// src/lib/validation.js
// Centralized validation rules for Add/Edit Employee form

// Name: required, >=3 chars, letters & spaces only
export function validateName(value) {
  const v = (value || '').trim();
  if (!v) return 'Full Name is required.';
  if (v.length < 3) return 'Full Name must be at least 3 characters.';
  if (!/^[A-Za-z ]+$/.test(v)) return 'Full Name can only contain letters and spaces.';
  return null;
}

// Email: required, simple email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateEmail(value) {
  const v = (value || '').trim();
  if (!v) return 'Email is required.';
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address.';
  return null;
}

// Password: required on create; >=8, at least 1 upper, 1 lower, 1 number, 1 special
export function validatePassword(value, { required = true } = {}) {
  const v = (value || '');
  if (required && !v) return 'Password is required.';
  if (!v && !required) return null;
  if (v.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(v)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(v)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(v)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(v)) return 'Password must include at least one special character.';
  return null;
}

// Role: required; Teacher or Principal (stored as 'teacher' | 'principal')
export function validateRole(value) {
  const v = (value || '').trim();
  if (!v) return 'Role is required.';
  if (!['teacher', 'principal'].includes(v)) return 'Role must be Teacher or Principal.';
  return null;
}

// Mobile No: required; exactly 10 digits (India)
export function validateMobileNo(value) {
  const v = (value || '').trim();
  if (!v) return 'Mobile No is required.';
  if (!/^\d{10}$/.test(v)) return 'Mobile No must be exactly 10 digits.';
  return null;
}

// Aadhaar Number: required; exactly 12 digits; unique enforced by DB
export function validateAadhaarNumber(value) {
  const v = (value || '').trim();
  if (!v) return 'Aadhaar Number is required.';
  if (!/^\d{12}$/.test(v)) return 'Aadhaar Number must be exactly 12 digits.';
  return null;
}

// Gender: optional; if provided must be one of Male, Female, Other
export function validateGender(value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (!['Male', 'Female', 'Other'].includes(v)) return 'Select a valid gender.';
  return null;
}

// Date of Joining: required; valid date; not in the future
export function validateDateOfJoining(value) {
  const v = (value || '').trim();
  if (!v) return 'Date of Joining is required.';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Enter a valid date.';
  const today = new Date();
  // Compare only date parts
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const tDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (dDate > tDate) return 'Date of Joining cannot be in the future.';
  return null;
}

// Monthly Salary: required; numeric > 0
export function validateMonthlySalary(value) {
  const v = (value ?? '').toString().trim();
  if (!v) return 'Monthly Salary is required.';
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Monthly Salary must be a number.';
  if (num <= 0) return 'Monthly Salary must be greater than 0.';
  return null;
}

// Education: required; must include at least one letter; max 100 chars
export function validateEducation(value) {
  const v = (value || '').trim();
  if (!v) return 'Education is required.';
  if (v.length > 100) return 'Education must be at most 100 characters.';
  if (!/[A-Za-z]/.test(v)) return 'Education must include at least one letter.';
  return null;
}

// Experience (years): optional; integer 0–50
export function validateExperienceYears(value) {
  const v = (value ?? '').toString().trim();
  if (v === '') return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Years must be a number.';
  if (!Number.isInteger(num)) return 'Years must be a whole number.';
  if (num < 0) return 'Years must be at least 0.';
  if (num > 50) return 'Years must be at most 50.';
  return null;
}

// Experience (months): optional; integer 0–11
export function validateExperienceMonths(value) {
  const v = (value ?? '').toString().trim();
  if (v === '') return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Months must be a number.';
  if (!Number.isInteger(num)) return 'Months must be a whole number.';
  if (num < 0) return 'Months must be at least 0.';
  if (num > 11) return 'Months must be at most 11.';
  return null;
}

// Home Address: required; max 250 chars
export function validateHomeAddress(value) {
  const v = (value || '').trim();
  if (!v) return 'Home Address is required.';
  if (v.length > 250) return 'Home Address must be at most 250 characters.';
  return null;
}

