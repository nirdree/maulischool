import { connectDB } from '@/lib/mongodb';
import { EmployeeAttendance } from '@/models/Attendance';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.get('employeeId'))   filter.employee     = searchParams.get('employeeId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const date     = searchParams.get('date');
    const fromDate = searchParams.get('fromDate');
    const toDate   = searchParams.get('toDate');

    if (date) {
      const d = new Date(date);
      filter.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    } else if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate)   filter.date.$lte = new Date(toDate);
    }

    const records = await EmployeeAttendance.find(filter)
      .populate('employee', 'name employeeId role')
      .sort({ date: -1 });

    return r.ok(records);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { records } = await request.json();
    if (!Array.isArray(records) || records.length === 0)
      return r.badRequest('records array required');

    const ops = records.map(rec => ({
      updateOne: {
        filter: { employee: rec.employee, date: new Date(rec.date) },
        update: { $set: { ...rec, date: new Date(rec.date) } },
        upsert: true,
      },
    }));

    await EmployeeAttendance.bulkWrite(ops);
    return r.ok(null, `${records.length} employee attendance record(s) saved`);
  } catch (err) {
    return r.serverError(err.message);
  }
});