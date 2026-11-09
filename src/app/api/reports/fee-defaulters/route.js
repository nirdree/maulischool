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
    const month = Number(searchParams.get('month'));
    const year = Number(searchParams.get('year'));
    const classId = searchParams.get('classId');

    if (!academicYear || !mongoose.Types.ObjectId.isValid(academicYear)) {
      return r.badRequest('A valid academicYear is required');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12
      || !Number.isInteger(year) || year < 1900 || year > 9999) {
      return r.badRequest('A valid month and year are required');
    }
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return r.badRequest('A valid classId is required');
    }

    const filter = {
      academicYear: new mongoose.Types.ObjectId(academicYear),
      month,
      year,
      status: { $ne: 'Waived' },
    };
    if (classId) filter.classroom = new mongoose.Types.ObjectId(classId);

    const fees = await Fee.find(filter)
      .populate('student', 'firstName lastName admissionNo')
      .populate('classroom', 'displayName')
      .sort({ dueDate: 1 });
    const payments = fees.length
      ? await FeePayment.aggregate([
          { $match: { fee: { $in: fees.map(fee => fee._id) } } },
          {
            $group: {
              _id: '$fee',
              amountPaid: {
                $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] },
              },
            },
          },
        ])
      : [];
    const paidByFee = new Map(payments.map(payment => [String(payment._id), payment.amountPaid]));
    const now = new Date();
    const defaulters = fees.flatMap(fee => {
      const amountPaid = paidByFee.get(String(fee._id)) || 0;
      const outstanding = Math.max(0, Number(fee.finalAmount || 0) - amountPaid);
      if (!outstanding) return [];
      return [{
        ...fee.toObject(),
        amountPaid,
        outstandingAmount: outstanding,
        status: fee.dueDate < now ? 'Overdue' : amountPaid > 0 ? 'PartiallyPaid' : 'Pending',
      }];
    });

    return r.ok(defaulters);
  } catch (err) {
    return r.serverError(err.message);
  }
});
