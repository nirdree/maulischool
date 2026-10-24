import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/auth';
import { r } from '@/lib/response';
import CashfreePayment from '@/models/CashfreePayment';
import Student from '@/models/Student';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    if (pagination?.error) return r.badRequest(pagination.error);
    const filter = {};
    if (searchParams.get('status')) filter.status = searchParams.get('status');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');
    if (searchParams.get('paymentMethod')) filter.paymentMethod = searchParams.get('paymentMethod');
    if (searchParams.get('classId')) {
      const students = await Student.find({ classroom: searchParams.get('classId') }).select('_id');
      filter.student = { $in: students.map(student => student._id) };
    }
    if (searchParams.get('from') || searchParams.get('to')) {
      filter.createdAt = {};
      if (searchParams.get('from')) filter.createdAt.$gte = new Date(searchParams.get('from'));
      if (searchParams.get('to')) filter.createdAt.$lte = new Date(`${searchParams.get('to')}T23:59:59.999`);
    }

    const search = searchParams.get('search')?.trim();
    if (search) {
      const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingStudents = await Student.find({
        $or: [
          { firstName: expression },
          { lastName: expression },
          { admissionNo: expression },
        ],
      }).select('_id');
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { student: { $in: matchingStudents.map(student => student._id) } },
            { receiptNo: expression },
            { orderId: expression },
          ],
        },
      ];
    }

    const query = CashfreePayment.find(filter)
      .populate('student', 'firstName lastName admissionNo classroom')
      .populate({ path: 'student', populate: { path: 'classroom', select: 'displayName' } })
      .populate('fee', 'month year')
      .populate('academicYear', 'name')
      .sort({ createdAt: -1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    else query.limit(500);
    const [payments, total] = await Promise.all([
      query,
      pagination ? CashfreePayment.countDocuments(filter) : Promise.resolve(null),
    ]);

    const stats = await CashfreePayment.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$expectedAmount' },
      } },
    ]);
    return pagination
      ? r.ok({ payments, stats }, 'Online payment records', paginationMeta(total, pagination))
      : r.ok({ payments, stats }, 'Online payment records');
  } catch (error) {
    console.error('Admin Cashfree payments query failed:', error.message);
    return r.serverError('Unable to load online payments');
  }
});
