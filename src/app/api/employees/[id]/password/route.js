import { connectDB } from '@/lib/mongodb';
import Employee from '@/models/Employee';
import User from '@/models/User';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { password } = await request.json();
    if (!password || password.length < 6) return r.badRequest('Password must be at least 6 characters');

    const employee = await Employee.findById(params.id).select('user');
    if (!employee)      return r.notFound('Employee not found');
    if (!employee.user) return r.notFound('No linked user account found');

    const user = await User.findById(employee.user).select('+password');
    if (!user) return r.notFound('Linked user not found');

    user.password = password;
    await user.save();
    return r.ok(null, 'Password updated successfully');
  } catch (err) {
    return r.serverError(err.message);
  }
});