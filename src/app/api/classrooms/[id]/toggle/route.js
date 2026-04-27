import { connectDB } from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const classroom = await Classroom.findById(params.id);
    if (!classroom) return r.notFound('Classroom not found');
    classroom.isActive = !classroom.isActive;
    await classroom.save();
    return r.ok(classroom, `Classroom ${classroom.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});