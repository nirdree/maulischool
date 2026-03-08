This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


You are an expert full-stack developer. Build a complete, production-ready 
School Management System using the following tech stack and specifications. 
Every single feature must be fully implemented — no placeholders, no TODOs, 
no mock data. Everything must be dynamic, database-driven, and fully functional.

═══════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════

- Framework: Next.js 15 (App Router, JavaScript only — no TypeScript)
- Database: MongoDB with Mongoose ODM
- Authentication: NextAuth.js v5 (credentials provider, JWT strategy)
- File/Image Storage: Cloudinary (images, PDFs, documents)
- Styling: Tailwind CSS only (no other CSS frameworks)
- UI Components: shadcn/ui + lucide-react icons
- Forms: React Hook Form + Zod validation
- PDF Generation: @react-pdf/renderer (for report cards, receipts, ID cards)
- Email: Resend (transactional emails)
- Charts: Recharts (dashboards and analytics)
- Date handling: date-fns
- State: React useState/useContext (no Redux)
- Notifications: react-hot-toast

═══════════════════════════════════════════════════════════
PROJECT STRUCTURE
═══════════════════════════════════════════════════════════

/app
  /(public)
    /admission
      /enquiry          → Public enquiry form (no login)
      /status/[id]      → Check enquiry status by ID
  /(auth)
    /login              → Single login page, role-based redirect
  /(admin)
    /layout.js          → Admin layout with sidebar + topbar
    /dashboard
    /enquiries
    /admissions
    /students
      /[id]
      /promote          → Promote students to next class
    /employees
      /[id]
    /classrooms
    /subjects
    /fees
      /structure
      /collect
      /reports
    /attendance
      /students
      /employees
    /marks
    /exams
    /timetable
    /homework
    /payroll
    /notices
    /reports
    /settings
      /school
      /academic-year
  /(principal)
    /layout.js
    /dashboard
    /enquiries
    /admissions
    /students
    /employees
      /attendance       → Principal marks teacher attendance
    /classrooms
    /marks
    /timetable
    /notices
    /reports
  /(teacher)
    /layout.js
    /dashboard
    /attendance         → Mark student attendance
    /marks              → Enter subject marks per test
    /exams              → Create exam/test
    /homework           → Assign homework
    /timetable          → View own timetable
    /students           → View own class students
    /leaves             → Apply for leave
  /(parent)
    /layout.js
    /dashboard
    /admission          → Multi-step admission form (post-login)
    /profile            → View child's full profile
    /attendance         → View child attendance
    /marks              → View child marks and report card
    /fees               → View fee dues and payment history
    /homework           → View child homework
    /timetable          → View child timetable
    /notices            → School notices
/components
  /ui                   → shadcn components
  /shared
    /Sidebar.js
    /Topbar.js
    /MobileSidebar.js
    /PageHeader.js
    /DataTable.js
    /StatusBadge.js
    /ConfirmModal.js
    /FileUpload.js
    /AvatarUpload.js
  /forms
    /EnquiryForm.js
    /AdmissionForm/
      /Step1Student.js
      /Step2Siblings.js
      /Step3Father.js
      /Step4Mother.js
      /Step5Documents.js
      /Step6Declaration.js
    /EmployeeForm.js
    /ClassroomForm.js
    /SubjectForm.js
    /FeeForm.js
    /MarksForm.js
    /ExamForm.js
    /HomeworkForm.js
    /TimetableForm.js
    /NoticeForm.js
  /pdf
    /ReportCardPDF.js
    /IDCardPDF.js
    /AdmissionSlipPDF.js
    /FeeReceiptPDF.js
    /PayslipPDF.js
    /TCCertificatePDF.js
    /OfferLetterPDF.js
    /ExperienceLetterPDF.js
  /charts
    /AttendanceChart.js
    /FeeChart.js
    /MarksChart.js
    /PerformanceChart.js
/lib
  /mongoose.js
  /auth.js
  /cloudinary.js
  /sendEmail.js
  /generatePDF.js
  /helpers.js
  /constants.js
/models
  /User.js
  /Enquiry.js
  /Student.js
  /Parent.js
  /Employee.js
  /Classroom.js
  /Subject.js
  /Exam.js
  /Mark.js
  /Attendance.js
  /EmployeeAttendance.js
  /Fee.js
  /FeePayment.js
  /Homework.js
  /Timetable.js
  /Leave.js
  /Payroll.js
  /Notice.js
  /AcademicYear.js
  /Promotion.js
/middleware.js
/next.config.js
/.env.local

═══════════════════════════════════════════════════════════
LAYOUT & DESIGN SYSTEM
═══════════════════════════════════════════════════════════

GLOBAL DESIGN RULES:
- Fully mobile responsive — works on 320px to 2560px screens
- Sidebar collapses to bottom navigation on mobile (phone)
- All tables become card-lists on mobile screens
- All modals become full-screen drawers on mobile
- Color scheme: Primary #6366F1 (indigo), Secondary #F59E0B (amber),
  Success #10B981, Danger #EF4444, Warning #F59E0B, Info #3B82F6
- Font: Inter (Google Fonts)
- Every page has breadcrumb navigation
- Every list page has: Search bar, Filters, Pagination, Export button
- Every form has: validation, loading states, success/error toasts
- Every action button shows loading spinner while processing
- Dark mode support using Tailwind dark: classes

SIDEBAR (desktop — 260px wide):
- School logo + name at top
- Navigation grouped by section with section headers
- Active link highlighted with indigo background
- Each link has icon (lucide-react) + label
- User avatar + name + role at bottom with logout button
- Sidebar is sticky, scrollable if links overflow

TOPBAR:
- Hamburger menu (mobile only) to toggle sidebar
- Page title (dynamic, based on current route)
- Search icon
- Notification bell with unread count badge
- User avatar dropdown: Profile, Settings, Logout

MOBILE BOTTOM NAV:
- 5 most important links as icon-only bottom navigation
- Active state with indigo color
- Badges for notifications

═══════════════════════════════════════════════════════════
MONGODB MODELS — COMPLETE SCHEMA
═══════════════════════════════════════════════════════════

--- AcademicYear ---
{
  name: String,           // "2024-2025"
  startDate: Date,
  endDate: Date,
  isCurrent: Boolean,     // only one can be true at a time
  createdAt, updatedAt
}

--- User ---
{
  email: String unique,
  password: String (hashed bcrypt),
  role: enum['admin','principal','teacher','parent'],
  status: enum['active','inactive','pending'],
  profilePhoto: String (Cloudinary URL),
  lastLogin: Date,
  createdAt, updatedAt
}

