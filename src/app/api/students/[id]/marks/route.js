import { connectDB } from '@/lib/mongodb';
import { Marks } from '@/models/Exam';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const examType     = searchParams.get('examType');

    const filter = { student: id };
    if (academicYear) filter.academicYear = academicYear;

    const marks = await Marks.find(filter)
      .populate({ path: 'exam', match: examType ? { examType } : {}, select: 'name examType totalMarks examDate' })
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    return r.ok(examType ? marks.filter(m => m.exam) : marks);
  } catch (err) {
    return r.serverError(err.message);
  }
});
