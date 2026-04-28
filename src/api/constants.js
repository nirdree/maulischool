

export const API = {

  // ── 🔐 Auth ──────────────────────────────────────────────
  AUTH: {
    REGISTER: `/api/auth/register`,
    LOGIN: `/api/auth/login`,
    ME: `/api/auth/me`,
    CHANGE_PASSWORD: `/api/auth/change-password`,
  },

  // ── 📅 Academic Years ─────────────────────────────────────
  ACADEMIC_YEARS: {
    BASE: `/api/academic-years`,
    CURRENT: `/api/academic-years/current`,
    BY_ID: (id) => `/api/academic-years/${id}`,
    SET_CURRENT: (id) => `/api/academic-years/${id}/set-current`,
  },

  // ── 🏫 Classrooms ─────────────────────────────────────────
  CLASSROOMS: {
    BASE: `/api/classrooms`,
    BY_ID: (id) => `/api/classrooms/${id}`,
    TOGGLE: (id) => `/api/classrooms/${id}/toggle`,
  },

  // ── 👨‍🏫 Employees ─────────────────────────────────────────
  EMPLOYEES: {
    BASE: `/api/employees`,
    BY_ID: (id) => `/api/employees/${id}`,
    STATUS: (id) => `/api/employees/${id}/status`,
    PASSWORD: (id) => `/api/employees/${id}/password`,
  },

  // ── 🎓 Students ───────────────────────────────────────────
  STUDENTS: {
    BASE: `/api/students`,
    BY_ID: (id) => `/api/students/${id}`,
    LINK_PARENT: (id) => `/api/students/${id}/link-parent`,
    STATUS: (id) => `/api/students/${id}/status`,
    BLOCK_PARENT: (id) => `/api/students/${id}/block-parent`,
    PARENT_PASSWORD: (id) => `/api/students/${id}/parent-password`,
      OVERVIEW:          (id) => `/api/students/${id}/overview`,
  ATTENDANCE:        (id) => `/api/students/${id}/attendance`,
  MARKS:             (id) => `/api/students/${id}/marks`,
  FEES:              (id) => `/api/students/${id}/fees`,
  ACADEMIC_HISTORY:  (id) => `/api/students/${id}/academic-history`,
  },

  // ── 📚 Subjects ───────────────────────────────────────────
  SUBJECTS: {
    BASE: `/api/subjects`,
    BY_ID: (id) => `/api/subjects/${id}`,
    TOGGLE: (id) => `/api/subjects/${id}/toggle`,
  },

  // ── 📝 Enquiries ──────────────────────────────────────────
  ENQUIRIES: {
    BASE: `/api/enquiries`,         // POST is public (no auth)
    BY_ID: (id) => `/api/enquiries/${id}`,
  },

  // ── ✅ Attendance ─────────────────────────────────────────
  ATTENDANCE: {
    STUDENTS: `/api/attendance/students`,
    STUDENTS_SUMMARY: `/api/attendance/students/summary`,
    EMPLOYEES: `/api/attendance/employees`,
  },

  // ── 📊 Exams & Marks ──────────────────────────────────────
  EXAMS: {
    BASE: `/api/exams`,
    BY_ID: (id) => `/api/exams/${id}`,
    MARKS: (examId) => `/api/exams/${examId}/marks`,
  },
  MARKS: {
    BASE: `/api/marks`,
    BY_ID: (id) => `/api/marks/${id}`,
  },

  // ── 💰 Fees ───────────────────────────────────────────────
  FEES: {
    BASE: `/api/fees`,
    BY_ID: (id) => `/api/fees/${id}`,
    PAY: (id) => `/api/fees/${id}/pay`,
    PAYMENTS: (id) => `/api/fees/${id}/payments`,
    RECEIPTS: `/api/fees/receipts/all`,
  },

  // ── 💼 Payroll ────────────────────────────────────────────
  PAYROLL: {
    BASE: `/api/payroll`,
    BY_ID: (id) => `/api/payroll/${id}`,
    PAY: (id) => `/api/payroll/${id}/pay`,
  },

  // ── 🏖 Leaves ─────────────────────────────────────────────
  LEAVES: {
    BASE: `/api/leaves`,
    BY_ID: (id) => `/api/leaves/${id}`,
    ACTION: (id) => `/api/leaves/${id}/action`,
  },

  // ── 📓 Homework ───────────────────────────────────────────
  HOMEWORK: {
    BASE: `/api/homework`,
    BY_ID: (id) => `/api/homework/${id}`,
  },

  // ── 📢 Notices ────────────────────────────────────────────
  NOTICES: {
    BASE: `/api/notices`,
    BY_ID: (id) => `/api/notices/${id}`,
  },

  // ── 🗓 Timetable ──────────────────────────────────────────
  TIMETABLE: {
    BASE: `/api/timetable`,
    BY_CLASS: (classId) => `/api/timetable/${classId}`,
    BY_ID: (id) => `/api/timetable/${id}`,
  },

  // ── 📈 Promote ────────────────────────────────────────────
  PROMOTE: {
    PREVIEW: `/api/promote/preview`,
    EXECUTE: `/api/promote`,
  },

  // ── ⚙️ Settings ───────────────────────────────────────────
  SETTINGS: {
    BASE: `/api/settings`,
  },

  // ── 📊 Reports ────────────────────────────────────────────
  REPORTS: {
    OVERVIEW: `/api/reports/overview`,
    FEE_COLLECTION: `/api/reports/fee-collection`,
    FEE_DEFAULTERS: `/api/reports/fee-defaulters`,
    ATTENDANCE_SUMMARY: `/api/reports/attendance-summary`,
    LOW_ATTENDANCE: `/api/reports/low-attendance`,
    EXAM_RESULTS: `/api/reports/exam-results`,
    STUDENT_RESULT_CARD: `/api/reports/student-result-card`,
    PAYROLL_SUMMARY: `/api/reports/payroll-summary`,
    CLASSWISE_STUDENTS: `/api/reports/classwise-students`,
    EMPLOYEE_ATTENDANCE_SUMMARY: `/api/reports/employee-attendance-summary`,
  },

  // ── ❤️ Health ─────────────────────────────────────────────
  HEALTH: `/api/health`,
};

// ─────────────────────────────────────────────────────────────
//  ROLE DEFINITIONS
// ─────────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  PARENT: 'parent',
};

// Which pages/features each role can access
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    'dashboard', 'students', 'employees', 'classrooms', 'subjects',
    'enquiries', 'attendance', 'exams', 'marks', 'fees', 'payroll',
    'leaves', 'homework', 'notices', 'timetable', 'promote',
    'settings', 'reports', 'academic-years',
  ],
  [ROLES.PRINCIPAL]: [
    'dashboard', 'students', 'employees', 'classrooms', 'subjects',
    'enquiries', 'attendance', 'exams', 'marks', 'fees', 'payroll',
    'leaves', 'homework', 'notices', 'timetable', 'promote', 'reports',
  ],
  [ROLES.TEACHER]: [
    'dashboard', 'students', 'attendance', 'exams', 'marks',
    'homework', 'notices', 'timetable', 'leaves',
  ],
  [ROLES.PARENT]: [
    'dashboard', 'my-children', 'attendance', 'marks', 'fees',
    'homework', 'notices', 'timetable',
  ],
};