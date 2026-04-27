import { protect } from '@/lib/auth';
import { r } from '@/lib/response';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export const PUT = protect(async (request) => {
  try {
    await connectDB();
    const { currentPassword, newPassword } = await request.json();
    const user = await User.findById(request.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword)))
      return r.badRequest('Current password is incorrect');

    user.password = newPassword;
    await user.save();
    return r.ok(null, 'Password changed successfully');
  } catch (err) {
    return r.serverError(err.message);
  }
});