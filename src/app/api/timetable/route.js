import { connectDB } from '@/lib/mongodb';
import { Timetable } from '@/models/Others';
import { NextResponse } from 'next/server';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';

export function sanitizeSchedule(schedule) {
  if (!Array.isArray(schedule)) return [];
  return schedule.map(ds => ({
    day: ds.day,
    periods: (ds.periods || []).map(p => ({
      periodNo:   p.periodNo,
      startTime:  p.startTime  || '',
      endTime:    p.endTime    || '',
      subject:    p.subject    || null,
      teacher:    p.teacher    || null,
      isBreak:    p.isBreak    || false,
      breakLabel: p.breakLabel || 'Break',
    })),
  }));
}

export async function findTeacherConflicts(academicYear, excludeClassroomId = null) {
  const filter = { academicYear };
  if (excludeClassroomId) filter.classroom = { $ne: excludeClassroomId };

  const allTimetables = await Timetable.find(filter)
    .populate('classroom', 'displayName')
    .populate('schedule.periods.teacher', 'name');

  const map = {};
  for (const tt of allTimetables) {
    for (const ds of tt.schedule) {
      for (const period of ds.periods) {
        if (!period.teacher || period.isBreak) continue;
        const key = `${period.teacher._id || period.teacher}|${ds.day}|${period.periodNo}`;
        if (!map[key]) {
          map[key] = {
            teacherId:   (period.teacher._id || period.teacher).toString(),
            teacherName: period.teacher.name || 'Unknown',
            day: ds.day, periodNo: period.periodNo,
            startTime: period.startTime, endTime: period.endTime, classrooms: [],
          };
        }
        map[key].classrooms.push({ id: tt.classroom._id, displayName: tt.classroom.displayName });
      }
    }
  }
  return Object.values(map).filter(v => v.classrooms.length > 1);
}

export async function checkIncomingConflicts(classroom, academicYear, incomingSchedule) {
  const otherTimetables = await Timetable.find({ academicYear, classroom: { $ne: classroom } })
    .populate('classroom', 'displayName')
    .populate('schedule.periods.teacher', 'name');

  const conflicts = [];
  for (const ds of incomingSchedule) {
    for (const period of ds.periods) {
      if (!period.teacher || period.isBreak || !period.subject) continue;
      for (const tt of otherTimetables) {
        const existingDay = tt.schedule.find(s => s.day === ds.day);
        if (!existingDay) continue;
        const existingPeriod = existingDay.periods.find(
          p => p.periodNo === period.periodNo && !p.isBreak && p.teacher &&
               (p.teacher._id || p.teacher).toString() === period.teacher.toString()
        );
        if (existingPeriod) {
          conflicts.push({
            day: ds.day, periodNo: period.periodNo,
            startTime: period.startTime, endTime: period.endTime,
            teacherId: period.teacher.toString(),
            teacherName: existingPeriod.teacher?.name || 'Unknown',
            conflictingClass: tt.classroom.displayName,
          });
        }
      }
    }
  }
  return conflicts;
}

export const GET = protect(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.get('classId'))      filter.classroom    = searchParams.get('classId');
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const timetables = await Timetable.find(filter)
      .populate('classroom', 'displayName className section')
      .populate('schedule.periods.subject', 'name')
      .populate('schedule.periods.teacher', 'name employeeId')
      .sort({ 'classroom.order': 1 });

    return r.ok(timetables);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const POST = authorize('admin', 'principal')(async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const { classroom, academicYear, totalPeriods, workingDays } = body;
    const schedule = sanitizeSchedule(body.schedule);

    if (!classroom || !academicYear || !schedule.length)
      return r.badRequest('classroom, academicYear and schedule are required');

    const conflicts = await checkIncomingConflicts(classroom, academicYear, schedule);
    if (conflicts.length > 0) {
      return NextResponse.json({
        success: false,
        message: `${conflicts.length} teacher conflict(s) detected. A teacher cannot be assigned to two classes at the same time.`,
        conflicts,
      }, { status: 409 });
    }

    const timetable = await Timetable.findOneAndUpdate(
      { classroom, academicYear },
      { classroom, academicYear, schedule, totalPeriods, workingDays },
      { new: true, upsert: true }
    ).populate('classroom', 'displayName');

    return r.ok(timetable, 'Timetable saved successfully');
  } catch (err) {
    return r.serverError(err.message);
  }
});