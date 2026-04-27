import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

async function safeAbort(session) {
  try { await session.abortTransaction(); } catch (_) {}
}

async function resolveParentUser({ existingUserId, email, phone, name, password, studentId, session }) {
  if (existingUserId) {
    const user = await User.findById(existingUserId).session(session);
    if (!user) throw new Error(`Parent user ${existingUserId} not found`);
    if (!user.studentIds.map(String).includes(String(studentId))) {
      user.studentIds.push(studentId);
      await user.save({ session });
    }
    return user;
  }
  if (email) {
    const existing = await User.findOne({ email: email.toLowerCase() }).session(session);
    if (existing) {
      if (!existing.studentIds.map(String).includes(String(studentId))) {
        existing.studentIds.push(studentId);
        await existing.save({ session });
      }
      return existing;
    }
    const [created] = await User.create(
      [{ name, email: email.toLowerCase(), password, role: 'parent', studentIds: [studentId] }],
      { session }
    );
    return created;
  }
  return null;
}

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  await connectDB();
  const session   = await mongoose.startSession();
  let   committed = false;
  try {
    session.startTransaction();
    const { slot, existingUserId, email, name, phone, password } = await request.json();
    if (!['father', 'mother'].includes(slot)) return r.badRequest('slot must be "father" or "mother"');

    const student = await Student.findById(params.id).session(session);
    if (!student) return r.notFound('Student not found');

    const oldId = slot === 'father' ? student.fatherUser : student.motherUser;
    if (oldId) {
      const old = await User.findById(oldId).session(session);
      if (old) {
        old.studentIds = (old.studentIds || []).filter(s => String(s) !== String(student._id));
        await old.save({ session });
      }
    }

    const newUser = await resolveParentUser({
      existingUserId, email, phone,
      name: name || `${student.firstName} ${slot === 'father' ? 'Father' : 'Mother'}`,
      password: password || phone || 'school@123',
      studentId: student._id, session,
    });

    student[slot === 'father' ? 'fatherUser' : 'motherUser'] = newUser?._id || null;
    await student.save({ session });
    await session.commitTransaction();
    committed = true;

    const populated = await Student.findById(student._id)
      .populate('fatherUser', 'name email status')
      .populate('motherUser', 'name email status');

    return r.ok(populated, `${slot} account linked`);
  } catch (err) {
    if (!committed) await safeAbort(session);
    if (err.code === 11000) return r.conflict('Email already registered');
    return r.serverError(err.message);
  } finally {
    session.endSession();
  }
});