--- Enquiry ---
{
  enquiryId: String unique auto-generated "ENQ-2024-0001",
  classApplying: String,
  childName: String,
  fatherName: String,
  residentialAddress: String,
  pinCode: String,
  phoneNo: String,
  mobileNo: String,
  email: String,
  gender: enum['Male','Female','Other'],
  age: Number,
  dateOfBirth: Date,
  preferredAdmissionDate: Date,
  remark: String,
  adminRemark: String,
  status: enum['New','Contacted','AdmissionDone','Cancelled',
               'PlanningFuture','Other'],
  convertedToAdmission: Boolean default false,
  parentUserId: ObjectId ref User (set when password generated),
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}

--- Student ---
{
  admissionNo: String unique auto-generated "ADM-2024-0001",
  enquiryId: ObjectId ref Enquiry,
  userId: ObjectId ref User (parent account),
  academicYear: ObjectId ref AcademicYear,
  classId: ObjectId ref Classroom,
  rollNumber: Number,
  status: enum['UnderReview','Approved','Rejected','OnHold','Left','Alumni'],
  adminRemark: String,
  holdRemark: String,
  rejectionRemark: String,

  // Personal
  photo: String (Cloudinary),
  firstName: String,
  middleName: String,
  lastName: String,
  dateOfBirth: Date,
  placeOfBirth: String,
  religion: String,
  caste: String,
  motherTongue: String,
  bloodGroup: enum['A+','A-','B+','B-','O+','O-','AB+','AB-'],
  gender: enum['Male','Female','Other'],
  aadhaarNo: String,
  penNumber: String,

  // Previous School
  previousSchoolName: String,
  previousSchoolAddress: String,
  studentPass: Boolean,
  studentPassYear: String,
  previousSchoolContact: String,

  // Siblings (array)
  siblings: [{
    name: String,
    gender: String,
    school: String,
    className: String
  }],

  // Father Details
  fatherName: String,
  fatherEducation: String,
  fatherDesignation: String,
  fatherOccupation: String,
  fatherIncome: Number,
  fatherOfficeAddress: String,
  fatherResidenceAddress: String,
  fatherEmail: String,
  fatherPhone: String,
  fatherPhoto: String (Cloudinary),

  // Mother Details
  motherName: String,
  motherEducation: String,
  motherDesignation: String,
  motherOccupation: String,
  motherIncome: Number,
  motherOfficeAddress: String,
  motherResidenceAddress: String,
  motherEmail: String,
  motherPhone: String,
  motherPhoto: String (Cloudinary),

  // Documents (Cloudinary URLs)
  documents: {
    birthCertificate: String,
    leavingCertificate: String,
    casteCertificate: String,
    reportCard: String,
    aadhaarCard: String
  },

  declarationAccepted: Boolean,
  declarationDate: Date,

  // Leaving details
  leavingDate: Date,
  leavingReason: String,
  tcIssued: Boolean,

  formCompletedAt: Date,
  createdAt, updatedAt
}

--- Employee ---
{
  employeeId: String unique auto-generated "EMP-2024-001",
  userId: ObjectId ref User,
  name: String,
  photo: String (Cloudinary),
  mobileNo: String,
  dateOfJoining: Date,
  monthlySalary: Number,
  role: enum['teacher','principal'],
  fatherHusbandName: String,
  nationalId: String,
  education: String,
  gender: enum['Male','Female','Other'],
  religion: String,
  bloodGroup: String,
  experience: String,
  email: String,
  dateOfBirth: Date,
  homeAddress: String,
  status: enum['active','inactive','resigned'],
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}

--- Classroom ---
{
  className: String,       // "Class 1", "Nursery"
  section: String,         // "A", "B"
  displayName: String,     // "Class 1 - A" (auto-generated)
  monthlyFees: Number,
  classTeacherId: ObjectId ref Employee,
  academicYear: ObjectId ref AcademicYear,
  capacity: Number,
  order: Number,           // for sorting: Playgroup=0, Nursery=1 ... Class8=11
  isActive: Boolean,
  createdAt, updatedAt
}

--- Subject ---
{
  name: String,
  classId: ObjectId ref Classroom,
  teacherId: ObjectId ref Employee,
  totalMarks: Number,      // total marks of the subject overall
  academicYear: ObjectId ref AcademicYear,
  isActive: Boolean,
  createdAt, updatedAt
}

--- Exam ---
{
  name: String,            // "Unit Test 1", "Mid Term", "Final Exam", "Project"
  examType: enum['UnitTest1','UnitTest2','MidTerm','FinalExam','Project','Other'],
  subjectId: ObjectId ref Subject,
  classId: ObjectId ref Classroom,
  teacherId: ObjectId ref Employee,
  totalMarks: Number,      // marks for THIS specific exam (cannot exceed subject totalMarks)
  examDate: Date,
  description: String,
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}

EXAM RULE: For each subject, there are exactly 4 exam types possible:
Unit Test 1, Unit Test 2, Mid Term, Final Exam.
The sum of all exam totalMarks for a subject cannot exceed that subject's totalMarks.
Enforce this validation on both client and server.

--- Mark ---
{
  examId: ObjectId ref Exam,
  studentId: ObjectId ref Student,
  subjectId: ObjectId ref Subject,
  classId: ObjectId ref Classroom,
  marksObtained: Number,
  isAbsent: Boolean default false,
  grade: String,           // auto-calculated A+, A, B, C, D, F
  remarks: String,
  enteredBy: ObjectId ref Employee,
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}

Grade calculation:
>= 90 → A+
>= 80 → A
>= 70 → B+  
>= 60 → B
>= 50 → C
>= 40 → D
< 40  → F

--- Attendance (Student) ---
{
  studentId: ObjectId ref Student,
  classId: ObjectId ref Classroom,
  date: Date,
  status: enum['Present','Absent','Late','HalfDay','Holiday'],
  markedBy: ObjectId ref Employee,
  remark: String,
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}
Unique index on: studentId + date

--- EmployeeAttendance ---
{
  employeeId: ObjectId ref Employee,
  date: Date,
  status: enum['Present','Absent','Late','HalfDay','OnLeave','Holiday'],
  markedBy: ObjectId ref User (principal/admin),
  remark: String,
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}
Unique index on: employeeId + date

