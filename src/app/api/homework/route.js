import { connectDB } from '@/lib/mongodb';
import { Homework } from '@/models/Others';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    if (pagination?.error) return r.badRequest(pagination.error);
    const filter = {};
    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('subjectId'))    filter.subject      = searchParams.get('subjectId');
    if (searchParams.get('teacherId'))    filter.teacher      = searchParams.get('teacherId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const query = Homework.find(filter)
      .populate('classroom', 'displayName')
      .populate('subject',   'name')
      .populate('teacher',   'name')
      .sort({ createdAt: -1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [homework, total] = await Promise.all([
      query,
      pagination ? Homework.countDocuments(filter) : Promise.resolve(null),
    ]);

    return pagination
      ? r.ok(homework, 'Homework fetched', paginationMeta(total, pagination))
      : r.ok(homework);
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