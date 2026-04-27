import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const academicYear = new URL(request.url).searchParams.get('academicYear');
    const filter = { student: params.id };
    if (academicYear) filter.academicYear = academicYear;

    const fees     = await Fee.find(filter).sort({ year: 1, month: 1 });
    const payments = await FeePayment.find({ fee: { $in: fees.map(f => f._id) } })
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });

    return r.ok({ fees, payments });
  } catch (err) {
    return r.serverError(err.message);
  }
});