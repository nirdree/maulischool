import { connectDB, supportsTransactions } from '@/lib/mongodb';
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
    const user = session
      ? await User.findById(existingUserId).session(session)
      : await User.findById(existingUserId);
    if (!user) throw new Error(`Parent user ${existingUserId} not found`);
    if (!user.studentIds.map(String).includes(String(studentId))) {
      user.studentIds.push(studentId);
      if (session) await user.save({ session });
      else await user.save();
    }
    return user;
  }
  if (email) {
    const existing = session
      ? await User.findOne({ email: email.toLowerCase() }).session(session)
      : await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (!existing.studentIds.map(String).includes(String(studentId))) {
        existing.studentIds.push(studentId);
        if (session) await existing.save({ session });
        else await existing.save();
      }
      return existing;
    }
    const created = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'parent',
      studentIds: [studentId],
    });
    if (session) await created.save({ session });
    else await created.save();
    return created;
  }
  return null;
}

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  await connectDB();
  const { id } = await params;
  const useTxn = await supportsTransactions();
  const session = useTxn ? await mongoose.startSession() : null;
  let committed = false;
  try {
    if (session) session.startTransaction();
    const { slot, existingUserId, email, name, phone, password } = await request.json();
    if (!['father', 'mother'].includes(slot)) return r.badRequest('slot must be "father" or "mother"');

    const student = session
      ? await Student.findById(id).session(session)
      : await Student.findById(id);
    if (!student) return r.notFound('Student not found');

    const oldId = slot === 'father' ? student.fatherUser : student.motherUser;
    if (oldId) {
      const old = session
        ? await User.findById(oldId).session(session)
        : await User.findById(oldId);
      if (old) {
        old.studentIds = (old.studentIds || []).filter(s => String(s) !== String(student._id));
        if (session) await old.save({ session });
        else await old.save();
      }
    }

    const newUser = await resolveParentUser({
      existingUserId, email, phone,
      name: name || `${student.firstName} ${slot === 'father' ? 'Father' : 'Mother'}`,
      password: password || phone || 'school@123',
      studentId: student._id, session,
    });

    student[slot === 'father' ? 'fatherUser' : 'motherUser'] = newUser?._id || null;
    if (session) await student.save({ session });
    else await student.save();
    if (session) await session.commitTransaction();
    committed = true;

    const populated = await Student.findById(student._id)
      .populate('fatherUser', 'name email status')
      .populate('motherUser', 'name email status');

    return r.ok(populated, `${slot} account linked`);
  } catch (err) {
    if (session && !committed) await safeAbort(session);
    if (err.code === 11000) return r.conflict('Email already registered');
    return r.serverError(err.message);
  } finally {
    if (session) session.endSession();
  }
});
