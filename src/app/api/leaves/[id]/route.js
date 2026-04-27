import { connectDB } from '@/lib/mongodb';
import { Leave } from '@/models/Others';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';
import { isPayrollLocked } from '../route';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const leave = await Leave.findById(params.id)
      .populate('employee',   'name employeeId role')
      .populate('approvedBy', 'name');
    if (!leave) return r.notFound('Leave not found');
    return r.ok(leave);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = protect(async (request, { params }) => {
  try {
    await connectDB();
    const leave = await Leave.findById(params.id);
    if (!leave)                      return r.notFound('Leave not found');
    if (leave.status !== 'Pending')  return r.badRequest('Cannot edit a leave that has already been processed');

    const body     = await request.json();
    const fromDate = body.fromDate || leave.fromDate;
    const toDate   = body.toDate   || leave.toDate;

    const lockCheck = await isPayrollLocked(leave.employee, fromDate, toDate);
    if (lockCheck.locked)
      return r.badRequest(`Cannot modify leave: payroll for ${lockCheck.month}/${lockCheck.year} is already paid and locked.`);

    if (body.fromDate || body.toDate) {
      body.totalDays = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
    }

    Object.assign(leave, body);
    await leave.save();
    await leave.populate('employee', 'name employeeId');
    return r.ok(leave, 'Leave updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = protect(async (request, { params }) => {
  try {
    await connectDB();
    const leave = await Leave.findById(params.id);
    if (!leave)                      return r.notFound('Leave not found');
    if (leave.status !== 'Pending')  return r.badRequest('Cannot delete a processed leave application');

    const lockCheck = await isPayrollLocked(leave.employee, leave.fromDate, leave.toDate);
    if (lockCheck.locked)
      return r.badRequest(`Cannot delete: payroll for ${lockCheck.month}/${lockCheck.year} is locked.`);

    await leave.deleteOne();
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});