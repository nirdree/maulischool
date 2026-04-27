import { connectDB } from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const classroom = await Classroom.findById(params.id);
    if (!classroom) return r.notFound('Classroom not found');

    const statusParam = new URL(request.url).searchParams.get('status');
    const statuses    = statusParam ? statusParam.split(',').map(s => s.trim()) : ['UnderReview', 'Approved', 'OnHold'];

    const students = await Student.find({ classroom: params.id, status: { $in: statuses } })
      .select('firstName middleName lastName admissionNo rollNumber gender status photo')
      .sort({ rollNumber: 1, firstName: 1 });

    return r.ok(students);
  } catch (err) {
    return r.serverError(err.message);
  }
});