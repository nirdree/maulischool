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
    const filter = {
      $or: [
        { classroom: id, academicYear: classroom.academicYear, status: { $in: statuses } },
        {
          academicHistory: {
            $elemMatch: {
              classroom: id,
              academicYear: classroom.academicYear,
              status: { $in: statuses },
            },
          },
        },
      ],
    };

    const query = Student.find(filter)
      .select('firstName middleName lastName admissionNo rollNumber gender status photo classroom academicYear academicHistory')
      .populate('academicHistory.classroom', 'displayName className section')
      .populate('academicHistory.academicYear', 'name')
      .sort({ rollNumber: 1, firstName: 1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [students, total] = await Promise.all([
      query,
      pagination ? Student.countDocuments(filter) : Promise.resolve(null),
    ]);
    const data = students.map(student => {
      const historicalEnrollment = (student.academicHistory || []).find(enrollment =>
        String(enrollment.classroom?._id || enrollment.classroom) === String(classroom._id)
        && String(enrollment.academicYear?._id || enrollment.academicYear) === String(classroom.academicYear),
      );
      if (String(student.classroom) !== String(classroom._id) && historicalEnrollment) {
        const row = student.toObject();
        row.classroom = historicalEnrollment.classroom;
        row.academicYear = historicalEnrollment.academicYear;
        row.rollNumber = historicalEnrollment.rollNumber;
        row.status = historicalEnrollment.status;
        return row;
      }
      return student;
    });

    return pagination
      ? r.ok(data, 'Classroom students fetched', paginationMeta(total, pagination))
      : r.ok(data);
  } catch (err) {
    return r.serverError(err.message);
  }
});
