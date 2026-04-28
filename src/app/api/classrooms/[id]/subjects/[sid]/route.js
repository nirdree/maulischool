import { connectDB } from '@/lib/mongodb';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id, sid } = await params;
    const body = await request.json();
    if (!body.teacher) delete body.teacher;

    const subject = await Subject.findOneAndUpdate(
      { _id: sid, classroom: id }, body, { new: true, runValidators: true }
    ).populate('teacher', 'name employeeId');

    if (!subject) return r.notFound('Subject not found');
    return r.ok(subject, 'Subject updated');
  } catch (err) {
    if (err.code === 11000) return r.conflict('A subject with this name already exists in this classroom');
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id, sid } = await params;
    const subject = await Subject.findOneAndDelete({ _id: sid, classroom: id });
    if (!subject) return r.notFound('Subject not found');
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
