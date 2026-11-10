import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';
import { cashfreeConfig, cashfreeRequest } from '@/lib/cashfree';
import { Fee, FeePayment } from '@/models/Fee';
import Student from '@/models/Student';
import CashfreePayment from '@/models/CashfreePayment';

export const POST = protect(async (request) => {
  try {
    if (request.user.role !== 'parent') return r.forbidden('Only parents can create online fee payments');
    await connectDB();
    const body = await request.json();
    const feeIds = body.feeIds ?? (body.feeId ? [body.feeId] : []);
    if (!Array.isArray(feeIds) || feeIds.length === 0 || feeIds.length > 12
      || feeIds.some(id => !mongoose.isValidObjectId(id))
      || new Set(feeIds.map(String)).size !== feeIds.length) {
      return r.badRequest('Select between 1 and 12 unique valid fee months');
    }

    const fees = await Fee.find({ _id: { $in: feeIds } }).sort({ year: 1, month: 1 });
    if (fees.length !== feeIds.length) return r.notFound('One or more fee records were not found');
    if (fees.some(fee => (
      String(fee.student) !== String(fees[0].student)
      || String(fee.academicYear) !== String(fees[0].academicYear)
    ))) {
      return r.badRequest('Selected fee records must belong to the same student and academic year');
    }
    if (fees.some(fee => fee.status === 'Waived')) return r.badRequest('Waived fees cannot be paid online');

    const studentId = fees[0].student;
    if (!(request.user.studentIds || []).some(id => String(id) === String(studentId))) {
      return r.forbidden('Fee record is not linked to this parent');
    }

    const student = await Student.findById(studentId);
    if (!student) return r.notFound('Student not found');
    const paymentTotals = await FeePayment.aggregate([
      { $match: { fee: { $in: fees.map(fee => fee._id) } } },
      {
        $group: {
          _id: '$fee',
          paid: { $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] } },
        },
      },
    ]);
    const paidByFee = new Map(paymentTotals.map(item => [String(item._id), item.paid]));
    const feeAllocations = fees.map(fee => ({
      fee: fee._id,
      amount: Number(Math.max(0, fee.finalAmount - (
        paidByFee.get(String(fee._id)) ?? (fee.status === 'Paid' ? fee.finalAmount : 0)
      )).toFixed(2)),
    }));
    if (feeAllocations.some(item => item.amount < 0.01)) {
      return r.conflict('One or more selected fee months no longer have an outstanding balance');
    }
    const expectedAmount = Number(feeAllocations.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
    const activeFeeKeys = fees.map(fee => String(fee._id));
    const existing = await CashfreePayment.findOne({
      $or: [
        { activeFeeKey: { $in: activeFeeKeys } },
        { activeFeeKeys: { $in: activeFeeKeys } },
      ],
    }).select('+paymentSessionId');
    if (existing) {
      const existingFeeIds = (existing.feeAllocations || [{ fee: existing.fee }]).map(item => String(item.fee));
      const sameSelection = existingFeeIds.length === activeFeeKeys.length
        && activeFeeKeys.every(id => existingFeeIds.includes(id));
      if (existing.parent.toString() !== request.user._id.toString() || !sameSelection)
        return r.conflict('A payment is already processing for one or more selected fee months');
      if (existing.paymentSessionId) {
        return r.ok({ orderId: existing.orderId, paymentSessionId: existing.paymentSessionId, amount: existing.expectedAmount, mode: cashfreeConfig().mode }, 'Existing checkout resumed');
      }
      return r.conflict('Your checkout is being prepared. Please retry shortly.');
    }

    const recentOrders = await CashfreePayment.countDocuments({
      parent: request.user._id,
      createdAt: { $gte: new Date(Date.now() - 60_000) },
    });
    if (recentOrders >= 8) return r.tooManyRequests('Too many payment attempts. Please wait a minute and retry.');

    const phone = (student.fatherUser?.toString() === request.user._id.toString() ? student.fatherPhone : '')
      || (student.motherUser?.toString() === request.user._id.toString() ? student.motherPhone : '')
      || student.fatherPhone || student.motherPhone;
    const customerPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (customerPhone.length !== 10) return r.badRequest('A valid guardian phone number is required for online payment');

    const config = cashfreeConfig();
    const orderId = `sch_${crypto.randomUUID().replaceAll('-', '')}`;
    let payment;
    try {
      payment = await CashfreePayment.create({
        student: student._id,
        parent: request.user._id,
        fee: fees[0]._id,
        feeAllocations,
        academicYear: fees[0].academicYear,
        expectedAmount,
        currency: 'INR',
        orderId,
        activeFeeKey: fees.length === 1 ? activeFeeKeys[0] : undefined,
        activeFeeKeys,
      });
    } catch (error) {
      if (error.code === 11000) {
        return r.conflict('A payment is already being created for one or more selected fee months. Please retry shortly.');
      }
      throw error;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const returnUrl = process.env.CASHFREE_RETURN_URL
      || `${appUrl}/parent/fees?payment=return&order_id={order_id}`;
    if (!appUrl && !process.env.CASHFREE_RETURN_URL) {
      await CashfreePayment.updateOne({ _id: payment._id }, {
        $set: { status: 'Failed', failureReason: 'Return URL is not configured' },
        $unset: { activeFeeKey: 1, activeFeeKeys: 1 },
      });
      return r.serverError('Payment return URL is not configured');
    }

    try {
      const order = await cashfreeRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          order_amount: payment.expectedAmount,
          order_currency: payment.currency,
          customer_details: {
            customer_id: String(request.user._id),
            customer_name: request.user.name,
            customer_email: request.user.email,
            customer_phone: customerPhone,
          },
          order_meta: { return_url: returnUrl },
          order_note: `School fees ${student.admissionNo} ${fees.map(fee => `${fee.month}/${fee.year}`).join(',')}`,
        }),
      });
      if (order.order_id !== orderId || !order.payment_session_id) throw new Error('Cashfree returned an invalid checkout session');
      await CashfreePayment.updateOne(
        { _id: payment._id },
        { $set: { paymentSessionId: order.payment_session_id } },
      );
      return r.created({ orderId, paymentSessionId: order.payment_session_id, amount: payment.expectedAmount, mode: config.mode }, 'Checkout session created');
    } catch (error) {
      await CashfreePayment.updateOne(
        { _id: payment._id, status: { $ne: 'Paid' } },
        {
          $set: { status: 'Failed', failureReason: 'Unable to create checkout session' },
          $unset: { activeFeeKey: 1, activeFeeKeys: 1 },
        },
      );
      console.error('Cashfree order creation failed:', error.status || error.message);
      return r.serverError('Could not start payment. Please try again.');
    }
  } catch (error) {
    console.error('Online fee order error:', error.message);
    return r.serverError('Unable to create payment order');
  }
});
