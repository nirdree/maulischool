import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Fee, FeePayment } from '@/models/Fee';
import FeeReceipt from '@/models/FeeReceipt';
import CashfreePayment from '@/models/CashfreePayment';

export const cashfreeConfig = () => {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) throw new Error('Cashfree credentials are not configured');

  const mode = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
  return {
    appId,
    secretKey,
    mode,
    apiVersion: process.env.CASHFREE_API_VERSION || '2026-01-01',
    baseUrl: mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg',
  };
};

export async function cashfreeRequest(path, options = {}) {
  const config = cashfreeConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-api-version': config.apiVersion,
      'x-client-id': config.appId,
      'x-client-secret': config.secretKey,
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Cashfree request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function verifyCashfreeWebhook(rawBody, timestamp, signature) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || !timestamp || !signature) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(`${timestamp}${rawBody}`)
    .digest('base64');
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function confirmCashfreePayment(payment) {
  if (!payment?.orderId) throw new Error('Payment order is missing');
  if (['Paid', 'Refunded'].includes(payment.status)) return payment;

  const order = await cashfreeRequest(`/orders/${encodeURIComponent(payment.orderId)}`);
  if (order.order_id !== payment.orderId) throw new Error('Cashfree order ID mismatch');
  if (order.order_currency !== payment.currency
    || Number(order.order_amount).toFixed(2) !== Number(payment.expectedAmount).toFixed(2)) {
    throw new Error('Cashfree order amount or currency mismatch');
  }
  if (order.order_status !== 'PAID') {
    const status = order.order_status === 'ACTIVE' ? 'Pending' : 'Failed';
    const update = { $set: { status, failureReason: status === 'Failed' ? `Cashfree order status: ${order.order_status}` : '' } };
    if (status === 'Failed') update.$unset = { activeFeeKey: 1, activeFeeKeys: 1 };
    await CashfreePayment.updateOne(
      { _id: payment._id, status: { $ne: 'Paid' } },
      update,
    );
    return CashfreePayment.findById(payment._id);
  }

  const gatewayPayments = await cashfreeRequest(`/orders/${encodeURIComponent(payment.orderId)}/payments`);
  const successfulPayment = (Array.isArray(gatewayPayments) ? gatewayPayments : [])
    .find(item => item.payment_status === 'SUCCESS'
      && Number(item.payment_amount).toFixed(2) === Number(payment.expectedAmount).toFixed(2));
  if (!successfulPayment) throw new Error('No successful Cashfree payment matches this order amount');

  if ((payment.feeAllocations || []).length > 1) {
    let batchReceipt = await FeeReceipt.findOne({ gatewayOrderId: payment.orderId });
    if (!batchReceipt) {
      const allocations = payment.feeAllocations.map(item => ({
        fee: item.fee,
        amountPaid: Number(item.amount.toFixed(2)),
      }));
      const allocatedTotal = allocations.reduce((sum, item) => sum + item.amountPaid, 0);
      if (Number(allocatedTotal.toFixed(2)) !== Number(payment.expectedAmount.toFixed(2))) {
        throw new Error('Online payment allocations do not match the verified order amount');
      }

      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const fees = await Fee.find({ _id: { $in: allocations.map(item => item.fee) } }).session(session);
        if (fees.length !== allocations.length) throw new Error('A fee record for this online payment no longer exists');
        const feeById = new Map(fees.map(fee => [String(fee._id), fee]));
        const paymentDate = new Date(successfulPayment.payment_time || Date.now());
        const receiptNo = `RCP-CF-${payment.orderId}`;
        [batchReceipt] = await FeeReceipt.create([{
          receiptNo,
          gatewayOrderId: payment.orderId,
          student: payment.student,
          academicYear: payment.academicYear,
          items: allocations.map(item => {
            const fee = feeById.get(String(item.fee));
            if (!fee) throw new Error('A fee allocation is invalid');
            return { fee: fee._id, month: fee.month, year: fee.year, amountPaid: item.amountPaid };
          }),
          amountPaid: payment.expectedAmount,
          paymentMode: 'Online',
          transactionId: String(successfulPayment.cf_payment_id || successfulPayment.bank_reference || payment.orderId),
          paymentDate,
          collectedBy: payment.parent,
          notes: 'Cashfree verified online payment',
        }], { session });

        const feePayments = await FeePayment.create(allocations.map((item, index) => ({
          fee: item.fee,
          student: payment.student,
          receiptNo: `${receiptNo}-${String(index + 1).padStart(2, '0')}`,
          amountPaid: item.amountPaid,
          paymentDate,
          paymentMode: 'Online',
          transactionId: String(successfulPayment.cf_payment_id || successfulPayment.bank_reference || payment.orderId),
          gatewayOrderId: index === 0 ? payment.orderId : undefined,
          collectedBy: payment.parent,
          notes: 'Cashfree verified online payment',
          academicYear: payment.academicYear,
          batchReceipt: batchReceipt._id,
        })), { session, ordered: true });
        batchReceipt.payments = feePayments.map(item => item._id);
        await batchReceipt.save({ session });

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
        for (const fee of fees) {
          const paid = paidByFee.get(String(fee._id)) || 0;
          fee.status = paid >= fee.finalAmount
            ? 'Paid'
            : (fee.dueDate < paymentDate ? 'Overdue' : 'PartiallyPaid');
          await fee.save({ session });
        }
        await session.commitTransaction();
      } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        if (error.code !== 11000) throw error;
        batchReceipt = await FeeReceipt.findOne({ gatewayOrderId: payment.orderId });
        if (!batchReceipt) throw error;
      } finally {
        await session.endSession();
      }
    }

    const primaryPayment = await FeePayment.findOne({ gatewayOrderId: payment.orderId });
    if (!primaryPayment) throw new Error('Verified multi-month fee payments are not available');
    await CashfreePayment.updateOne(
      { _id: payment._id, status: { $ne: 'Paid' } },
      { $set: {
        status: 'Paid',
        feePayment: primaryPayment._id,
        feeReceipt: batchReceipt._id,
        cashfreePaymentId: String(successfulPayment.cf_payment_id || ''),
        transactionReference: String(successfulPayment.bank_reference || successfulPayment.cf_payment_id || ''),
        paymentMethod: successfulPayment.payment_group || '',
        paidAt: new Date(successfulPayment.payment_time || Date.now()),
        receiptNo: batchReceipt.receiptNo,
        failureReason: '',
      } },
    );
    await CashfreePayment.updateOne({ _id: payment._id }, { $unset: { activeFeeKey: 1, activeFeeKeys: 1 } });
    return CashfreePayment.findById(payment._id).populate('feePayment').populate('feeReceipt');
  }

  let receipt = await FeePayment.findOne({ gatewayOrderId: payment.orderId });
  if (!receipt) {
    try {
      receipt = await FeePayment.create({
        fee: payment.fee,
        student: payment.student,
        receiptNo: `RCP-CF-${payment.orderId}`,
        amountPaid: payment.expectedAmount,
        paymentDate: new Date(successfulPayment.payment_time || Date.now()),
        paymentMode: 'Online',
        transactionId: String(successfulPayment.cf_payment_id || successfulPayment.bank_reference || payment.orderId),
        gatewayOrderId: payment.orderId,
        collectedBy: payment.parent,
        notes: 'Cashfree verified online payment',
        academicYear: payment.academicYear,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      receipt = await FeePayment.findOne({ gatewayOrderId: payment.orderId });
      if (!receipt) throw error;
    }
  }

  const allPayments = await FeePayment.find({ fee: payment.fee }).select('amountPaid amountRefunded');
  const totalPaid = allPayments.reduce((sum, item) => sum + (item.amountPaid || 0) - (item.amountRefunded || 0), 0);
  const fee = await Fee.findById(payment.fee);
  if (!fee) throw new Error('Fee record no longer exists');
  fee.status = totalPaid >= fee.finalAmount
    ? 'Paid'
    : (fee.dueDate < new Date() ? 'Overdue' : 'PartiallyPaid');
  await fee.save();

  await CashfreePayment.updateOne(
    { _id: payment._id, status: { $ne: 'Paid' } },
    { $set: {
      status: 'Paid',
      feePayment: receipt._id,
      cashfreePaymentId: String(successfulPayment.cf_payment_id || ''),
      transactionReference: String(successfulPayment.bank_reference || successfulPayment.cf_payment_id || ''),
      paymentMethod: successfulPayment.payment_group || '',
      paidAt: new Date(successfulPayment.payment_time || Date.now()),
      receiptNo: receipt.receiptNo,
      failureReason: '',
    } },
  );
  await CashfreePayment.updateOne({ _id: payment._id }, { $unset: { activeFeeKey: 1, activeFeeKeys: 1 } });
  return CashfreePayment.findById(payment._id).populate('feePayment');
}
