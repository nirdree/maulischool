import { connectDB } from '@/lib/mongodb';
import { FeePayment } from '@/models/Fee';
import FeeReceipt from '@/models/FeeReceipt';
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

    const singleFilter = { ...filter, batchReceipt: { $exists: false } };
    const batchLimit = pagination.skip + pagination.limit;
    const [singlePayments, batchReceipts, singleTotal, batchTotal] = await Promise.all([
      FeePayment.find(singleFilter)
        .populate('student', 'firstName lastName admissionNo')
        .populate('fee', 'month year')
        .populate('collectedBy', 'name')
        .sort({ paymentDate: -1 })
        .limit(batchLimit),
      FeeReceipt.find(filter)
        .populate('student', 'firstName lastName admissionNo')
        .populate('items.fee', 'month year')
        .populate('collectedBy', 'name')
        .sort({ paymentDate: -1 })
        .limit(batchLimit),
      FeePayment.countDocuments(singleFilter),
      FeeReceipt.countDocuments(filter),
    ]);

    const combined = [
      ...singlePayments.map(payment => ({
        ...payment.toObject(),
        receiptType: 'single',
        months: payment.fee ? [payment.fee] : [],
      })),
      ...batchReceipts.map(receipt => ({
        ...receipt.toObject(),
        receiptType: 'multi',
        months: receipt.items.map(item => ({
          _id: item.fee?._id,
          month: item.month,
          year: item.year,
        })),
      })),
    ].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    const total = singleTotal + batchTotal;
    const receipts = combined.slice(pagination.skip, pagination.skip + pagination.limit);

    return r.ok(receipts, 'Receipts fetched', paginationMeta(total, pagination));
  } catch (err) {
    return r.serverError(err.message);
  }
});