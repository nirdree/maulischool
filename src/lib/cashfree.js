import crypto from 'node:crypto';
import { Fee, FeePayment } from '@/models/Fee';
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
    if (status === 'Failed') update.$unset = { activeFeeKey: 1 };
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
  await CashfreePayment.updateOne({ _id: payment._id }, { $unset: { activeFeeKey: 1 } });
  return CashfreePayment.findById(payment._id).populate('feePayment');
}
