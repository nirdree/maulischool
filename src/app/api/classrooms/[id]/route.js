import { connectDB } from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const classroom = await Classroom.findById(id)
      .populate('classTeacher', 'name employeeId email mobileNo')
      .populate('academicYear', 'name');
    if (!classroom) return r.notFound('Classroom not found');

    const studentCount = await Student.countDocuments({
      classroom: classroom._id, status: { $nin: ['Left', 'Alumni'] },
    });
    return r.ok({ ...classroom.toObject(), studentCount });
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    if (!body.classTeacher) delete body.classTeacher;

    if (body.classTeacher && body.academicYear) {
      const conflict = await Classroom.findOne({
        classTeacher: body.classTeacher, academicYear: body.academicYear, _id: { $ne: id },
      });
      if (conflict) return r.conflict(`This teacher is already the class teacher of ${conflict.displayName}`);
    }

    const classroom = await Classroom.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('classTeacher', 'name employeeId');
    if (!classroom) return r.notFound('Classroom not found');
    return r.ok(classroom, 'Classroom updated');
  } catch (err) {
    if (err.code === 11000) return r.conflict('A classroom with this name and section already exists for this academic year');
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const classroom = await Classroom.findById(id);
    if (!classroom) return r.notFound('Classroom not found');

    const activeStudentCount = await Student.countDocuments({
      classroom: id, status: { $nin: ['Left', 'Alumni'] },
    });
    if (activeStudentCount > 0) {
      return r.badRequest(`Cannot delete: ${activeStudentCount} student(s) still enrolled. Transfer or remove them first.`);
    }

    await Subject.deleteMany({ classroom: id });
    await Classroom.findByIdAndDelete(id);
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
