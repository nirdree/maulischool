import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { status } = await request.json();
    if (!['active', 'inactive', 'resigned'].includes(status)) return r.badRequest('Invalid status');

    const employee = await Employee.findByIdAndUpdate(params.id, { status }, { new: true });
    if (!employee) return r.notFound('Employee not found');

    if (employee.user) {
      await User.findByIdAndUpdate(employee.user, {
        status: status === 'active' ? 'active' : 'inactive',
      });
    }

    return r.ok(employee, 'Status updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});