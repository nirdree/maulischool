import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import { Attendance } from '@/models/Attendance';
import { Exam, Marks } from '@/models/Exam';
import { Fee } from '@/models/Fee';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id: studentId } = await params;

    if (request.user.role === 'parent') {
      const allowed = (request.user.studentIds || []).map(String);
      if (!allowed.includes(studentId)) return r.forbidden();
    }

    const student = await Student.findById(studentId)
      .populate('classroom',    'displayName className section monthlyFees')
      .populate('academicYear', 'name startDate endDate')
      .populate('fatherUser',   'name email status studentIds')
      .populate('motherUser',   'name email status studentIds');

    if (!student) return r.notFound('Student not found');

    const attendanceRecords = await Attendance.find({
      student:      studentId,
      academicYear: student.academicYear?._id,
    });

    const attSummary = { Present: 0, Absent: 0, Late: 0, HalfDay: 0, Holiday: 0, total: 0 };
    for (const a of attendanceRecords) {
      attSummary[a.status] = (attSummary[a.status] || 0) + 1;
      attSummary.total += 1;
    }
    const workingDays = attSummary.total - attSummary.Holiday;
    attSummary.percentage = workingDays > 0
      ? Math.round(((attSummary.Present + attSummary.Late * 0.5 + attSummary.HalfDay * 0.5) / workingDays) * 100)
      : 0;

    const feeRecords = await Fee.find({
      student:      studentId,
      academicYear: student.academicYear?._id,
    }).sort({ year: 1, month: 1 });

    const feeSummary = { total: 0, paid: 0, pending: 0, overdue: 0 };
    feeSummary.total = feeRecords.reduce((s, f) => s + f.finalAmount, 0);
    for (const f of feeRecords) {
      if (f.status === 'Paid')    feeSummary.paid    += f.finalAmount;
      if (f.status === 'Pending') feeSummary.pending += f.finalAmount;
      if (f.status === 'Overdue') feeSummary.overdue += f.finalAmount;
    }

    const marks = await Marks.find({
      student:      studentId,
      academicYear: student.academicYear?._id,
    })
      .populate('exam',    'name examType totalMarks examDate')
      .populate('subject', 'name');

    const subjectMap = {};
    for (const m of marks) {
      if (m.isAbsent) continue;
      const name = m.subject?.name || 'Unknown';
      if (!subjectMap[name]) subjectMap[name] = { total: 0, obtained: 0 };
      subjectMap[name].total    += m.exam?.totalMarks || 100;
      subjectMap[name].obtained += m.marksObtained;
    }
    const subjectStats = Object.entries(subjectMap).map(([name, v]) => ({
      name,
      percentage: Math.round((v.obtained / v.total) * 100),
      obtained: v.obtained,
      total: v.total,
    })).sort((a, b) => b.percentage - a.percentage);

    const validMarks      = marks.filter(m => !m.isAbsent);
    const overallObtained = validMarks.reduce((s, m) => s + m.marksObtained, 0);
    const overallTotal    = validMarks.reduce((s, m) => s + (m.exam?.totalMarks || 100), 0);

    return r.ok({
      student,
      attendance: { ...attSummary, records: attendanceRecords.slice(-30) },
      fees:       { ...feeSummary, records: feeRecords },
      exams:      {
        marks, subjectStats,
        overallPercentage: overallTotal > 0 ? Math.round((overallObtained / overallTotal) * 100) : 0,
        totalExams: marks.length,
      },
    });
  } catch (err) {
    return r.serverError(err.message);
  }
});
