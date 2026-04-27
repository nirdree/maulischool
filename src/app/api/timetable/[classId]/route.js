import { connectDB } from '@/lib/mongodb';
import { Timetable } from '@/models/Others';
import { NextResponse } from 'next/server';
import { r } from '@/lib/response';
import { protect, authorize } from '@/lib/auth';
import { sanitizeSchedule, checkIncomingConflicts } from '../route';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = { classroom: params.classId };
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const timetable = await Timetable.findOne(filter)
      .populate('classroom', 'displayName className section')
      .populate('schedule.periods.subject', 'name')
      .populate('schedule.periods.teacher', 'name employeeId');

    if (!timetable) return r.notFound('Timetable not found for this class');
    return r.ok(timetable);
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const PUT = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const existing = await Timetable.findById(params.classId);
    if (!existing) return r.notFound('Timetable not found');

    const body     = await request.json();
    const schedule = sanitizeSchedule(body.schedule || existing.schedule);
    const conflicts = await checkIncomingConflicts(
      existing.classroom.toString(), existing.academicYear.toString(), schedule
    );

    if (conflicts.length > 0) {
      return NextResponse.json({
        success: false,
        message: `${conflicts.length} teacher conflict(s) detected.`,
        conflicts,
      }, { status: 409 });
    }

    const timetable = await Timetable.findByIdAndUpdate(
      params.classId, { ...body, schedule }, { new: true }
    ).populate('classroom', 'displayName');

    return r.ok(timetable, 'Timetable updated');
  } catch (err) {
    return r.serverError(err.message);
  }
});

export const DELETE = authorize('admin')(async (request, { params }) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = { classroom: params.classId };
    if (searchParams.get('academicYear')) filter.academicYear = searchParams.get('academicYear');

    const result = await Timetable.findOneAndDelete(filter);
    if (!result) return r.notFound('Timetable not found');
    return r.noContent();
  } catch (err) {
    return r.serverError(err.message);
  }
});