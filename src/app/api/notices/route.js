import { connectDB } from '@/lib/mongodb';
import { Notice } from '@/models/Others';
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
    if (searchParams.get('priority'))     filter.priority     = searchParams.get('priority');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    if (['parent', 'teacher'].includes(request.user.role)) {
      filter.targetRoles = request.user.role;
    }

    filter.$or = [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gte: new Date() } },
    ];

    const query = Notice.find(filter)
      .populate('createdBy', 'name')
      .sort({ publishDate: -1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [notices, total] = await Promise.all([
      query,
      pagination ? Notice.countDocuments(filter) : Promise.resolve(null),
    ]);

    return pagination
      ? r.ok(notices, 'Notices fetched', paginationMeta(total, pagination))
      : r.ok(notices);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body   = await request.json();
    const notice = await Notice.create({ ...body, createdBy: request.user._id });
    return r.created(notice, 'Notice published');
  } catch (err) {
    return r.serverError(err.message);
  }
});