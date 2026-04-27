import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { target, password } = await request.json();
    if (!['father', 'mother'].includes(target)) return r.badRequest('target must be "father" or "mother"');
    if (!password || password.length < 6) return r.badRequest('Password must be at least 6 characters');

    const student = await Student.findById(params.id).select('fatherUser motherUser');
    if (!student) return r.notFound('Student not found');

    const userId = target === 'father' ? student.fatherUser : student.motherUser;
    if (!userId) return r.notFound(`No ${target} account linked`);

    const user = await User.findById(userId).select('+password');
    if (!user) return r.notFound('Parent user not found');

    user.password = password;
    await user.save();
    return r.ok(null, 'Password updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});