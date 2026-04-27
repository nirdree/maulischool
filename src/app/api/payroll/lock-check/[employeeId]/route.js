import { connectDB } from '@/lib/mongodb';
import { Payroll } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get('month'));
    const year  = Number(searchParams.get('year'));

    const paid = await Payroll.findOne({ employee: params.employeeId, month, year, status: 'Paid' });
    return r.ok({ locked: !!paid });
  } catch (err) {
    return r.serverError(err.message);
  }
});