import { connectDB } from '@/lib/mongodb';
import { FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};

    if (searchParams.get('studentId'))    filter.student      = searchParams.get('studentId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const pagination = parsePagination(searchParams, { enabledByDefault: true, defaultLimit: 50 });
    if (pagination.error) return r.badRequest(pagination.error);

    const total    = await FeePayment.countDocuments(filter);
    const receipts = await FeePayment.find(filter)
      .populate('student',     'firstName lastName admissionNo')
      .populate('fee',         'month year')
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return r.ok(receipts, 'Receipts fetched', paginationMeta(total, pagination));
  } catch (err) {
    return r.serverError(err.message);
  }
});