import { connectDB } from '@/lib/mongodb';
import { Exam, Marks } from '@/models/Exam';
import Subject from '@/models/Subject';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const exam = await Exam.findById(id);
    if (!exam) return r.notFound('Exam not found');
    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      const [assignedSubject, classTeacher] = await Promise.all([
        Subject.exists({
          _id: exam.subject,
          classroom: exam.classroom,
          teacher: request.user.employeeId,
          academicYear: exam.academicYear,
        }),
        Classroom.exists({
          _id: exam.classroom,
          classTeacher: request.user.employeeId,
          academicYear: exam.academicYear,
        }),
      ]);
      if (!assignedSubject && !classTeacher) return r.forbidden();
    }

    const marks = await Marks.find({ exam: id })
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
    const { id } = await params;
    const { marks } = await request.json();
    if (!Array.isArray(marks) || marks.length === 0)
      return r.badRequest('marks array is required');
    if (marks.some(mark => !mark || typeof mark !== 'object' || Array.isArray(mark))) {
      return r.badRequest('Each mark must be an object');
    }

    const exam = await Exam.findById(id);
    if (!exam) return r.notFound('Exam not found');

    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      const assignedSubject = await Subject.exists({
        _id: exam.subject,
        classroom: exam.classroom,
        teacher: request.user.employeeId,
        academicYear: exam.academicYear,
      });
      if (!assignedSubject) return r.forbidden('You can enter marks only for subjects assigned to you');
    }

    const studentIds = marks.map(mark => String(mark?.student || ''));
    if (studentIds.some(id => !/^[a-f\d]{24}$/i.test(id)) || new Set(studentIds).size !== studentIds.length) {
      return r.badRequest('Each mark must include a unique valid student');
    }
    for (const mark of marks) {
      const obtained = Number(mark.marksObtained);
      if (typeof mark.isAbsent !== 'boolean' || !Number.isFinite(obtained)
        || obtained < 0 || obtained > exam.totalMarks) {
        return r.badRequest(`Marks must be between 0 and ${exam.totalMarks}`);
      }
    }

    const students = await Student.find({
      _id: { $in: studentIds },
      $or: [
        { classroom: exam.classroom, academicYear: exam.academicYear },
        {
          academicHistory: {
            $elemMatch: {
              classroom: exam.classroom,
              academicYear: exam.academicYear,
            },
          },
        },
      ],
    }).select('_id');
    if (students.length !== studentIds.length) {
      return r.badRequest('All students must belong to this exam classroom and academic year');
    }

    const calcGrade = (obtained, total) => {
      const pct = (obtained / total) * 100;
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+';
      if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';
      if (pct >= 40) return 'D';
      return 'F';
    };

    const bulkOps = marks.map(mark => {
      const marksObtained = mark.isAbsent ? 0 : Number(mark.marksObtained);
      return {
        updateOne: {
          filter: { exam: id, student: mark.student },
          update: {
            $set: {
              marksObtained,
              isAbsent: mark.isAbsent,
              grade: mark.isAbsent ? 'F' : calcGrade(marksObtained, exam.totalMarks),
              subject: exam.subject,
              classroom: exam.classroom,
              academicYear: exam.academicYear,
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      };
    });

    await Marks.bulkWrite(bulkOps);
    return r.ok({ message: 'Marks saved successfully' });
  } catch (err) {
    return r.serverError(err.message);
  }
});