--- Fee (Structure per student per month) ---
{
  studentId: ObjectId ref Student,
  classId: ObjectId ref Classroom,
  academicYear: ObjectId ref AcademicYear,
  month: Number,          // 1-12
  year: Number,
  tuitionFee: Number,
  transportFee: Number default 0,
  activityFee: Number default 0,
  otherFee: Number default 0,
  otherFeeLabel: String,
  totalAmount: Number,    // auto-calculated
  dueDate: Date,
  status: enum['Pending','Paid','PartiallyPaid','Overdue','Waived'],
  lateFine: Number default 0,
  discount: Number default 0,
  finalAmount: Number,    // totalAmount + lateFine - discount
  createdAt, updatedAt
}

--- FeePayment ---
{
  feeId: ObjectId ref Fee,
  studentId: ObjectId ref Student,
  receiptNo: String unique auto-generated "RCP-2024-00001",
  amountPaid: Number,
  paymentDate: Date,
  paymentMode: enum['Cash','Cheque','Online','BankTransfer','UPI'],
  transactionId: String,
  collectedBy: ObjectId ref User (admin),
  notes: String,
  createdAt, updatedAt
}

--- Homework ---
{
  classId: ObjectId ref Classroom,
  subjectId: ObjectId ref Subject,
  teacherId: ObjectId ref Employee,
  title: String,
  description: String,
  dueDate: Date,
  attachment: String (Cloudinary URL),
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}

--- Timetable ---
{
  classId: ObjectId ref Classroom,
  academicYear: ObjectId ref AcademicYear,
  schedule: [{
    day: enum['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    periods: [{
      periodNo: Number,
      startTime: String,
      endTime: String,
      subjectId: ObjectId ref Subject,
      teacherId: ObjectId ref Employee
    }]
  }],
  createdAt, updatedAt
}

--- Leave ---
{
  employeeId: ObjectId ref Employee,
  leaveType: enum['Sick','Casual','Earned','Maternity','Unpaid','Other'],
  fromDate: Date,
  toDate: Date,
  totalDays: Number,
  reason: String,
  status: enum['Pending','Approved','Rejected'],
  approvedBy: ObjectId ref User,
  approvalRemark: String,
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}

--- Payroll ---
{
  employeeId: ObjectId ref Employee,
  month: Number,
  year: Number,
  academicYear: ObjectId ref AcademicYear,
  basicSalary: Number,
  daysPresent: Number,
  daysAbsent: Number,
  daysLeave: Number,
  deductions: Number,
  bonus: Number,
  netSalary: Number,        // auto-calculated
  paymentDate: Date,
  paymentMode: enum['Cash','BankTransfer','Cheque'],
  status: enum['Pending','Paid'],
  paidBy: ObjectId ref User,
  createdAt, updatedAt
}

--- Notice ---
{
  title: String,
  content: String,
  targetRoles: [String],    // ['parent','teacher'] — who can see it
  targetClasses: [ObjectId ref Classroom],  // empty = all classes
  attachment: String (Cloudinary),
  priority: enum['Normal','Important','Urgent'],
  publishDate: Date,
  expiryDate: Date,
  createdBy: ObjectId ref User,
  academicYear: ObjectId ref AcademicYear,
  createdAt, updatedAt
}

--- Promotion ---
{
  fromAcademicYear: ObjectId ref AcademicYear,
  toAcademicYear: ObjectId ref AcademicYear,
  fromClassId: ObjectId ref Classroom,
  toClassId: ObjectId ref Classroom,
  students: [{
    studentId: ObjectId ref Student,
    result: enum['Promoted','Detained','Left'],
    remark: String
  }],
  promotedBy: ObjectId ref User,
  promotedAt: Date,
  createdAt, updatedAt
}

═══════════════════════════════════════════════════════════
API ROUTES — COMPLETE LIST
═══════════════════════════════════════════════════════════

/api/auth/[...nextauth]     → NextAuth handler
/api/auth/generate-password → Admin generates parent password

/api/enquiries
  GET    → list (filter: status, date, class, search)
  POST   → create new enquiry (public)
/api/enquiries/[id]
  GET    → single enquiry
  PUT    → update enquiry + remark + status
  DELETE → admin only

/api/students
  GET    → list (filter: class, status, search, academic year)
  POST   → create student record (links to enquiry)
/api/students/[id]
  GET    → full student profile
  PUT    → update student
  PATCH  → update status (approve/reject/hold)
/api/students/[id]/promote  → promote to next class
/api/students/[id]/leaving  → mark student as left, generate TC

/api/employees
  GET, POST
/api/employees/[id]
  GET, PUT, DELETE

/api/classrooms
  GET, POST
/api/classrooms/[id]
  GET, PUT, DELETE

/api/subjects
  GET    → filter by classId
  POST
/api/subjects/[id]
  GET, PUT, DELETE

/api/exams
  GET    → filter by classId, subjectId, academicYear
  POST   → create exam (validate totalMarks against subject)
/api/exams/[id]
  GET, PUT, DELETE

/api/marks
  GET    → filter by examId, classId, studentId
  POST   → bulk save marks for entire class
/api/marks/[studentId]/report-card
  GET    → all marks for student across all exams (for report card)

/api/attendance/students
  GET    → filter by classId, date, month, studentId
  POST   → bulk mark attendance for class
/api/attendance/students/[studentId]
  GET    → student's monthly attendance

/api/attendance/employees
  GET    → filter by employeeId, date, month
  POST   → mark employee attendance (principal only)
/api/attendance/employees/[employeeId]
  GET    → monthly attendance summary

/api/fees/structure         → GET, POST fee structure
/api/fees
  GET    → filter by studentId, month, status
  POST   → generate fees for class (bulk)
/api/fees/[id]
  GET, PUT
/api/fees/[id]/pay          → POST payment, generate receipt
/api/fees/defaulters        → GET list of students with pending fees
/api/fees/collection-report → GET monthly collection summary

/api/homework
  GET, POST
/api/homework/[id]
  GET, PUT, DELETE

/api/timetable
  GET    → by classId
  POST, PUT

/api/leaves
  GET, POST
/api/leaves/[id]
  GET, PATCH (approve/reject)

/api/payroll
  GET    → filter by employeeId, month, year
  POST   → generate payroll for employee/month
/api/payroll/[id]
  GET, PUT (mark as paid)

/api/notices
  GET, POST
/api/notices/[id]
  GET, PUT, DELETE

/api/promotions
  GET, POST

/api/academic-years
  GET, POST
/api/academic-years/[id]/set-current
  PATCH → set as current academic year

