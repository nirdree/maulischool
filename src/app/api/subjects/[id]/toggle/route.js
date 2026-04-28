import { connectDB } from '@/lib/mongodb';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const subject = await Subject.findById(id);
    if (!subject) return r.notFound('Subject not found');
    subject.isActive = !subject.isActive;
    await subject.save();
    return r.ok(subject, `Subject ${subject.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});
