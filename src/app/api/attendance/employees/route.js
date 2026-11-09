import { connectDB } from '@/lib/mongodb';
import { EmployeeAttendance } from '@/models/Attendance';
import Employee from '@/models/Employee';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

function toDateOnly(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      filter.employee = request.user.employeeId;
    } else if (searchParams.get('employeeId')) {
      filter.employee = searchParams.get('employeeId');
    }
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

    if (records.some(rec => !rec || !rec.employee || !rec.date || !toDateOnly(rec.date))) {
      return r.badRequest('Each attendance record must include a valid employee and date');
    }

    const employeeIds = [...new Set(records.map(rec => String(rec.employee)))];
    if (employeeIds.some(id => !/^[a-f\d]{24}$/i.test(id))) {
      return r.badRequest('Invalid employee ID');
    }

    const employees = await Employee.find({ _id: { $in: employeeIds } })
      .select('_id name dateOfJoining');
    const employeesById = new Map(employees.map(employee => [String(employee._id), employee]));
    for (const record of records) {
      const employee = employeesById.get(String(record.employee));
      if (!employee) return r.badRequest(`Employee ${record.employee} was not found`);
      const joiningDate = toDateOnly(employee.dateOfJoining);
      if (!joiningDate) {
        return r.serverError(`Joining date is missing or invalid for employee ${employee.name}`);
      }
      if (toDateOnly(record.date) < joiningDate) {
        return r.badRequest(
          `Attendance for ${employee.name} cannot be recorded before their joining date (${joiningDate})`,
        );
      }
    }

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