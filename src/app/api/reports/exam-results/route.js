import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Marks } from '@/models/Exam';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const classId = searchParams.get('classId');

    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear)) {
      return r.badRequest('A valid academicYear is required');
    }
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return r.badRequest('A valid classId is required');
    }

    const match = { academicYear: new mongoose.Types.ObjectId(academicYear) };
    if (classId) match.classroom = new mongoose.Types.ObjectId(classId);

    const data = await Marks.aggregate([
      { $match: match },
      {
        $group: {
          _id: { exam: '$exam', classroom: '$classroom' },
          totalStudents: { $sum: 1 },
          averageMarks: { $avg: '$marksObtained' },
          highestMarks: { $max: '$marksObtained' },
          passCount: { $sum: { $cond: [{ $ne: ['$grade', 'F'] }, 1, 0] } },
          gradeF: { $sum: { $cond: [{ $eq: ['$grade', 'F'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id.exam',
          foreignField: '_id',
          as: 'exam',
        },
      },
      {
        $lookup: {
          from: 'classrooms',
          localField: '_id.classroom',
          foreignField: '_id',
          as: 'classroom',
        },
      },
      { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$classroom', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { exam: '$exam', classroom: '$classroom' },
          totalStudents: 1,
          averageMarks: { $round: ['$averageMarks', 2] },
          highestMarks: 1,
          passCount: 1,
          gradeF: 1,
        },
      },
      { $sort: { '_id.exam.examDate': -1, '_id.classroom.displayName': 1 } },
    ]);

    return r.ok(data);
  } catch (err) {
    return r.serverError(err.message);
  }
});
