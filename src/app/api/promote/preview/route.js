import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import AcademicYear from '@/models/AcademicYear';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const GET = authorize('admin', 'principal')(async request => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const sourceAcademicYearId = searchParams.get('sourceAcademicYear');
    const targetAcademicYearId = searchParams.get('targetAcademicYear');
    if (![classId, sourceAcademicYearId, targetAcademicYearId].every(mongoose.Types.ObjectId.isValid)) {
      return r.badRequest('Valid class, source academic year, and target academic year are required');
    }

    const [currentClass, sourceYear, targetYear] = await Promise.all([
      Classroom.findOne({ _id: classId, academicYear: sourceAcademicYearId }),
      AcademicYear.findById(sourceAcademicYearId),
      AcademicYear.findById(targetAcademicYearId),
    ]);
    if (!sourceYear || !targetYear) return r.notFound('Academic year not found');
    if (new Date(targetYear.startDate) <= new Date(sourceYear.endDate)) {
      return r.badRequest('Target academic year must start after the source academic year ends');
    }
    if (!currentClass) return r.notFound('Classroom not found for the source academic year');

    const [targetClasses, students] = await Promise.all([
      Classroom.find({ academicYear: targetYear._id, isActive: true }).sort({ order: 1 }),
      Student.find({
        classroom: currentClass._id,
        academicYear: sourceYear._id,
        status: 'Approved',
      })
        .populate('classroom', 'displayName className section')
        .sort({ rollNumber: 1 }),
    ]);
    const nextClass = targetClasses.find(classroom => classroom.order > currentClass.order) || null;
    const sameClass = targetClasses.find(classroom =>
      classroom.className.trim().toLowerCase() === currentClass.className.trim().toLowerCase()
      && (classroom.section || '').trim().toLowerCase() === (currentClass.section || '').trim().toLowerCase(),
    ) || null;

    return r.ok({
      currentClass,
      sourceAcademicYear: sourceYear,
      targetAcademicYear: targetYear,
      nextClass,
      sameClass,
      targetClasses,
      students,
      totalCount: students.length,
    });
  } catch (err) {
    return r.serverError(err.message);
  }
});
