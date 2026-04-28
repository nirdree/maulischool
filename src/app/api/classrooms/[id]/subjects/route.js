import { connectDB } from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const classroom = await Classroom.findById(id);
    if (!classroom) return r.notFound('Classroom not found');
    const subjects = await Subject.find({ classroom: id })
      .populate('teacher', 'name employeeId')
      .sort({ name: 1 });
    return r.ok(subjects);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const classroom = await Classroom.findById(id);
    if (!classroom) return r.notFound('Classroom not found');

    const body = await request.json();
    if (!body.teacher) delete body.teacher;

    const subject = await Subject.create({ ...body, classroom: id, academicYear: classroom.academicYear });
    await subject.populate('teacher', 'name employeeId');
    return r.created(subject, 'Subject added');
  } catch (err) {
    if (err.code === 11000) return r.conflict('A subject with this name already exists in this classroom');
    return r.serverError(err.message);
  }
});