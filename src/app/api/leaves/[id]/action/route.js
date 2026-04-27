import { connectDB } from '@/lib/mongodb';
import { Leave } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { isPayrollLocked } from '../../route';

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { status, approvalRemark } = await request.json();
    if (!['Approved', 'Rejected'].includes(status))
      return r.badRequest("status must be 'Approved' or 'Rejected'");

    const leave = await Leave.findById(params.id);
    if (!leave)                      return r.notFound('Leave record not found');
    if (leave.status !== 'Pending')  return r.badRequest('Leave has already been processed');

    if (status === 'Approved') {
      const lockCheck = await isPayrollLocked(leave.employee, leave.fromDate, leave.toDate);
      if (lockCheck.locked)
        return r.badRequest(`Cannot approve leave: payroll for ${lockCheck.month}/${lockCheck.year} is already paid and locked.`);
    }

    leave.status         = status;
    leave.approvalRemark = approvalRemark;
    leave.approvedBy     = request.user._id;
    await leave.save();
    await leave.populate('employee', 'name');
    return r.ok(leave, `Leave ${status.toLowerCase()}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});