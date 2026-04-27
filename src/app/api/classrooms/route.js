import { connectDB } from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    const academicYear = searchParams.get('academicYear');
    const isActive     = searchParams.get('isActive');

    if (academicYear)          filter.academicYear = academicYear;
    if (isActive !== null)     filter.isActive     = isActive === 'true';

    const classrooms = await Classroom.find(filter)
      .populate('classTeacher', 'name employeeId')
      .populate('academicYear', 'name')
      .sort({ order: 1, className: 1, section: 1 });

    const counts = await Student.aggregate([
      { $match: { classroom: { $in: classrooms.map(c => c._id) }, status: { $nin: ['Left', 'Alumni'] } } },
      { $group: { _id: '$classroom', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));

    return r.ok(classrooms.map(c => ({ ...c.toObject(), studentCount: countMap[c._id.toString()] || 0 })));
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    if (!body.classTeacher) delete body.classTeacher;

    if (body.classTeacher && body.academicYear) {
      const conflict = await Classroom.findOne({ classTeacher: body.classTeacher, academicYear: body.academicYear });
      if (conflict) return r.conflict(`This teacher is already the class teacher of ${conflict.displayName}`);
    }

    const classroom = await Classroom.create(body);
    await classroom.populate('classTeacher', 'name employeeId');
    return r.created(classroom, 'Classroom created');
  } catch (err) {
    if (err.code === 11000) return r.conflict('A classroom with this name and section already exists for this academic year');
    return r.serverError(err.message);
  }
});