import { connectDB } from '@/lib/mongodb';
import { protect } from '@/lib/auth';
import { r } from '@/lib/response';
import CashfreePayment from '@/models/CashfreePayment';
import { confirmCashfreePayment } from '@/lib/cashfree';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const orderId = new URL(request.url).searchParams.get('order_id');
    if (!orderId) return r.badRequest('order_id is required');
    const filter = { orderId };
    if (request.user.role === 'parent') filter.parent = request.user._id;
    else if (!['admin', 'principal'].includes(request.user.role)) return r.forbidden();

    let payment = await CashfreePayment.findOne(filter);
    if (!payment) return r.notFound('Payment order not found');
    if (payment.status !== 'Paid') payment = await confirmCashfreePayment(payment);
    return r.ok({
      id: payment._id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.expectedAmount,
      receiptNo: payment.receiptNo,
    }, 'Payment status verified');
  } catch (error) {
    console.error('Cashfree verification failed:', error.message);
    return r.serverError('Unable to verify payment right now');
  }
});
