import { connectDB } from '@/lib/mongodb';
import { Homework } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PUT = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const hw = await Homework.findByIdAndUpdate(id, await request.json(), { new: true });
    if (!hw) return r.notFound('Homework not found');
    return r.ok(hw, 'Homework updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    await Homework.findByIdAndDelete(id);
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
