// models/Student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  admissionNo:        { type: String, unique: true },
  firstName:          { type: String, required: true, trim: true },
  middleName:         { type: String, trim: true, default: '' },
  lastName:           { type: String, required: true, trim: true },
  gender:             { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  dateOfBirth:        { type: Date, required: true },
  photo:              { type: String, default: null },
  bloodGroup:         { type: String },
  religion:           { type: String },
  caste:              { type: String },
  motherTongue:       { type: String },
  placeOfBirth:       { type: String },
  penNumber:          { type: String },
  classroom:          { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  isRTE:              { type: Boolean, default: false },
  rteFee:             { type: Number, default: 0, min: 0 },
  rollNumber:         { type: Number },
  status:             {
    type: String,
    enum: ['UnderReview', 'Approved', 'Rejected', 'OnHold', 'Left', 'Alumni'],
    default: 'UnderReview',
  },
  // Father's details
  fatherName:         { type: String, required: true },
  fatherPhone:        { type: String },
  fatherEmail:        { type: String },
  fatherOccupation:   { type: String },
  // Mother's details
  motherName:         { type: String },
  motherPhone:        { type: String },
  motherEmail:        { type: String },
  motherOccupation:   { type: String },
  // Previous school
  previousSchoolName: { type: String },
  previousClass:      { type: String },
  // Admission handling
  rejectionRemark:    { type: String },
  holdRemark:         { type: String },
  leavingDate:        { type: Date },
  leavingReason:      { type: String },
  graduationDate:     { type: Date },
  // Link to parent user account
fatherUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
motherUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  academicYear:       { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  academicHistory: [{
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    classroom:    { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    rollNumber:   { type: Number },
    status:       { type: String, default: 'Approved' },
    outcome:      { type: String, enum: ['Promoted', 'Detained', 'Left', 'Graduated'] },
    nextClassroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    nextAcademicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
    completedAt:  { type: Date, default: Date.now },
  }],
}, { timestamps: true });

studentSchema.virtual('fullName').get(function () {
  return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(' ');
});

studentSchema.pre('save', async function () {
  if (!this.admissionNo) {
    const year = new Date().getFullYear();

    const lastStudent = await this.constructor
      .findOne({ admissionNo: new RegExp(`ADM-${year}`) })
      .sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastStudent && lastStudent.admissionNo) {
      const lastNumber = parseInt(lastStudent.admissionNo.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    this.admissionNo = `ADM-${year}-${String(nextNumber).padStart(4, '0')}`;
  }
});

const cachedStudentModel = mongoose.models.Student;
const cachedHistorySchema = cachedStudentModel?.schema.path('academicHistory')?.schema;
if (cachedStudentModel && (
  !cachedHistorySchema?.path('nextClassroom')
  || !cachedHistorySchema?.path('nextAcademicYear')
)) {
  delete mongoose.models.Student;
}

export default mongoose.models.Student || mongoose.model('Student', studentSchema);