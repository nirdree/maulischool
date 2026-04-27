import { connectDB } from '@/lib/mongodb';
import { FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const payments = await FeePayment.find({ fee: params.id })
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });
    return r.ok(payments);
  } catch (err) {
    return r.serverError(err.message);
  }
});