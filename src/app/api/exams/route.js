import { connectDB } from '@/lib/mongodb';
import { Exam } from '@/models/Exam';
import Subject from '@/models/Subject';
import Classroom from '@/models/Classroom';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';
import { parsePagination, paginationMeta } from '@/lib/pagination';

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    if (pagination?.error) return r.badRequest(pagination.error);
    const filter = {};
    if (searchParams.get('subjectId'))    filter.subject      = searchParams.get('subjectId');
    if (searchParams.get('examType'))     filter.examType     = searchParams.get('examType');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');
    const classId = searchParams.get('classId');
    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      const assignedSubjectFilter = { teacher: request.user.employeeId };
      if (filter.academicYear) assignedSubjectFilter.academicYear = filter.academicYear;
      if (classId) assignedSubjectFilter.classroom = classId;
      const teacherClassFilter = { classTeacher: request.user.employeeId };
      if (filter.academicYear) teacherClassFilter.academicYear = filter.academicYear;
      const [assignedSubjects, classTeacherClassIds] = await Promise.all([
        Subject.find(assignedSubjectFilter).select('_id classroom'),
        Classroom.find(teacherClassFilter).distinct('_id'),
      ]);
      const visibleClassroomIds = new Set(classTeacherClassIds.map(id => String(id)));
      assignedSubjects.forEach(subject => visibleClassroomIds.add(String(subject.classroom)));
      if (classId && !visibleClassroomIds.has(classId)) return r.forbidden();

      const visibleClassTeacherIds = classId
        ? classTeacherClassIds.filter(id => id.toString() === classId)
        : classTeacherClassIds;
      const visibleSubjectIds = classId
        ? assignedSubjects.filter(subject => String(subject.classroom) === classId).map(subject => subject._id)
        : assignedSubjects.map(subject => subject._id);
      filter.$or = [
        { subject: { $in: visibleSubjectIds } },
        { classroom: { $in: visibleClassTeacherIds } },
      ];
      if (classId) filter.classroom = classId;
    } else if (classId) {
      filter.classroom = classId;
    }

    const query = Exam.find(filter)
      .populate('classroom', 'displayName')
      .populate('subject',   'name totalMarks teacher')
      .populate('teacher',   'name')
      .sort({ examDate: -1 });
    if (pagination) query.skip(pagination.skip).limit(pagination.limit);
    const [exams, total] = await Promise.all([
      query,
      pagination ? Exam.countDocuments(filter) : Promise.resolve(null),
    ]);

    return pagination
      ? r.ok(exams, 'Exams fetched', paginationMeta(total, pagination))
      : r.ok(exams);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal', 'teacher')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const { classroom, subject, totalMarks } = body;

    const sub = await Subject.findOne({ _id: subject, classroom, academicYear: body.academicYear });
    if (!sub) return r.notFound('Subject not found');
    if (request.user.role === 'teacher') {
      if (!request.user.employeeId) return r.forbidden('Teacher account is not linked to an employee');
      const assignedSubject = await Subject.exists({
        _id: subject,
        classroom,
        teacher: request.user.employeeId,
        academicYear: body.academicYear,
        isActive: true,
      });
      if (!assignedSubject) return r.forbidden('You can create exams only for subjects assigned to you');
    }

    const existing = await Exam.find({ classroom, subject, academicYear: body.academicYear });
    const usedMarks = existing.reduce((sum, e) => sum + e.totalMarks, 0);

    if (usedMarks + Number(totalMarks) > sub.totalMarks) {
      return r.badRequest(`Only ${sub.totalMarks - usedMarks} marks available for this subject`);
    }

    const exam = await Exam.create({
      ...body,
      ...(request.user.role === 'teacher' ? { teacher: request.user.employeeId } : {}),
    });
    await exam.populate([
      { path: 'classroom', select: 'displayName' },
      { path: 'subject',   select: 'name' },
    ]);
    return r.created(exam, 'Exam created');
  } catch (err) {
    return r.serverError(err.message);
  }
});