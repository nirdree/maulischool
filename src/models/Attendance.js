// models/Attendance.js
import mongoose from 'mongoose';

// ── Student Attendance ───────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classroom:    { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  date:         { type: Date, required: true },
  status:       {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'HalfDay', 'Holiday'],
    required: true,
  },
  remark:       { type: String },
  markedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// ── Employee Attendance ──────────────────────────────────────
const employeeAttendanceSchema = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:         { type: Date, required: true },
  status:       {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'HalfDay', 'OnLeave', 'Holiday'],
    required: true,
  },
  remark:       { type: String },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

employeeAttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const Attendance         = mongoose.models.Attendance         || mongoose.model('Attendance',         attendanceSchema);
export const EmployeeAttendance = mongoose.models.EmployeeAttendance || mongoose.model('EmployeeAttendance', employeeAttendanceSchema);
