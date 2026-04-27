import { connectDB } from '@/lib/mongodb';
import { Homework } from '@/models/Others';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('subjectId'))    filter.subject      = searchParams.get('subjectId');
    if (searchParams.get('teacherId'))    filter.teacher      = searchParams.get('teacherId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const homework = await Homework.find(filter)
      .populate('classroom', 'displayName')
      .populate('subject',   'name')
      .populate('teacher',   'name')
      .sort({ createdAt: -1 });

    return r.ok(homework);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal', 'teacher')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const hw = await Homework.create({ ...body, teacher: body.teacher || request.user.employeeId });
    await hw.populate([
      { path: 'classroom', select: 'displayName' },
      { path: 'subject',   select: 'name' },
    ]);
    return r.created(hw, 'Homework assigned');
  } catch (err) {
    return r.serverError(err.message);
  }
});