import { connectDB } from '@/lib/mongodb';
import { Exam, Marks } from '@/models/Exam';
import Subject from '@/models/Subject';
import Classroom from '@/models/Classroom';
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
    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      const [assignedSubject, classTeacher] = await Promise.all([
        Subject.exists({
          _id: exam.subject?._id || exam.subject,
          classroom: exam.classroom?._id || exam.classroom,
          teacher: request.user.employeeId,
          academicYear: exam.academicYear,
        }),
        Classroom.exists({
          _id: exam.classroom?._id || exam.classroom,
          classTeacher: request.user.employeeId,
          academicYear: exam.academicYear,
        }),
      ]);
      if (!assignedSubject && !classTeacher) return r.forbidden();
    }
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
    const existing = await Exam.findById(id);
    if (!existing) return r.notFound('Exam not found');

    let update = body;
    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      const assignedSubject = await Subject.exists({
        _id: existing.subject,
        classroom: existing.classroom,
        teacher: request.user.employeeId,
        academicYear: existing.academicYear,
      });
      if (!assignedSubject) return r.forbidden();
      update = Object.fromEntries(
        ['name', 'examType', 'examDate', 'description']
          .filter(key => Object.hasOwn(body, key))
          .map(key => [key, body[key]])
      );
      if (Object.keys(update).length === 0) return r.badRequest('No editable exam details provided');
    }

    const exam = await Exam.findByIdAndUpdate(id, update, {
      new: true, runValidators: true,
    });
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
