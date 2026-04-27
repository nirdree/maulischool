import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { target = 'both', blocked } = await request.json();
    if (typeof blocked !== 'boolean') return r.badRequest('blocked must be true or false');

    const student = await Student.findById(params.id).select('fatherUser motherUser');
    if (!student) return r.notFound('Student not found');

    const status  = blocked ? 'inactive' : 'active';
    const userIds = [];
    const seen    = new Set();

    for (const [slot, uid] of [['father', student.fatherUser], ['mother', student.motherUser]]) {
      if (!uid || (target !== 'both' && target !== slot)) continue;
      const key = String(uid);
      if (seen.has(key)) continue;
      seen.add(key);
      userIds.push(uid);
    }

    if (!userIds.length) return r.badRequest('No parent accounts linked');
    await User.updateMany({ _id: { $in: userIds } }, { status });
    return r.ok(null, `Parent account(s) ${blocked ? 'blocked' : 'unblocked'}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});