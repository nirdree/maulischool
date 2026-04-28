import { connectDB } from '@/lib/mongodb';
import { Fee, FeePayment } from '@/models/Fee';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const fee = await Fee.findById(id)
      .populate('student',   'firstName lastName admissionNo fatherName fatherPhone')
      .populate('classroom', 'displayName');
    if (!fee) return r.notFound('Fee record not found');
    return r.ok(fee);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { tuitionFee, transportFee, activityFee, otherFee, lateFine = 0, discount = 0 } = body;

    let updateData = { ...body };
    if (tuitionFee !== undefined) {
      const total = Number(tuitionFee || 0) + Number(transportFee || 0)
        + Number(activityFee || 0) + Number(otherFee || 0) + Number(lateFine || 0);
      updateData.totalAmount = total;
      updateData.finalAmount = total - Number(discount || 0);
    }

    const fee = await Fee.findByIdAndUpdate(id, updateData, {
      new: true, runValidators: true,
    }).populate('student', 'firstName lastName').populate('classroom', 'displayName');

    if (!fee) return r.notFound('Fee record not found');
    return r.ok(fee, 'Fee updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const fee = await Fee.findById(id);
    if (!fee) return r.notFound('Fee record not found');
    await FeePayment.deleteMany({ fee: fee._id });
    await Fee.findByIdAndDelete(id);
    return r.ok({ id }, 'Fee record and associated payments deleted');
  } catch (err) {
    return r.serverError(err.message);
  }
});
