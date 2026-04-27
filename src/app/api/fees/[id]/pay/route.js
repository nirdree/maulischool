import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const POST = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const fee = await Fee.findById(params.id);
    if (!fee)                  return r.notFound('Fee record not found');
    if (fee.status === 'Paid') return r.badRequest('Fee is already fully paid');

    const { amountPaid, paymentMode, transactionId, notes } = await request.json();
    if (!amountPaid)   return r.badRequest('amountPaid is required');
    if (!paymentMode)  return r.badRequest('paymentMode is required');

    const payment = await FeePayment.create({
      fee:          fee._id,
      student:      fee.student,
      amountPaid:   Number(amountPaid),
      paymentDate:  new Date(),
      paymentMode,
      transactionId,
      notes,
      collectedBy:  request.user._id,
      academicYear: fee.academicYear,
    });

    const allPayments = await FeePayment.find({ fee: fee._id });
    const totalPaid   = allPayments.reduce((s, p) => s + (p.amountPaid || 0), 0);
    fee.status = totalPaid >= fee.finalAmount ? 'Paid' : 'PartiallyPaid';
    await fee.save();

    return r.ok(
      { payment, receiptNo: payment.receiptNo, newStatus: fee.status, totalPaid },
      `Payment recorded. Receipt: ${payment.receiptNo}`,
    );
  } catch (err) {
    return r.serverError(err.message);
  }
});