import { connectDB } from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Employee from '@/models/Employee';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const academicYear      = searchParams.get('academicYear');
    const excludeClassroom  = searchParams.get('excludeClassroom');

    const filter = { classTeacher: { $exists: true, $ne: null } };
    if (academicYear)     filter.academicYear = academicYear;
    if (excludeClassroom) filter._id          = { $ne: excludeClassroom };

    const rooms       = await Classroom.find(filter).select('classTeacher');
    const assignedIds = new Set(rooms.map(r => r.classTeacher.toString()));

    const teachers = await Employee.find({
      role:   'teacher',
      status: 'active',
      ...(assignedIds.size > 0 && {
        _id: { $nin: Array.from(assignedIds).map(id => new mongoose.Types.ObjectId(id)) },
      }),
    }).select('name employeeId').sort({ name: 1 });

    return r.ok(teachers);
  } catch (err) {
    return r.serverError(err.message);
  }
});