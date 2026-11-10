import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import Classroom from '@/models/Classroom';
import AcademicYear from '@/models/AcademicYear';
import { r } from '@/lib/response';
import { authorize } from '@/lib/auth';

export const POST = authorize('admin', 'principal')(async request => {
  try {
    await connectDB();
    const { promotions, sourceAcademicYearId, targetAcademicYearId } = await request.json();
    if (!Array.isArray(promotions) || promotions.length === 0) {
      return r.badRequest('promotions array is required');
    }
    if (![sourceAcademicYearId, targetAcademicYearId].every(id => mongoose.Types.ObjectId.isValid(id))) {
      return r.badRequest('Valid source and target academic years are required');
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

    const results = { promoted: 0, detained: 0, left: 0, graduated: 0, errors: [] };
    const processedStudents = new Set();

    for (const item of promotions) {
      const { studentId, action, nextClassId } = item;
      try {
        if (!mongoose.Types.ObjectId.isValid(studentId) || processedStudents.has(String(studentId))) {
          results.errors.push(`Invalid or duplicate student ${studentId}`);
          continue;
        }
        processedStudents.add(String(studentId));

        const student = await Student.findOne({
          _id: studentId,
          academicYear: sourceYear._id,
          status: 'Approved',
        });
        if (!student) {
          results.errors.push(`Student ${studentId} is not an approved student in the source academic year`);
          continue;
        }
        const sourceClass = await Classroom.findOne({
          _id: student.classroom,
          academicYear: sourceYear._id,
        }).select('order className section');
        if (!sourceClass) {
          results.errors.push(`Source classroom not found for student ${studentId}`);
          continue;
        }

        const previousEnrollment = {
          academicYear: student.academicYear,
          classroom: student.classroom,
          rollNumber: student.rollNumber,
          status: student.status,
          completedAt: new Date(),
        };
        if (!Array.isArray(student.academicHistory)) student.academicHistory = [];

        if (action === 'Left' || action === 'Graduated') {
          student.academicHistory.push({
            ...previousEnrollment,
            outcome: action,
          });
          if (action === 'Left') {
            student.status = 'Left';
            student.leavingDate = new Date();
            student.leavingReason = item.leavingReason || 'Left after promotion cycle';
          } else {
            student.status = 'Alumni';
            student.graduationDate = new Date();
          }
          await student.save();
          if (action === 'Left') results.left++;
          else results.graduated++;
          continue;
        }

        if (!['Promoted', 'Detained'].includes(action)) {
          results.errors.push(`Invalid action '${action}' for student ${studentId}`);
          continue;
        }
        if (!mongoose.Types.ObjectId.isValid(nextClassId)) {
          results.errors.push(`Next-year classroom is required for student ${studentId}`);
          continue;
        }
        const nextClass = await Classroom.findOne({
          _id: nextClassId,
          academicYear: targetYear._id,
          isActive: true,
        });
        if (!nextClass) {
          results.errors.push(`Target classroom is not active in the selected academic year for student ${studentId}`);
          continue;
        }
        if (action === 'Promoted' && nextClass.order <= sourceClass.order) {
          results.errors.push(`Promoted destination must be a higher class for student ${studentId}`);
          continue;
        }
        if (action === 'Detained') {
          if (sourceClass.className.trim().toLowerCase() !== nextClass.className.trim().toLowerCase()
            || (sourceClass.section || '').trim().toLowerCase() !== (nextClass.section || '').trim().toLowerCase()) {
            results.errors.push(`Detained students must remain in the same class and section for student ${studentId}`);
            continue;
          }
        }

        const [enrollmentSummary] = await Student.aggregate([
          {
            $match: {
              classroom: nextClass._id,
              academicYear: targetYear._id,
              status: { $nin: ['Left', 'Alumni'] },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              lastRollNumber: { $max: { $ifNull: ['$rollNumber', 0] } },
            },
          },
        ]);
        if ((enrollmentSummary?.count || 0) >= nextClass.capacity) {
          results.errors.push(`${nextClass.displayName} is at capacity for student ${studentId}`);
          continue;
        }

        student.academicHistory.push({
          ...previousEnrollment,
          outcome: action,
          nextClassroom: nextClass._id,
          nextAcademicYear: targetYear._id,
        });
        student.classroom = nextClass._id;
        student.academicYear = targetYear._id;
        student.rollNumber = Number(enrollmentSummary?.lastRollNumber || 0) + 1;
        student.status = 'Approved';
        await student.save();
        if (action === 'Promoted') results.promoted++;
        else results.detained++;
      } catch (innerErr) {
        results.errors.push(`Error processing student ${studentId}: ${innerErr.message}`);
      }
    }

    return r.ok(results, `Promotion complete. Promoted: ${results.promoted}, Detained: ${results.detained}, Left: ${results.left}, Graduated: ${results.graduated}`);
  } catch (err) {
    return r.serverError(err.message);
  }
});
