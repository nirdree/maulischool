import { connectDB } from '@/lib/mongodb';
import { Attendance } from '@/models/Attendance';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('studentId'))    filter.student      = searchParams.get('studentId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const month = searchParams.get('month');
    const year  = searchParams.get('year');
    if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }

    const summary = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id:     '$student',
          total:   { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent:  { $sum: { $cond: [{ $eq: ['$status', 'Absent']  }, 1, 0] } },
          late:    { $sum: { $cond: [{ $eq: ['$status', 'Late']    }, 1, 0] } },
        },
      },
      {
        $addFields: {
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
        },
      },
    ]);

    return r.ok(summary);
  } catch (err) {
    return r.serverError(err.message);
  }
});