import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import { Leave } from '@/models/Others';
import Classroom from '@/models/Classroom';
import Employee from '@/models/Employee';
import Student from '@/models/Student';
import { authorize } from '@/lib/auth';
import { r } from '@/lib/response';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();

    const academicYear = new URL(request.url).searchParams.get('academicYear');
    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear))
      return r.badRequest('A valid academicYear is required');

    const yearId = new mongoose.Types.ObjectId(academicYear);
    const [
      studentStats,
      employeeStats,
      classCount,
      feeStats,
      paymentStats,
      pendingLeaves,
    ] = await Promise.all([
      Student.aggregate([
        { $match: { academicYear: yearId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
            underReview: { $sum: { $cond: [{ $eq: ['$status', 'UnderReview'] }, 1, 0] } },
          },
        },
      ]),
      Employee.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          },
        },
      ]),
      Classroom.countDocuments({ academicYear: yearId, isActive: true }),
      Fee.aggregate([
        { $match: { academicYear: yearId } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      FeePayment.aggregate([
        { $match: { academicYear: yearId } },
        {
          $group: {
            _id: null,
            collected: {
              $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] },
            },
          },
        },
      ]),
      Leave.countDocuments({ academicYear: yearId, status: 'Pending' }),
    ]);

    const students = studentStats[0] || { total: 0, approved: 0, underReview: 0 };
    const employees = employeeStats[0] || { total: 0, active: 0 };
    const totalFees = feeStats[0]?.total || 0;
    const collectedFees = paymentStats[0]?.collected || 0;

    return r.ok({
      students,
      employees,
      classes: { total: classCount },
      fees: {
        total: totalFees,
        collected: collectedFees,
        pending: Math.max(0, totalFees - collectedFees),
      },
      leaves: { pending: pendingLeaves },
    });
  } catch (err) {
    return r.serverError(err.message);
  }
});
