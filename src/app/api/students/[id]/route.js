import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

async function safeAbort(session) {
  try { await session.abortTransaction(); } catch (_) {}
}

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id)
      .populate('classroom',    'displayName className section monthlyFees')
      .populate('academicYear', 'name')
      .populate('fatherUser',   'name email status studentIds')
      .populate('motherUser',   'name email status studentIds');

    if (!student) return r.notFound('Student not found');

    if (request.user.role === 'parent') {
      const allowed = (request.user.studentIds || []).map(String);
      if (!allowed.includes(String(student._id))) return r.forbidden();
    }

    return r.ok(student);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { fatherUser, motherUser, admissionNo, ...updateData } = body;

    const student = await Student.findByIdAndUpdate(id, updateData, {
      new: true, runValidators: true,
    })
      .populate('classroom',  'displayName')
      .populate('fatherUser', 'name email status')
      .populate('motherUser', 'name email status');

    if (!student) return r.notFound('Student not found');
    return r.ok(student, 'Student updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  await connectDB();
  const { id } = await params;
  const session   = await mongoose.startSession();
  let   committed = false;
  try {
    session.startTransaction();
    const student = await Student.findByIdAndDelete(id).session(session);
    if (!student) {
      await safeAbort(session);
      committed = true;
      return r.notFound('Student not found');
    }

    const seen = new Set();
    for (const userId of [student.fatherUser, student.motherUser]) {
      if (!userId) continue;
      const uid = String(userId);
      if (seen.has(uid)) continue;
      seen.add(uid);
      const user = await User.findById(userId).session(session);
      if (!user) continue;
      user.studentIds = (user.studentIds || []).filter(s => String(s) !== String(student._id));
      if (user.studentIds.length === 0) {
        await User.findByIdAndDelete(userId).session(session);
      } else {
        await user.save({ session });
      }
    }

    await session.commitTransaction();
    committed = true;
    return r.noContent();
  } catch (err) {
    if (!committed) await safeAbort(session);
    return r.serverError(err.message);
  } finally {
    session.endSession();
  }
});
