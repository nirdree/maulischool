import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const year = Number(searchParams.get('year'));

    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear)) {
      return r.badRequest('A valid academicYear is required');
    }
    if (!Number.isInteger(year) || year < 1900 || year > 9999) {
      return r.badRequest('A valid year is required');
    }

    const fees = await Fee.find({ academicYear, year })
      .select('_id month finalAmount')
      .lean();
    const paidByFee = fees.length
      ? await FeePayment.aggregate([
          { $match: { fee: { $in: fees.map(fee => fee._id) } } },
          {
            $group: {
              _id: '$fee',
              collected: {
                $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] },
              },
            },
          },
        ])
      : [];
    const collectedByFee = new Map(paidByFee.map(payment => [String(payment._id), payment.collected]));
    const monthly = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      totalExpected: 0,
      totalCollected: 0,
    }));

    for (const fee of fees) {
      const month = monthly[fee.month - 1];
      if (!month) continue;
      month.totalExpected += Number(fee.finalAmount || 0);
      month.totalCollected += collectedByFee.get(String(fee._id)) || 0;
    }

    return r.ok(monthly.map(item => {
      const totalPending = Math.max(0, item.totalExpected - item.totalCollected);
      return {
        ...item,
        totalPending,
        collectionRate: item.totalExpected
          ? Number(((item.totalCollected / item.totalExpected) * 100).toFixed(1))
          : 0,
      };
    }));
  } catch (err) {
    return r.serverError(err.message);
  }
});
