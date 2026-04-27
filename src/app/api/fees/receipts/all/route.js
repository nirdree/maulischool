import { connectDB } from '@/lib/mongodb';
import { FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.get('studentId'))    filter.student      = searchParams.get('studentId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const page  = Number(searchParams.get('page')  || 1);
    const limit = Number(searchParams.get('limit') || 50);

    const total    = await FeePayment.countDocuments(filter);
    const receipts = await FeePayment.find(filter)
      .populate('student',     'firstName lastName admissionNo')
      .populate('fee',         'month year')
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return r.ok(receipts, 'Receipts fetched', { total, page, limit });
  } catch (err) {
    return r.serverError(err.message);
  }
});