import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const POST = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const fee = await Fee.findById(id);
    if (!fee) return r.notFound('Fee record not found');
    if (fee.status === 'Waived') return r.badRequest('Waived fees cannot be paid');

    const { amountPaid, paymentMode, transactionId, notes } = await request.json();
    const paymentAmount = Number(amountPaid);
    const paymentModes = ['Cash', 'Cheque', 'Online', 'UPI', 'BankTransfer'];
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return r.badRequest('amountPaid must be a positive number');
    }
    if (!paymentModes.includes(paymentMode)) {
      return r.badRequest('A valid paymentMode is required');
    }

    const priorPayments = await FeePayment.find({ fee: fee._id }).select('amountPaid amountRefunded');
    if (fee.status === 'Paid' && priorPayments.length === 0) {
      return r.badRequest('Fee is already fully paid');
    }
    const totalPaid = priorPayments.reduce(
      (sum, payment) => sum + (payment.amountPaid || 0) - (payment.amountRefunded || 0),
      0,
    );
    const outstandingAmount = Math.max(0, fee.finalAmount - totalPaid);
    if (paymentAmount > outstandingAmount) {
      return r.badRequest(`Payment exceeds the outstanding balance of ${outstandingAmount}`);
    }
    if (outstandingAmount === 0) return r.badRequest('Fee is already fully paid');

    const payment = await FeePayment.create({
      fee:          fee._id,
      student:      fee.student,
      amountPaid:   paymentAmount,
      paymentDate:  new Date(),
      paymentMode,
      transactionId,
      notes,
      collectedBy:  request.user._id,
      academicYear: fee.academicYear,
    });

    const newTotalPaid = totalPaid + paymentAmount;
    fee.status = newTotalPaid >= fee.finalAmount
      ? 'Paid'
      : (fee.dueDate < new Date() ? 'Overdue' : 'PartiallyPaid');
    await fee.save();

    return r.ok(
      { payment, receiptNo: payment.receiptNo, newStatus: fee.status, totalPaid: newTotalPaid },
      `Payment recorded. Receipt: ${payment.receiptNo}`,
    );
  } catch (err) {
    return r.serverError(err.message);
  }
});
