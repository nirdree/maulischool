import { connectDB } from '@/lib/mongodb';
import { Attendance } from '@/models/Attendance';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month        = searchParams.get('month');
    const year         = searchParams.get('year');
    const academicYear = searchParams.get('academicYear');

    const filter = { student: id };
    if (academicYear) filter.academicYear = academicYear;
    if (month && year) {
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59),
      };
    }

    const records = await Attendance.find(filter)
      .sort({ date: 1 })
      .populate('markedBy', 'name');

    return r.ok(records);
  } catch (err) {
    return r.serverError(err.message);
  }
});
