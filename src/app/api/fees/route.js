import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import Student from '@/models/Student';
import mongoose from 'mongoose';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    if (pagination?.error) return r.badRequest(pagination.error);
    const filter = {};

    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('month'))        filter.month        = Number(searchParams.get('month'));
    if (searchParams.get('year'))         filter.year         = Number(searchParams.get('year'));
    if (searchParams.get('status'))       filter.status       = searchParams.get('status');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    if (request.user.role === 'parent') {
      const studentId = searchParams.get('studentId');
      const linkedStudents = (request.user.studentIds || []).map(String);
      if (studentId && !linkedStudents.includes(studentId)) return r.forbidden('Student is not linked to this parent');
      filter.student = studentId || { $in: linkedStudents };
    } else if (searchParams.get('studentId')) {
      filter.student = searchParams.get('studentId');
    }

    const search = searchParams.get('search');
    if (search && request.user.role !== 'parent') {
      const regex = new RegExp(search, 'i');
      const matchingStudents = await Student.find({
        $or: [{ firstName: regex }, { lastName: regex }, { admissionNo: regex }],
      }).select('_id');
      const ids = matchingStudents.map(s => s._id);
      filter.student = filter.student
        ? { $in: ids.filter(id => String(id) === String(filter.student)) }
        : { $in: ids };
    }

    const query = Fee.find(filter)
      .populate('student',   'firstName lastName admissionNo')
      .populate('classroom', 'displayName')
      .sort({ year: -1, month: -1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [fees, total, summary, parentSummary] = await Promise.all([
      query,
      pagination ? Fee.countDocuments(filter) : Promise.resolve(null),
      pagination
        ? Fee.aggregate([
            {
              $match: Object.fromEntries(Object.entries(filter).map(([key, value]) => {
                if (key === 'classroom' || key === 'academicYear') {
                  return [key, mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value];
                }
                if (key === 'student' && typeof value === 'string') {
                  return [key, mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value];
                }
                if (key === 'student' && value?.$in) {
                  return [key, { $in: value.$in.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id) }];
                }
                return [key, value];
              })),
            },
            {
              $group: {
                _id: null,
                pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                overdueCount: { $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] } },
                totalOutstanding: {
                  $sum: { $cond: [{ $ne: ['$status', 'Paid'] }, '$finalAmount', 0] },
                },
              },
            },
          ]).then(result => result[0] || { pendingCount: 0, overdueCount: 0, totalOutstanding: 0 })
        : Promise.resolve(null),
      pagination && request.user.role === 'parent'
        ? (async () => {
            const allFees = await Fee.find(filter).select('_id finalAmount').lean();
            const payments = await FeePayment.aggregate([
              { $match: { fee: { $in: allFees.map(fee => fee._id) } } },
              {
                $group: {
                  _id: '$fee',
                  amountPaid: {
                    $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] },
                  },
                },
              },
            ]);
            const paidByFee = new Map(payments.map(payment => [String(payment._id), payment.amountPaid]));
            const annualTotal = allFees.reduce((sum, fee) => sum + (fee.finalAmount || 0), 0);
            const totalPaid = allFees.reduce((sum, fee) => sum + (paidByFee.get(String(fee._id)) || 0), 0);
            const totalDue = allFees.reduce((sum, fee) => (
              sum + Math.max(0, fee.finalAmount - (paidByFee.get(String(fee._id)) || 0))
            ), 0);
            return { annualTotal, totalPaid, totalDue };
          })()
        : Promise.resolve(null),
    ]);

    if (request.user.role === 'parent' && fees.length) {
      const payments = await FeePayment.aggregate([
        { $match: { fee: { $in: fees.map(fee => fee._id) } } },
        { $group: { _id: '$fee', amountPaid: { $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] } } } },
      ]);
      const paidByFee = new Map(payments.map(item => [String(item._id), item.amountPaid]));
      const data = fees.map(fee => {
        const amountPaid = paidByFee.get(String(fee._id)) || 0;
        return { ...fee.toObject(), amountPaid, outstandingAmount: Math.max(0, fee.finalAmount - amountPaid) };
      });
      return pagination
        ? r.ok(data, 'Fees fetched', {
            ...paginationMeta(total, pagination),
            ...(parentSummary || summary),
          })
        : r.ok(data);
    }
    return pagination
      ? r.ok(fees, 'Fees fetched', {
          ...paginationMeta(total, pagination),
          ...(parentSummary || summary),
        })
      : r.ok(fees);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const {
      tuitionFee, transportFee = 0, activityFee = 0, otherFee = 0, discount = 0,
    } = body;

    const total    = Number(tuitionFee) + Number(transportFee) + Number(activityFee) + Number(otherFee);
    const finalAmt = total - Number(discount);

    const fee = await Fee.create({ ...body, totalAmount: total, finalAmount: finalAmt });
    await fee.populate('student', 'firstName lastName');
    return r.created(fee, 'Fee record created');
  } catch (err) {
    if (err.code === 11000) return r.conflict('Fee record already exists for this student/month/year');
    return r.serverError(err.message);
  }
});