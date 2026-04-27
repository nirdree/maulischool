import { connectDB } from '@/lib/mongodb';
import AcademicYear from '@/models/AcademicYear';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const years = await AcademicYear.find().sort({ startDate: -1 });
    return r.ok(years);
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