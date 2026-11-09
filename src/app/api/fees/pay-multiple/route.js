import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import FeeReceipt from '@/models/FeeReceipt';
import { authorize } from '@/lib/auth';
import { r } from '@/lib/response';

const PAYMENT_MODES = ['Cash', 'Cheque', 'Online', 'UPI', 'BankTransfer'];

export const POST = authorize('admin', 'principal')(async (request) => {
  let session;
  try {
    await connectDB();
    const body = await request.json();
    const feeIds = body.feeIds;

    if (!Array.isArray(feeIds) || feeIds.length === 0)
      return r.badRequest('Select at least one fee month');
    if (feeIds.some(id => !mongoose.isValidObjectId(id)) || new Set(feeIds.map(String)).size !== feeIds.length)
      return r.badRequest('Fee months must contain unique valid IDs');
    if (!PAYMENT_MODES.includes(body.paymentMode))
      return r.badRequest('A valid paymentMode is required');

    session = await mongoose.startSession();
    session.startTransaction();
    const abortWith = async (response) => {
      await session.abortTransaction();
      return response;
    };

    const fees = await Fee.find({ _id: { $in: feeIds } })
      .sort({ year: 1, month: 1 })
      .session(session);
    if (fees.length !== feeIds.length) return await abortWith(r.notFound('One or more fee records were not found'));
    if (fees.some(fee => fee.status === 'Waived'))
      return await abortWith(r.badRequest('Waived fees cannot be included in a payment'));
    if (fees.some(fee => (
      String(fee.student) !== String(fees[0].student)
      || String(fee.academicYear) !== String(fees[0].academicYear)
    ))) {
      return await abortWith(r.badRequest('Selected fee records must belong to the same student and academic year'));
    }

    const paymentTotals = await FeePayment.aggregate([
      { $match: { fee: { $in: fees.map(fee => fee._id) } } },
      {
        $group: {
          _id: '$fee',
          paid: { $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] } },
        },
      },
    ]).session(session);
    const paidByFee = new Map(paymentTotals.map(item => [String(item._id), item.paid]));
    const allocations = fees.map(fee => ({
      fee,
      amountPaid: Math.max(0, Number(fee.finalAmount) - (paidByFee.get(String(fee._id)) || 0)),
    })).filter(item => item.amountPaid > 0);

    if (allocations.length !== fees.length)
      return await abortWith(r.conflict('One or more selected fee months have already been paid'));

    const totalAmount = allocations.reduce((sum, item) => sum + item.amountPaid, 0);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0)
      return await abortWith(r.badRequest('Selected fee months have no outstanding balance'));

    const receiptNo = `RCP-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const paymentDate = new Date();

    const [receipt] = await FeeReceipt.create([{
      receiptNo,
      student: fees[0].student,
      academicYear: fees[0].academicYear,
      items: allocations.map(({ fee, amountPaid }) => ({
        fee: fee._id,
        month: fee.month,
        year: fee.year,
        amountPaid,
      })),
      amountPaid: totalAmount,
      paymentMode: body.paymentMode,
      transactionId: String(body.transactionId || '').trim(),
      paymentDate,
      collectedBy: request.user._id,
      notes: String(body.notes || '').trim(),
    }], { session });

    const payments = await FeePayment.create(allocations.map(({ fee, amountPaid }, index) => ({
      fee: fee._id,
      student: fee.student,
      receiptNo: `${receiptNo}-${String(index + 1).padStart(2, '0')}`,
      amountPaid,
      paymentDate,
      paymentMode: body.paymentMode,
      transactionId: String(body.transactionId || '').trim(),
      collectedBy: request.user._id,
      notes: String(body.notes || '').trim(),
      academicYear: fee.academicYear,
      batchReceipt: receipt._id,
    })), { session, ordered: true });

    receipt.payments = payments.map(payment => payment._id);
    await receipt.save({ session });

    for (const { fee, amountPaid } of allocations) {
      fee.status = (paidByFee.get(String(fee._id)) || 0) + amountPaid >= fee.finalAmount
        ? 'Paid'
        : (fee.dueDate < paymentDate ? 'Overdue' : 'PartiallyPaid');
      await fee.save({ session });
    }

    await session.commitTransaction();
    return r.created({
      receiptId: String(receipt._id),
      receiptNo: receipt.receiptNo,
      amountPaid: totalAmount,
      monthsPaid: allocations.length,
      paymentDate,
    }, 'Multi-month payment recorded');
  } catch (error) {
    if (session?.inTransaction()) await session.abortTransaction();
    if (error.code === 11000) return r.conflict('A receipt with this number already exists. Please retry.');
    return r.serverError(error.message);
  } finally {
    await session?.endSession();
  }
});
