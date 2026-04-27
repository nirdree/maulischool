import { connectDB } from '@/lib/mongodb';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { sanitizeSchedule, checkIncomingConflicts } from '../route';

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const { classroom, academicYear } = body;
    const schedule = sanitizeSchedule(body.schedule);

    if (!classroom || !academicYear || !schedule.length)
      return r.badRequest('classroom, academicYear and schedule are required');

    const conflicts = await checkIncomingConflicts(classroom, academicYear, schedule);
    return r.ok({ valid: conflicts.length === 0, conflicts });
  } catch (err) {
    return r.serverError(err.message);
  }
});