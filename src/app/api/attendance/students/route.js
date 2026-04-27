import { connectDB } from '@/lib/mongodb';
import { Attendance } from '@/models/Attendance';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('studentId'))    filter.student      = searchParams.get('studentId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const date      = searchParams.get('date');
    const fromDate  = searchParams.get('fromDate');
    const toDate    = searchParams.get('toDate');

    if (date) {
      const d = new Date(date);
      filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    } else if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate)   filter.date.$lte = new Date(toDate);
    }

    if (request.user.role === 'parent') {
      filter.student = { $in: request.user.studentIds || [] };
    }

    const records = await Attendance.find(filter)
      .populate('student',   'firstName lastName rollNumber admissionNo')
      .populate('classroom', 'displayName')
      .populate('markedBy',  'name')
      .sort({ date: -1 });

    return r.ok(records);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal', 'teacher')(async (request) => {
  try {
    await connectDB();
    const { records } = await request.json();
    if (!Array.isArray(records) || records.length === 0)
      return r.badRequest('records array required');

    const ops = records.map(rec => ({
      updateOne: {
        filter: { student: rec.student, date: new Date(rec.date) },
        update: { $set: { ...rec, markedBy: request.user._id, date: new Date(rec.date) } },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    return r.ok(null, `${records.length} attendance record(s) saved`);
  } catch (err) {
    return r.serverError(err.message);
  }
});