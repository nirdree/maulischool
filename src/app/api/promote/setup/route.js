import { connectDB } from '@/lib/mongodb';
import AcademicYear from '@/models/AcademicYear';
import Classroom from '@/models/Classroom';
import Subject from '@/models/Subject';
import { Timetable } from '@/models/Others';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const POST = authorize('admin', 'principal')(async request => {
  try {
    await connectDB();
    const { sourceAcademicYearId, targetAcademicYearId } = await request.json();
    if (!sourceAcademicYearId || !targetAcademicYearId) {
      return r.badRequest('Source and target academic years are required');
    }
    if (String(sourceAcademicYearId) === String(targetAcademicYearId)) {
      return r.badRequest('Choose a different target academic year');
    }

    const [sourceYear, targetYear] = await Promise.all([
      AcademicYear.findById(sourceAcademicYearId),
      AcademicYear.findById(targetAcademicYearId),
    ]);
    if (!sourceYear || !targetYear) return r.notFound('Academic year not found');
    if (new Date(targetYear.startDate) <= new Date(sourceYear.endDate)) {
      return r.badRequest('Target academic year must start after the source academic year ends');
    }

    const sourceClasses = await Classroom.find({ academicYear: sourceYear._id }).sort({ order: 1 });
    if (!sourceClasses.length) return r.badRequest('No classrooms found in the source academic year');
    const targetClasses = await Classroom.find({ academicYear: targetYear._id });
    const targetByKey = new Map(targetClasses.map(classroom => [
      `${classroom.className.trim().toLowerCase()}|${(classroom.section || '').trim().toLowerCase()}`,
      classroom,
    ]));
    const classMap = new Map();
    let classroomsCreated = 0;

    for (const sourceClass of sourceClasses) {
      const key = `${sourceClass.className.trim().toLowerCase()}|${(sourceClass.section || '').trim().toLowerCase()}`;
      let targetClass = targetByKey.get(key);
      if (!targetClass) {
        targetClass = await Classroom.create({
          className: sourceClass.className,
          section: sourceClass.section,
          displayName: sourceClass.displayName,
          monthlyFees: sourceClass.monthlyFees,
          rteFee: sourceClass.rteFee,
          classTeacher: sourceClass.classTeacher,
          order: sourceClass.order,
          capacity: sourceClass.capacity,
          isActive: sourceClass.isActive,
          academicYear: targetYear._id,
        });
        targetByKey.set(key, targetClass);
        classroomsCreated++;
      }
      classMap.set(String(sourceClass._id), targetClass);
    }

    let subjectsCreated = 0;
    for (const sourceClass of sourceClasses) {
      const targetClass = classMap.get(String(sourceClass._id));
      const sourceSubjects = await Subject.find({ classroom: sourceClass._id });
      for (const sourceSubject of sourceSubjects) {
        let targetSubject = await Subject.findOne({
          classroom: targetClass._id,
          name: sourceSubject.name,
          academicYear: targetYear._id,
        });
        if (!targetSubject) {
          [targetSubject] = await Subject.create([{
            name: sourceSubject.name,
            classroom: targetClass._id,
            teacher: sourceSubject.teacher,
            totalMarks: sourceSubject.totalMarks,
            isActive: sourceSubject.isActive,
            academicYear: targetYear._id,
          }]);
          subjectsCreated++;
        }
      }
    }

    const subjectMap = new Map();
    for (const sourceClass of sourceClasses) {
      const targetClass = classMap.get(String(sourceClass._id));
      const sourceSubjects = await Subject.find({ classroom: sourceClass._id });
      for (const sourceSubject of sourceSubjects) {
        const targetSubject = await Subject.findOne({
          classroom: targetClass._id,
          name: sourceSubject.name,
          academicYear: targetYear._id,
        });
        if (targetSubject) subjectMap.set(String(sourceSubject._id), targetSubject._id);
      }
    }

    let timetablesCreated = 0;
    for (const sourceClass of sourceClasses) {
      const sourceTimetable = await Timetable.findOne({
        classroom: sourceClass._id,
        academicYear: sourceYear._id,
      }).lean();
      if (!sourceTimetable) continue;

      const targetClass = classMap.get(String(sourceClass._id));
      const schedule = sourceTimetable.schedule.map(day => ({
        ...day,
        periods: day.periods.map(period => ({
          ...period,
          subject: period.subject ? subjectMap.get(String(period.subject)) || null : null,
        })),
      }));
      const existing = await Timetable.findOne({
        classroom: targetClass._id,
        academicYear: targetYear._id,
      });
      if (!existing) {
        await Timetable.create({
          classroom: targetClass._id,
          academicYear: targetYear._id,
          schedule,
          totalPeriods: sourceTimetable.totalPeriods,
          workingDays: sourceTimetable.workingDays,
        });
        timetablesCreated++;
      }
    }

    return r.ok({
      targetAcademicYear: targetYear,
      classroomsCreated,
      classroomsAvailable: classMap.size,
      subjectsCreated,
      timetablesCreated,
    }, 'Next-year classroom setup is ready');
  } catch (err) {
    return r.serverError(err.message);
  }
});
