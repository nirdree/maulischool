import { connectDB } from '@/lib/mongodb';
import { Homework } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PUT = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    const hw = await Homework.findByIdAndUpdate(params.id, await request.json(), { new: true });
    if (!hw) return r.notFound('Homework not found');
    return r.ok(hw, 'Homework updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    await Homework.findByIdAndDelete(params.id);
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});