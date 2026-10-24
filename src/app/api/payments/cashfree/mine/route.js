import { connectDB } from '@/lib/mongodb';
import { protect } from '@/lib/auth';
import { r } from '@/lib/response';
import CashfreePayment from '@/models/CashfreePayment';

export const GET = protect(async (request) => {
  try {
    if (request.user.role !== 'parent') return r.forbidden();
    await connectDB();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const linkedStudents = (request.user.studentIds || []).map(String);
    if (studentId && !linkedStudents.includes(studentId)) return r.forbidden('Student is not linked to this parent');
    const filter = { parent: request.user._id };
    if (studentId) filter.student = studentId;
    else filter.student = { $in: linkedStudents };

    const payments = await CashfreePayment.find(filter)
      .select('-paymentSessionId -webhookEvents')
      .populate('student', 'firstName lastName admissionNo')
      .populate('fee', 'month year')
      .sort({ createdAt: -1 })
      .limit(100);
    return r.ok(payments);
  } catch (error) {
    console.error('Parent payment history query failed:', error.message);
    return r.serverError('Unable to load online payment history');
  }
});
