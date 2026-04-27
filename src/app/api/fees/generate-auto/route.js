import { connectDB } from '@/lib/mongodb';
import { Fee } from '@/models/Fee';
import Student from '@/models/Student';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const {
      month, year, dueDate, classId,
      academicYear, onlyUnpaid = true, preview = false,
    } = body;

    if (!month || !year || !academicYear)
      return r.badRequest('month, year and academicYear are required');
    if (!preview && !dueDate)
      return r.badRequest('dueDate is required');

    const studentFilter = { status: 'Approved', academicYear };
    if (classId) studentFilter.classroom = classId;

    const students = await Student.find(studentFilter).populate('classroom');

    let toCreate = 0, toSkip = 0, created = 0, skipped = 0;
    const errors = [];

    for (const student of students) {
      const exists = await Fee.findOne({
        student: student._id, month: Number(month), year: Number(year), academicYear,
      });

      if (exists && onlyUnpaid) { toSkip++; skipped++; continue; }
      toCreate++;

      if (!preview) {
        try {
          const classroom = student.classroom;
          if (!classroom) { skipped++; toCreate--; toSkip++; continue; }

          const tuitionFee = classroom.monthlyFees || 0;
          await Fee.create({
            student: student._id, classroom: classroom._id,
            month: Number(month), year: Number(year),
            tuitionFee, transportFee: 0, activityFee: 0, otherFee: 0,
            discount: 0, totalAmount: tuitionFee, finalAmount: tuitionFee,
            dueDate, academicYear, status: 'Pending',
          });
          created++;
        } catch (err) {
          if (err.code === 11000) { skipped++; toCreate--; toSkip++; }
          else errors.push(`${student.firstName}: ${err.message}`);
        }
      }
    }

    if (preview) return r.ok({ toCreate, toSkip }, 'Preview calculated');
    return r.ok({ created, skipped, errors }, `Generated ${created} fee records. Skipped ${skipped}.`);
  } catch (err) {
    return r.serverError(err.message);
  }
});