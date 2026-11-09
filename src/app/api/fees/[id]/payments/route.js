import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';
import CashfreePayment from '@/models/CashfreePayment';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    if (request.user.role === 'parent') {
      const fee = await Fee.findById(id).select('student');
      if (!fee) return r.notFound('Fee record not found');
      if (!(request.user.studentIds || []).some(studentId => String(studentId) === String(fee.student))) {
        return r.forbidden('Fee record is not linked to this parent');
      }
    }
    const payments = await FeePayment.find({ fee: id })
      .populate('collectedBy', 'name')
      .populate('batchReceipt', 'receiptNo')
      .sort({ paymentDate: -1 });
    const onlinePayments = await CashfreePayment.find({
      status: 'Paid',
      $or: [{ fee: id }, { 'feeAllocations.fee': id }],
    }).select('_id feePayment feeReceipt');
    const onlinePaymentIds = new Map(onlinePayments.map(payment => [String(payment.feePayment), String(payment._id)]));
    const onlineReceiptIds = new Map(onlinePayments
      .filter(payment => payment.feeReceipt)
      .map(payment => [String(payment.feeReceipt), String(payment._id)]));
    return r.ok(payments.map(payment => ({
      ...payment.toObject(),
      onlinePaymentId: onlinePaymentIds.get(String(payment._id))
        || onlineReceiptIds.get(String(payment.batchReceipt?._id || payment.batchReceipt))
        || null,
    })));
  } catch (err) {
    return r.serverError(err.message);
  }
});
