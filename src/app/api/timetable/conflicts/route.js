import { connectDB } from '@/lib/mongodb';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { findTeacherConflicts } from '../route';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    if (!academicYear) return r.badRequest('academicYear is required');

    const conflicts = await findTeacherConflicts(academicYear);
    return r.ok({ count: conflicts.length, conflicts });
  } catch (err) {
    return r.serverError(err.message);
  }
});