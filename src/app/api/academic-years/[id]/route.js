import { connectDB } from '@/lib/mongodb';
import AcademicYear from '@/models/AcademicYear';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const year = await AcademicYear.findById(id);
    if (!year) return r.notFound('Academic year not found');
    return r.ok(year);
  } catch (err) {
    return r.serverError(err.message);
  }
}

export const PUT = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const year = await AcademicYear.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!year) return r.notFound('Academic year not found');
    return r.ok(year, 'Academic year updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const year = await AcademicYear.findById(id);
    if (!year)          return r.notFound('Academic year not found');
    if (year.isCurrent) return r.badRequest('Cannot delete the current academic year');

    const [studentCount, classCount] = await Promise.all([
      Student.countDocuments({ academicYear: id }),
      Classroom.countDocuments({ academicYear: id }),
    ]);

    if (studentCount > 0 || classCount > 0)
      return r.badRequest(`Cannot delete — ${studentCount} students and ${classCount} classrooms are linked to this year`);

    await AcademicYear.findByIdAndDelete(id);
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
