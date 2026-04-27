import { connectDB } from '@/lib/mongodb';
import { Marks } from '@/models/Exam';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.get('studentId'))    filter.student      = searchParams.get('studentId');
    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('subjectId'))    filter.subject      = searchParams.get('subjectId');
    if (searchParams.get('examId'))       filter.exam         = searchParams.get('examId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    if (request.user.role === 'parent') {
      filter.student = { $in: request.user.studentIds || [] };
    }

    const marks = await Marks.find(filter)
      .populate('student',   'firstName lastName rollNumber admissionNo')
      .populate('subject',   'name totalMarks')
      .populate('exam',      'name examType totalMarks examDate')
      .populate('classroom', 'displayName')
      .sort({ createdAt: -1 });

    return r.ok(marks);
  } catch (err) {
    return r.serverError(err.message);
  }
});