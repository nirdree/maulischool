import { connectDB } from '@/lib/mongodb';
import AcademicYear from '@/models/AcademicYear';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const PATCH = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    await AcademicYear.updateMany({}, { isCurrent: false });
    const year = await AcademicYear.findByIdAndUpdate(params.id, { isCurrent: true }, { new: true });
    if (!year) return r.notFound('Academic year not found');
    return r.ok(year, 'Current academic year updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});