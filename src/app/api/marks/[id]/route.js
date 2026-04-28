import { connectDB } from '@/lib/mongodb';
import { Marks } from '@/models/Exam';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const mark = await Marks.findById(id)
      .populate('student',   'firstName lastName rollNumber admissionNo')
      .populate('subject',   'name totalMarks')
      .populate('exam',      'name examType totalMarks examDate')
      .populate('classroom', 'displayName');

    if (!mark) return r.notFound('Mark entry not found');

    if (request.user.role === 'parent') {
      const ids = (request.user.studentIds || []).map(id => id.toString());
      if (!ids.includes(mark.student?._id?.toString()))
        return r.forbidden();
    }

    return r.ok(mark);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    if (!['admin', 'principal'].includes(request.user.role))
      return r.forbidden();

    const mark = await Marks.findByIdAndDelete(id);
    if (!mark) return r.notFound('Mark entry not found');
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
