import { connectDB } from '@/lib/mongodb';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const subject = await Subject.findById(params.id)
      .populate('classroom', 'displayName')
      .populate('teacher',   'name');
    if (!subject) return r.notFound('Subject not found');
    return r.ok(subject);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const body    = await request.json();
    const subject = await Subject.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
      .populate('classroom', 'displayName')
      .populate('teacher',   'name');
    if (!subject) return r.notFound('Subject not found');
    return r.ok(subject, 'Subject updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const subject = await Subject.findByIdAndDelete(params.id);
    if (!subject) return r.notFound('Subject not found');
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});