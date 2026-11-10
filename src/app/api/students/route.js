import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import User from '@/models/User';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';
import { parsePagination, paginationMeta } from '@/lib/pagination';

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
    const created = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'parent',
      studentIds: [studentId],
    });
    await created.save({ session });
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
    const pagination = parsePagination(searchParams, { enabledByDefault: true });
    if (pagination.error) return r.badRequest(pagination.error);

    const filter = {};
    if (request.user.role === 'parent') filter._id = { $in: request.user.studentIds || [] };
    if (academicYear || classId) {
      const currentEnrollment = {};
      const historicalEnrollment = {};
      if (academicYear) {
        currentEnrollment.academicYear = academicYear;
        historicalEnrollment.academicYear = academicYear;
      }
      if (classId) {
        currentEnrollment.classroom = classId;
        historicalEnrollment.classroom = classId;
      }
      if (status) {
        currentEnrollment.status = status;
        historicalEnrollment.status = status;
      }
      filter.$or = [
        currentEnrollment,
        { academicHistory: { $elemMatch: historicalEnrollment } },
      ];
    } else if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$and = [{
        $or: [
        { firstName:   { $regex: search, $options: 'i' } },
        { lastName:    { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { fatherName:  { $regex: search, $options: 'i' } },
        { motherName:  { $regex: search, $options: 'i' } },
        ],
      }];
    }

    const total    = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('classroom',    'displayName className section')
      .populate('academicYear', 'name startDate endDate')
      .populate('academicHistory.classroom', 'displayName className section')
      .populate('academicHistory.academicYear', 'name startDate endDate')
      .populate('academicHistory.nextClassroom', 'displayName className section')
      .populate('academicHistory.nextAcademicYear', 'name startDate endDate')
      .populate('fatherUser',   'name email status')
      .populate('motherUser',   'name email status')
      .sort({ rollNumber: 1, createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const data = students.map(student => {
      const history = student.academicHistory || [];
      const historicalEnrollment = history.find(enrollment =>
        (!academicYear || String(enrollment.academicYear?._id || enrollment.academicYear) === academicYear)
        && (!classId || String(enrollment.classroom?._id || enrollment.classroom) === classId)
        && (!status || enrollment.status === status),
      );
      const currentMatches = (!academicYear || String(student.academicYear?._id || student.academicYear) === academicYear)
        && (!classId || String(student.classroom?._id || student.classroom) === classId)
        && (!status || student.status === status);
      const row = student.toObject();
      if (!currentMatches && historicalEnrollment) {
        row.isHistoricalEnrollment = true;
        row.classroom = historicalEnrollment.classroom;
        row.academicYear = historicalEnrollment.academicYear;
        row.rollNumber = historicalEnrollment.rollNumber;
        row.status = historicalEnrollment.status;
        const nextHistory = history
          .filter(enrollment => new Date(enrollment.academicYear?.startDate) > new Date(historicalEnrollment.academicYear?.startDate))
          .sort((a, b) => new Date(a.academicYear?.startDate) - new Date(b.academicYear?.startDate))[0];
        row.enrollmentOutcome = historicalEnrollment.outcome
          || (student.status === 'Left' && String(student.academicYear?._id || student.academicYear) === String(historicalEnrollment.academicYear?._id || historicalEnrollment.academicYear)
            ? 'Left'
            : student.status === 'Alumni' && String(student.academicYear?._id || student.academicYear) === String(historicalEnrollment.academicYear?._id || historicalEnrollment.academicYear)
              ? 'Graduated'
              : nextHistory || new Date(student.academicYear?.startDate) > new Date(historicalEnrollment.academicYear?.startDate)
                ? (String((nextHistory?.classroom?._id || nextHistory?.classroom) || student.classroom?._id || student.classroom)
                  === String(historicalEnrollment.classroom?._id || historicalEnrollment.classroom) ? 'Detained' : 'Promoted')
                : '');
        row.nextEnrollmentClass = historicalEnrollment.nextClassroom || nextHistory?.classroom
          || (row.enrollmentOutcome === 'Promoted' || row.enrollmentOutcome === 'Detained' ? student.classroom : null);
        row.nextEnrollmentYear = historicalEnrollment.nextAcademicYear || nextHistory?.academicYear
          || (row.enrollmentOutcome === 'Promoted' || row.enrollmentOutcome === 'Detained' ? student.academicYear : null);
        return row;
      }

      const previousEnrollment = history
        .filter(enrollment => String(enrollment.nextAcademicYear?._id || enrollment.nextAcademicYear || '') === String(student.academicYear?._id || student.academicYear)
          || String(enrollment.nextClassroom?._id || enrollment.nextClassroom || '') === String(student.classroom?._id || student.classroom))
        .sort((a, b) => new Date(b.academicYear?.startDate) - new Date(a.academicYear?.startDate))[0];
      row.enrollmentOutcome = previousEnrollment?.outcome || '';
      row.enrolledFromClass = previousEnrollment?.classroom || null;
      row.enrolledFromYear = previousEnrollment?.academicYear || null;
      if (!row.enrollmentOutcome && student.status === 'Left') row.enrollmentOutcome = 'Left';
      if (!row.enrollmentOutcome && student.status === 'Alumni') row.enrollmentOutcome = 'Graduated';
      return row;
    });

    return r.ok(data, 'Students fetched', paginationMeta(total, pagination));
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

    if (studentData.isRTE && (studentData.rteFee === undefined || studentData.rteFee === '')) {
      const classroom = await Classroom.findById(studentData.classroom).select('rteFee');
      studentData.rteFee = classroom?.rteFee || 0;
    }

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