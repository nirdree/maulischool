import { connectDB } from '@/lib/mongodb';
import AcademicYear from '@/models/AcademicYear';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    if (pagination?.error) return r.badRequest(pagination.error);
    const query = AcademicYear.find().sort({ startDate: -1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [years, total] = await Promise.all([
      query,
      pagination ? AcademicYear.countDocuments() : Promise.resolve(null),
    ]);
    return pagination
      ? r.ok(years, 'Academic years fetched', paginationMeta(total, pagination))
      : r.ok(years);
  } catch (err) {
    return r.serverError(err.message);
  }
}

export const POST = authorize('admin')(async (request) => {
  try {
    await connectDB();
    const { name, startDate, endDate, isCurrent } = await request.json();
    if (!name || !startDate || !endDate)
      return r.badRequest('name, startDate and endDate are required');
    if (new Date(startDate) >= new Date(endDate))
      return r.badRequest('startDate must be before endDate');

    const year = await AcademicYear.create({ name, startDate, endDate, isCurrent: isCurrent || false });
    return r.created(year, 'Academic year created');
  } catch (err) {
    return r.serverError(err.message);
  }
});