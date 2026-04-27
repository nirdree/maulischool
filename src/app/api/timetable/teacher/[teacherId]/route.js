import { connectDB } from '@/lib/mongodb';
import { Timetable } from '@/models/Others';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = { 'schedule.periods.teacher': params.teacherId };
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const timetables = await Timetable.find(filter)
      .populate('classroom', 'displayName className section')
      .populate('schedule.periods.subject', 'name')
      .populate('schedule.periods.teacher', 'name employeeId');

    const result = timetables.map(tt => ({
      classroom: tt.classroom, academicYear: tt.academicYear,
      schedule: tt.schedule.map(ds => ({
        day: ds.day,
        periods: ds.periods.filter(
          p => p.teacher && (p.teacher._id || p.teacher).toString() === params.teacherId
        ),
      })).filter(ds => ds.periods.length > 0),
    }));

    return r.ok(result);
  } catch (err) {
    return r.serverError(err.message);
  }
});