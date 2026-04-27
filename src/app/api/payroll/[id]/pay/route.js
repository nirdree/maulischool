import { connectDB } from '@/lib/mongodb';
import { Payroll } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const record = await Payroll.findById(params.id);
    if (!record)                  return r.notFound('Payroll record not found');
    if (record.status === 'Paid') return r.badRequest('Already marked as paid');

    record.status      = 'Paid';
    record.paymentDate = new Date();
    record.paidBy      = request.user._id;
    record.lockedAt    = new Date();
    await record.save();

    await record.populate('employee', 'name employeeId');
    return r.ok(record, `Payroll marked as paid and locked for ${record.employee?.name}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});