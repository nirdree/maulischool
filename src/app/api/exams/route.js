import { connectDB } from '@/lib/mongodb';
import { Exam } from '@/models/Exam';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('subjectId'))    filter.subject      = searchParams.get('subjectId');
    if (searchParams.get('examType'))     filter.examType     = searchParams.get('examType');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const exams = await Exam.find(filter)
      .populate('classroom', 'displayName')
      .populate('subject',   'name totalMarks')
      .populate('teacher',   'name')
      .sort({ examDate: -1 });

    return r.ok(exams);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal', 'teacher')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const { classroom, subject, totalMarks } = body;

    const sub = await Subject.findById(subject);
    if (!sub) return r.notFound('Subject not found');

    const existing = await Exam.find({ classroom, subject });
    const usedMarks = existing.reduce((sum, e) => sum + e.totalMarks, 0);

    if (usedMarks + Number(totalMarks) > sub.totalMarks) {
      return r.badRequest(`Only ${sub.totalMarks - usedMarks} marks available for this subject`);
    }

    const exam = await Exam.create(body);
    await exam.populate([
      { path: 'classroom', select: 'displayName' },
      { path: 'subject',   select: 'name' },
    ]);
    return r.created(exam, 'Exam created');
  } catch (err) {
    return r.serverError(err.message);
  }
});