/api/upload/image           → Cloudinary image upload
/api/upload/document        → Cloudinary PDF/doc upload
/api/upload/delete          → Delete from Cloudinary

/api/dashboard/admin        → Admin dashboard stats
/api/dashboard/principal    → Principal dashboard stats  
/api/dashboard/teacher      → Teacher dashboard stats
/api/dashboard/parent       → Parent dashboard stats

/api/pdf/report-card/[studentId]    → Generate report card PDF
/api/pdf/id-card/[studentId]        → Generate student ID card PDF
/api/pdf/admission-slip/[enquiryId] → Generate enquiry slip PDF
/api/pdf/fee-receipt/[paymentId]    → Generate fee receipt PDF
/api/pdf/payslip/[payrollId]        → Generate payslip PDF
/api/pdf/tc/[studentId]             → Generate transfer certificate PDF
/api/pdf/offer-letter/[employeeId]  → Generate offer letter PDF
/api/pdf/experience-letter/[employeeId] → Generate experience letter PDF
/api/pdf/id-card/employee/[employeeId]  → Generate employee ID card PDF

═══════════════════════════════════════════════════════════
FEATURE 1 — PUBLIC ENQUIRY FORM + PDF DOWNLOAD
═══════════════════════════════════════════════════════════

Page: /admission/enquiry (no auth required)

UI: Single-page form with card layout, school logo at top
Fields (all validated):
- Class Applying For* → Dropdown (dynamically populated from DB,
  shows only active classes)
- Child's Full Name*
- Father's Name*
- Residential Address*
- Pin Code* (6 digits)
- Phone No* (10 digits)
- Mobile No* (10 digits)  
- Email ID* (valid email)
- Gender* (radio: Male / Female / Other)
- Age* (number)
- Date of Birth* (date picker, cannot be future)
- Preferred Admission Date (date picker)
- Remarks (textarea)

On Submit:
1. POST /api/enquiries
2. Generate unique Enquiry ID (ENQ-YYYY-NNNN, padded 4 digits)
3. Store in DB, send confirmation email to parent
4. Show success screen with Enquiry ID
5. "Download Enquiry Slip" button → generates PDF with all details
6. "Check Status" link → /admission/status/[enquiryId]

PDF Enquiry Slip contains:
- School name, logo, address
- Enquiry ID (large, prominent)
- All form fields in a formatted table
- "For Office Use Only" section (blank)
- Footer with date and website

═══════════════════════════════════════════════════════════
FEATURE 2 — ADMIN ENQUIRY MANAGEMENT
═══════════════════════════════════════════════════════════

Page: /admin/enquiries

Table columns: Enquiry ID | Child Name | Class | Father Name |
Mobile | Email | Submission Date | Status | Actions

Filters:
- Search (name, enquiry ID, mobile, email)
- Class filter (dropdown, all classes)
- Status filter (all statuses)
- Date range picker (from - to)
- Gender filter
- Export to CSV button

Actions per row:
- View (opens side drawer with full details)
- Edit (opens edit modal with all fields editable)
- Change Status (dropdown: New/Contacted/AdmissionDone/Cancelled/
  PlanningFuture/Other)
- Add Admin Remark (text input in modal)
- Generate Password (only if status != AdmissionDone)
  → Creates User account (role: parent)
  → Generates secure random 8-char password
  → Sends email: "Login credentials for admission form"
  → Shows password once in UI with copy button
  → Links parent user to enquiry

Status badge colors:
New → Blue | Contacted → Yellow | AdmissionDone → Green |
Cancelled → Red | PlanningFuture → Purple | Other → Gray

═══════════════════════════════════════════════════════════
FEATURE 3 — PARENT LOGIN + MULTI-STEP ADMISSION FORM
═══════════════════════════════════════════════════════════

Login page: /login (shared for all roles)
After login, NextAuth checks role → redirects to correct dashboard

Parent after login — if status is 'pending form':
→ Redirect to /parent/admission

Multi-step form with progress bar at top:
Step 1 of 6 → Step 2 of 6 → ... → Step 6 of 6

Each step saves to localStorage on "Next" click (persist on refresh)
Final submit sends everything to API at once

STEP 1 — Student Information:
- Application For (class) — auto-filled from enquiry, can change
- Student Photo* — Cloudinary upload, preview shown, max 1MB
- First Name* | Middle Name | Last Name*
- Date of Birth* | Place of Birth*
- Religion | Caste | Mother Tongue
- Blood Group (select)
- Gender* (radio)
- Aadhaar Number (12 digits)
- PEN Number
- Previous School Name
- Previous School Address
- Had Student Pass? (Yes/No toggle)
  → If Yes: Pass Year (input)
- Contact No. of Previous School

STEP 2 — Sibling Details:
- Dynamic list — starts with one empty sibling form
- Per sibling: Name | Gender | School Name | Class
- [+ Add Sibling] button — adds new sibling row (max 5)
- [Remove] button on each row
- "No Siblings" checkbox — hides all sibling inputs

STEP 3 — Father's Details:
- Father's Full Name*
- Education Qualification (input)
- Designation (job title)
- Occupation
- Annual Income (number)
- Office Address
- Residence Address*
- Email ID
- Phone Number*
- Father's Photo — Cloudinary upload, preview shown

STEP 4 — Mother's Details:
Same fields as Step 3 but for mother
- Mother's Full Name*
- (same fields...)
- Mother's Photo — Cloudinary upload

STEP 5 — Document Upload:
Each document has:
- Upload button (accepts PDF, JPG, PNG, max 2MB)
- File name shown after upload
- Preview/View button (opens in new tab)
- Remove button
- Status indicator (Uploaded / Not Uploaded)

Documents:
- Birth Certificate* (required)
- Leaving Certificate
- Caste Certificate
- School Report Card
- Student Aadhaar Card

All uploads go directly to Cloudinary from browser
Show progress bar during upload

STEP 6 — Declaration:
- Display school declaration text (from settings/DB)
- Checkbox: "I confirm that all information provided is accurate"*
- Parent name (typed signature)
- Date (auto: today)
- [Submit Application] button

After submit:
- Student record created in DB
- Status set to: UnderReview
- Show success screen with admission number
- "Download Application" button → PDF of entire form
- Parent dashboard now shows: Application Under Review

═══════════════════════════════════════════════════════════
FEATURE 4 — ADMISSION REVIEW (ADMIN + PRINCIPAL)
═══════════════════════════════════════════════════════════

Page: /admin/admissions and /principal/admissions