// Aggregate validator for the employee form
export function validateEmployee(form, { isEdit = false } = {}) {
  const errors = {};

  errors.name = validateName(form?.name);
  errors.email = validateEmail(form?.email);
  errors.password = validatePassword(form?.password, { required: !isEdit });
  errors.role = validateRole(form?.role);
  errors.mobileNo = validateMobileNo(form?.mobileNo);
  errors.aadhaarNumber = validateAadhaarNumber(form?.aadhaarNumber);
  errors.gender = validateGender(form?.gender);
  errors.dateOfJoining = validateDateOfJoining(form?.dateOfJoining);
  errors.monthlySalary = validateMonthlySalary(form?.monthlySalary);
  errors.education = validateEducation(form?.education);
  errors.experienceYears = validateExperienceYears(form?.experienceYears);
  errors.experienceMonths = validateExperienceMonths(form?.experienceMonths);
  errors.homeAddress = validateHomeAddress(form?.homeAddress);

  // If both years and months are empty, no error (optional)
  if (!form?.experienceYears && !form?.experienceMonths) {
    delete errors.experienceYears;
    delete errors.experienceMonths;
  }

  // Remove nulls
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });

  return { valid: Object.keys(errors).length === 0, errors };
}

// ────────────── Classroom validators ──────────────
export function validateClassName(value) {
  const v = (value || '').trim();
  if (!v) return 'Class Name is required.';
  if (v.length < 2) return 'Class Name must be at least 2 characters.';
  if (v.length > 50) return 'Class Name must be at most 50 characters.';
  return null;
}

export function validateSection(value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (v.length > 20) return 'Section must be at most 20 characters.';
  return null;
}

export function validateDisplayName(value) {
  const v = (value || '').trim();
  if (!v) return 'Display Name is required.';
  if (v.length < 2) return 'Display Name must be at least 2 characters.';
  if (v.length > 100) return 'Display Name must be at most 100 characters.';
  return null;
}

export function validateMonthlyFees(value) {
  const v = (value ?? '').toString().trim();
  if (!v && v !== '0') return 'Monthly Fees is required.';
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Monthly Fees must be a number.';
  if (num < 0) return 'Monthly Fees must be at least ₹0.';
  return null;
}

export function validateRteFee(value) {
  const v = (value ?? '').toString().trim();
  if (!v) return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return 'RTE Contribution must be a number.';
  if (num < 0) return 'RTE Contribution must be at least ₹0.';
  return null;
}

// ────────────── Exam validators ──────────────
export function validateExamName(value) {
  const v = (value || '').trim();
  if (!v) return 'Exam Name is required.';
  if (v.length < 2) return 'Exam Name must be at least 2 characters.';
  return null;
}

export function validateExamType(value) {
  const v = (value || '').trim();
  if (!v) return 'Exam Type is required.';
  const allowed = ['UnitTest1','UnitTest2','MidTerm','FinalExam','Project','Other'];
  if (!allowed.includes(v)) return 'Select a valid exam type.';
  return null;
}

export function validateExamClass(value) {
  const v = (value || '').trim();
  if (!v) return 'Class is required.';
  return null;
}

export function validateExamSubject(value) {
  const v = (value || '').trim();
  if (!v) return 'Subject is required.';
  return null;
}

export function validateExamTotalMarks(value) {
  const v = (value ?? '').toString().trim();
  if (!v) return 'Total Marks is required.';
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Total Marks must be a number.';
  if (!Number.isInteger(num)) return 'Total Marks must be a whole number.';
  if (num <= 0) return 'Total Marks must be greater than 0.';
  return null;
}

export function validateExamDate(value) {
  const v = (value || '').trim();
  if (!v) return 'Exam Date is required.';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Enter a valid date.';
  return null;
}

