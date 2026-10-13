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
    const { feeId } = await request.json();
    if (!mongoose.isValidObjectId(feeId)) return r.badRequest('A valid feeId is required');

    const fee = await Fee.findById(feeId).populate('classroom', 'displayName');
    if (!fee) return r.notFound('Fee record not found');
    if (!(request.user.studentIds || []).some(id => String(id) === String(fee.student))) {
      return r.forbidden('Fee record is not linked to this parent');
    }

    const student = await Student.findById(fee.student);
    if (!student) return r.notFound('Student not found');
    const payments = await FeePayment.find({ fee: fee._id }).select('amountPaid amountRefunded');
    const paidAmount = payments.reduce((sum, payment) => sum + (payment.amountPaid || 0) - (payment.amountRefunded || 0), 0);
    const outstanding = Math.max(0, Number(fee.finalAmount) - paidAmount);
    if (outstanding < 0.01 || fee.status === 'Waived') return r.badRequest('This fee has no outstanding balance');

    const existing = await CashfreePayment.findOne({ activeFeeKey: String(fee._id) }).select('+paymentSessionId');
    if (existing) {
      if (existing.parent.toString() !== request.user._id.toString()) return r.conflict('A payment is already processing for this fee');
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
        fee: fee._id,
        academicYear: fee.academicYear,
        expectedAmount: Number(outstanding.toFixed(2)),
        currency: 'INR',
        orderId,
        activeFeeKey: String(fee._id),
      });
    } catch (error) {
      if (error.code === 11000) {
        return r.conflict('A payment is already being created for this fee. Please retry shortly.');
      }
      throw error;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const returnUrl = process.env.CASHFREE_RETURN_URL
      || `${appUrl}/parent/fees?payment=return&order_id={order_id}`;
    if (!appUrl && !process.env.CASHFREE_RETURN_URL) {
      await CashfreePayment.updateOne({ _id: payment._id }, { $set: { status: 'Failed', failureReason: 'Return URL is not configured' }, $unset: { activeFeeKey: 1 } });
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
          order_note: `School fees ${student.admissionNo} ${fee.month}/${fee.year}`,
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
        { $set: { status: 'Failed', failureReason: 'Unable to create checkout session' }, $unset: { activeFeeKey: 1 } },
      );
      console.error('Cashfree order creation failed:', error.status || error.message);
      return r.serverError('Could not start payment. Please try again.');
    }
  } catch (error) {
    console.error('Online fee order error:', error.message);
    return r.serverError('Unable to create payment order');
  }
});
