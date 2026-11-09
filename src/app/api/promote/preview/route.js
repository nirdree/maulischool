import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const academicYear = searchParams.get('academicYear');

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return r.badRequest('A valid classId is required');
    }
    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear)) {
      return r.badRequest('A valid academicYear is required');
    }

    const classroom = await Classroom.findOne({
      _id: new mongoose.Types.ObjectId(classId),
      academicYear: new mongoose.Types.ObjectId(academicYear),
    });
    if (!classroom) return r.notFound('Classroom not found for this academic year');

    const [nextClassroom, students] = await Promise.all([
      Classroom.findOne({
        order: { $gt: classroom.order },
        academicYear: classroom.academicYear,
        isActive: true,
      }).sort({ order: 1 }),
      Student.find({
        classroom: classroom._id,
        academicYear: new mongoose.Types.ObjectId(academicYear),
        status: 'Approved',
      })
        .populate('classroom', 'displayName className section')
        .sort({ rollNumber: 1 }),
    ]);

    return r.ok({
      currentClass: classroom,
      nextClass: nextClassroom || null,
      students,
      totalCount: students.length,
    });
  } catch (err) {
    return r.serverError(err.message);
  }
});
