import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import Student from '@/models/Student';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
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

    const fees = await Fee.find(filter)
      .populate('student',   'firstName lastName admissionNo')
      .populate('classroom', 'displayName')
      .sort({ year: -1, month: -1 });

    if (request.user.role === 'parent' && fees.length) {
      const payments = await FeePayment.aggregate([
        { $match: { fee: { $in: fees.map(fee => fee._id) } } },
        { $group: { _id: '$fee', amountPaid: { $sum: { $subtract: ['$amountPaid', { $ifNull: ['$amountRefunded', 0] }] } } } },
      ]);
      const paidByFee = new Map(payments.map(item => [String(item._id), item.amountPaid]));
      return r.ok(fees.map(fee => {
        const amountPaid = paidByFee.get(String(fee._id)) || 0;
        return { ...fee.toObject(), amountPaid, outstandingAmount: Math.max(0, fee.finalAmount - amountPaid) };
      }));
    }
    return r.ok(fees);
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