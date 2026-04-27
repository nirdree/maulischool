import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const classId      = searchParams.get('classId');
    const academicYear = searchParams.get('academicYear');
    if (!classId) return r.badRequest('classId is required');

    const classroom = await Classroom.findById(classId);
    if (!classroom) return r.notFound('Classroom not found');

    const nextClassroom = await Classroom.findOne({
      order: { $gt: classroom.order },
      academicYear: classroom.academicYear,
      isActive: true,
    }).sort({ order: 1 });

    const filter = { classroom: classId, status: 'Approved' };
    if (academicYear) filter.academicYear = academicYear;

    const students = await Student.find(filter)
      .populate('classroom', 'displayName className section')
      .sort({ rollNumber: 1 });

    return r.ok({ currentClass: classroom, nextClass: nextClassroom || null, students, totalCount: students.length });
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const { promotions } = await request.json();
    if (!Array.isArray(promotions) || promotions.length === 0)
      return r.badRequest('promotions array is required');

    const results = { promoted: 0, detained: 0, left: 0, errors: [] };

    for (const item of promotions) {
      const { studentId, action, nextClassId } = item;
      try {
        const student = await Student.findById(studentId);
        if (!student) { results.errors.push(`Student ${studentId} not found`); continue; }

        if (action === 'Promoted') {
          if (!nextClassId) { results.errors.push(`nextClassId required for student ${studentId}`); continue; }
          const nextClass = await Classroom.findById(nextClassId);
          if (!nextClass) { results.errors.push(`Next classroom not found for student ${studentId}`); continue; }

          const existingCount = await Student.countDocuments({
            classroom: nextClassId, status: 'Approved', _id: { $ne: studentId },
          });
          await Student.findByIdAndUpdate(studentId, {
            classroom: nextClassId, status: 'Approved', rollNumber: existingCount + 1,
          });
          results.promoted++;
        } else if (action === 'Detained') {
          await Student.findByIdAndUpdate(studentId, { status: 'Approved' });
          results.detained++;
        } else if (action === 'Left') {
          await Student.findByIdAndUpdate(studentId, {
            status: 'Left', leavingDate: new Date(),
            leavingReason: item.leavingReason || 'Left after promotion cycle',
          });
          results.left++;
        } else {
          results.errors.push(`Invalid action '${action}' for student ${studentId}`);
        }
      } catch (innerErr) {
        results.errors.push(`Error processing student ${studentId}: ${innerErr.message}`);
      }
    }

    return r.ok(results, `Promotion complete. Promoted: ${results.promoted}, Detained: ${results.detained}, Left: ${results.left}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});