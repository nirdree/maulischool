import { connectDB } from '@/lib/mongodb';
import { Leave, Payroll } from '@/models/Others';
import Employee from '@/models/Employee';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export async function isPayrollLocked(employeeId, fromDate, toDate) {
  const from = new Date(fromDate);
  const to   = new Date(toDate);
  const months = new Set();
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to) {
    months.add(`${cursor.getFullYear()}-${cursor.getMonth() + 1}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const ym of months) {
    const [year, month] = ym.split('-').map(Number);
    const paid = await Payroll.findOne({ employee: employeeId, month, year, status: 'Paid' });
    if (paid) return { locked: true, month, year };
  }
  return { locked: false };
}

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.get('status'))       filter.status       = searchParams.get('status');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');
    if (searchParams.get('leaveType'))    filter.leaveType    = searchParams.get('leaveType');

    const fromDate = searchParams.get('fromDate');
    const toDate   = searchParams.get('toDate');
    if (fromDate || toDate) {
      filter.fromDate = {};
      if (fromDate) filter.fromDate.$gte = new Date(fromDate);
      if (toDate)   filter.fromDate.$lte = new Date(toDate);
    }

    if (request.user.role === 'teacher') {
      filter.employee = request.user.employeeId;
    } else if (searchParams.get('employeeId')) {
      filter.employee = searchParams.get('employeeId');
    }

    const leaves = await Leave.find(filter)
      .populate('employee',   'name employeeId role')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    return r.ok(leaves);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = protect(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    let { employee: employeeId, fromDate, toDate, leaveType, reason, academicYear } = body;

    if (!employeeId) {
      const emp = await Employee.findOne({ user: request.user._id }).select('_id');
      if (!emp) return r.notFound('Employee profile not found for this user');
      employeeId = emp._id;
    }

    if (!fromDate || !toDate || !leaveType || !reason || !academicYear)
      return r.badRequest('fromDate, toDate, leaveType, reason, academicYear are required');

    const lockCheck = await isPayrollLocked(employeeId, fromDate, toDate);
    if (lockCheck.locked)
      return r.badRequest(`Cannot apply leave: payroll for ${lockCheck.month}/${lockCheck.year} is already paid and locked.`);

    const days = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
    const leave = await Leave.create({ ...body, employee: employeeId, totalDays: days });
    await leave.populate('employee', 'name employeeId');
    return r.created(leave, 'Leave application submitted');
  } catch (err) {
    return r.serverError(err.message);
  }
});