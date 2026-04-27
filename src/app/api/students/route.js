import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

// ── Helpers ──────────────────────────────────────────────────

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

// ── GET /api/students ────────────────────────────────────────

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const classId      = searchParams.get('classId');
    const status       = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const search       = searchParams.get('search');
    const page         = Number(searchParams.get('page')  || 1);
    const limit        = Number(searchParams.get('limit') || 20);

    const filter = {};
    if (classId)      filter.classroom    = classId;
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;
    if (request.user.role === 'parent') filter._id = { $in: request.user.studentIds || [] };
    if (search) {
      filter.$or = [
        { firstName:   { $regex: search, $options: 'i' } },
        { lastName:    { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { fatherName:  { $regex: search, $options: 'i' } },
        { motherName:  { $regex: search, $options: 'i' } },
      ];
    }

    const total    = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('classroom',    'displayName className section')
      .populate('academicYear', 'name')
      .populate('fatherUser',   'name email status')
      .populate('motherUser',   'name email status')
      .sort({ rollNumber: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return r.ok(students, 'Students fetched', {
      total, page, limit, pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return r.serverError(err.message);
  }
});

// ── POST /api/students ───────────────────────────────────────

export const POST = authorize('admin', 'principal')(async (request) => {
  await connectDB();
  const session   = await mongoose.startSession();
  let   committed = false;
  try {
    session.startTransaction();
    const body = await request.json();
    const {
      fatherExistingUserId, fatherEmail, fatherPhone, fatherName, fatherOccupation, fatherPassword,
      motherExistingUserId, motherEmail, motherPhone, motherName, motherOccupation, motherPassword,
      ...studentData
    } = body;

    const merge = { fatherName, fatherPhone, fatherEmail, fatherOccupation, motherName, motherPhone, motherEmail, motherOccupation };
    for (const [k, v] of Object.entries(merge)) { if (v) studentData[k] = v; }

    const [student] = await Student.create([studentData], { session });

    const fatherUser = await resolveParentUser({
      existingUserId: fatherExistingUserId,
      email: fatherEmail, phone: fatherPhone,
      name:  fatherName || `${studentData.firstName} Father`,
      password: fatherPassword || fatherPhone || 'school@123',
      studentId: student._id, session,
    });
    if (fatherUser) student.fatherUser = fatherUser._id;

    const sharedAccount =
      (fatherExistingUserId && motherExistingUserId && String(fatherExistingUserId) === String(motherExistingUserId)) ||
      (fatherEmail && motherEmail && fatherEmail.toLowerCase() === motherEmail.toLowerCase());

    const motherUser = sharedAccount
      ? fatherUser
      : await resolveParentUser({
          existingUserId: motherExistingUserId,
          email: motherEmail, phone: motherPhone,
          name:  motherName || `${studentData.firstName} Mother`,
          password: motherPassword || motherPhone || 'school@123',
          studentId: student._id, session,
        });
    if (motherUser) student.motherUser = motherUser._id;

    await student.save({ session });
    await session.commitTransaction();
    committed = true;

    const populated = await Student.findById(student._id)
      .populate('classroom',  'displayName')
      .populate('fatherUser', 'name email status')
      .populate('motherUser', 'name email status');

    return r.created(populated, 'Student admission created');
  } catch (err) {
    if (!committed) await safeAbort(session);
    if (err.code === 11000) return r.conflict('Duplicate admission number or email');
    return r.serverError(err.message);
  } finally {
    session.endSession();
  }
});