Tabs: All | Under Review | Approved | On Hold | Rejected

Table: Admission No | Photo | Student Name | Class | Submission Date |
Status | Actions

Filters: Class | Status | Date Range | Gender | Search

Click row → opens full-page detail view:

Detail page tabs:
1. Student Info — all Step 1 fields displayed in grid
2. Family Info — father + mother details side by side
3. Siblings — list of siblings
4. Documents — each document with View/Download button,
   checkboxes to mark as "Verified"
5. Timeline — chronological log:
   "Enquiry submitted → Form filled → Reviewed by [admin] → Approved"

Action buttons (top right of detail page):
✅ Approve → 
   - Sets status: Approved
   - Assigns Roll Number (auto: next available in class)
   - Sends email to parent: "Congratulations! Admission approved."
   - Parent can now access full student dashboard

❌ Reject →
   - Modal opens: "Enter rejection reason" (required textarea)
   - Sets status: Rejected
   - Stores rejectionRemark
   - Sends email to parent with reason
   - Parent login shows rejection screen with reason

⏸ On Hold →
   - Modal opens: "Enter hold reason" (required textarea)  
   - Sets status: OnHold
   - Stores holdRemark
   - Sends email to parent with reason
   - Parent login shows hold screen with reason

✏️ Edit →
   - Opens same multi-step form but editable (admin can change any field)
   - "Save Changes" button

📄 Download Application → generates PDF of all student data

Admin can also add internal notes (not visible to parent)

═══════════════════════════════════════════════════════════
FEATURE 5 — EMPLOYEE MANAGEMENT (ADMIN ONLY)
═══════════════════════════════════════════════════════════

Page: /admin/employees

List view with cards on mobile, table on desktop
Columns: Photo | Name | ID | Role | Mobile | Joining Date | Salary | Status

Actions: View | Edit | Deactivate | Generate Payslip | Documents

CREATE EMPLOYEE FORM (/admin/employees/new):
- Employee Name*
- Profile Picture (Cloudinary upload, max 100KB, optional)
- Mobile No* (10 digits)
- Date of Joining*
- Monthly Salary* (number)
- Employee Role* (radio: Teacher / Principal)
- Email Address* (becomes login email)
- Password* (admin sets it, shown once, copy button)
- Father/Husband Name
- National ID
- Education Qualification
- Gender (Male/Female/Other)
- Religion
- Blood Group (select)
- Years of Experience
- Date of Birth
- Home Address

On Create:
- Employee record created
- User account created (role matching employee role)
- Employee ID auto-generated (EMP-YYYY-NNN)
- Welcome email sent with login credentials

EMPLOYEE PROFILE PAGE (/admin/employees/[id]):
Tabs:
1. Personal Info — all fields displayed, Edit button
2. Attendance — monthly calendar view showing P/A/L/H for each day
   → Summary: Present X | Absent X | Leave X | Late X
   → Previous months navigable
3. Payroll — table of all months with status (Paid/Pending)
   → Each row: Month | Working Days | Present | Absent | 
     Basic Salary | Deductions | Net Salary | Status | Actions
   → "Generate Payslip" button → PDF download
4. Leaves — table of leave applications with approval status
5. Documents:
   → Generate Offer Letter (PDF)
   → Generate Experience Letter (PDF — only if resigned)
   → Generate Employee ID Card (PDF)
6. Assigned Classes — which classes this teacher is class teacher of
   and which subjects they teach

═══════════════════════════════════════════════════════════
FEATURE 6 — CLASSROOM MANAGEMENT
═══════════════════════════════════════════════════════════

Page: /admin/classrooms (admin + principal)

Classes are ordered: Playgroup → Nursery → Jr. KG → Sr. KG → 
Class 1 → Class 2 → ... → Class 8

Display: Card grid — each card shows class name, section,
teacher name, student count, monthly fees

CREATE CLASS FORM:
- Class Name* (select from fixed list: Playgroup, Nursery, Jr. KG,
  Sr. KG, Class 1, Class 2, ..., Class 8)
- Section (A / B / C / D — optional, default blank)
- Display Name (auto-generated: "Class 1 - A")
- Monthly Tuition Fees*
- Class Teacher* (dropdown — only active teachers, searchable)
- Academic Year* (defaults to current)
- Capacity (number, optional)

IMPORTANT: Every dropdown across the entire application that shows
classes must dynamically query the Classrooms collection and sort
by the order field. Never hardcode class names.

CLASS DETAIL PAGE:
- Students list (enrolled in this class) with count
- Subjects assigned to this class
- Timetable view
- Attendance summary for current month
- Average performance across subjects

═══════════════════════════════════════════════════════════
FEATURE 7 — SUBJECT MANAGEMENT
═══════════════════════════════════════════════════════════

Page: /admin/subjects

Filter by Class → shows all subjects for that class

CREATE SUBJECT FORM (matches eSkooly design):
- Select Class* (dropdown — all active classes)
- Add multiple subjects at once:
  For each row: Subject Name* | Total Marks* | Assign Teacher*
  [+ Add More] button to add new row
  [Remove] button to remove row
  [Assign Subjects] button to save all

Teacher dropdown shows only teachers (not principals)

Subject list per class:
Table: Subject Name | Total Marks | Teacher | Actions (Edit/Delete)
→ Cannot delete if marks have been entered for this subject

═══════════════════════════════════════════════════════════
FEATURE 8 — EXAM & MARKS SYSTEM
═══════════════════════════════════════════════════════════

EXAM TYPES per subject (exactly 4 standard types):
1. Unit Test 1
2. Unit Test 2
3. Mid Term Exam
4. Final Exam
(Teacher can also create custom "Project" or "Other" type)

