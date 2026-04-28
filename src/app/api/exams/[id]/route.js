import { connectDB } from '@/lib/mongodb';
import { Exam, Marks } from '@/models/Exam';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const exam = await Exam.findById(id)
      .populate('classroom', 'displayName')
      .populate('subject',   'name totalMarks')
      .populate('teacher',   'name');
    if (!exam) return r.notFound('Exam not found');
    return r.ok(exam);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const exam = await Exam.findByIdAndUpdate(id, body, {
      new: true, runValidators: true,
    });
    if (!exam) return r.notFound('Exam not found');
    return r.ok(exam, 'Exam updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    await Exam.findByIdAndDelete(id);
    await Marks.deleteMany({ exam: id });
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
