import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const enquiry = await Enquiry.findById(id)
      .populate('classApplying', 'displayName')
      .populate('academicYear',  'name');
    if (!enquiry) return r.notFound('Enquiry not found');
    return r.ok(enquiry);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body    = await request.json();
    const enquiry = await Enquiry.findByIdAndUpdate(id, body, {
      new: true, runValidators: true,
    }).populate('classApplying', 'displayName');
    if (!enquiry) return r.notFound('Enquiry not found');
    return r.ok(enquiry, 'Enquiry updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (!enquiry) return r.notFound('Enquiry not found');
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});
