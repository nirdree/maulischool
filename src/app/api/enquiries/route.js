import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

// Public — no auth
export async function POST(request) {
  try {
    await connectDB();
    const body    = await request.json();
    const enquiry = await Enquiry.create(body);
    return r.created(
      { enquiryId: enquiry.enquiryId, _id: enquiry._id },
      'Enquiry submitted successfully',
    );
  } catch (err) {
    return r.serverError(err.message);
  }
}

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const page   = Number(searchParams.get('page')  || 1);
    const limit  = Number(searchParams.get('limit') || 50);
    const filter = {};

    if (searchParams.get('status'))       filter.status        = searchParams.get('status');
    if (searchParams.get('classId'))      filter.classApplying = searchParams.get('classId');
    if (searchParams.get('academicYear')) filter.academicYear  = searchParams.get('academicYear');

    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { childName:  { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { mobileNo:   { $regex: search, $options: 'i' } },
        { enquiryId:  { $regex: search, $options: 'i' } },
      ];
    }

    const total     = await Enquiry.countDocuments(filter);
    const enquiries = await Enquiry.find(filter)
      .populate('classApplying', 'displayName')
      .populate('academicYear',  'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return r.ok(enquiries, 'Enquiries fetched', { total, page, limit });
  } catch (err) {
    return r.serverError(err.message);
  }
});