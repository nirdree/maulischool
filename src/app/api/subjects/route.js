import { connectDB } from '@/lib/mongodb';
import Subject from '@/models/Subject';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    const classId      = searchParams.get('classId');
    const teacherId    = searchParams.get('teacherId');
    const academicYear = searchParams.get('academicYear');
    const isActive     = searchParams.get('isActive');

    if (classId)              filter.classroom    = classId;
    if (teacherId)            filter.teacher      = teacherId;
    if (academicYear)         filter.academicYear = academicYear;
    if (isActive !== null)    filter.isActive     = isActive === 'true';

    const subjects = await Subject.find(filter)
      .populate('classroom',   'displayName')
      .populate('teacher',     'name employeeId')
      .populate('academicYear','name')
      .sort({ name: 1 });

    return r.ok(subjects);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body    = await request.json();
    const payload = Array.isArray(body) ? body : [body];
    const created = await Subject.insertMany(payload, { ordered: false });
    return r.created(created, `${created.length} subject(s) created`);
  } catch (err) {
    if (err.code === 11000) return r.conflict('One or more subjects already exist for this class');
    return r.serverError(err.message);
  }
});