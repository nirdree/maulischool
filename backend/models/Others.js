// models/Others.js
const mongoose = require('mongoose');

// ── Payroll ──────────────────────────────────────────────────
const payrollSchema = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month:        { type: Number, required: true, min: 1, max: 12 },
  year:         { type: Number, required: true },
  basicSalary:  { type: Number, required: true },
  daysPresent:  { type: Number, default: 0 },
  daysAbsent:   { type: Number, default: 0 },
  daysLeave:    { type: Number, default: 0 },
  deductions:   { type: Number, default: 0 },
  bonus:        { type: Number, default: 0 },
  netSalary:    { type: Number, required: true },
  status:       { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paymentDate:  { type: Date },
  paymentMode:  { type: String, enum: ['Cash', 'BankTransfer', 'Cheque'], default: 'BankTransfer' },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// ── Leave ────────────────────────────────────────────────────
const leaveSchema = new mongoose.Schema({
  employee:       { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType:      { type: String, enum: ['Sick', 'Casual', 'Earned', 'Maternity', 'Unpaid', 'Other'], required: true },
  fromDate:       { type: Date, required: true },
  toDate:         { type: Date, required: true },
  totalDays:      { type: Number, required: true },
  reason:         { type: String, required: true },
  status:         { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalRemark: { type: String },
  academicYear:   { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

// ── Homework ─────────────────────────────────────────────────
const homeworkSchema = new mongoose.Schema({
  classroom:    { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  subject:      { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String },
  dueDate:      { type: Date, required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

// ── Notice ───────────────────────────────────────────────────
const noticeSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  content:      { type: String, required: true },
  targetRoles:  [{ type: String, enum: ['parent', 'teacher', 'admin'] }],
  priority:     { type: String, enum: ['Normal', 'Important', 'Urgent'], default: 'Normal' },
  publishDate:  { type: Date, required: true, default: Date.now },
  expiryDate:   { type: Date },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

// ── Timetable Period ─────────────────────────────────────────
const periodSchema = new mongoose.Schema({
  periodNo:  { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  subject:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day:     { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
  periods: [periodSchema],
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  classroom:    { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  schedule:     [dayScheduleSchema],
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

timetableSchema.index({ classroom: 1, academicYear: 1 }, { unique: true });

// ── School Settings ──────────────────────────────────────────
const schoolSettingsSchema = new mongoose.Schema({
  name:          { type: String, default: 'School Name' },
  address:       { type: String },
  phone:         { type: String },
  email:         { type: String },
  website:       { type: String },
  logo:          { type: String },
  affiliationNo: { type: String },
  board:         { type: String },
  declaration:   { type: String },
  lateFinePer:   { type: Number, default: 10 },
  feeDueDay:     { type: Number, default: 10 },
  minAttendance: { type: Number, default: 75 },
}, { timestamps: true });

module.exports = {
  Payroll:        mongoose.model('Payroll',        payrollSchema),
  Leave:          mongoose.model('Leave',          leaveSchema),
  Homework:       mongoose.model('Homework',       homeworkSchema),
  Notice:         mongoose.model('Notice',         noticeSchema),
  Timetable:      mongoose.model('Timetable',      timetableSchema),
  SchoolSettings: mongoose.model('SchoolSettings', schoolSettingsSchema),
};