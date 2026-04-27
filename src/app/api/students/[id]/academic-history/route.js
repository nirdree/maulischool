import { connectDB } from '@/lib/mongodb';
import { Marks } from '@/models/Exam';
import { r } from '@/lib/response';
import { protect } from '@/lib/auth';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const allMarks = await Marks.find({ student: params.id })
      .populate('exam',         'name examType totalMarks examDate')
      .populate('subject',      'name')
      .populate('academicYear', 'name startDate')
      .sort({ createdAt: -1 });

    const byYear = {};
    for (const m of allMarks) {
      const ayId   = String(m.academicYear?._id || 'unknown');
      const ayName = m.academicYear?.name || 'Unknown Year';
      if (!byYear[ayId]) byYear[ayId] = {
        academicYear: { _id: ayId, name: ayName, startDate: m.academicYear?.startDate },
        marks: [],
      };
      byYear[ayId].marks.push(m);
    }

    const history = Object.values(byYear).map(entry => {
      const valid    = entry.marks.filter(m => !m.isAbsent);
      const obtained = valid.reduce((s, m) => s + m.marksObtained, 0);
      const total    = valid.reduce((s, m) => s + (m.exam?.totalMarks || 100), 0);
      return {
        ...entry,
        summary: {
          totalExams:  entry.marks.length,
          overallPerc: total > 0 ? Math.round((obtained / total) * 100) : 0,
        },
      };
    }).sort((a, b) => new Date(b.academicYear.startDate) - new Date(a.academicYear.startDate));

    return r.ok(history);
  } catch (err) {
    return r.serverError(err.message);
  }
});