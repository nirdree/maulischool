import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { confirmCashfreePayment, verifyCashfreeWebhook } from '@/lib/cashfree';
import CashfreePayment from '@/models/CashfreePayment';
import { Fee, FeePayment } from '@/models/Fee';
import FeeReceipt from '@/models/FeeReceipt';
import { r } from '@/lib/response';

export const POST = async (request) => {
  const rawBody = await request.text();
  const timestamp = request.headers.get('x-webhook-timestamp');
  const signature = request.headers.get('x-webhook-signature');
  if (!verifyCashfreeWebhook(rawBody, timestamp, signature)) return r.unauthorized('Invalid webhook signature');

  try {
    const event = JSON.parse(rawBody);
    const orderId = event?.data?.order?.order_id || event?.data?.order_id;
    if (!orderId) return r.badRequest('Webhook order ID is missing');
    await connectDB();
    const payment = await CashfreePayment.findOne({ orderId });
    if (!payment) return r.ok({ received: true }, 'Unmatched event acknowledged');

    const eventKey = request.headers.get('x-idempotency-header')
      || crypto.createHash('sha256').update(rawBody).digest('hex');
    await CashfreePayment.updateOne({ _id: payment._id }, { $addToSet: { webhookEvents: eventKey } });
    const eventType = String(event.type || event.event_type || '').toUpperCase();
    if (eventType.includes('REFUND')) {
      const refund = event.data?.refund || event.data;
      if (refund?.refund_status !== 'SUCCESS') return r.ok({ received: true }, 'Refund event acknowledged');
      const amount = Number(refund.refund_amount);
      if (!Number.isFinite(amount) || amount <= 0) return r.badRequest('Refund amount is invalid');
      if (payment.status !== 'Paid' && payment.status !== 'Refunded') await confirmCashfreePayment(payment);
      const batchReceipt = await FeeReceipt.findOne({ gatewayOrderId: orderId });
      if (batchReceipt) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          const receipt = await FeeReceipt.findById(batchReceipt._id).session(session);
          if (!receipt) throw new Error('Multi-month receipt was not found');
          if (receipt.refundReferences.includes(eventKey)) {
            await session.abortTransaction();
            return r.ok({ received: true }, 'Refund already processed');
          }

          const refundCentsTotal = Math.round(amount * 100);
          let remainingCents = refundCentsTotal;
          if (remainingCents < 1) throw new Error('Refund amount is below the minimum currency unit');
          const feePayments = await FeePayment.find({ _id: { $in: receipt.payments } }).session(session);
          const paymentByFee = new Map(feePayments.map(item => [String(item.fee), item]));
          if (feePayments.length !== receipt.items.length)
            throw new Error('Multi-month payment allocations are incomplete');

          for (const item of receipt.items) {
            if (remainingCents <= 0) break;
            const feePayment = paymentByFee.get(String(item.fee));
            if (!feePayment) throw new Error('A refund allocation is missing its fee payment');
            const availableCents = Math.max(0, Math.round((feePayment.amountPaid - feePayment.amountRefunded) * 100));
            const refundCents = Math.min(availableCents, remainingCents);
            if (refundCents > 0) {
              feePayment.amountRefunded = Number((feePayment.amountRefunded + refundCents / 100).toFixed(2));
              feePayment.refundReferences.push(eventKey);
              await feePayment.save({ session });
              remainingCents -= refundCents;
            }
          }

          if (remainingCents > 0) throw new Error('Refund exceeds the unrefunded amount of this receipt');
          receipt.amountRefunded = Number((receipt.amountRefunded + refundCentsTotal / 100).toFixed(2));
          receipt.refundReferences.push(eventKey);
          await receipt.save({ session });

          const feeIds = receipt.items.map(item => item.fee);
          const paymentTotals = await FeePayment.aggregate([
            { $match: { fee: { $in: feeIds } } },
            {
              $group: {
                _id: '$fee',
                paid: { $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] } },
              },
            },
          ]).session(session);
          const paidByFee = new Map(paymentTotals.map(item => [String(item._id), item.paid]));
          const fees = await Fee.find({ _id: { $in: feeIds } }).session(session);
          for (const fee of fees) {
            const paid = paidByFee.get(String(fee._id)) || 0;
            fee.status = paid >= fee.finalAmount
              ? 'Paid'
              : (fee.dueDate < new Date() ? 'Overdue' : 'PartiallyPaid');
            await fee.save({ session });
          }
          await CashfreePayment.updateOne({ _id: payment._id }, { $set: {
            status: receipt.amountRefunded >= receipt.amountPaid ? 'Refunded' : 'Paid',
            refundAmount: receipt.amountRefunded,
            refundedAt: new Date(refund.refund_processed_at || Date.now()),
            refundReference: String(refund.cf_refund_id || ''),
          } }, { session });
          await session.commitTransaction();
        } catch (error) {
          if (session.inTransaction()) await session.abortTransaction();
          throw error;
        } finally {
          await session.endSession();
        }
        return r.ok({ received: true }, 'Refund processed');
      }

      const receipt = await FeePayment.findOne({ gatewayOrderId: orderId });
      if (!receipt) return r.serverError('Verified fee receipt is not available for this refund');
      const updatedReceipt = await FeePayment.findOneAndUpdate(
        { _id: receipt._id, refundReferences: { $ne: eventKey }, amountRefunded: { $lte: receipt.amountPaid - amount } },
        { $inc: { amountRefunded: amount }, $addToSet: { refundReferences: eventKey } },
        { new: true },
      );
      const finalReceipt = updatedReceipt || await FeePayment.findById(receipt._id);
      const ledger = await FeePayment.find({ fee: receipt.fee }).select('amountPaid amountRefunded');
      const netPaid = ledger.reduce((sum, item) => sum + (item.amountPaid || 0) - (item.amountRefunded || 0), 0);
      const fee = await Fee.findById(receipt.fee);
      if (fee) {
        fee.status = netPaid >= fee.finalAmount ? 'Paid' : (fee.dueDate < new Date() ? 'Overdue' : 'PartiallyPaid');
        await fee.save();
      }
      await CashfreePayment.updateOne({ _id: payment._id }, { $set: {
        status: 'Refunded',
        refundAmount: Math.min(Number(finalReceipt?.amountRefunded || 0), payment.expectedAmount),
        refundedAt: new Date(refund.refund_processed_at || Date.now()),
        refundReference: String(refund.cf_refund_id || ''),
      } });
      return r.ok({ received: true }, 'Refund processed');
    }
    if (payment.status !== 'Paid') {
      try {
        await confirmCashfreePayment(payment);
      } catch (error) {
        if (error.status && error.status < 500) {
          console.error('Cashfree webhook verification rejected:', error.status);
          return r.serverError('Could not verify webhook payment with Cashfree');
        }
        throw error;
      }
    }
    return r.ok({ received: true }, 'Webhook processed');
  } catch (error) {
    console.error('Cashfree webhook processing failed:', error.message);
    return r.serverError('Webhook processing failed');
  }
};
