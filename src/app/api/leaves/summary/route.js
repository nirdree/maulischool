import { connectDB } from '@/lib/mongodb';
import { Leave } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = { status: 'Approved' };
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');
    if (searchParams.get('employeeId'))   filter.employee     = searchParams.get('employeeId');

    const summary = await Leave.aggregate([
      { $match: filter },
      { $group: { _id: { employee: '$employee', leaveType: '$leaveType' }, totalDays: { $sum: '$totalDays' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.employee', types: { $push: { leaveType: '$_id.leaveType', totalDays: '$totalDays', count: '$count' } }, totalLeaves: { $sum: '$totalDays' } } },
    ]);

    return r.ok(summary);
  } catch (err) {
    return r.serverError(err.message);
  }
});