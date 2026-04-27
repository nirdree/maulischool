import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const q = new URL(request.url).searchParams.get('q') || '';
    if (q.trim().length < 2) return r.ok([]);

    const users = await User.find({
      role: 'parent',
      $or: [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name email status studentIds')
      .populate('studentIds', 'firstName lastName admissionNo')
      .limit(10);

    return r.ok(users);
  } catch (err) {
    return r.serverError(err.message);
  }
});