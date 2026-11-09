import { connectDB } from '@/lib/mongodb';
import { Homework } from '@/models/Others';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PUT = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const existing = await Homework.findById(id);
    if (!existing) return r.notFound('Homework not found');

    let update = body;
    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      if (String(existing.teacher) !== String(request.user.employeeId)) return r.forbidden();
      const classroom = body.classroom || existing.classroom;
      const subject = body.subject || existing.subject;
      const academicYear = body.academicYear || existing.academicYear;
      const assignedSubject = await Subject.exists({
        _id: subject,
        classroom,
        teacher: request.user.employeeId,
        academicYear,
        isActive: true,
      });
      if (!assignedSubject) return r.forbidden('You can assign homework only to your assigned subjects and classes');
      update = Object.fromEntries(
        ['title', 'description', 'classroom', 'subject', 'dueDate', 'academicYear']
          .filter(key => Object.hasOwn(body, key))
          .map(key => [key, body[key]])
      );
    }

    const hw = await Homework.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!hw) return r.notFound('Homework not found');
    return r.ok(hw, 'Homework updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin', 'principal', 'teacher')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const hw = await Homework.findById(id);
    if (!hw) return r.notFound('Homework not found');
    if (request.user.role === 'teacher' && String(hw.teacher) !== String(request.user.employeeId)) {
      return r.forbidden();
    }
    await hw.deleteOne();
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
