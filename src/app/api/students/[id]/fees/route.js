import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import Student from '@/models/Student';
import '@/models/Classroom';
import '@/models/AcademicYear';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal', 'parent')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    if (request.user.role === 'parent') {
      const linkedStudentIds = (request.user.studentIds || []).map(String);
      if (!linkedStudentIds.includes(String(id))) return r.forbidden('Student is not linked to this parent');
    }

    const academicYear = new URL(request.url).searchParams.get('academicYear');
    const filter = { student: id };
    if (academicYear) filter.academicYear = academicYear;

    const student = await Student.findById(id).select('firstName lastName admissionNo');
    if (!student) return r.notFound('Student not found');

    const fees = await Fee.find(filter)
      .populate('classroom', 'displayName className section')
      .populate('academicYear', 'name startDate endDate')
      .sort({ academicYear: -1, year: 1, month: 1 });
    const payments = await FeePayment.find({ fee: { $in: fees.map(f => f._id) } })
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });

    const paymentTotals = await FeePayment.aggregate([
      { $match: { fee: { $in: fees.map(fee => fee._id) } } },
      {
        $group: {
          _id: '$fee',
          amountPaid: {
            $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] },
          },
        },
      },
    ]);
    const paidByFee = new Map(paymentTotals.map(payment => [String(payment._id), payment.amountPaid]));
    const feesWithBalances = fees.map(fee => {
      const recordedPaid = paidByFee.get(String(fee._id));
      const amountPaid = recordedPaid ?? (fee.status === 'Paid' ? fee.finalAmount : 0);
      const outstandingAmount = fee.status === 'Waived'
        ? 0
        : Math.max(0, fee.finalAmount - amountPaid);
      return {
        ...fee.toObject(),
        student,
        amountPaid,
        outstandingAmount,
        status: fee.status === 'Waived'
          ? 'Waived'
          : outstandingAmount === 0
            ? 'Paid'
            : amountPaid > 0
              ? 'PartiallyPaid'
              : fee.dueDate < new Date()
                ? 'Overdue'
                : 'Pending',
      };
    });

    return r.ok({ fees: feesWithBalances, payments });
  } catch (err) {
    return r.serverError(err.message);
  }
});
