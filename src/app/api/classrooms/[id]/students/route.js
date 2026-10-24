import { connectDB } from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import Student from '@/models/Student';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const classroom = await Classroom.findById(id);
    if (!classroom) return r.notFound('Classroom not found');

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    if (pagination?.error) return r.badRequest(pagination.error);
    const statusParam = searchParams.get('status');
    const statuses    = statusParam ? statusParam.split(',').map(s => s.trim()) : ['UnderReview', 'Approved', 'OnHold'];
    const filter = { classroom: id, status: { $in: statuses } };

    const query = Student.find(filter)
      .select('firstName middleName lastName admissionNo rollNumber gender status photo')
      .sort({ rollNumber: 1, firstName: 1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [students, total] = await Promise.all([
      query,
      pagination ? Student.countDocuments(filter) : Promise.resolve(null),
    ]);

    return pagination
      ? r.ok(students, 'Classroom students fetched', paginationMeta(total, pagination))
      : r.ok(students);
  } catch (err) {
    return r.serverError(err.message);
  }
});
