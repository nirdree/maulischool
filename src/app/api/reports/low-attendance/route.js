import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Attendance } from '@/models/Attendance';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const month = Number(searchParams.get('month'));
    const year = Number(searchParams.get('year'));
    const classId = searchParams.get('classId');

    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear)) {
      return r.badRequest('A valid academicYear is required');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12
      || !Number.isInteger(year) || year < 1900 || year > 9999) {
      return r.badRequest('A valid month and year are required');
    }
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return r.badRequest('A valid classId is required');
    }

    const match = {
      academicYear: new mongoose.Types.ObjectId(academicYear),
      date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) },
    };
    if (classId) match.classroom = new mongoose.Types.ObjectId(classId);

    const data = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$student',
          total: { $sum: { $cond: [{ $ne: ['$status', 'Holiday'] }, 1, 0] } },
          present: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $in: ['$status', ['Present', 'Late']] }, then: 1 },
                  { case: { $eq: ['$status', 'HalfDay'] }, then: 0.5 },
                ],
                default: 0,
              },
            },
          },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
        },
      },
      { $match: { total: { $gt: 0 } } },
      {
        $addFields: {
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
        },
      },
      { $match: { percentage: { $lt: 75 } } },
      { $sort: { percentage: 1, '_id': 1 } },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      { $project: { _id: '$student', total: 1, present: 1, absent: 1, percentage: 1 } },
    ]);

    return r.ok(data);
  } catch (err) {
    return r.serverError(err.message);
  }
});
