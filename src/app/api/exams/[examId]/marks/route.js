import { connectDB } from '@/lib/mongodb';
import { Exam, Marks } from '@/models/Exam';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const marks = await Marks.find({ exam: params.examId })
      .populate('student', 'firstName lastName rollNumber admissionNo')
      .populate('subject', 'name')
      .sort({ 'student.rollNumber': 1 });
    return r.ok(marks);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    const { marks } = await request.json();
    if (!Array.isArray(marks) || marks.length === 0)
      return r.badRequest('marks array is required');

    const exam = await Exam.findById(params.examId);
    if (!exam) return r.notFound('Exam not found');

    const calcGrade = (obtained, total) => {
      const pct = (obtained / total) * 100;
      if (pct >= 90) return 'A+'; if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+'; if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';  if (pct >= 40) return 'D';
      return 'F';
    };

    const ops = marks.map(m => ({
      updateOne: {
        filter: { exam: exam._id, student: m.student },
        update: {
          $set: {
            exam:          exam._id,
            student:       m.student,
            subject:       exam.subject,
            classroom:     exam.classroom,
            marksObtained: m.isAbsent ? 0 : Number(m.marksObtained),
            isAbsent:      m.isAbsent || false,
            grade:         m.isAbsent ? 'F' : calcGrade(Number(m.marksObtained), exam.totalMarks),
            remarks:       m.remarks || '',
            academicYear:  exam.academicYear,
          },
        },
        upsert: true,
      },
    }));

    await Marks.bulkWrite(ops);
    return r.ok(null, `${marks.length} mark(s) saved`);
  } catch (err) {
    return r.serverError(err.message);
  }
});