EXAM CREATION (Teacher — /teacher/exams):
Form:
- Class* (only teacher's assigned classes)
- Subject* (only subjects assigned to this teacher in selected class)
- Exam Type* (dropdown: Unit Test 1 / Unit Test 2 / Mid Term / Final Exam / Project / Other)
- Exam Name (auto-filled from type, editable)
- Total Marks for this exam* (number)
  → Validates: sum of all exam marks for this subject must not exceed subject.totalMarks
  → Shows tooltip: "Subject total: 100. Already allocated: 70. Remaining: 30"
- Exam Date*
- Description (optional)

VALIDATION RULE: When teacher enters totalMarks for exam:
1. Query all existing exams for same subject + class + academicYear
2. Sum their totalMarks
3. New exam marks + existing sum must NOT exceed subject.totalMarks
4. If exceeded → show error: "Cannot exceed subject total of [X] marks.
   Already allocated [Y] marks. Available: [Z] marks."

MARKS ENTRY (Teacher — /teacher/marks):
Step 1: Select Class → Subject → Exam (dropdowns, cascading)
Step 2: Spreadsheet-style table:
  Columns: Roll No | Student Name | Photo | Marks (input) | Absent (checkbox) | Remarks
  - All students of class shown
  - If "Absent" checked, marks input is disabled (stores null, isAbsent: true)
  - Marks input validates: cannot exceed exam.totalMarks
  - Shows exam name and out-of marks in table header
  - Autosave every 30 seconds (localStorage) + manual Save button
  - Bulk "Mark All Present" button

Teacher can edit marks after saving but only before admin locks exam.
Admin can lock/unlock exam periods.

MARKS VIEW:
- Teacher sees only their subjects
- Admin/Principal see all classes and subjects
- Parent sees only their child's marks

REPORT CARD GENERATION (Admin + Principal):
- Select Class → Academic Year
- Choose report card type: Term-wise or Full Year
- Preview on screen, then Download PDF
- Report card PDF includes:
  - School letterhead (logo, name, address)
  - Student photo + details (name, class, roll no, admission no)
  - Table: Subject | UT1 | UT2 | Mid Term | Final | Total | Grade
  - Attendance summary: Present X / Total Days X = X%
  - Teacher Remark field (editable before printing)
  - Principal signature area
  - School stamp area
  - Grade legend at bottom

Individual student report card available from student profile.

═══════════════════════════════════════════════════════════
FEATURE 9 — STUDENT ATTENDANCE
═══════════════════════════════════════════════════════════

Page: /teacher/attendance (teacher marks own class students)
Page: /admin/attendance/students (admin sees + edits all)

MARK ATTENDANCE:
- Select Class → auto-fills teacher's class
- Date picker → defaults to today
- Check if today is holiday (from school calendar) → show warning
- Spreadsheet table:
  Columns: Roll No | Photo | Student Name | Present | Absent | Late | Half Day
  - Radio buttons per row (Present pre-selected by default)
  - "Mark All Present" button
  - "Mark All Absent" button
  - Notes field per student (optional)
- Save button → saves all records in bulk (upsert by studentId + date)
- Edit today's attendance (teacher can edit until midnight)
- Admin can edit any date's attendance

ATTENDANCE REPORTS:
- Class-wise monthly report: calendar grid, P/A/L per student per day
- Student-wise report: month selector, daily breakdown, % calculation
- Defaulter report: students below X% attendance (X configurable in settings)
- Export to PDF / CSV

PARENT VIEW:
- Monthly calendar for child
- Color coding: Green=Present, Red=Absent, Yellow=Late, Orange=HalfDay
- Attendance percentage this month and this year

═══════════════════════════════════════════════════════════
FEATURE 10 — EMPLOYEE ATTENDANCE (PRINCIPAL MARKS)
═══════════════════════════════════════════════════════════

Page: /principal/employees/attendance

Principal can mark and view all teachers' attendance.
Admin can also mark and view all employee attendance.

MARK EMPLOYEE ATTENDANCE:
- Date picker (defaults to today)
- Table: Photo | Employee Name | Role | Present | Absent | Late | On Leave | Remark
- "Mark All Present" button
- Save all in bulk

Monthly report per employee:
- Calendar view
- Summary: Present / Absent / Leave / Late counts
- Working days calculation (excludes Sundays and holidays)

PAYROLL CALCULATION (uses attendance data):
- Per working day salary = monthlySalary / working days in month
- Deduction = absents × per-day salary
- Leave balance affects deduction (if on approved leave, no deduction)

═══════════════════════════════════════════════════════════
FEATURE 11 — FEES MANAGEMENT
═══════════════════════════════════════════════════════════

Page: /admin/fees (admin only for payments)
Page: /parent/fees (view only)

FEE STRUCTURE SETUP (/admin/fees/structure):
- Per class → monthly fee is set during class creation
- Additional fees can be added globally or per student:
  Transport Fee, Activity Fee, Other (custom label)
- Late fine setup: fine per day after due date

GENERATE MONTHLY FEES:
- Admin clicks "Generate Fees for [Month] [Year]"
- Select class or "All Classes"
- System creates Fee record for every active student
- Can preview before generating
- Cannot generate if already generated for that month+class

FEE COLLECTION PAGE (/admin/fees/collect):
Table with filters:
- Search by student name / admission no
- Filter by class, month, year, status
- Columns: Student | Class | Month | Total | Paid | Pending | Status | Action

"Collect Fee" button per student opens modal:
- Shows fee breakdown (tuition + transport + activity + other + late fine - discount)
- Amount to pay (input, pre-filled with pending amount)
- Payment mode: Cash / Cheque / Online / UPI / Bank Transfer
- Transaction ID (if online/UPI)
- Notes
- [Generate Receipt] button → saves payment + opens PDF receipt

FEE RECEIPT PDF:
- School letterhead
- Receipt number (auto-generated RCP-YYYY-NNNNN)
- Student name, class, admission no
- Month for which fee is paid
- Itemized breakdown
- Payment mode + transaction ID
- Collected by (admin name)
- Signature area

DEFAULTERS LIST:
- Students with pending/overdue fees
- Filter by class, months overdue
- Export to PDF / CSV

FEE REPORTS:
- Monthly collection summary per class
- Total collected vs total expected
- Bar chart by month
- Category-wise breakdown (tuition / transport / activity)

PARENT FEE VIEW:
- Current month status prominently shown
- Table of all months: Month | Amount | Status | Receipt
- Download receipt button for paid months
- Pending dues highlighted in red

═══════════════════════════════════════════════════════════
FEATURE 12 — STUDENT PROMOTION (CLASS UPGRADE)
═══════════════════════════════════════════════════════════

Page: /admin/students/promote

This is done at end of academic year.

PROMOTION FLOW:
Step 1: Select current academic year + new academic year
Step 2: Select class to promote FROM
Step 3: System shows all students in that class with:
  - Student name, photo, roll no
  - Attendance % for the year
  - Final exam result (pass/fail based on marks)
  - Dropdown per student: Promoted | Detained | Left School
  - Remark field (required if Detained or Left)
  - "Promote To" class (auto-filled with next class, but editable)

Step 4: Review summary:
  - X students to be Promoted
  - Y students Detained
  - Z students Left
  
Step 5: Confirm and Execute:
  - For Promoted students: classId updated to next class, 
    new roll number assigned, academicYear updated
  - For Detained students: stay in same class, academicYear updated
  - For Left students: status set to Left, leavingDate recorded
  - Promotion record saved for audit trail
  - Cannot be undone easily (require admin confirmation modal)
  
After promotion:
- Previous year data preserved
- New academic year data starts fresh (new attendance, fees, marks)
- Report cards from previous year still accessible

═══════════════════════════════════════════════════════════
FEATURE 13 — LEAVE MANAGEMENT (TEACHERS)
═══════════════════════════════════════════════════════════

TEACHER APPLIES FOR LEAVE (/teacher/leaves):
Form:
- Leave Type* (Sick / Casual / Earned / Maternity / Unpaid / Other)
- From Date* | To Date*
- Total Days (auto-calculated, excluding Sundays)
- Reason* (textarea)

Table of own leave applications:
- Date | Type | Days | Status | Remarks

PRINCIPAL APPROVES LEAVES (/principal/employees/leaves):
Table: Employee | Leave Type | Dates | Days | Reason | Status | Actions
Actions: Approve | Reject (with remark)

Leave balance tracker:
- Casual: 12/year | Sick: 10/year | Earned: 15/year
- Shows remaining balance per employee

═══════════════════════════════════════════════════════════
FEATURE 14 — PAYROLL
═══════════════════════════════════════════════════════════

Page: /admin/payroll

GENERATE PAYROLL:
- Select Month + Year
- Select employee or "All Employees"
- Auto-calculation:
  Working days in month (from attendance)
  Days present + leave (from attendance records)
  Per day salary = basicSalary / working days
  Deductions = absent days × per day salary
  (Approved leave days are NOT deducted)
  Bonus field (manual input)
  Net Salary = basic + bonus - deductions

Preview table before generating:
Employee | Basic | Working Days | Present | Absent | Deductions | Bonus | Net

After generating:
- Payroll records created
- Status: Pending → admin marks as Paid with payment date + mode

PAYSLIP PDF:
- School letterhead
- Employee name, ID, designation
- Month and year
- Earnings: Basic Salary, Bonus
- Deductions: Absent deductions, Other deductions
- Net payable
- Payment date + mode
- Signature area

═══════════════════════════════════════════════════════════
FEATURE 15 — ID CARDS (PDF Generation)
═══════════════════════════════════════════════════════════

STUDENT ID CARD PDF:
- School logo + name + address
- Student photo (from Cloudinary)
- Student Name (large)
- Class + Section
- Admission No
- Roll No
- Blood Group
- Emergency contact (father/mother phone)
- Academic Year
- Principal signature area
Card size: 85mm × 54mm (standard business card size)
Generate individually or bulk (all students in class → ZIP of PDFs)

EMPLOYEE ID CARD PDF:
- School logo
- Employee photo
- Name
- Employee ID
- Role/Designation
- Mobile
- Blood Group
- Joining Date
Card size: same as student

═══════════════════════════════════════════════════════════
FEATURE 16 — HOMEWORK MANAGEMENT
═══════════════════════════════════════════════════════════

TEACHER ASSIGNS HOMEWORK (/teacher/homework):
Form:
- Class* (teacher's classes)
- Subject*
- Title*
- Description / Instructions
- Due Date*
- Attachment (optional, Cloudinary — PDF/image)

Table of assigned homework:
- Date | Class | Subject | Title | Due Date | Actions

STUDENT/PARENT VIEW (/parent/homework):
- List of homework due this week (highlighted)
- All homework chronologically
- Each item: Subject badge | Title | Description | Due date | Download attachment
- Filter by subject

Admin/Principal see all homework across all classes.

═══════════════════════════════════════════════════════════
FEATURE 17 — TIMETABLE MANAGEMENT
═══════════════════════════════════════════════════════════

Page: /admin/timetable (create/edit), /teacher/timetable (view)

CREATE TIMETABLE:
- Select Class + Section + Academic Year
- 6-day grid (Mon-Sat) × 8 periods
- Each cell: dropdown to select Subject (auto-includes teacher from subject)
- Add/remove periods button
- Set period times (globally: 9:00-9:40, 9:40-10:20, etc.)

Display as visual timetable grid.
Print/Download PDF button.

Teacher sees their own timetable: which periods, which class, which subject.

═══════════════════════════════════════════════════════════
FEATURE 18 — NOTICE BOARD
═══════════════════════════════════════════════════════════

ADMIN/PRINCIPAL CREATES NOTICE:
- Title*
- Content* (rich text or textarea)
- Target Audience: (multi-select) Parents | Teachers | All
- Target Classes: (multi-select) All Classes | Specific classes
- Priority: Normal | Important | Urgent
- Publish Date (default: today)
- Expiry Date
- Attachment (optional)

Notices shown in dashboards:
- Urgent notices in red banner at top
- Important in yellow
- Normal in info bar

Parents see only notices targeted to them.
Teachers see only notices for teachers.

═══════════════════════════════════════════════════════════
FEATURE 19 — DASHBOARDS
═══════════════════════════════════════════════════════════

ADMIN DASHBOARD (/admin/dashboard):
Stats cards row (4 cards):
- Total Students (active) | Total Teachers | Total Classes | Pending Admissions

Charts row:
- Fee Collection bar chart (last 6 months)
- Attendance pie chart (Present/Absent for today)

Lists:
- Recent enquiries (last 5, with status badge)
- Recent admissions (last 5)
- Fee defaulters (top 5)
- Pending leave requests
- Recent notices

Quick Actions:
- New Enquiry | New Student | New Employee | Collect Fee

PRINCIPAL DASHBOARD (/principal/dashboard):
Stats cards:
- Total Students | Total Teachers | Today's Student Attendance % | Today's Teacher Attendance %

Charts:
- Class-wise student count bar chart
- Monthly attendance trend line chart

Lists:
- Pending admission reviews
- Leave requests pending approval
- Recent notices

TEACHER DASHBOARD (/teacher/dashboard):
Stats cards:
- My Students (class count) | Homework Assigned | Pending Marks Entry | Attendance Marked Today?

Today's schedule:
- Visual timetable for today (highlighted current period)

Lists:
- Homework due this week (I assigned)
- Recent marks entered
- Notices for teachers

STUDENT/PARENT DASHBOARD (/parent/dashboard):
Stats cards:
- Attendance % this month | Pending Homework | Fee Status | Next Exam

Today's schedule:
- Today's timetable

Lists:
- Pending homework (due soonest first)
- Recent marks/test results
- Upcoming exams
- Fee dues (highlighted if overdue)
- Recent notices

═══════════════════════════════════════════════════════════
FEATURE 20 — SETTINGS & CONFIGURATION (ADMIN)
═══════════════════════════════════════════════════════════

Page: /admin/settings

Tabs:
1. School Info:
   - School Name | Address | Phone | Email | Website
   - School Logo (Cloudinary upload)
   - Affiliation No | Board
   - Declaration text (for admission form)
   
2. Academic Year:
   - List of academic years
   - Create new (name, start date, end date)
   - Set as current (only one current at a time)
   - Warning: changing current year affects all dropdowns
   
3. Attendance Settings:
   - Minimum attendance % (for defaulter report)
   - School working days (Mon-Sat or Mon-Fri)
   - Holiday list (add dates + names)
   
4. Fee Settings:
   - Late fine per day
   - Fee due day (e.g., 10th of each month)
   
5. Grade Settings:
   - Grade boundaries (admin can customize A+, A, B+, etc. thresholds)

═══════════════════════════════════════════════════════════
FEATURE 21 — STUDENT LEAVING / TRANSFER CERTIFICATE
═══════════════════════════════════════════════════════════

Admin marks student as Left from student profile:
- Leaving Date*
- Reason for Leaving*
- Last Class (auto-filled)
- Remarks

After marking as Left:
- Student status: Left
- Generate Transfer Certificate PDF:
  - School letterhead
  - Certificate number (TC-YYYY-NNN)
  - Student name, father name, DOB, class, admission date
  - Date of leaving
  - Conduct: Good (editable)
  - Reason for leaving
  - Principal signature
  - School stamp
  - Date

═══════════════════════════════════════════════════════════
MIDDLEWARE & SECURITY
═══════════════════════════════════════════════════════════

/middleware.js protects all routes:
- /admin/* → only role='admin'
- /principal/* → only role='principal'
- /teacher/* → only role='teacher'
- /parent/* → only role='parent', status must be 'active'
- /api/* → validate session, check role per endpoint
- Public routes: /login, /admission/enquiry, /admission/status/*

API security:
- All API routes check NextAuth session
- Role-based access enforced in every API handler
- Rate limiting on public endpoints
- Input sanitization on all inputs
- File upload validation (type, size)

═══════════════════════════════════════════════════════════
ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════

MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

═══════════════════════════════════════════════════════════
RESPONSIVE DESIGN RULES
═══════════════════════════════════════════════════════════

Breakpoints (Tailwind):
- sm: 640px | md: 768px | lg: 1024px | xl: 1280px

Mobile (< 768px):
- Sidebar hidden, bottom navigation shown (5 icons)
- Tables convert to card list with all data
- Forms single column
- Modals full-screen bottom sheet / drawer
- Dashboard stats: 2x2 grid (2 cards per row)
- Charts full width, scrollable horizontally if needed

Tablet (768px - 1024px):
- Sidebar shown as icons-only (64px wide)
- Hover to see label
- Tables show key columns, rest in expandable row
- Forms 2 columns
- Dashboard stats: 4 in a row

Desktop (> 1024px):
- Full sidebar (260px)
- Full tables with all columns
- Multi-column forms
- Dashboard with side panels

═══════════════════════════════════════════════════════════
BUILD ORDER (implement exactly in this sequence)
═══════════════════════════════════════════════════════════

Phase 1 — Foundation:
1. Project setup (Next.js, Tailwind, shadcn/ui, dependencies)
2. MongoDB connection + all Mongoose models
3. NextAuth setup (credentials, JWT, middleware)
4. Seed script (create default admin user)
5. Shared layout components (Sidebar, Topbar, MobileNav)
6. Login page (role-based redirect)

Phase 2 — Admission Flow:
7. Public enquiry form + API + PDF + email
8. Admin enquiry management page
9. Generate password for parent + email
10. Multi-step parent admission form
11. Cloudinary upload setup
12. Admission review page (admin + principal)

Phase 3 — School Setup:
13. Academic year management
14. Employee creation + management
15. Classroom creation + management
16. Subject creation + assignment

Phase 4 — Core Academic:
17. Student attendance (teacher marks)
18. Employee attendance (principal marks)
19. Exam creation + marks entry
20. Report card generation PDF

Phase 5 — Finance:
21. Fee structure + monthly fee generation
22. Fee collection + receipt PDF
23. Payroll generation + payslip PDF

Phase 6 — Supporting Features:
24. Homework management
25. Timetable management
26. Notice board
27. Leave management

Phase 7 — Advanced:
28. Student promotion system
29. ID card PDF generation
30. Transfer certificate
31. Offer letter + experience letter PDFs
32. All dashboards with charts
33. Settings page

Phase 8 — Polish:
34. All export to CSV/PDF
35. Email notifications throughout
36. Loading states + skeletons everywhere
37. Error boundaries
38. 404 and error pages
39. Final responsive testing

═══════════════════════════════════════════════════════════
IMPORTANT IMPLEMENTATION NOTES
═══════════════════════════════════════════════════════════

1. Every dropdown that shows classes MUST query the database —
   never hardcode class options. Sort by order field.

2. Academic year filter must be on every major listing page.
   Default always shows current academic year data.

3. Teacher only sees data for their assigned class and subjects.
   Enforce this in every API route.

4. All monetary values stored in paisa (integer) or use exact
   decimal (Number with 2 decimal places). Display formatted.

5. All dates stored as UTC Date objects in MongoDB.
   Display in DD/MM/YYYY format throughout the UI.

6. Auto-generated IDs (ENQ-YYYY-NNNN, ADM-YYYY-NNNN, etc.)
   use atomic counter or padding based on count+1.
   Always pad to 4 digits minimum.

7. Cloudinary uploads: use signed uploads for private documents,
   unsigned preset for public profile photos.

8. Soft delete everywhere — never hard delete student or employee
   records. Use isActive or status fields.

9. All list pages must have:
   - Server-side pagination (20 per page default)
   - Search (debounced 300ms)
   - Active filters shown as removable chips
   - "No records found" empty state with illustration
   - Loading skeleton while fetching

10. Toast notifications for every action:
    Success (green), Error (red), Warning (yellow), Info (blue)

11. Confirm modal before any destructive action
    (delete, reject, approve, generate bulk fees)

12. Every PDF must include school logo from settings.
    Fall back to placeholder if no logo set.

Build this complete system now, starting with Phase 1.