export function validateExam(form) {
  const errors = {};
  errors.name = validateExamName(form?.name);
  errors.examType = validateExamType(form?.examType);
  errors.classroom = validateExamClass(form?.classroom);
  errors.subject = validateExamSubject(form?.subject);
  errors.totalMarks = validateExamTotalMarks(form?.totalMarks);
  errors.examDate = validateExamDate(form?.examDate);
  // description optional
  Object.keys(errors).forEach(k => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCapacity(value) {
  const v = (value ?? '').toString().trim();
  if (!v) return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Capacity must be a number.';
  if (!Number.isInteger(num)) return 'Capacity must be a whole number.';
  if (num < 1) return 'Capacity must be a positive integer.';
  if (num > 10000) return 'Capacity must be at most 10,000.';
  return null;
}

export function validateClassTeacher(value) {
  const v = (value || '').trim();
  if (!v) return 'Class Teacher is required.';
  return null;
}

export function validateSubjectTotalMarks(value) {
  const v = (value ?? '').toString().trim();
  if (!v && v !== '0') return null; // allow empty when editing name only
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Total Marks must be a number.';
  if (!Number.isInteger(num)) return 'Total Marks must be a whole number.';
  if (num < 0) return 'Total Marks must be a non-negative number.';
  if (num > 500) return 'Total Marks must be at most 500.';
  return null;
}

export function validateClassroom(form) {
  const errors = {};
  errors.className   = validateClassName(form?.className);
  errors.section     = validateSection(form?.section);
  errors.displayName = validateDisplayName(form?.displayName);
  errors.monthlyFees = validateMonthlyFees(form?.monthlyFees);
  errors.rteFee      = validateRteFee(form?.rteFee);
  errors.capacity    = validateCapacity(form?.capacity);
  errors.classTeacher = validateClassTeacher(form?.classTeacher);
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ────────────── Subjects (admin/subjects) validators ──────────────
export function validateSubjectName(value) {
  const v = (value || '').trim();
  if (!v) return 'Subject Name is required.';
  return null;
}

export function validateSubjectClassroom(value) {
  const v = (value || '').trim();
  if (!v) return 'Classroom is required.';
  return null;
}

export function validateSubjectTeacher(value) {
  const v = (value || '').trim();
  if (!v) return 'Teacher is required.';
  return null;
}

export function validateSubject(form) {
  const errors = {};
  errors.name       = validateSubjectName(form?.name);
  errors.classroom  = validateSubjectClassroom(form?.classroom);
  errors.teacher    = validateSubjectTeacher(form?.teacher);
  errors.totalMarks = validateSubjectTotalMarks(form?.totalMarks);
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ────────────── Students (admission) validators ──────────────
export function validateStudentName(value, label = 'Name') {
  const v = (value || '').trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 50) return `${label} must be at most 50 characters.`;
  if (!/^[A-Za-z' -]+$/.test(v)) return `${label} can contain letters, spaces, hyphens, apostrophes.`;
  return null;
}

export function validateStudentMiddleName(value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (v.length > 50) return 'Middle Name must be at most 50 characters.';
  return null;
}

export function validateStudentDOB(value) {
  const v = (value || '').trim();
  if (!v) return 'Date of Birth is required.';
  // Accept either 'YYYY-MM-DD' (native date input) or 'DD-MM-YYYY'
  let d = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    d = new Date(v);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
    const [dd, mm, yyyy] = v.split('-').map(Number);
    d = new Date(yyyy, mm - 1, dd);
  } else {
    return 'Enter date in DD-MM-YYYY format.';
  }
  if (Number.isNaN(d.getTime())) return 'Enter a valid date.';
  const today = new Date();
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const tDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (dDate >= tDate) return 'Date of Birth cannot be today or in the future.';
  return null;
}

export function validateStudentClassroom(value) {
  const v = (value || '').trim();
  if (!v) return 'Classroom is required.';
  return null;
}

export function validateStudentRteFee(value) {
  const v = (value ?? '').toString().trim();
  if (!v) return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Government Contribution must be a number.';
  if (num < 0) return 'Government Contribution must be at least ₹0.';
  return null;
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export function validateBloodGroup(value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (!BLOOD_GROUPS.includes(v)) return 'Select a valid blood group.';
  return null;
}

export function validateMax50(value, label) {
  const v = (value || '').trim();
  if (!v) return null;
  if (v.length > 50) return `${label} must be at most 50 characters.`;
  return null;
}

export function validatePlaceOfBirth(value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (v.length > 100) return 'Place of Birth must be at most 100 characters.';
  return null;
}

export function validatePenNumber(value) {
  const v = (value || '').trim();
  if (!v) return null;
  // School policy: 1–20 characters, letters or digits only
  if (!/^[A-Za-z0-9]{1,20}$/.test(v)) return 'PEN Number must be 1–20 letters/digits.';
  return null;
}

export function validateStudent(form) {
  const errors = {};
  errors.firstName    = validateStudentName(form?.firstName, 'First Name');
  errors.lastName     = validateStudentName(form?.lastName,  'Last Name');
  errors.middleName   = validateStudentMiddleName(form?.middleName);
  errors.gender       = validateGender(form?.gender);
  errors.dateOfBirth  = validateStudentDOB(form?.dateOfBirth);
  errors.classroom    = validateStudentClassroom(form?.classroom);
  errors.isRTE        = null; // no validation
  errors.rteFee       = validateStudentRteFee(form?.rteFee);
  errors.bloodGroup   = validateBloodGroup(form?.bloodGroup);
  errors.religion     = validateMax50(form?.religion, 'Religion');
  errors.caste        = validateMax50(form?.caste, 'Caste');
  errors.motherTongue = validateMax50(form?.motherTongue, 'Mother Tongue');
  errors.placeOfBirth = validatePlaceOfBirth(form?.placeOfBirth);
  errors.penNumber    = validatePenNumber(form?.penNumber);
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ────────────── Parent account validators ──────────────
export function validateParentName(value) {
  const v = (value || '').trim();
  if (!v) return 'Full Name is required.';
  if (v.length < 2) return 'Full Name must be at least 2 characters.';
  if (v.length > 50) return 'Full Name must be at most 50 characters.';
  if (!/^[A-Za-z' -]+$/.test(v)) return 'Name can contain letters, spaces, hyphens, apostrophes.';
  return null;
}

export function validateParentPhone(value) {
  const v = (value || '').trim();
  if (!v) return 'Phone is required.';
  if (!/^\d{10}$/.test(v)) return 'Phone must be exactly 10 digits.';
  return null;
}

export function validateParentEmail(value) {
  const v = (value || '').trim();
  if (!v) return 'Email is required.';
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address.';
  return null;
}

export function validateParentOccupation(value) {
  const v = (value || '').trim();
  if (!v) return null;
  if (v.length > 50) return 'Occupation must be at most 50 characters.';
  return null;
}

export function validateParentPassword(value) {
  const v = (value || '').trim();
  if (!v) return null; // defaults to phone number when blank
  if (v.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ────────────── Generate Fee validators ──────────────
export function validateFeeClass(value) {
  const v = (value || '').trim();
  if (!v) return 'Class is required.';
  return null;
}
export function validateFeeStudent(value) {
  const v = (value || '').trim();
  if (!v) return 'Student is required.';
  return null;
}
export function validateFeeMonth(value) {
  const v = (value || '').toString().trim();
  if (!v) return 'Month is required.';
  const num = Number(v);
  if (!Number.isFinite(num) || num < 1 || num > 12) return 'Select a valid month.';
  return null;
}
export function validateFeeYear(value) {
  const v = (value || '').toString().trim();
  if (!v) return 'Year is required.';
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Year must be a number.';
  if (num < 2000 || num > 3000) return 'Enter a valid year.';
  return null;
}
export function validateNonNegativeNumber(value, label) {
  const v = (value ?? '').toString().trim();
  if (v === '') return `${label} is required.`;
  const num = Number(v);
  if (!Number.isFinite(num)) return `${label} must be a number.`;
  if (num < 0) return `${label} must be at least 0.`;
  return null;
}
export function validateOptionalNonNegativeNumber(value, label) {
  const v = (value ?? '').toString().trim();
  if (v === '') return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return `${label} must be a number.`;
  if (num < 0) return `${label} must be at least 0.`;
  return null;
}
export function validateDiscount(value, subtotal) {
  const v = (value ?? '').toString().trim();
  if (v === '') return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return 'Discount must be a number.';
  if (num < 0) return 'Discount must be at least 0.';
  if (Number.isFinite(subtotal) && num > subtotal) return 'Discount cannot exceed subtotal.';
  return null;
}
export function validateDueDate(value) {
  const v = (value || '').trim();
  if (!v) return 'Due Date is required.';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Enter a valid date.';
  return null;
}
export function validateGenerateFee(form) {
  const subtotal = (Number(form?.tuitionFee) || 0)
    + (Number(form?.transportFee) || 0)
    + (Number(form?.activityFee) || 0)
    + (Number(form?.otherFee) || 0);
  const errors = {};
  errors.classroom   = validateFeeClass(form?.classroom);
  errors.student     = validateFeeStudent(form?.student);
  errors.month       = validateFeeMonth(form?.month);
  errors.year        = validateFeeYear(form?.year);
  errors.tuitionFee  = validateNonNegativeNumber(form?.tuitionFee, 'Tuition Fee');
  errors.transportFee= validateOptionalNonNegativeNumber(form?.transportFee, 'Transport Fee');
  errors.activityFee = validateOptionalNonNegativeNumber(form?.activityFee, 'Activity Fee');
  errors.otherFee    = validateOptionalNonNegativeNumber(form?.otherFee, 'Other Fee');
  errors.discount    = validateDiscount(form?.discount, subtotal);
  errors.dueDate     = validateDueDate(form?.dueDate);
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ────────────── Payroll validators ──────────────
export function validatePayrollEmployee(value) {
  const v = (value || '').trim();
  if (!v) return 'Employee is required.';
  return null;
}
export function validatePayrollMonth(value) {
  return validateFeeMonth(value);
}
export function validatePayrollYear(value) {
  return validateFeeYear(value);
}
export function validatePaymentMode(value) {
  const v = (value || '').trim();
  if (!v) return 'Payment Mode is required.';
  if (!['Cash','BankTransfer','Cheque'].includes(v)) return 'Select a valid payment mode.';
  return null;
}
export function validateBonus(value) {
  return validateOptionalNonNegativeNumber(value, 'Bonus');
}
export function validateExtraDeductions(value) {
  return validateOptionalNonNegativeNumber(value, 'Extra Deductions');
}
export function validateGeneratePayroll(form) {
  const errors = {};
  errors.employee       = validatePayrollEmployee(form?.employee);
  errors.month          = validatePayrollMonth(form?.month);
  errors.year           = validatePayrollYear(form?.year);
  errors.paymentMode    = validatePaymentMode(form?.paymentMode);
  errors.bonus          = validateBonus(form?.bonus);
  errors.extraDeductions= validateExtraDeductions(form?.extraDeductions);
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ────────────── Leave validators ──────────────
export const LEAVE_TYPES = ['Sick','Casual','Earned','Maternity','Unpaid','Other'];
export function validateLeaveEmployee(value) {
  const v = (value || '').trim();
  if (!v) return 'Employee is required.';
  return null;
}
export function validateLeaveType(value) {
  const v = (value || '').trim();
  if (!v) return 'Leave Type is required.';
  if (!LEAVE_TYPES.includes(v)) return 'Select a valid leave type.';
  return null;
}
export function validateLeaveDate(value, label) {
  const v = (value || '').trim();
  if (!v) return `${label} is required.`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return `Enter a valid ${label.toLowerCase()}.`;
  return null;
}
export function validateLeaveReason(value) {
  const v = (value || '').trim();
  if (!v) return 'Reason is required.';
  if (v.length < 2) return 'Reason must be at least 2 characters.';
  if (v.length > 500) return 'Reason must be at most 500 characters.';
  return null;
}
export function validateApplyLeave(form) {
  const errors = {};
  errors.employee  = validateLeaveEmployee(form?.employee);
  errors.leaveType = validateLeaveType(form?.leaveType);
  errors.fromDate  = validateLeaveDate(form?.fromDate, 'From Date');
  errors.toDate    = validateLeaveDate(form?.toDate,   'To Date');
  errors.reason    = validateLeaveReason(form?.reason);
  // Cross-field: To Date must be on/after From Date
  if (!errors.fromDate && !errors.toDate && form?.fromDate && form?.toDate) {
    const from = new Date(form.fromDate);
    const to   = new Date(form.toDate);
    const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const toDateOnly   = new Date(to.getFullYear(),   to.getMonth(),   to.getDate());
    if (toDateOnly < fromDateOnly) {
      errors.toDate = 'To Date must be on or after From Date.';
    }
  }
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ────────────── Notice validators ──────────────
export function validateNoticeTitle(value) {
  const v = (value || '').trim();
  if (!v) return 'Title is required.';
  if (v.length < 2) return 'Title must be at least 2 characters.';
  if (v.length > 100) return 'Title must be at most 100 characters.';
  return null;
}
export function validateNoticeContent(value) {
  const v = (value || '').trim();
  if (!v) return 'Content is required.';
  if (v.length < 2) return 'Content must be at least 2 characters.';
  if (v.length > 2000) return 'Content must be at most 2000 characters.';
  return null;
}
export function validateNoticePriority(value) {
  const v = (value || '').trim();
  if (!v) return 'Priority is required.';
  if (!['Normal','Important','Urgent'].includes(v)) return 'Select a valid priority.';
  return null;
}
export function validateNoticeAudience(value) {
  const arr = Array.isArray(value) ? value : [];
  if (arr.length === 0) return 'Select at least one audience.';
  const allowed = ['parent','teacher','admin','public'];
  if (!arr.every(v => allowed.includes(v))) return 'Select a valid audience.';
  return null;
}
export function validateNoticeDate(value, label) {
  const v = (value || '').trim();
  if (!v) return `${label} is required.`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return `Enter a valid ${label.toLowerCase()}.`;
  return null;
}
export function validatePublishNotice(form) {
  const errors = {};
  errors.title       = validateNoticeTitle(form?.title);
  errors.content     = validateNoticeContent(form?.content);
  errors.priority    = validateNoticePriority(form?.priority);
  errors.targetRoles = validateNoticeAudience(form?.targetRoles);
  errors.publishDate = validateNoticeDate(form?.publishDate, 'Publish Date');
  errors.expiryDate  = validateNoticeDate(form?.expiryDate,  'Expiry Date');
  if (!errors.publishDate && !errors.expiryDate && form?.publishDate && form?.expiryDate) {
    const pub = new Date(form.publishDate);
    const exp = new Date(form.expiryDate);
    const pubDateOnly = new Date(pub.getFullYear(), pub.getMonth(), pub.getDate());
    const expDateOnly = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
    if (expDateOnly < pubDateOnly) errors.expiryDate = 'Expiry Date must be on or after Publish Date.';
  }
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}
// ────────────── Homework (teacher/homework) validators ──────────────
export function validateHomeworkTitle(value) {
  const v = (value || '').trim();
  if (!v) return 'Title is required.';
  if (v.length < 2) return 'Title must be at least 2 characters.';
  return null;
}

export function validateHomeworkDescription(value) {
  const v = (value || '').trim();
  if (!v) return null; // optional
  if (v.length > 500) return 'Description must be at most 500 characters.';
  return null;
}

export function validateHomeworkClass(value) {
  const v = (value || '').trim();
  if (!v) return 'Class is required.';
  return null;
}

export function validateHomeworkSubject(value) {
  const v = (value || '').trim();
  if (!v) return 'Subject is required.';
  return null;
}

export function validateHomeworkDueDate(value) {
  const v = (value || '').trim();
  if (!v) return 'Due Date is required.';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Enter a valid date.';
  // Compare date-only, disallow past dates
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dOnly < todayOnly) return 'Due Date cannot be in the past.';
  return null;
}

export function validateHomework(form) {
  const errors = {};
  errors.title     = validateHomeworkTitle(form?.title);
  errors.description = validateHomeworkDescription(form?.description);
  errors.classroom = validateHomeworkClass(form?.classroom);
  errors.subject   = validateHomeworkSubject(form?.subject);
  errors.dueDate   = validateHomeworkDueDate(form?.dueDate);
  Object.keys(errors).forEach((k) => { if (errors[k] == null) delete errors[k]; });
  return { valid: Object.keys(errors).length === 0, errors };
}
