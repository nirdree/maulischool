import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Payroll } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const month = Number(searchParams.get('month'));
    const year = Number(searchParams.get('year'));

    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear)) {
      return r.badRequest('A valid academicYear is required');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12
      || !Number.isInteger(year) || year < 1900 || year > 9999) {
      return r.badRequest('A valid month and year are required');
    }

    const filter = {
      academicYear: new mongoose.Types.ObjectId(academicYear),
      month,
      year,
    };
    const [records, summary] = await Promise.all([
      Payroll.find(filter)
        .populate('employee', 'name employeeId')
        .sort({ 'employee.name': 1 }),
      Payroll.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalEmployees: { $sum: 1 },
            totalNet: { $sum: '$netSalary' },
            paidCount: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    return r.ok({
      summary: summary[0] || { totalEmployees: 0, totalNet: 0, paidCount: 0, pendingCount: 0 },
      records,
    });
  } catch (err) {
    return r.serverError(err.message);
  }
});
