import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/auth';
import { r } from '@/lib/response';
import Student from '@/models/Student';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();

    const academicYear = new URL(request.url).searchParams.get('academicYear');
    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear)) {
      return r.badRequest('A valid academicYear is required');
    }

    const data = await Student.aggregate([
      { $match: { academicYear: new mongoose.Types.ObjectId(academicYear) } },
      {
        $group: {
          _id: '$classroom',
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          underReview: { $sum: { $cond: [{ $eq: ['$status', 'UnderReview'] }, 1, 0] } },
          boys: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
          girls: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'classrooms',
          localField: '_id',
          foreignField: '_id',
          as: 'classroom',
        },
      },
      { $unwind: { path: '$classroom', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: '$classroom',
          total: 1,
          approved: 1,
          underReview: 1,
          boys: 1,
          girls: 1,
        },
      },
      { $sort: { '_id.order': 1, '_id.displayName': 1 } },
    ]);

    return r.ok(data, 'Class-wise student report fetched');
  } catch (err) {
    return r.serverError(err.message);
  }
});
