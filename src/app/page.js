'use client'
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ==================== STORAGE API ====================
// Wraps localStorage to mimic a REST API pattern.
// To swap for a real backend, replace these functions with fetch() calls to your API endpoints.
const DB_KEY = "school_mgmt_db_v2";

const StorageAPI = {
  init(seedData) {
    const existing = this._read();
    if (!existing) this._write(seedData);
    return this._read();
  },
  _read() {
    try { const raw = localStorage.getItem(DB_KEY); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  },
  _write(data) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(data)); return true; }
    catch { return false; }
  },
  getAll(collection) { return this._read()?.[collection] ?? []; },
  getById(collection, id) { return this.getAll(collection).find(i => i._id === id) ?? null; },
  create(collection, item) {
    const db = this._read(); if (!db) return null;
    db[collection] = [...(db[collection] ?? []), item];
    this._write(db); return item;
  },
  update(collection, id, updates) {
    const db = this._read(); if (!db) return null;
    let updated = null;
    db[collection] = (db[collection] ?? []).map(item => {
      if (item._id === id) { updated = { ...item, ...updates }; return updated; } return item;
    });
    this._write(db); return updated;
  },
  delete(collection, id) {
    const db = this._read(); if (!db) return false;
    db[collection] = (db[collection] ?? []).filter(i => i._id !== id);
    this._write(db); return true;
  },
  setAll(collection, items) {
    const db = this._read(); if (!db) return false;
    db[collection] = items; this._write(db); return true;
  },
  getSettings() { return this._read()?.schoolSettings ?? {}; },
  updateSettings(updates) {
    const db = this._read(); if (!db) return null;
    db.schoolSettings = { ...db.schoolSettings, ...updates };
    this._write(db); return db.schoolSettings;
  },
  getDB() { return this._read(); },
  reset(seedData) { this._write(seedData); return this._read(); },
};

// ==================== INITIAL SEED DATA ====================
const SEED_DATA = {
  academicYears: [
    { _id: "ay1", name: "2024-2025", startDate: "2024-06-01", endDate: "2025-05-31", isCurrent: true }
  ],
  classrooms: [
    { _id: "cls1", className: "Nursery", section: "", displayName: "Nursery", monthlyFees: 2500, classTeacherId: "emp1", order: 1, isActive: true, academicYear: "ay1" },
    { _id: "cls2", className: "Jr. KG", section: "", displayName: "Jr. KG", monthlyFees: 3000, classTeacherId: "emp2", order: 2, isActive: true, academicYear: "ay1" },
    { _id: "cls3", className: "Class 1", section: "A", displayName: "Class 1 - A", monthlyFees: 3500, classTeacherId: "emp3", order: 5, isActive: true, academicYear: "ay1" },
    { _id: "cls4", className: "Class 2", section: "A", displayName: "Class 2 - A", monthlyFees: 3500, classTeacherId: "emp4", order: 6, isActive: true, academicYear: "ay1" },
    { _id: "cls5", className: "Class 3", section: "A", displayName: "Class 3 - A", monthlyFees: 4000, classTeacherId: "emp1", order: 7, isActive: true, academicYear: "ay1" },
  ],
  employees: [
    { _id: "emp1", employeeId: "EMP-2024-001", name: "Priya Sharma", photo: null, mobileNo: "9876543210", dateOfJoining: "2020-06-01", monthlySalary: 35000, role: "teacher", email: "priya@school.edu", gender: "Female", status: "active", academicYear: "ay1", bloodGroup: "B+", dateOfBirth: "1990-03-15", homeAddress: "123 MG Road, Pune" },
    { _id: "emp2", employeeId: "EMP-2024-002", name: "Rahul Verma", photo: null, mobileNo: "9876543211", dateOfJoining: "2019-06-01", monthlySalary: 38000, role: "teacher", email: "rahul@school.edu", gender: "Male", status: "active", academicYear: "ay1", bloodGroup: "O+", dateOfBirth: "1988-07-22", homeAddress: "456 FC Road, Pune" },
    { _id: "emp3", employeeId: "EMP-2024-003", name: "Anjali Singh", photo: null, mobileNo: "9876543212", dateOfJoining: "2021-06-01", monthlySalary: 32000, role: "teacher", email: "anjali@school.edu", gender: "Female", status: "active", academicYear: "ay1", bloodGroup: "A+", dateOfBirth: "1992-11-08", homeAddress: "789 Kothrud, Pune" },
    { _id: "emp4", employeeId: "EMP-2024-004", name: "Vikram Patil", photo: null, mobileNo: "9876543213", dateOfJoining: "2018-06-01", monthlySalary: 40000, role: "teacher", email: "vikram@school.edu", gender: "Male", status: "active", academicYear: "ay1", bloodGroup: "AB+", dateOfBirth: "1985-05-30", homeAddress: "12 Baner, Pune" },
    { _id: "emp5", employeeId: "EMP-2024-005", name: "Dr. Meena Joshi", photo: null, mobileNo: "9876543214", dateOfJoining: "2015-06-01", monthlySalary: 65000, role: "principal", email: "principal@school.edu", gender: "Female", status: "active", academicYear: "ay1", bloodGroup: "O-", dateOfBirth: "1978-09-12", homeAddress: "45 Aundh, Pune" },
  ],
  subjects: [
    { _id: "sub1", name: "Mathematics", classId: "cls3", teacherId: "emp1", totalMarks: 100, academicYear: "ay1", isActive: true },
    { _id: "sub2", name: "English", classId: "cls3", teacherId: "emp2", totalMarks: 100, academicYear: "ay1", isActive: true },
    { _id: "sub3", name: "Science", classId: "cls3", teacherId: "emp3", totalMarks: 100, academicYear: "ay1", isActive: true },
    { _id: "sub4", name: "Hindi", classId: "cls3", teacherId: "emp4", totalMarks: 100, academicYear: "ay1", isActive: true },
    { _id: "sub5", name: "Mathematics", classId: "cls4", teacherId: "emp1", totalMarks: 100, academicYear: "ay1", isActive: true },
    { _id: "sub6", name: "English", classId: "cls4", teacherId: "emp2", totalMarks: 100, academicYear: "ay1", isActive: true },
  ],
  students: [
    { _id: "std1", admissionNo: "ADM-2024-0001", firstName: "Arjun", middleName: "", lastName: "Mehta", gender: "Male", dateOfBirth: "2016-04-10", classId: "cls3", rollNumber: 1, status: "Approved", photo: null, bloodGroup: "B+", fatherName: "Suresh Mehta", motherName: "Kavita Mehta", fatherPhone: "9811234567", motherPhone: "9822345678", fatherEmail: "suresh.mehta@gmail.com", academicYear: "ay1", userId: "usr3" },
    { _id: "std2", admissionNo: "ADM-2024-0002", firstName: "Priya", middleName: "", lastName: "Sharma", gender: "Female", dateOfBirth: "2016-07-22", classId: "cls3", rollNumber: 2, status: "Approved", photo: null, bloodGroup: "A+", fatherName: "Anil Sharma", motherName: "Sunita Sharma", fatherPhone: "9833456789", motherPhone: "9844567890", fatherEmail: "anil.sharma@gmail.com", academicYear: "ay1", userId: "usr4" },
    { _id: "std3", admissionNo: "ADM-2024-0003", firstName: "Rohan", middleName: "Kumar", lastName: "Gupta", gender: "Male", dateOfBirth: "2016-02-15", classId: "cls3", rollNumber: 3, status: "Approved", photo: null, bloodGroup: "O+", fatherName: "Deepak Gupta", motherName: "Nisha Gupta", fatherPhone: "9855678901", motherPhone: "9866789012", fatherEmail: "deepak.gupta@gmail.com", academicYear: "ay1", userId: null },
    { _id: "std4", admissionNo: "ADM-2024-0004", firstName: "Ananya", middleName: "", lastName: "Patel", gender: "Female", dateOfBirth: "2015-11-30", classId: "cls4", rollNumber: 1, status: "Approved", photo: null, bloodGroup: "AB-", fatherName: "Rajesh Patel", motherName: "Mira Patel", fatherPhone: "9877890123", motherPhone: "9888901234", fatherEmail: "rajesh.patel@gmail.com", academicYear: "ay1", userId: null },
    { _id: "std5", admissionNo: "ADM-2024-0005", firstName: "Karan", middleName: "", lastName: "Singh", gender: "Male", dateOfBirth: "2015-08-05", classId: "cls4", rollNumber: 2, status: "UnderReview", photo: null, bloodGroup: "B-", fatherName: "Harpreet Singh", motherName: "Gurpreet Kaur", fatherPhone: "9899012345", motherPhone: "9800123456", fatherEmail: "harpreet@gmail.com", academicYear: "ay1", userId: null },
  ],
  enquiries: [
    { _id: "enq1", enquiryId: "ENQ-2024-0001", classApplying: "cls3", childName: "Amit Kumar", fatherName: "Rajesh Kumar", mobileNo: "9812345678", email: "rajesh@gmail.com", gender: "Male", age: 7, status: "New", dateOfBirth: "2017-03-10", residentialAddress: "123 Main St, Pune", pinCode: "411001", phoneNo: "0206543210", preferredAdmissionDate: "2024-06-15", remark: "Interested in science stream", academicYear: "ay1", createdAt: "2024-05-10" },
    { _id: "enq2", enquiryId: "ENQ-2024-0002", classApplying: "cls4", childName: "Sneha Desai", fatherName: "Vivek Desai", mobileNo: "9823456789", email: "vivek.desai@gmail.com", gender: "Female", age: 8, status: "Contacted", dateOfBirth: "2016-08-20", residentialAddress: "456 Park Ave, Pune", pinCode: "411002", phoneNo: "0206543211", preferredAdmissionDate: "2024-06-20", remark: "", academicYear: "ay1", createdAt: "2024-05-12" },
    { _id: "enq3", enquiryId: "ENQ-2024-0003", classApplying: "cls1", childName: "Neel Joshi", fatherName: "Pramod Joshi", mobileNo: "9834567890", email: "pramod.joshi@gmail.com", gender: "Male", age: 4, status: "AdmissionDone", dateOfBirth: "2020-01-15", residentialAddress: "789 Koregaon Park, Pune", pinCode: "411003", phoneNo: "0206543212", preferredAdmissionDate: "2024-06-01", remark: "twins", academicYear: "ay1", createdAt: "2024-05-15", convertedToAdmission: true },
  ],
  exams: [
    { _id: "exam1", name: "Unit Test 1", examType: "UnitTest1", subjectId: "sub1", classId: "cls3", teacherId: "emp1", totalMarks: 25, examDate: "2024-08-10", academicYear: "ay1" },
    { _id: "exam2", name: "Unit Test 1", examType: "UnitTest1", subjectId: "sub2", classId: "cls3", teacherId: "emp2", totalMarks: 25, examDate: "2024-08-12", academicYear: "ay1" },
    { _id: "exam3", name: "Mid Term", examType: "MidTerm", subjectId: "sub1", classId: "cls3", teacherId: "emp1", totalMarks: 50, examDate: "2024-10-15", academicYear: "ay1" },
    { _id: "exam4", name: "Unit Test 1", examType: "UnitTest1", subjectId: "sub3", classId: "cls3", teacherId: "emp3", totalMarks: 25, examDate: "2024-08-14", academicYear: "ay1" },
  ],
  marks: [
    { _id: "mrk1", examId: "exam1", studentId: "std1", subjectId: "sub1", classId: "cls3", marksObtained: 22, isAbsent: false, grade: "A+", academicYear: "ay1" },
    { _id: "mrk2", examId: "exam1", studentId: "std2", subjectId: "sub1", classId: "cls3", marksObtained: 20, isAbsent: false, grade: "A", academicYear: "ay1" },
    { _id: "mrk3", examId: "exam1", studentId: "std3", subjectId: "sub1", classId: "cls3", marksObtained: 18, isAbsent: false, grade: "B+", academicYear: "ay1" },
    { _id: "mrk4", examId: "exam2", studentId: "std1", subjectId: "sub2", classId: "cls3", marksObtained: 24, isAbsent: false, grade: "A+", academicYear: "ay1" },
    { _id: "mrk5", examId: "exam2", studentId: "std2", subjectId: "sub2", classId: "cls3", marksObtained: 19, isAbsent: false, grade: "A", academicYear: "ay1" },
    { _id: "mrk6", examId: "exam3", studentId: "std1", subjectId: "sub1", classId: "cls3", marksObtained: 45, isAbsent: false, grade: "A+", academicYear: "ay1" },
    { _id: "mrk7", examId: "exam4", studentId: "std1", subjectId: "sub3", classId: "cls3", marksObtained: 0, isAbsent: true, grade: "F", academicYear: "ay1" },
  ],
  attendance: [
    { _id: "att1", studentId: "std1", classId: "cls3", date: "2024-11-04", status: "Present", academicYear: "ay1" },
    { _id: "att2", studentId: "std2", classId: "cls3", date: "2024-11-04", status: "Present", academicYear: "ay1" },
    { _id: "att3", studentId: "std3", classId: "cls3", date: "2024-11-04", status: "Absent", academicYear: "ay1" },
    { _id: "att4", studentId: "std1", classId: "cls3", date: "2024-11-05", status: "Present", academicYear: "ay1" },
    { _id: "att5", studentId: "std2", classId: "cls3", date: "2024-11-05", status: "Late", academicYear: "ay1" },
  ],
  employeeAttendance: [],
  fees: [
    { _id: "fee1", studentId: "std1", classId: "cls3", month: 11, year: 2024, tuitionFee: 3500, transportFee: 500, activityFee: 200, otherFee: 0, totalAmount: 4200, status: "Paid", dueDate: "2024-11-10", finalAmount: 4200, academicYear: "ay1" },
    { _id: "fee2", studentId: "std2", classId: "cls3", month: 11, year: 2024, tuitionFee: 3500, transportFee: 500, activityFee: 200, otherFee: 0, totalAmount: 4200, status: "Pending", dueDate: "2024-11-10", finalAmount: 4200, academicYear: "ay1" },
    { _id: "fee3", studentId: "std3", classId: "cls3", month: 11, year: 2024, tuitionFee: 3500, transportFee: 0, activityFee: 200, otherFee: 0, totalAmount: 3700, status: "Overdue", dueDate: "2024-11-10", finalAmount: 3800, lateFine: 100, academicYear: "ay1" },
    { _id: "fee4", studentId: "std4", classId: "cls4", month: 11, year: 2024, tuitionFee: 3500, transportFee: 500, activityFee: 200, otherFee: 0, totalAmount: 4200, status: "Paid", dueDate: "2024-11-10", finalAmount: 4200, academicYear: "ay1" },
    { _id: "fee5", studentId: "std1", classId: "cls3", month: 10, year: 2024, tuitionFee: 3500, transportFee: 500, activityFee: 200, otherFee: 0, totalAmount: 4200, status: "Paid", dueDate: "2024-10-10", finalAmount: 4200, academicYear: "ay1" },
  ],
  feePayments: [
    { _id: "pay1", feeId: "fee1", studentId: "std1", receiptNo: "RCP-2024-00001", amountPaid: 4200, paymentDate: "2024-11-08", paymentMode: "UPI", transactionId: "TXN123456", collectedBy: "usr1", academicYear: "ay1" },
    { _id: "pay2", feeId: "fee4", studentId: "std4", receiptNo: "RCP-2024-00002", amountPaid: 4200, paymentDate: "2024-11-07", paymentMode: "Cash", transactionId: "", collectedBy: "usr1", academicYear: "ay1" },
    { _id: "pay3", feeId: "fee5", studentId: "std1", receiptNo: "RCP-2024-00003", amountPaid: 4200, paymentDate: "2024-10-09", paymentMode: "Online", transactionId: "TXN789012", collectedBy: "usr1", academicYear: "ay1" },
  ],
  homework: [
    { _id: "hw1", classId: "cls3", subjectId: "sub1", teacherId: "emp1", title: "Chapter 5 Exercise", description: "Complete exercises 5.1 to 5.5 from textbook", dueDate: "2025-04-08", academicYear: "ay1", createdAt: "2024-11-04" },
    { _id: "hw2", classId: "cls3", subjectId: "sub2", teacherId: "emp2", title: "Essay Writing", description: "Write a 200-word essay on your favourite festival", dueDate: "2025-04-10", academicYear: "ay1", createdAt: "2024-11-05" },
    { _id: "hw3", classId: "cls3", subjectId: "sub3", teacherId: "emp3", title: "Draw Plant Cell", description: "Draw and label a plant cell diagram", dueDate: "2025-04-12", academicYear: "ay1", createdAt: "2024-11-05" },
  ],
  notices: [
    { _id: "ntc1", title: "Annual Sports Day", content: "Annual Sports Day will be held on 25th November 2024. All students must participate. Parents are cordially invited.", targetRoles: ["parent", "teacher"], priority: "Important", publishDate: "2024-11-01", expiryDate: "2025-11-26", createdBy: "usr2", academicYear: "ay1" },
    { _id: "ntc2", title: "Staff Meeting", content: "All teaching staff must attend the staff meeting on 15th November 2024 at 3:00 PM in the conference room.", targetRoles: ["teacher"], priority: "Urgent", publishDate: "2024-11-04", expiryDate: "2025-11-15", createdBy: "usr2", academicYear: "ay1" },
    { _id: "ntc3", title: "Fee Reminder", content: "Kindly note that November fees are due by 10th November 2024. Late fees will attract a fine of ₹10 per day.", targetRoles: ["parent"], priority: "Normal", publishDate: "2024-11-01", expiryDate: "2025-11-30", createdBy: "usr1", academicYear: "ay1" },
  ],
  leaves: [
    { _id: "lv1", employeeId: "emp1", leaveType: "Sick", fromDate: "2024-11-06", toDate: "2024-11-07", totalDays: 2, reason: "Fever and cold", status: "Approved", approvedBy: "usr2", approvalRemark: "Get well soon", academicYear: "ay1" },
    { _id: "lv2", employeeId: "emp3", leaveType: "Casual", fromDate: "2024-11-15", toDate: "2024-11-15", totalDays: 1, reason: "Personal work", status: "Pending", academicYear: "ay1" },
  ],
  payroll: [
    { _id: "pr1", employeeId: "emp1", month: 10, year: 2024, basicSalary: 35000, daysPresent: 26, daysAbsent: 0, daysLeave: 0, deductions: 0, bonus: 2000, netSalary: 37000, status: "Paid", paymentDate: "2024-10-31", paymentMode: "BankTransfer", academicYear: "ay1" },
    { _id: "pr2", employeeId: "emp2", month: 10, year: 2024, basicSalary: 38000, daysPresent: 24, daysAbsent: 2, daysLeave: 0, deductions: 2923, bonus: 0, netSalary: 35077, status: "Paid", paymentDate: "2024-10-31", paymentMode: "BankTransfer", academicYear: "ay1" },
    { _id: "pr3", employeeId: "emp1", month: 11, year: 2024, basicSalary: 35000, daysPresent: 0, daysAbsent: 0, daysLeave: 0, deductions: 0, bonus: 0, netSalary: 35000, status: "Pending", academicYear: "ay1" },
  ],
  timetable: [
    {
      _id: "tt1", classId: "cls3", academicYear: "ay1",
      schedule: [
        {
          day: "Monday", periods: [
            { periodNo: 1, startTime: "09:00", endTime: "09:40", subjectId: "sub1", teacherId: "emp1" },
            { periodNo: 2, startTime: "09:40", endTime: "10:20", subjectId: "sub2", teacherId: "emp2" },
            { periodNo: 3, startTime: "10:30", endTime: "11:10", subjectId: "sub3", teacherId: "emp3" },
            { periodNo: 4, startTime: "11:10", endTime: "11:50", subjectId: "sub4", teacherId: "emp4" },
          ]
        },
        {
          day: "Tuesday", periods: [
            { periodNo: 1, startTime: "09:00", endTime: "09:40", subjectId: "sub3", teacherId: "emp3" },
            { periodNo: 2, startTime: "09:40", endTime: "10:20", subjectId: "sub1", teacherId: "emp1" },
            { periodNo: 3, startTime: "10:30", endTime: "11:10", subjectId: "sub2", teacherId: "emp2" },
            { periodNo: 4, startTime: "11:10", endTime: "11:50", subjectId: "sub4", teacherId: "emp4" },
          ]
        },
        {
          day: "Wednesday", periods: [
            { periodNo: 1, startTime: "09:00", endTime: "09:40", subjectId: "sub4", teacherId: "emp4" },
            { periodNo: 2, startTime: "09:40", endTime: "10:20", subjectId: "sub3", teacherId: "emp3" },
            { periodNo: 3, startTime: "10:30", endTime: "11:10", subjectId: "sub1", teacherId: "emp1" },
            { periodNo: 4, startTime: "11:10", endTime: "11:50", subjectId: "sub2", teacherId: "emp2" },
          ]
        },
        {
          day: "Thursday", periods: [
            { periodNo: 1, startTime: "09:00", endTime: "09:40", subjectId: "sub2", teacherId: "emp2" },
            { periodNo: 2, startTime: "09:40", endTime: "10:20", subjectId: "sub4", teacherId: "emp4" },
            { periodNo: 3, startTime: "10:30", endTime: "11:10", subjectId: "sub3", teacherId: "emp3" },
            { periodNo: 4, startTime: "11:10", endTime: "11:50", subjectId: "sub1", teacherId: "emp1" },
          ]
        },
        {
          day: "Friday", periods: [
            { periodNo: 1, startTime: "09:00", endTime: "09:40", subjectId: "sub1", teacherId: "emp1" },
            { periodNo: 2, startTime: "09:40", endTime: "10:20", subjectId: "sub3", teacherId: "emp3" },
            { periodNo: 3, startTime: "10:30", endTime: "11:10", subjectId: "sub4", teacherId: "emp4" },
            { periodNo: 4, startTime: "11:10", endTime: "11:50", subjectId: "sub2", teacherId: "emp2" },
          ]
        },
      ]
    }
  ],
  schoolSettings: {
    name: "Mauli School",
    address: "123 Education Lane, Pune, Maharashtra 411001",
    phone: "020-6543210",
    email: "info@maulischool.edu",
    website: "www.maulischool.edu",
    logo: null,
    affiliationNo: "CBSE-12345",
    board: "CBSE",
    declaration: "I hereby declare that all information provided in this admission form is true and correct to the best of my knowledge.",
    lateFinePer: 10,
    feeDueDay: 10,
    minAttendance: 75
  },
  users: [
    { _id: "usr1", email: "admin@school.edu", role: "admin", status: "active", name: "Admin User" },
    { _id: "usr2", email: "principal@school.edu", role: "principal", status: "active", name: "Dr. Meena Joshi" },
    { _id: "usr3", email: "parent1@gmail.com", role: "parent", status: "active", name: "Suresh Mehta" },
    { _id: "usr4", email: "parent2@gmail.com", role: "parent", status: "active", name: "Anil Sharma" },
    { _id: "usr5", email: "priya@school.edu", role: "teacher", status: "active", name: "Priya Sharma" },
  ]
};

// ==================== CONTEXT ====================
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ==================== HELPERS ====================
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_COLORS = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", Contacted: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  AdmissionDone: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", Cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  PlanningFuture: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", Other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", UnderReview: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", OnHold: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Left: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", Alumni: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  Paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  Overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", PartiallyPaid: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Waived: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", Present: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Absent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", Late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  HalfDay: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", Holiday: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", inactive: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  resigned: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const fmt = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
const fmtCurrency = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
const calcGrade = (obtained, total) => {
  const pct = (obtained / total) * 100;
  if (pct >= 90) return "A+"; if (pct >= 80) return "A";
  if (pct >= 70) return "B+"; if (pct >= 60) return "B";
  if (pct >= 50) return "C"; if (pct >= 40) return "D";
  return "F";
};
const genId = (prefix, list) => {
  const year = new Date().getFullYear();
  const next = (list.length + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${next}`;
};

// ==================== UI COMPONENTS ====================
const Badge = ({ status, label }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
    {label || status}
  </span>
);

const Toast = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map(t => (
      <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-red-500' : t.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
        }`}>
        <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}</span>
        <span>{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="ml-2 opacity-70 hover:opacity-100">×</button>
      </div>
    ))}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-6xl" };
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl">×</button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

const Confirm = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", danger = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
      <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 rounded-lg text-white font-medium ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{confirmText}</button>
    </div>
  </Modal>
);

const Input = ({ label, required, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <input className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${error ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'} ${className}`} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Select = ({ label, required, error, options = [], className = "", ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <select className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${error ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'} ${className}`} {...props}>
      <option value="">Select...</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Textarea = ({ label, required, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
    <textarea className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${error ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'} ${className}`} rows={3} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const Button = ({ children, variant = "primary", size = "md", loading, className = "", ...props }) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    outline: "border border-gray-200 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300",
    ghost: "hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-700 dark:text-gray-400",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-2.5 text-base" };
  return (
    <button disabled={loading} className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
      {children}
    </button>
  );
};

const Card = ({ children, className = "", ...props }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm ${className}`} {...props}>{children}</div>
);

const StatCard = ({ label, value, icon, color = "indigo", change }) => {
  const colors = { indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400", green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400", amber: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-400", red: "bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-400", blue: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400", purple: "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-400" };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {change && <p className={`text-xs mt-1 ${change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{change > 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${colors[color]}`}>{icon}</div>
      </div>
    </Card>
  );
};

const Table = ({ columns, data, onRowClick, emptyMsg = "No records found" }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {columns.map((col, i) => <th key={i} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide whitespace-nowrap">{col.header}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
            <div className="flex flex-col items-center gap-2"><span className="text-4xl">📭</span><span className="font-medium">{emptyMsg}</span></div>
          </td></tr>
        ) : data.map((row, i) => (
          <tr key={i} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
            {columns.map((col, j) => <td key={j} className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">{col.render ? col.render(row) : row[col.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Avatar = ({ name, photo, size = 8 }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return photo ? <img src={photo} alt={name} className={`w-${size} h-${size} rounded-full object-cover`} /> :
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>{initials}</div>;
};

const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
    {tabs.map(t => (
      <button key={t.value} onClick={() => onChange(t.value)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.value ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
        {t.label}
      </button>
    ))}
  </div>
);

const PageHeader = ({ title, subtitle, breadcrumbs, actions }) => (
  <div className="mb-6">
    {breadcrumbs && (
      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-2">
        {breadcrumbs.map((b, i) => <span key={i} className="flex items-center gap-1">{i > 0 && <span>/</span>}<span className={i === breadcrumbs.length - 1 ? 'text-gray-600 dark:text-gray-400 font-medium' : ''}>{b}</span></span>)}
      </div>
    )}
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>{subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}</div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  </div>
);

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
  </div>
);

// ==================== NAV CONFIG ====================
const NAV_CONFIG = {
  admin: [
    { section: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "📊" }] },
    { section: "Admissions", items: [{ id: "enquiries", label: "Enquiries", icon: "📋" }, { id: "admissions", label: "Admissions", icon: "🎓" }, { id: "students", label: "Students", icon: "👨‍🎓" }] },
    { section: "Academic", items: [{ id: "employees", label: "Employees", icon: "👨‍🏫" }, { id: "classrooms", label: "Classrooms", icon: "🏫" }, { id: "subjects", label: "Subjects", icon: "📚" }, { id: "exams", label: "Exams & Marks", icon: "📝" }, { id: "timetable", label: "Timetable", icon: "🗓️" }, { id: "homework", label: "Homework", icon: "📖" }] },
    { section: "Attendance", items: [{ id: "student-attendance", label: "Student Attendance", icon: "✅" }, { id: "employee-attendance", label: "Staff Attendance", icon: "🕐" }] },
    { section: "Finance", items: [{ id: "fees", label: "Fee Management", icon: "💰" }, { id: "payroll", label: "Payroll", icon: "💵" }] },
    { section: "Communication", items: [{ id: "notices", label: "Notices", icon: "📢" }] },
    { section: "Administration", items: [{ id: "promote", label: "Promote Students", icon: "⬆️" }, { id: "leaves", label: "Leave Requests", icon: "🏖️" }, { id: "reports", label: "Reports", icon: "📈" }, { id: "settings", label: "Settings", icon: "⚙️" }] },
  ],
  principal: [
    { section: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "📊" }] },
    { section: "Admissions", items: [{ id: "enquiries", label: "Enquiries", icon: "📋" }, { id: "admissions", label: "Admissions", icon: "🎓" }, { id: "students", label: "Students", icon: "👨‍🎓" }] },
    { section: "Academic", items: [{ id: "employees", label: "Teachers", icon: "👨‍🏫" }, { id: "classrooms", label: "Classrooms", icon: "🏫" }, { id: "exams", label: "Exams & Marks", icon: "📝" }, { id: "timetable", label: "Timetable", icon: "🗓️" }] },
    { section: "Attendance", items: [{ id: "student-attendance", label: "Student Attendance", icon: "✅" }, { id: "employee-attendance", label: "Staff Attendance", icon: "🕐" }] },
    { section: "Management", items: [{ id: "notices", label: "Notices", icon: "📢" }, { id: "leaves", label: "Leave Requests", icon: "🏖️" }, { id: "reports", label: "Reports", icon: "📈" }] },
  ],
  teacher: [
    { section: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "📊" }] },
    { section: "My Class", items: [{ id: "students", label: "My Students", icon: "👨‍🎓" }, { id: "student-attendance", label: "Mark Attendance", icon: "✅" }, { id: "timetable", label: "My Timetable", icon: "🗓️" }] },
    { section: "Academic", items: [{ id: "exams", label: "Exams", icon: "📝" }, { id: "homework", label: "Homework", icon: "📖" }] },
    { section: "Personal", items: [{ id: "leaves", label: "My Leaves", icon: "🏖️" }, { id: "notices", label: "Notices", icon: "📢" }] },
  ],
  parent: [
    { section: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "📊" }] },
    { section: "My Child", items: [{ id: "profile", label: "Child Profile", icon: "👦" }, { id: "student-attendance", label: "Attendance", icon: "✅" }, { id: "exams", label: "Marks & Results", icon: "📝" }] },
    { section: "School", items: [{ id: "fees", label: "Fee Details", icon: "💰" }, { id: "homework", label: "Homework", icon: "📖" }, { id: "timetable", label: "Timetable", icon: "🗓️" }, { id: "notices", label: "Notices", icon: "📢" }] },
  ],
};

// ==================== LOGIN VIEW ====================
const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const DEMO_ACCOUNTS = [
    { email: "admin@school.edu", pass: "admin123", role: "admin", label: "Admin" },
    { email: "principal@school.edu", pass: "admin123", role: "principal", label: "Principal" },
    { email: "priya@school.edu", pass: "admin123", role: "teacher", label: "Teacher" },
    { email: "parent1@gmail.com", pass: "admin123", role: "parent", label: "Parent" },
  ];

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 400));
    const found = DEMO_ACCOUNTS.find(a => a.email === email);
    if (found && password === found.pass) {
      const users = StorageAPI.getAll('users');
      const user = users.find(u => u.email === email);
      onLogin({ email, role: found.role, name: user?.name || found.label });
    } else {
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-indigo-200">🌅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mauli School</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">School Management System</p>
        </div>
        <Card className="p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Sign In</h2>
          {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
            <Button className="w-full" loading={loading} type="submit">Sign In</Button>
          </form>
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role} onClick={() => { setEmail(acc.email); setPassword(acc.pass); }} className="text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{acc.label}</span><br /><span className="text-gray-400 dark:text-gray-500">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          For enquiry: <button onClick={() => onLogin({ role: 'public' })} className="text-indigo-600 dark:text-indigo-400 hover:underline">Submit Enquiry (Public)</button>
        </p>
      </div>
    </div>
  );
};

// ==================== PUBLIC ENQUIRY ====================
const PublicEnquiryView = ({ onBack }) => {
  const { data, showToast } = useApp();
  const [form, setForm] = useState({ classApplying: "", childName: "", fatherName: "", residentialAddress: "", pinCode: "", phoneNo: "", mobileNo: "", email: "", gender: "Male", age: "", dateOfBirth: "", preferredAdmissionDate: "", remark: "" });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.classApplying) e.classApplying = "Required";
    if (!form.childName) e.childName = "Required";
    if (!form.fatherName) e.fatherName = "Required";
    if (!form.residentialAddress) e.residentialAddress = "Required";
    if (!/^\d{6}$/.test(form.pinCode)) e.pinCode = "6 digits required";
    if (!/^\d{10}$/.test(form.phoneNo)) e.phoneNo = "10 digits required";
    if (!/^\d{10}$/.test(form.mobileNo)) e.mobileNo = "10 digits required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.age || form.age < 1) e.age = "Required";
    if (!form.dateOfBirth) e.dateOfBirth = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const enquiries = StorageAPI.getAll('enquiries');
    const newEnq = { _id: `enq${Date.now()}`, enquiryId: genId("ENQ", enquiries), ...form, status: "New", academicYear: "ay1", createdAt: new Date().toISOString(), convertedToAdmission: false };
    StorageAPI.create('enquiries', newEnq);
    setSubmitted(newEnq);
    showToast("Enquiry submitted successfully!", "success");
    setLoading(false);
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Enquiry Submitted!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Your enquiry has been received. We will contact you shortly.</p>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium uppercase tracking-wide">Your Enquiry ID</p>
          <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 font-mono">{submitted.enquiryId}</p>
        </div>
        <div className="space-y-2">
          <Button className="w-full" onClick={() => setSubmitted(null)}>Submit Another Enquiry</Button>
          <Button variant="outline" className="w-full" onClick={onBack}>← Back to Login</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">🌅</div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mauli School</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Admission Enquiry Form</p>
        </div>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">📋 Student Enquiry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Select label="Class Applying For" required value={form.classApplying} onChange={e => f('classApplying', e.target.value)} error={errors.classApplying} options={classes.map(c => ({ value: c._id, label: c.displayName }))} />
            </div>
            <Input label="Child's Full Name" required value={form.childName} onChange={e => f('childName', e.target.value)} error={errors.childName} />
            <Input label="Father's Name" required value={form.fatherName} onChange={e => f('fatherName', e.target.value)} error={errors.fatherName} />
            <div className="sm:col-span-2"><Textarea label="Residential Address" required value={form.residentialAddress} onChange={e => f('residentialAddress', e.target.value)} error={errors.residentialAddress} rows={2} /></div>
            <Input label="Pin Code" required value={form.pinCode} onChange={e => f('pinCode', e.target.value)} error={errors.pinCode} maxLength={6} />
            <Input label="Phone No" required value={form.phoneNo} onChange={e => f('phoneNo', e.target.value)} error={errors.phoneNo} maxLength={10} />
            <Input label="Mobile No" required value={form.mobileNo} onChange={e => f('mobileNo', e.target.value)} error={errors.mobileNo} maxLength={10} />
            <Input label="Email ID" required type="email" value={form.email} onChange={e => f('email', e.target.value)} error={errors.email} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender <span className="text-red-500">*</span></label>
              <div className="flex gap-4 pt-1">
                {["Male", "Female", "Other"].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => f('gender', g)} />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <Input label="Age (years)" required type="number" value={form.age} onChange={e => f('age', e.target.value)} error={errors.age} min={1} max={20} />
            <Input label="Date of Birth" required type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} error={errors.dateOfBirth} max={new Date().toISOString().split('T')[0]} />
            <Input label="Preferred Admission Date" type="date" value={form.preferredAdmissionDate} onChange={e => f('preferredAdmissionDate', e.target.value)} />
            <div className="sm:col-span-2"><Textarea label="Remarks" value={form.remark} onChange={e => f('remark', e.target.value)} placeholder="Any additional information..." rows={2} /></div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={onBack}>← Back</Button>
            <Button className="flex-1" onClick={handleSubmit} loading={loading}>Submit Enquiry</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==================== DASHBOARD VIEWS ====================
const AdminDashboard = () => {
  const { data } = useApp();
  const approvedStudents = data.students.filter(s => s.status === "Approved").length;
  const activeTeachers = data.employees.filter(e => e.role === "teacher" && e.status === "active").length;
  const pendingAdmissions = data.students.filter(s => s.status === "UnderReview").length;
  const totalClasses = data.classrooms.filter(c => c.isActive).length;

  const feeData = [
    { month: "Jun", collected: 85000, target: 100000 }, { month: "Jul", collected: 92000, target: 100000 },
    { month: "Aug", collected: 88000, target: 100000 }, { month: "Sep", collected: 95000, target: 100000 },
    { month: "Oct", collected: data.fees.filter(f => f.month === 10 && f.status === 'Paid').reduce((s, f) => s + f.finalAmount, 0) || 90000, target: 100000 },
    { month: "Nov", collected: data.fees.filter(f => f.month === 11 && f.status === 'Paid').reduce((s, f) => s + f.finalAmount, 0), target: 100000 },
  ];

  const presentCount = data.attendance.filter(a => a.status === 'Present').length;
  const absentCount = data.attendance.filter(a => a.status === 'Absent').length;
  const lateCount = data.attendance.filter(a => a.status === 'Late').length;
  const attTotal = presentCount + absentCount + lateCount || 1;

  const attendanceData = [
    { name: "Present", value: Math.round(presentCount / attTotal * 100), fill: "#10B981" },
    { name: "Absent", value: Math.round(absentCount / attTotal * 100), fill: "#EF4444" },
    { name: "Late", value: Math.round(lateCount / attTotal * 100), fill: "#F59E0B" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Welcome back! Here's what's happening today." breadcrumbs={["Home", "Dashboard"]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={approvedStudents} icon="👨‍🎓" color="indigo" />
        <StatCard label="Total Teachers" value={activeTeachers} icon="👨‍🏫" color="green" />
        <StatCard label="Total Classes" value={totalClasses} icon="🏫" color="amber" />
        <StatCard label="Pending Admissions" value={pendingAdmissions} icon="📋" color="red" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Fee Collection (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={feeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${v / 1000}k`} stroke="#9CA3AF" />
              <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
              <Legend wrapperStyle={{ color: '#6B7280' }} />
              <Bar dataKey="collected" fill="#6366F1" radius={[4, 4, 0, 0]} name="Collected" />
              <Bar dataKey="target" fill="#E0E7FF" radius={[4, 4, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {attendanceData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {attendanceData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: d.fill }} /><span className="text-gray-600 dark:text-gray-400">{d.name}</span></div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Recent Enquiries</h3>
            <Badge status="New" label={`${data.enquiries.filter(e => e.status === 'New').length} New`} />
          </div>
          <div className="space-y-3">
            {data.enquiries.slice(-4).reverse().map(enq => {
              const cls = data.classrooms.find(c => c._id === enq.classApplying);
              return (
                <div key={enq._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div><p className="font-medium text-sm text-gray-900 dark:text-gray-100">{enq.childName}</p><p className="text-xs text-gray-500 dark:text-gray-400">{cls?.displayName} · {enq.enquiryId}</p></div>
                  <Badge status={enq.status} />
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Fee Defaulters</h3>
          <div className="space-y-3">
            {data.fees.filter(f => f.status === 'Pending' || f.status === 'Overdue').map(fee => {
              const student = data.students.find(s => s._id === fee.studentId);
              const cls = data.classrooms.find(c => c._id === fee.classId);
              return student ? (
                <div key={fee._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${student.firstName} ${student.lastName}`} size={8} />
                    <div><p className="font-medium text-sm text-gray-900 dark:text-gray-100">{student.firstName} {student.lastName}</p><p className="text-xs text-gray-500 dark:text-gray-400">{cls?.displayName} · {MONTHS[fee.month - 1]}</p></div>
                  </div>
                  <div className="text-right"><p className="font-bold text-red-600 dark:text-red-400 text-sm">{fmtCurrency(fee.finalAmount)}</p><Badge status={fee.status} /></div>
                </div>
              ) : null;
            })}
            {data.fees.filter(f => f.status === 'Pending' || f.status === 'Overdue').length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">✅ All fees are paid!</p>}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Notices</h3>
          <div className="space-y-3">
            {data.notices.slice(0, 3).map(n => (
              <div key={n._id} className={`p-3 rounded-xl border-l-4 ${n.priority === 'Urgent' ? 'bg-red-50 dark:bg-red-900/20 border-red-400' : n.priority === 'Important' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400'}`}>
                <div className="flex items-start justify-between">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{n.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.priority === 'Urgent' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : n.priority === 'Important' ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>{n.priority}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{n.content}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Pending Leave Requests</h3>
          <div className="space-y-3">
            {data.leaves.filter(l => l.status === 'Pending').map(leave => {
              const emp = data.employees.find(e => e._id === leave.employeeId);
              return emp ? (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Avatar name={emp.name} size={8} />
                    <div><p className="font-medium text-sm text-gray-900 dark:text-gray-100">{emp.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{leave.leaveType} · {leave.totalDays} day(s)</p></div>
                  </div>
                  <Badge status="Pending" />
                </div>
              ) : null;
            })}
            {data.leaves.filter(l => l.status === 'Pending').length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">No pending leave requests</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

const PrincipalDashboard = () => {
  const { data } = useApp();
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-6">
      <PageHeader title="Principal Dashboard" subtitle="School Overview" breadcrumbs={["Home", "Dashboard"]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={data.students.filter(s => s.status === 'Approved').length} icon="👨‍🎓" color="indigo" />
        <StatCard label="Total Teachers" value={data.employees.filter(e => e.role === 'teacher' && e.status === 'active').length} icon="👨‍🏫" color="green" />
        <StatCard label="Pending Leaves" value={data.leaves.filter(l => l.status === 'Pending').length} icon="🏖️" color="amber" />
        <StatCard label="Pending Admissions" value={data.students.filter(s => s.status === 'UnderReview').length} icon="📋" color="red" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Class-wise Students</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classes.map(c => ({ name: c.displayName.replace('Class ', 'C').replace('Jr. ', 'Jr.'), count: data.students.filter(s => s.classId === c._id && s.status === 'Approved').length }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
              <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Leave Requests</h3>
          <div className="space-y-3">
            {data.leaves.slice(0, 4).map(l => {
              const emp = data.employees.find(e => e._id === l.employeeId);
              return emp ? (
                <div key={l._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2"><Avatar name={emp.name} size={8} /><div><p className="font-medium text-sm">{emp.name}</p><p className="text-xs text-gray-500">{l.leaveType} · {l.totalDays} day(s)</p></div></div>
                  <Badge status={l.status} />
                </div>
              ) : null;
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

const TeacherDashboard = ({ currentUser }) => {
  const { data } = useApp();
  const myEmployee = data.employees.find(e => e.email === currentUser?.email) || data.employees[0];
  const classes = [...data.classrooms].filter(c => c.isActive);
  const myClasses = classes.filter(c => c.classTeacherId === myEmployee?._id);
  const mySubjects = data.subjects.filter(s => s.teacherId === myEmployee?._id);
  const myStudents = data.students.filter(s => myClasses.some(c => c._id === s.classId) && s.status === 'Approved');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAtt = data.attendance.filter(a => a.date === todayStr && myClasses.some(c => c._id === a.classId));
  const upcomingHW = data.homework.filter(hw => hw.teacherId === myEmployee?._id && new Date(hw.dueDate) >= new Date());

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher Dashboard" subtitle={`Welcome, ${myEmployee?.name || 'Teacher'}!`} breadcrumbs={["Home", "Dashboard"]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Students" value={myStudents.length} icon="👨‍🎓" color="indigo" />
        <StatCard label="My Subjects" value={mySubjects.length} icon="📚" color="green" />
        <StatCard label="Homework Given" value={upcomingHW.length} icon="📖" color="amber" />
        <StatCard label="Attendance Today" value={todayAtt.length > 0 ? "✓ Done" : "Pending"} icon="✅" color={todayAtt.length > 0 ? "green" : "red"} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Today's Timetable</h3>
          {(() => {
            const today = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
            const tt = data.timetable.find(t => myClasses.some(c => c._id === t.classId));
            const todaySchedule = tt?.schedule.find(s => s.day === today);
            return todaySchedule?.periods ? (
              <div className="space-y-2">
                {todaySchedule.periods.map(p => {
                  const sub = data.subjects.find(s => s._id === p.subjectId);
                  const cls = classes.find(c => c._id === tt.classId);
                  return (
                    <div key={p.periodNo} className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <div className="text-center w-14"><p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">P{p.periodNo}</p><p className="text-xs text-gray-500 dark:text-gray-400">{p.startTime}</p></div>
                      <div><p className="font-medium text-sm text-gray-900 dark:text-gray-100">{sub?.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{cls?.displayName}</p></div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-gray-400 text-sm">No classes today ({today})</p>;
          })()}
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Notices</h3>
          <div className="space-y-3">
            {data.notices.filter(n => (n.targetRoles || []).includes('teacher')).slice(0, 3).map(n => (
              <div key={n._id} className={`p-3 rounded-xl border-l-4 ${n.priority === 'Urgent' ? 'bg-red-50 dark:bg-red-900/20 border-red-400' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-400'}`}>
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.content}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ParentDashboard = ({ currentUser }) => {
  const { data } = useApp();
  const classes = [...data.classrooms].filter(c => c.isActive);
  const myStudent = data.students.find(s => s.userId === currentUser?.userId) || data.students.find(s => s.status === 'Approved' && s.userId === 'usr3') || data.students.find(s => s.status === 'Approved');
  const cls = myStudent ? classes.find(c => c._id === myStudent?.classId) : null;
  const myFees = myStudent ? data.fees.filter(f => f.studentId === myStudent._id) : [];
  const pendingFees = myFees.filter(f => f.status !== 'Paid');
  const myAtt = myStudent ? data.attendance.filter(a => a.studentId === myStudent._id) : [];
  const attPct = myAtt.length > 0 ? Math.round((myAtt.filter(a => a.status === 'Present').length / myAtt.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Parent Dashboard" subtitle="Track your child's academic progress" breadcrumbs={["Home", "Dashboard"]} />
      {myStudent ? (
        <>
          <Card className="p-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center gap-4">
              <Avatar name={`${myStudent.firstName} ${myStudent.lastName}`} size={14} />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{myStudent.firstName} {myStudent.middleName} {myStudent.lastName}</h3>
                <p className="text-indigo-200 dark:text-indigo-300">{cls?.displayName} · Roll No: {myStudent.rollNumber} · {myStudent.admissionNo}</p>
                <div className="mt-1"><Badge status={myStudent.status} /></div>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Attendance" value={`${attPct}%`} icon="✅" color={attPct >= 75 ? 'green' : 'red'} />
            <StatCard label="Pending HW" value={data.homework.filter(hw => hw.classId === myStudent.classId && new Date(hw.dueDate) >= new Date()).length} icon="📖" color="amber" />
            <StatCard label="Pending Fees" value={pendingFees.length} icon="💰" color={pendingFees.length > 0 ? 'red' : 'green'} />
            <StatCard label="This Month" value={MONTHS[new Date().getMonth()]} icon="📅" color="blue" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Homework</h3>
              <div className="space-y-3">
                {data.homework.filter(hw => hw.classId === myStudent.classId).slice(0, 3).map(hw => {
                  const sub = data.subjects.find(s => s._id === hw.subjectId);
                  const overdue = new Date(hw.dueDate) < new Date();
                  return (
                    <div key={hw._id} className={`p-3 rounded-xl ${overdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex items-center justify-between">
                        <div><span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">{sub?.name}</span><p className="font-medium text-sm text-gray-900 dark:text-gray-100 mt-1">{hw.title}</p></div>
                        <div className="text-right"><p className="text-xs text-gray-400 dark:text-gray-500">Due</p><p className={`text-xs font-semibold ${overdue ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{fmt(hw.dueDate)}</p></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Marks</h3>
              <div className="space-y-3">
                {data.marks.filter(m => m.studentId === myStudent._id).slice(0, 4).map(m => {
                  const sub = data.subjects.find(s => s._id === m.subjectId);
                  const exam = data.exams.find(e => e._id === m.examId);
                  return (
                    <div key={m._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div><p className="font-medium text-sm text-gray-900 dark:text-gray-100">{sub?.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{exam?.name}</p></div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-700 dark:text-indigo-300">{m.isAbsent ? 'Absent' : `${m.marksObtained}/${exam?.totalMarks}`}</p>
                        <p className={`text-xs font-bold ${m.grade === 'F' ? 'text-red-500 dark:text-red-400' : m.grade?.includes('A') ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>{m.grade}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center"><div className="text-4xl mb-3">📋</div><h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">No Active Student Found</h3><p className="text-gray-500 dark:text-gray-400 text-sm">Contact the school for more information.</p></Card>
      )}
    </div>
  );
};

// ==================== ENQUIRIES VIEW ====================
const EnquiriesView = ({ userRole }) => {
  const { data, refreshData, showToast } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  const filtered = data.enquiries.filter(e => {
    const q = search.toLowerCase();
    return (!q || e.childName?.toLowerCase().includes(q) || e.enquiryId?.includes(q) || e.mobileNo?.includes(q)) &&
      (!statusFilter || e.status === statusFilter) && (!classFilter || e.classApplying === classFilter);
  });

  const handleGeneratePassword = (enq) => {
    const pass = Math.random().toString(36).slice(2, 10);
    setGeneratedPassword(pass);
    setSelected(enq);
    setShowPasswordModal(true);
    showToast("Password generated! Send credentials to parent.", "success");
  };

  const columns = [
    { header: "Enquiry ID", render: r => <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{r.enquiryId}</span> },
    { header: "Child Name", render: r => <span className="font-medium text-gray-900 dark:text-gray-100">{r.childName}</span> },
    { header: "Class", render: r => { const c = classes.find(cl => cl._id === r.classApplying); return c?.displayName || "-"; } },
    { header: "Father Name", key: "fatherName" },
    { header: "Mobile", key: "mobileNo" },
    { header: "Date", render: r => fmt(r.createdAt) },
    { header: "Status", render: r => <Badge status={r.status} /> },
    {
      header: "Actions", render: r => (
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); setSelected(r); setEditData({ ...r }); setShowModal(true); }} className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded">✏️</button>
          {r.status !== 'AdmissionDone' && <button onClick={e => { e.stopPropagation(); handleGeneratePassword(r); }} className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded text-xs font-medium">🔑</button>}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Enquiries" subtitle={`${filtered.length} enquiries found`} breadcrumbs={["Home", "Enquiries"]} />
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48"><SearchBar value={search} onChange={setSearch} placeholder="Search by name, ID, mobile..." /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
            <option value="">All Status</option>
            {["New", "Contacted", "AdmissionDone", "Cancelled", "PlanningFuture", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
          </select>
        </div>
      </Card>
      <Card><Table columns={columns} data={filtered} emptyMsg="No enquiries found" /></Card>

      <Modal isOpen={showModal && !!editData} onClose={() => setShowModal(false)} title={`Edit Enquiry - ${selected?.enquiryId}`} size="lg">
        {editData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Child's Name" value={editData.childName} onChange={e => setEditData(p => ({ ...p, childName: e.target.value }))} />
              <Input label="Father's Name" value={editData.fatherName} onChange={e => setEditData(p => ({ ...p, fatherName: e.target.value }))} />
              <Input label="Mobile" value={editData.mobileNo} onChange={e => setEditData(p => ({ ...p, mobileNo: e.target.value }))} />
              <Input label="Email" value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} />
              <Select label="Status" value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))} options={["New", "Contacted", "AdmissionDone", "Cancelled", "PlanningFuture", "Other"].map(s => ({ value: s, label: s }))} />
              <Select label="Class" value={editData.classApplying} onChange={e => setEditData(p => ({ ...p, classApplying: e.target.value }))} options={classes.map(c => ({ value: c._id, label: c.displayName }))} />
            </div>
            <Textarea label="Admin Remark" value={editData.adminRemark || ""} onChange={e => setEditData(p => ({ ...p, adminRemark: e.target.value }))} />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => { StorageAPI.update('enquiries', editData._id, editData); refreshData(); showToast("Enquiry updated!", "success"); setShowModal(false); }}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Generated Login Credentials" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl"><p className="text-sm text-amber-700 font-medium">⚠️ Save this password — it will only be shown once!</p></div>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Email</p><p className="font-mono font-semibold text-sm">{selected?.email}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Password</p>
              <div className="flex items-center justify-between">
                <p className="font-mono font-bold text-lg text-indigo-700">{generatedPassword}</p>
                <button onClick={() => { navigator.clipboard?.writeText(generatedPassword); showToast("Copied!", "success"); }} className="text-xs text-indigo-600 hover:underline">Copy</button>
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={() => setShowPasswordModal(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
};

// ==================== ADMISSIONS VIEW ====================
const AdmissionsView = () => {
  const { data, refreshData, showToast } = useApp();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [remark, setRemark] = useState("");
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  const tabs = ["All", "UnderReview", "Approved", "OnHold", "Rejected"];
  const filtered = data.students.filter(s => {
    const q = search.toLowerCase();
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return (tab === "All" || s.status === tab) && (!q || name.includes(q) || s.admissionNo?.toLowerCase().includes(q));
  });

  const handleApprove = (student) => {
    const classStudents = data.students.filter(s => s.classId === student.classId && s.status === 'Approved');
    const nextRoll = classStudents.length + 1;
    StorageAPI.update('students', student._id, { status: 'Approved', rollNumber: nextRoll });
    refreshData();
    showToast(`${student.firstName}'s admission approved! Roll No: ${nextRoll}`, "success");
    setSelected(null);
  };

  const handleReject = () => {
    if (!remark) return showToast("Please enter rejection reason", "error");
    StorageAPI.update('students', selected._id, { status: 'Rejected', rejectionRemark: remark });
    refreshData(); showToast("Admission rejected", "error"); setShowRejectModal(false); setSelected(null); setRemark("");
  };

  const handleHold = () => {
    if (!remark) return showToast("Please enter hold reason", "error");
    StorageAPI.update('students', selected._id, { status: 'OnHold', holdRemark: remark });
    refreshData(); showToast("Admission put on hold", "warning"); setShowHoldModal(false); setSelected(null); setRemark("");
  };

  if (selected) {
    const cls = classes.find(c => c._id === selected.classId);
    return (
      <div className="space-y-5">
        <PageHeader title="Admission Detail" breadcrumbs={["Home", "Admissions", selected.admissionNo]}
          actions={<div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>← Back</Button>
            {selected.status === 'UnderReview' && <>
              <Button variant="success" onClick={() => handleApprove(selected)}>✅ Approve</Button>
              <Button variant="warning" onClick={() => setShowHoldModal(true)}>⏸ On Hold</Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>❌ Reject</Button>
            </>}
          </div>} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="p-5">
            <div className="text-center">
              <Avatar name={`${selected.firstName} ${selected.lastName}`} size={20} />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-3">{selected.firstName} {selected.middleName} {selected.lastName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{cls?.displayName}</p>
              <div className="mt-1"><Badge status={selected.status} /></div>
              <div className="mt-4 text-left space-y-2">
                {[["Admission No", selected.admissionNo], ["DOB", fmt(selected.dateOfBirth)], ["Gender", selected.gender], ["Blood Group", selected.bloodGroup]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">{k}</span><span className="font-medium text-gray-900 dark:text-gray-100">{v || '-'}</span></div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="p-5 lg:col-span-2">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Family Information</h4>
            <div className="grid grid-cols-2 gap-3">
              {[["Father", selected.fatherName], ["Mother", selected.motherName], ["Father Phone", selected.fatherPhone], ["Mother Phone", selected.motherPhone], ["Father Email", selected.fatherEmail]].map(([k, v]) => (
                <div key={k} className="space-y-0.5"><p className="text-xs text-gray-400 dark:text-gray-500">{k}</p><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{v || '-'}</p></div>
              ))}
            </div>
          </Card>
        </div>
        <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Admission" size="sm">
          <Textarea label="Rejection Reason *" value={remark} onChange={e => setRemark(e.target.value)} placeholder="Enter reason..." />
          <div className="flex gap-3 justify-end mt-4"><Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button><Button variant="danger" onClick={handleReject}>Reject</Button></div>
        </Modal>
        <Modal isOpen={showHoldModal} onClose={() => setShowHoldModal(false)} title="Put On Hold" size="sm">
          <Textarea label="Hold Reason *" value={remark} onChange={e => setRemark(e.target.value)} placeholder="Enter reason..." />
          <div className="flex gap-3 justify-end mt-4"><Button variant="outline" onClick={() => setShowHoldModal(false)}>Cancel</Button><Button variant="warning" onClick={handleHold}>Put On Hold</Button></div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Admissions" subtitle="Review and manage student admission applications" breadcrumbs={["Home", "Admissions"]} />
      <Tabs tabs={tabs.map(t => ({ value: t, label: t === 'All' ? `All (${data.students.length})` : `${t} (${data.students.filter(s => s.status === t).length})` }))} activeTab={tab} onChange={setTab} />
      <Card className="p-4"><SearchBar value={search} onChange={setSearch} placeholder="Search by name or admission no..." /></Card>
      <Card>
        <Table columns={[
          { header: "Adm No", render: r => <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{r.admissionNo}</span> },
          { header: "Student", render: r => <div className="flex items-center gap-2"><Avatar name={`${r.firstName} ${r.lastName}`} size={8} /><span className="font-medium text-gray-900 dark:text-gray-100">{r.firstName} {r.lastName}</span></div> },
          { header: "Class", render: r => { const c = classes.find(cl => cl._id === r.classId); return c?.displayName || "-"; } },
          { header: "Father", key: "fatherName" },
          { header: "Status", render: r => <Badge status={r.status} /> },
          { header: "Actions", render: r => <Button size="sm" variant="outline" onClick={() => setSelected(r)}>View</Button> },
        ]} data={filtered} onRowClick={setSelected} emptyMsg="No admissions found" />
      </Card>
    </div>
  );
};

// ==================== STUDENTS VIEW ====================
const StudentsView = ({ userRole }) => {
  const { data, refreshData, showToast } = useApp();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState({ leavingDate: "", leavingReason: "" });
  const [detailTab, setDetailTab] = useState("info");
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  const filtered = data.students.filter(s => {
    const q = search.toLowerCase();
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return (!q || name.includes(q) || s.admissionNo?.includes(q)) && (!classFilter || s.classId === classFilter) && (!statusFilter || s.status === statusFilter);
  });

  const handleMarkLeft = () => {
    if (!leaveData.leavingDate || !leaveData.leavingReason) return showToast("Please fill required fields", "error");
    StorageAPI.update('students', selected._id, { status: 'Left', ...leaveData });
    refreshData(); showToast("Student marked as left.", "success"); setShowLeaveModal(false); setSelected(null);
  };

  if (selected) {
    const cls = classes.find(c => c._id === selected.classId);
    const studentFees = data.fees.filter(f => f.studentId === selected._id);
    const studentMarks = data.marks.filter(m => m.studentId === selected._id);
    const att = data.attendance.filter(a => a.studentId === selected._id);
    const present = att.filter(a => a.status === 'Present').length;
    const pct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;

    return (
      <div className="space-y-5">
        <PageHeader title={`${selected.firstName} ${selected.lastName}`} breadcrumbs={["Home", "Students", selected.admissionNo]}
          actions={<div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>← Back</Button>
            {userRole === 'admin' && selected.status === 'Approved' && <Button variant="danger" size="sm" onClick={() => setShowLeaveModal(true)}>🚪 Mark as Left</Button>}
          </div>} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <Card className="p-5">
            <div className="text-center">
              <Avatar name={`${selected.firstName} ${selected.lastName}`} size={20} />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-3 text-lg">{selected.firstName} {selected.middleName} {selected.lastName}</h3>
              <p className="text-sm text-gray-500 mb-2">{cls?.displayName} · Roll {selected.rollNumber || '-'}</p>
              <Badge status={selected.status} />
            </div>
            <div className="mt-4 space-y-2 pt-4 border-t border-gray-100">
              {[["Adm No", selected.admissionNo], ["DOB", fmt(selected.dateOfBirth)], ["Gender", selected.gender], ["Blood Group", selected.bloodGroup || '-']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span></div>
              ))}
            </div>
          </Card>
          <div className="lg:col-span-3 space-y-4">
            <Tabs tabs={[{ value: 'info', label: 'Info' }, { value: 'family', label: 'Family' }, { value: 'fees', label: 'Fees' }, { value: 'marks', label: 'Marks' }, { value: 'attendance', label: 'Attendance' }]} activeTab={detailTab} onChange={setDetailTab} />
            {detailTab === 'info' && <Card className="p-5"><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Student Information</h4><div className="grid grid-cols-2 gap-3 text-sm">{[["Place of Birth", selected.placeOfBirth], ["Religion", selected.religion], ["Caste", selected.caste], ["Mother Tongue", selected.motherTongue], ["PEN Number", selected.penNumber], ["Previous School", selected.previousSchoolName]].map(([k, v]) => <div key={k}><p className="text-xs text-gray-400 dark:text-gray-500">{k}</p><p className="font-medium text-gray-900 dark:text-gray-100">{v || '-'}</p></div>)}</div></Card>}
            {detailTab === 'family' && (
              <Card className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">👨 Father's Details</h4><div className="space-y-2 text-sm">{[["Name", selected.fatherName], ["Occupation", selected.fatherOccupation], ["Phone", selected.fatherPhone], ["Email", selected.fatherEmail]].map(([k, v]) => <div key={k}><p className="text-xs text-gray-400 dark:text-gray-500">{k}</p><p className="font-medium text-gray-900 dark:text-gray-100">{v || '-'}</p></div>)}</div></div>
                  <div><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-3">👩 Mother's Details</h4><div className="space-y-2 text-sm">{[["Name", selected.motherName], ["Occupation", selected.motherOccupation], ["Phone", selected.motherPhone], ["Email", selected.motherEmail]].map(([k, v]) => <div key={k}><p className="text-xs text-gray-400 dark:text-gray-500">{k}</p><p className="font-medium text-gray-900 dark:text-gray-100">{v || '-'}</p></div>)}</div></div>
                </div>
              </Card>
            )}
            {detailTab === 'fees' && <Card className="p-5"><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Fee History</h4><Table columns={[{ header: "Month", render: r => `${MONTHS[r.month - 1]} ${r.year}` }, { header: "Amount", render: r => fmtCurrency(r.finalAmount) }, { header: "Status", render: r => <Badge status={r.status} /> }, { header: "Due Date", render: r => fmt(r.dueDate) }]} data={studentFees} emptyMsg="No fee records" /></Card>}
            {detailTab === 'marks' && <Card className="p-5"><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Marks & Results</h4><Table columns={[{ header: "Subject", render: r => { const s = data.subjects.find(s => s._id === r.subjectId); return s?.name || '-'; } }, { header: "Exam", render: r => { const e = data.exams.find(e => e._id === r.examId); return e?.name || '-'; } }, { header: "Marks", render: r => r.isAbsent ? <span className="text-red-500 dark:text-red-400 font-medium">Absent</span> : `${r.marksObtained}/${data.exams.find(e => e._id === r.examId)?.totalMarks || '-'}` }, { header: "Grade", render: r => <span className={`font-bold ${r.grade === 'F' ? 'text-red-500 dark:text-red-400' : r.grade?.includes('A') ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>{r.grade}</span> }]} data={studentMarks} emptyMsg="No marks entered" /></Card>}
            {detailTab === 'attendance' && (
              <Card className="p-5">
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Attendance Record</h4>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[["Total Days", att.length], ["Present", present], ["Absent", att.filter(a => a.status === 'Absent').length], ["Attendance %", `${pct}%`]].map(([k, v]) => (
                    <div key={k} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{v}</p><p className="text-xs text-gray-500 dark:text-gray-400">{k}</p></div>
                  ))}
                </div>
                <Table columns={[{ header: "Date", render: r => fmt(r.date) }, { header: "Status", render: r => <Badge status={r.status} /> }]} data={att} emptyMsg="No attendance records" />
              </Card>
            )}
          </div>
        </div>
        <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Mark Student as Left" size="sm">
          <div className="space-y-3">
            <Input label="Leaving Date *" type="date" value={leaveData.leavingDate} onChange={e => setLeaveData(p => ({ ...p, leavingDate: e.target.value }))} />
            <Textarea label="Reason *" value={leaveData.leavingReason} onChange={e => setLeaveData(p => ({ ...p, leavingReason: e.target.value }))} />
            <div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setShowLeaveModal(false)}>Cancel</Button><Button variant="danger" onClick={handleMarkLeft}>Confirm & Generate TC</Button></div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Students" subtitle={`${filtered.length} students`} breadcrumbs={["Home", "Students"]} />
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48"><SearchBar value={search} onChange={setSearch} placeholder="Search students..." /></div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
            <option value="">All Status</option>
            {["UnderReview", "Approved", "Rejected", "OnHold", "Left"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>
      <Card>
        <Table columns={[
          { header: "Adm No", render: r => <span className="font-mono text-xs font-semibold text-indigo-600">{r.admissionNo}</span> },
          { header: "Student", render: r => <div className="flex items-center gap-2"><Avatar name={`${r.firstName} ${r.lastName}`} size={8} /><div><p className="font-medium text-sm">{r.firstName} {r.lastName}</p><p className="text-xs text-gray-400">Roll: {r.rollNumber || '-'}</p></div></div> },
          { header: "Class", render: r => { const c = classes.find(cl => cl._id === r.classId); return c?.displayName || "-"; } },
          { header: "Gender", key: "gender" },
          { header: "Father", key: "fatherName" },
          { header: "Status", render: r => <Badge status={r.status} /> },
          { header: "Actions", render: r => <Button size="sm" variant="outline" onClick={() => setSelected(r)}>View</Button> },
        ]} data={filtered} onRowClick={setSelected} emptyMsg="No students found" />
      </Card>
    </div>
  );
};

// ==================== EMPLOYEES VIEW ====================
const EmployeesView = () => {
  const { data, refreshData, showToast } = useApp();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [empTab, setEmpTab] = useState("info");
  const [form, setForm] = useState({ name: "", email: "", mobileNo: "", role: "teacher", monthlySalary: "", dateOfJoining: "", gender: "Female", bloodGroup: "", dateOfBirth: "", homeAddress: "" });
  const classes = [...data.classrooms].filter(c => c.isActive);

  const filtered = data.employees.filter(e => {
    const q = search.toLowerCase();
    return (!q || e.name?.toLowerCase().includes(q) || e.employeeId?.includes(q) || e.email?.toLowerCase().includes(q)) && (!roleFilter || e.role === roleFilter);
  });

  const handleCreate = () => {
    if (!form.name || !form.email) return showToast("Name and email required", "error");
    const emp = { _id: `emp${Date.now()}`, employeeId: genId("EMP", data.employees), ...form, status: "active", academicYear: "ay1", photo: null };
    StorageAPI.create('employees', emp); refreshData();
    showToast(`${emp.name} added! Employee ID: ${emp.employeeId}`, "success");
    setShowModal(false); setForm({ name: "", email: "", mobileNo: "", role: "teacher", monthlySalary: "", dateOfJoining: "", gender: "Female", bloodGroup: "", dateOfBirth: "", homeAddress: "" });
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (selected) {
    const empLeaves = data.leaves.filter(l => l.employeeId === selected._id);
    const empPayroll = data.payroll.filter(p => p.employeeId === selected._id);
    const empClasses = classes.filter(c => c.classTeacherId === selected._id);
    const empSubjects = data.subjects.filter(s => s.teacherId === selected._id);

    return (
      <div className="space-y-5">
        <PageHeader title={selected.name} breadcrumbs={["Home", "Employees", selected.employeeId]}
          actions={<Button variant="outline" onClick={() => setSelected(null)}>← Back</Button>} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <Card className="p-5">
            <div className="text-center">
              <Avatar name={selected.name} size={20} />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-3">{selected.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selected.role}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">{selected.employeeId}</p>
              <div className="mt-2"><Badge status={selected.status} /></div>
            </div>
            <div className="mt-4 space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              {[["Mobile", selected.mobileNo], ["Email", selected.email], ["Salary", fmtCurrency(selected.monthlySalary)], ["Joined", fmt(selected.dateOfJoining)], ["Blood Group", selected.bloodGroup || '-']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs"><span className="text-gray-500 dark:text-gray-400">{k}</span><span className="font-medium text-gray-800 dark:text-gray-200">{v}</span></div>
              ))}
            </div>
          </Card>
          <div className="lg:col-span-3 space-y-4">
            <Tabs tabs={[{ value: 'info', label: 'Personal' }, { value: 'classes', label: 'Classes' }, { value: 'payroll', label: 'Payroll' }, { value: 'leaves', label: 'Leaves' }]} activeTab={empTab} onChange={setEmpTab} />
            {empTab === 'info' && <Card className="p-5"><div className="grid grid-cols-2 gap-3 text-sm">{[["Gender", selected.gender], ["DOB", fmt(selected.dateOfBirth)], ["Education", selected.education || '-'], ["Experience", selected.experience || '-'], ["Religion", selected.religion || '-'], ["Address", selected.homeAddress || '-']].map(([k, v]) => <div key={k}><p className="text-xs text-gray-400 dark:text-gray-500">{k}</p><p className="font-medium text-gray-900 dark:text-gray-100">{v}</p></div>)}</div></Card>}
            {empTab === 'classes' && <Card className="p-5"><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Assigned Classes & Subjects</h4><div className="space-y-2">{empClasses.map(c => <div key={c._id} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm font-medium text-indigo-700 dark:text-indigo-300">🏫 Class Teacher: {c.displayName}</div>)}{empSubjects.map(s => { const c = classes.find(cl => cl._id === s.classId); return <div key={s._id} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-300">📚 {s.name} — {c?.displayName}</div>; })}{empClasses.length + empSubjects.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm">No assignments yet</p>}</div></Card>}
            {empTab === 'payroll' && <Card className="p-5"><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Payroll History</h4><Table columns={[{ header: "Month", render: r => `${MONTHS[r.month - 1]} ${r.year}` }, { header: "Basic", render: r => fmtCurrency(r.basicSalary) }, { header: "Present", key: "daysPresent" }, { header: "Absent", key: "daysAbsent" }, { header: "Deductions", render: r => fmtCurrency(r.deductions) }, { header: "Net Salary", render: r => <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtCurrency(r.netSalary)}</span> }, { header: "Status", render: r => <Badge status={r.status} /> }]} data={empPayroll} emptyMsg="No payroll records" /></Card>}
            {empTab === 'leaves' && <Card className="p-5"><h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Leave History</h4><Table columns={[{ header: "Type", key: "leaveType" }, { header: "From", render: r => fmt(r.fromDate) }, { header: "To", render: r => fmt(r.toDate) }, { header: "Days", key: "totalDays" }, { header: "Reason", key: "reason" }, { header: "Status", render: r => <Badge status={r.status} /> }]} data={empLeaves} emptyMsg="No leave records" /></Card>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Employees" subtitle={`${filtered.length} employees`} breadcrumbs={["Home", "Employees"]}
        actions={<Button onClick={() => setShowModal(true)}>+ Add Employee</Button>} />
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48"><SearchBar value={search} onChange={setSearch} placeholder="Search employees..." /></div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <option value="">All Roles</option>
            <option value="teacher">Teacher</option>
            <option value="principal">Principal</option>
          </select>
        </div>
      </Card>
      <Card>
        <Table columns={[
          { header: "Employee", render: r => <div className="flex items-center gap-2"><Avatar name={r.name} size={8} /><div><p className="font-medium text-sm text-gray-900 dark:text-gray-100">{r.name}</p><p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{r.employeeId}</p></div></div> },
          { header: "Role", render: r => <span className="capitalize font-medium text-sm text-gray-900 dark:text-gray-100">{r.role}</span> },
          { header: "Mobile", key: "mobileNo" },
          { header: "Joined", render: r => fmt(r.dateOfJoining) },
          { header: "Salary", render: r => fmtCurrency(r.monthlySalary) },
          { header: "Status", render: r => <Badge status={r.status} /> },
          { header: "Actions", render: r => <Button size="sm" variant="outline" onClick={() => { setSelected(r); setEmpTab('info'); }}>View</Button> },
        ]} data={filtered} onRowClick={r => { setSelected(r); setEmpTab('info'); }} emptyMsg="No employees found" />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Employee" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Full Name" required value={form.name} onChange={e => f('name', e.target.value)} /></div>
          <Input label="Email *" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
          <Input label="Mobile No *" value={form.mobileNo} onChange={e => f('mobileNo', e.target.value)} maxLength={10} />
          <Input label="Monthly Salary *" type="number" value={form.monthlySalary} onChange={e => f('monthlySalary', e.target.value)} />
          <Input label="Date of Joining *" type="date" value={form.dateOfJoining} onChange={e => f('dateOfJoining', e.target.value)} />
          <Select label="Role *" value={form.role} onChange={e => f('role', e.target.value)} options={[{ value: 'teacher', label: 'Teacher' }, { value: 'principal', label: 'Principal' }]} />
          <Select label="Gender" value={form.gender} onChange={e => f('gender', e.target.value)} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} />
          <Select label="Blood Group" value={form.bloodGroup} onChange={e => f('bloodGroup', e.target.value)} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(b => ({ value: b, label: b }))} />
          <div className="col-span-2"><Textarea label="Home Address" value={form.homeAddress} onChange={e => f('homeAddress', e.target.value)} rows={2} /></div>
        </div>
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Employee</Button>
        </div>
      </Modal>
    </div>
  );
};

// ==================== CLASSROOMS VIEW ====================
const ClassroomsView = () => {
  const { data, refreshData, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ className: "", section: "", monthlyFees: "", classTeacherId: "", capacity: "" });
  const CLASS_NAMES = [
    { name: "Playgroup", order: 0 }, { name: "Nursery", order: 1 }, { name: "Jr. KG", order: 2 }, { name: "Sr. KG", order: 3 },
    { name: "Class 1", order: 4 }, { name: "Class 2", order: 5 }, { name: "Class 3", order: 6 }, { name: "Class 4", order: 7 },
    { name: "Class 5", order: 8 }, { name: "Class 6", order: 9 }, { name: "Class 7", order: 10 }, { name: "Class 8", order: 11 },
  ];
  const teachers = data.employees.filter(e => e.role === 'teacher' && e.status === 'active');
  const sorted = [...data.classrooms].sort((a, b) => a.order - b.order);

  const handleCreate = () => {
    const sel = CLASS_NAMES.find(c => c.name === form.className);
    if (!form.className || !form.monthlyFees) return showToast("Class name and fees required", "error");
    const displayName = form.section ? `${form.className} - ${form.section}` : form.className;
    const cls = { _id: `cls${Date.now()}`, displayName, ...form, order: sel?.order || 99, isActive: true, academicYear: "ay1", monthlyFees: Number(form.monthlyFees) };
    StorageAPI.create('classrooms', cls); refreshData();
    showToast(`${displayName} created successfully!`, "success");
    setShowModal(false); setForm({ className: "", section: "", monthlyFees: "", classTeacherId: "", capacity: "" });
  };

  const toggleActive = (cls) => {
    StorageAPI.update('classrooms', cls._id, { isActive: !cls.isActive }); refreshData();
    showToast(`${cls.displayName} ${cls.isActive ? 'deactivated' : 'activated'}`, "success");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Classrooms" subtitle={`${sorted.length} classes configured`} breadcrumbs={["Home", "Classrooms"]}
        actions={<Button onClick={() => setShowModal(true)}>+ Add Classroom</Button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map(cls => {
          const teacher = data.employees.find(e => e._id === cls.classTeacherId);
          const studentCount = data.students.filter(s => s.classId === cls._id && s.status === 'Approved').length;
          return (
            <Card key={cls._id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-xl">🏫</div>
                <Badge status={cls.isActive ? 'active' : 'inactive'} label={cls.isActive ? 'Active' : 'Inactive'} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{cls.displayName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teacher?.name || 'No class teacher'}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-gray-400 dark:text-gray-500">Students</p><p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{studentCount}</p></div>
                <div><p className="text-gray-400 dark:text-gray-500">Monthly Fee</p><p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{fmtCurrency(cls.monthlyFees)}</p></div>
              </div>
              <button onClick={() => toggleActive(cls)} className={`mt-3 w-full text-xs py-1.5 rounded-lg border transition-colors ${cls.isActive ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                {cls.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </Card>
          );
        })}
      </div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Classroom" size="md">
        <div className="space-y-4">
          <Select label="Class Name *" value={form.className} onChange={e => setForm(p => ({ ...p, className: e.target.value }))} options={CLASS_NAMES.map(c => ({ value: c.name, label: c.name }))} />
          <Select label="Section" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} options={[{ value: '', label: 'No Section' }, { value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'D', label: 'D' }]} />
          <Input label="Monthly Tuition Fees *" type="number" value={form.monthlyFees} onChange={e => setForm(p => ({ ...p, monthlyFees: e.target.value }))} placeholder="e.g. 3500" />
          <Select label="Class Teacher" value={form.classTeacherId} onChange={e => setForm(p => ({ ...p, classTeacherId: e.target.value }))} options={teachers.map(t => ({ value: t._id, label: t.name }))} />
          <Input label="Capacity" type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Classroom</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== SUBJECTS VIEW ====================
const SubjectsView = () => {
  const { data, refreshData, showToast } = useApp();
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [rows, setRows] = useState([{ name: "", totalMarks: "100", teacherId: "" }]);
  const [selClass, setSelClass] = useState("");
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);
  const teachers = data.employees.filter(e => e.role === 'teacher' && e.status === 'active');
  const filtered = data.subjects.filter(s => !classFilter || s.classId === classFilter);

  const handleAssign = () => {
    if (!selClass) return showToast("Please select a class", "error");
    if (!rows.every(r => r.name && r.totalMarks)) return showToast("Fill all subject details", "error");
    rows.forEach(r => {
      const sub = { _id: `sub${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: r.name, classId: selClass, teacherId: r.teacherId, totalMarks: Number(r.totalMarks), academicYear: "ay1", isActive: true };
      StorageAPI.create('subjects', sub);
    });
    refreshData(); showToast(`${rows.length} subject(s) assigned!`, "success");
    setShowModal(false); setRows([{ name: "", totalMarks: "100", teacherId: "" }]); setSelClass("");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Subjects" subtitle={`${filtered.length} subjects`} breadcrumbs={["Home", "Subjects"]}
        actions={<Button onClick={() => setShowModal(true)}>+ Assign Subjects</Button>} />
      <Card className="p-4">
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
        </select>
      </Card>
      <Card>
        <Table columns={[
          { header: "Subject", render: r => <span className="font-semibold text-gray-900 dark:text-gray-100">{r.name}</span> },
          { header: "Class", render: r => { const c = classes.find(cl => cl._id === r.classId); return c?.displayName || '-'; } },
          { header: "Teacher", render: r => { const t = teachers.find(t => t._id === r.teacherId); return t?.name || 'Not assigned'; } },
          { header: "Total Marks", render: r => <span className="font-bold text-indigo-600 dark:text-indigo-400">{r.totalMarks}</span> },
          { header: "Status", render: r => <Badge status={r.isActive ? 'active' : 'inactive'} label={r.isActive ? 'Active' : 'Inactive'} /> },
          {
            header: "Actions", render: r => (
              <button onClick={() => { StorageAPI.update('subjects', r._id, { isActive: !r.isActive }); refreshData(); }} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">Toggle</button>
            )
          },
        ]} data={filtered} emptyMsg="No subjects found" />
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Subjects to Class" size="lg">
        <div className="space-y-4">
          <Select label="Select Class *" value={selClass} onChange={e => setSelClass(e.target.value)} options={classes.map(c => ({ value: c._id, label: c.displayName }))} />
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              <div className="col-span-5">Subject Name</div><div className="col-span-3">Total Marks</div><div className="col-span-3">Assign Teacher</div><div className="col-span-1"></div>
            </div>
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><Input value={row.name} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g. Mathematics" /></div>
                <div className="col-span-3"><Input type="number" value={row.totalMarks} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, totalMarks: e.target.value } : x))} /></div>
                <div className="col-span-3">
                  <select value={row.teacherId} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, teacherId: e.target.value } : x))} className="w-full px-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="">Select...</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="col-span-1 flex justify-center">{rows.length > 1 && <button onClick={() => setRows(r => r.filter((_, j) => j !== i))} className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">✕</button>}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setRows(r => [...r, { name: "", totalMarks: "100", teacherId: "" }])} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+ Add More</button>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleAssign}>Assign Subjects</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== EXAMS & MARKS VIEW ====================
const ExamsView = ({ userRole }) => {
  const { data, refreshData, showToast } = useApp();
  const [tab, setTab] = useState("exams");
  const [showModal, setShowModal] = useState(false);
  const [marksClass, setMarksClass] = useState("");
  const [marksSub, setMarksSub] = useState("");
  const [marksExam, setMarksExam] = useState("");
  const [marksData, setMarksData] = useState([]);
  const [form, setForm] = useState({ classId: "", subjectId: "", examType: "UnitTest1", name: "Unit Test 1", totalMarks: "", examDate: "", description: "" });
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  const EXAM_TYPES = [
    { value: "UnitTest1", label: "Unit Test 1" }, { value: "UnitTest2", label: "Unit Test 2" },
    { value: "MidTerm", label: "Mid Term Exam" }, { value: "FinalExam", label: "Final Exam" },
    { value: "Project", label: "Project" }, { value: "Other", label: "Other" },
  ];

  const getAvailableMarks = (classId, subjectId, excludeExamId = null) => {
    const sub = data.subjects.find(s => s._id === subjectId);
    if (!sub) return 0;
    const existing = data.exams.filter(e => e.classId === classId && e.subjectId === subjectId && e._id !== excludeExamId);
    const used = existing.reduce((sum, e) => sum + (e.totalMarks || 0), 0);
    return sub.totalMarks - used;
  };

  const handleCreateExam = () => {
    if (!form.classId || !form.subjectId || !form.totalMarks || !form.examDate) return showToast("Fill required fields", "error");
    const avail = getAvailableMarks(form.classId, form.subjectId);
    if (Number(form.totalMarks) > avail) return showToast(`Cannot exceed available marks: ${avail}`, "error");
    const exam = { _id: `exam${Date.now()}`, ...form, totalMarks: Number(form.totalMarks), academicYear: "ay1" };
    StorageAPI.create('exams', exam); refreshData();
    showToast("Exam created!", "success"); setShowModal(false);
    setForm({ classId: "", subjectId: "", examType: "UnitTest1", name: "Unit Test 1", totalMarks: "", examDate: "", description: "" });
  };

  const loadMarksEntry = () => {
    if (!marksClass || !marksSub || !marksExam) return showToast("Select class, subject and exam", "error");
    const classStudents = data.students.filter(s => s.classId === marksClass && s.status === 'Approved').sort((a, b) => a.rollNumber - b.rollNumber);
    const existingMarks = data.marks.filter(m => m.examId === marksExam);
    setMarksData(classStudents.map(s => {
      const ex = existingMarks.find(m => m.studentId === s._id);
      return { studentId: s._id, student: s, marksObtained: ex?.marksObtained ?? '', isAbsent: ex?.isAbsent || false, remarks: ex?.remarks || '' };
    }));
  };

  const saveMarks = () => {
    const exam = data.exams.find(e => e._id === marksExam);
    // Remove old marks for this exam
    const allMarks = StorageAPI.getAll('marks');
    const filtered = allMarks.filter(m => m.examId !== marksExam);
    const newMarks = marksData.map(m => ({
      _id: `mrk${Date.now()}${Math.random().toString(36).slice(2, 6)}`, examId: marksExam, studentId: m.studentId,
      subjectId: marksSub, classId: marksClass, marksObtained: m.isAbsent ? 0 : Number(m.marksObtained),
      isAbsent: m.isAbsent, remarks: m.remarks, academicYear: "ay1",
      grade: m.isAbsent ? 'F' : calcGrade(Number(m.marksObtained), exam?.totalMarks || 100)
    }));
    StorageAPI.setAll('marks', [...filtered, ...newMarks]); refreshData();
    showToast("Marks saved successfully!", "success");
  };

  const filteredSubjects = data.subjects.filter(s => !form.classId || s.classId === form.classId);
  const marksSubjects = data.subjects.filter(s => !marksClass || s.classId === marksClass);
  const marksExams = data.exams.filter(e => (!marksClass || e.classId === marksClass) && (!marksSub || e.subjectId === marksSub));

  return (
    <div className="space-y-5">
      <PageHeader title="Exams & Marks" breadcrumbs={["Home", "Exams & Marks"]}
        actions={userRole !== 'parent' && <Button onClick={() => setShowModal(true)}>+ Create Exam</Button>} />
      <Tabs tabs={[{ value: 'exams', label: 'Exams List' }, { value: 'marks', label: 'Enter Marks' }, { value: 'results', label: 'Results' }]} activeTab={tab} onChange={setTab} />

      {tab === 'exams' && (
        <Card>
          <Table columns={[
            { header: "Exam Name", render: r => <span className="font-semibold text-gray-900 dark:text-gray-100">{r.name}</span> },
            { header: "Class", render: r => { const c = classes.find(cl => cl._id === r.classId); return c?.displayName || '-'; } },
            { header: "Subject", render: r => { const s = data.subjects.find(s => s._id === r.subjectId); return s?.name || '-'; } },
            { header: "Type", key: "examType" },
            { header: "Total Marks", render: r => <span className="font-bold text-indigo-600 dark:text-indigo-400">{r.totalMarks}</span> },
            { header: "Date", render: r => fmt(r.examDate) },
          ]} data={data.exams} emptyMsg="No exams created yet" />
        </Card>
      )}

      {tab === 'marks' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <select value={marksClass} onChange={e => { setMarksClass(e.target.value); setMarksSub(""); setMarksExam(""); setMarksData([]); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
              </select>
              <select value={marksSub} onChange={e => { setMarksSub(e.target.value); setMarksExam(""); setMarksData([]); }} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Select Subject</option>
                {marksSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select value={marksExam} onChange={e => setMarksExam(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Select Exam</option>
                {marksExams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <Button onClick={loadMarksEntry}>Load Students</Button>
            </div>
          </Card>
          {marksData.length > 0 && (
            <Card>
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div><h4 className="font-bold text-gray-900 dark:text-gray-100">Enter Marks</h4><p className="text-xs text-gray-500 dark:text-gray-400">Out of {data.exams.find(e => e._id === marksExam)?.totalMarks} marks</p></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setMarksData(m => m.map(x => ({ ...x, isAbsent: false })))}>All Present</Button>
                  <Button size="sm" onClick={saveMarks}>💾 Save Marks</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Roll</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Marks</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Absent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Remarks</th>
                  </tr></thead>
                  <tbody>
                    {marksData.map((m, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{m.student.rollNumber}</td>
                        <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar name={`${m.student.firstName} ${m.student.lastName}`} size={6} /><span className="font-medium text-gray-900 dark:text-gray-100">{m.student.firstName} {m.student.lastName}</span></div></td>
                        <td className="px-4 py-2"><input type="number" value={m.marksObtained} disabled={m.isAbsent} onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, marksObtained: e.target.value } : x))} max={data.exams.find(e => e._id === marksExam)?.totalMarks} className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-center text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" /></td>
                        <td className="px-4 py-2"><input type="checkbox" checked={m.isAbsent} onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, isAbsent: e.target.checked, marksObtained: e.target.checked ? '' : x.marksObtained } : x))} className="w-4 h-4" /></td>
                        <td className="px-4 py-2"><input value={m.remarks} onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, remarks: e.target.value } : x))} className="w-32 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700" placeholder="Optional" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'results' && (
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Results Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.exams.slice(0, 6).map(exam => {
              const examMarks = data.marks.filter(m => m.examId === exam._id);
              const cls = classes.find(c => c._id === exam.classId);
              const sub = data.subjects.find(s => s._id === exam.subjectId);
              const avg = examMarks.filter(m => !m.isAbsent).length > 0 ? Math.round(examMarks.filter(m => !m.isAbsent).reduce((s, m) => s + m.marksObtained, 0) / examMarks.filter(m => !m.isAbsent).length) : 0;
              return (
                <div key={exam._id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{exam.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{cls?.displayName} · {sub?.name}</p>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Students: {examMarks.length}</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Avg: {avg}/{exam.totalMarks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Exam" size="md">
        <div className="space-y-4">
          <Select label="Class *" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, subjectId: "" }))} options={classes.map(c => ({ value: c._id, label: c.displayName }))} />
          <Select label="Subject *" value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} options={filteredSubjects.map(s => ({ value: s._id, label: s.name }))} />
          <Select label="Exam Type *" value={form.examType} onChange={e => setForm(p => ({ ...p, examType: e.target.value, name: EXAM_TYPES.find(t => t.value === e.target.value)?.label || '' }))} options={EXAM_TYPES} />
          <Input label="Exam Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <div className="space-y-1">
            <Input label="Total Marks *" type="number" value={form.totalMarks} onChange={e => setForm(p => ({ ...p, totalMarks: e.target.value }))} />
            {form.classId && form.subjectId && <p className="text-xs text-indigo-600 dark:text-indigo-400">Available marks: {getAvailableMarks(form.classId, form.subjectId)}</p>}
          </div>
          <Input label="Exam Date *" type="date" value={form.examDate} onChange={e => setForm(p => ({ ...p, examDate: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreateExam}>Create Exam</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== ATTENDANCE VIEW ====================
const AttendanceView = ({ type = "student" }) => {
  const { data, refreshData, showToast } = useApp();
  const [selClass, setSelClass] = useState("");
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0]);
  const [attData, setAttData] = useState([]);
  const [saved, setSaved] = useState(false);
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  const loadAttendance = () => {
    if (type === 'student') {
      if (!selClass) return showToast("Select a class", "error");
      const students = data.students.filter(s => s.classId === selClass && s.status === 'Approved').sort((a, b) => a.rollNumber - b.rollNumber);
      const existing = data.attendance.filter(a => a.classId === selClass && a.date === selDate);
      setAttData(students.map(s => {
        const ex = existing.find(a => a.studentId === s._id);
        return { id: s._id, name: `${s.firstName} ${s.lastName}`, rollNo: s.rollNumber, status: ex?.status || 'Present', remark: ex?.remark || '' };
      }));
    } else {
      const existing = (data.employeeAttendance || []).filter(a => a.date === selDate);
      setAttData(data.employees.filter(e => e.status === 'active').map(e => {
        const ex = existing.find(a => a.employeeId === e._id);
        return { id: e._id, name: e.name, role: e.role, status: ex?.status || 'Present', remark: ex?.remark || '' };
      }));
    }
    setSaved(false);
  };

  const saveAttendance = () => {
    if (type === 'student') {
      const allAtt = StorageAPI.getAll('attendance');
      const filtered = allAtt.filter(a => !(a.classId === selClass && a.date === selDate));
      const records = attData.map(a => ({ _id: `att${Date.now()}${Math.random().toString(36).slice(2, 6)}`, studentId: a.id, classId: selClass, date: selDate, status: a.status, remark: a.remark, academicYear: "ay1" }));
      StorageAPI.setAll('attendance', [...filtered, ...records]);
    } else {
      const allEmpAtt = StorageAPI.getAll('employeeAttendance') || [];
      const filtered = allEmpAtt.filter(a => a.date !== selDate);
      const records = attData.map(a => ({ _id: `eatt${Date.now()}${Math.random().toString(36).slice(2, 6)}`, employeeId: a.id, date: selDate, status: a.status, remark: a.remark, academicYear: "ay1" }));
      StorageAPI.setAll('employeeAttendance', [...filtered, ...records]);
    }
    refreshData(); setSaved(true); showToast("Attendance saved!", "success");
  };

  const STATUS_OPTS = type === 'student' ? ['Present', 'Absent', 'Late', 'HalfDay', 'Holiday'] : ['Present', 'Absent', 'Late', 'HalfDay', 'OnLeave', 'Holiday'];

  return (
    <div className="space-y-5">
      <PageHeader title={type === 'student' ? 'Student Attendance' : 'Staff Attendance'} breadcrumbs={["Home", type === 'student' ? 'Student Attendance' : 'Staff Attendance']} />
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {type === 'student' && (
            <select value={selClass} onChange={e => setSelClass(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
          )}
          <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
          <Button onClick={loadAttendance}>Load</Button>
          {attData.length > 0 && <>
            <Button variant="secondary" size="sm" onClick={() => setAttData(d => d.map(x => ({ ...x, status: 'Present' })))}>✅ All Present</Button>
            <Button variant="secondary" size="sm" onClick={() => setAttData(d => d.map(x => ({ ...x, status: 'Absent' })))}>❌ All Absent</Button>
          </>}
        </div>
      </Card>
      {attData.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div><h4 className="font-bold text-gray-900 dark:text-gray-100">Attendance for {fmt(selDate)}</h4><p className="text-xs text-gray-500 dark:text-gray-400">{attData.length} {type === 'student' ? 'students' : 'employees'} · Present: {attData.filter(a => a.status === 'Present').length}</p></div>
            <Button onClick={saveAttendance}>{saved ? '✓ Saved' : '💾 Save All'}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                {type === 'student' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Roll</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Name</th>
                {type === 'employee' && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Role</th>}
                {STATUS_OPTS.map(s => <th key={s} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400">{s}</th>)}
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Remark</th>
              </tr></thead>
              <tbody>
                {attData.map((a, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    {type === 'student' && <td className="px-4 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">{a.rollNo}</td>}
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{a.name}</td>
                    {type === 'employee' && <td className="px-4 py-2 capitalize text-gray-500 dark:text-gray-400">{a.role}</td>}
                    {STATUS_OPTS.map(s => (
                      <td key={s} className="px-3 py-2 text-center">
                        <input type="radio" name={`att-${i}`} checked={a.status === s} onChange={() => setAttData(d => d.map((x, j) => j === i ? { ...x, status: s } : x))} className="w-4 h-4" />
                      </td>
                    ))}
                    <td className="px-4 py-2"><input value={a.remark} onChange={e => setAttData(d => d.map((x, j) => j === i ? { ...x, remark: e.target.value } : x))} className="w-28 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Optional" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==================== FEES VIEW ====================
const FeesView = ({ userRole }) => {
  const { data, refreshData, showToast } = useApp();
  const [tab, setTab] = useState("collect");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [selFee, setSelFee] = useState(null);
  const [payForm, setPayForm] = useState({ amountPaid: "", paymentMode: "Cash", transactionId: "", notes: "" });
  const [genForm, setGenForm] = useState({ studentId: "", month: new Date().getMonth() + 1, year: 2024, tuitionFee: "", transportFee: "0", activityFee: "0", otherFee: "0", dueDate: "" });
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  const filtered = data.fees.filter(fee => {
    const student = data.students.find(s => s._id === fee.studentId);
    const name = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
    const q = search.toLowerCase();
    return (!q || name.includes(q) || student?.admissionNo?.includes(q)) &&
      (!classFilter || fee.classId === classFilter) && (!monthFilter || fee.month === Number(monthFilter)) && (!statusFilter || fee.status === statusFilter);
  });

  const handleCollectFee = () => {
    if (!payForm.amountPaid) return showToast("Enter amount", "error");
    const receipt = { _id: `pay${Date.now()}`, feeId: selFee._id, studentId: selFee.studentId, receiptNo: genId("RCP", data.feePayments), amountPaid: Number(payForm.amountPaid), paymentDate: new Date().toISOString().split('T')[0], ...payForm, academicYear: "ay1" };
    StorageAPI.create('feePayments', receipt);
    StorageAPI.update('fees', selFee._id, { status: Number(payForm.amountPaid) >= selFee.finalAmount ? 'Paid' : 'PartiallyPaid' });
    refreshData(); showToast(`Payment recorded! Receipt: ${receipt.receiptNo}`, "success");
    setShowPayModal(false); setPayForm({ amountPaid: "", paymentMode: "Cash", transactionId: "", notes: "" });
  };

  const handleGenerateFee = () => {
    if (!genForm.studentId || !genForm.tuitionFee) return showToast("Fill required fields", "error");
    const student = data.students.find(s => s._id === genForm.studentId);
    if (!student) return;
    const total = Number(genForm.tuitionFee) + Number(genForm.transportFee) + Number(genForm.activityFee) + Number(genForm.otherFee);
    const fee = { _id: `fee${Date.now()}`, ...genForm, classId: student.classId, totalAmount: total, finalAmount: total, status: "Pending", academicYear: "ay1" };
    StorageAPI.create('fees', fee); refreshData();
    showToast("Fee record created!", "success"); setShowGenModal(false);
    setGenForm({ studentId: "", month: new Date().getMonth() + 1, year: 2024, tuitionFee: "", transportFee: "0", activityFee: "0", otherFee: "0", dueDate: "" });
  };

  const summary = {
    total: data.fees.reduce((s, f) => s + (f.finalAmount || 0), 0),
    collected: data.fees.filter(f => f.status === 'Paid').reduce((s, f) => s + (f.finalAmount || 0), 0),
    pending: data.fees.filter(f => f.status !== 'Paid' && f.status !== 'Waived').reduce((s, f) => s + (f.finalAmount || 0), 0),
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Fee Management" breadcrumbs={["Home", "Fees"]}
        actions={userRole !== 'parent' && <Button onClick={() => setShowGenModal(true)}>+ Generate Fee</Button>} />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Expected" value={fmtCurrency(summary.total)} icon="💳" color="indigo" />
        <StatCard label="Collected" value={fmtCurrency(summary.collected)} icon="✅" color="green" />
        <StatCard label="Pending" value={fmtCurrency(summary.pending)} icon="⚠️" color="red" />
      </div>
      {userRole !== 'parent' && <Tabs tabs={[{ value: 'collect', label: 'Fee Collection' }, { value: 'defaulters', label: 'Defaulters' }, { value: 'reports', label: 'Reports' }]} activeTab={tab} onChange={setTab} />}

      {(tab === 'collect' || userRole === 'parent') && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-40"><SearchBar value={search} onChange={setSearch} placeholder="Search student..." /></div>
              <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
              </select>
              <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">All Months</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">All Status</option>
                {["Pending", "Paid", "Overdue", "PartiallyPaid"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </Card>
          <Card>
            <Table columns={[
              { header: "Student", render: r => { const s = data.students.find(st => st._id === r.studentId); return s ? <div><p className="font-medium text-sm text-gray-900 dark:text-gray-100">{s.firstName} {s.lastName}</p><p className="text-xs text-gray-400 dark:text-gray-500">{s.admissionNo}</p></div> : '-'; } },
              { header: "Class", render: r => { const c = classes.find(cl => cl._id === r.classId); return c?.displayName || '-'; } },
              { header: "Month", render: r => `${MONTHS[r.month - 1]} ${r.year}` },
              { header: "Amount", render: r => fmtCurrency(r.finalAmount) },
              { header: "Status", render: r => <Badge status={r.status} /> },
              { header: "Due Date", render: r => fmt(r.dueDate) },
              {
                header: "Actions", render: r => (
                  <div className="flex gap-1">
                    {userRole !== 'parent' && r.status !== 'Paid' && r.status !== 'Waived' && (
                      <Button size="sm" onClick={() => { setSelFee(r); setPayForm({ amountPaid: r.finalAmount, paymentMode: "Cash", transactionId: "", notes: "" }); setShowPayModal(true); }}>Collect</Button>
                    )}
                    {r.status === 'Paid' && <Button size="sm" variant="outline">Receipt</Button>}
                  </div>
                )
              },
            ]} data={filtered} emptyMsg="No fee records" />
          </Card>
        </div>
      )}

      {tab === 'defaulters' && (
        <Card>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700"><h3 className="font-bold text-gray-900 dark:text-gray-100">Fee Defaulters</h3></div>
          <Table columns={[
            { header: "Student", render: r => { const s = data.students.find(st => st._id === r.studentId); return s ? `${s.firstName} ${s.lastName}` : '-'; } },
            { header: "Class", render: r => { const c = classes.find(cl => cl._id === r.classId); return c?.displayName || '-'; } },
            { header: "Month", render: r => `${MONTHS[r.month - 1]} ${r.year}` },
            { header: "Amount Due", render: r => <span className="text-red-600 dark:text-red-400 font-bold">{fmtCurrency(r.finalAmount)}</span> },
            { header: "Status", render: r => <Badge status={r.status} /> },
          ]} data={data.fees.filter(f => f.status === 'Pending' || f.status === 'Overdue')} emptyMsg="No defaulters! All fees paid." />
        </Card>
      )}

      {tab === 'reports' && (
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Monthly Collection Report</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={MONTHS.map((m, i) => ({ month: m, collected: data.fees.filter(f => f.month === i + 1 && f.status === 'Paid').reduce((s, f) => s + f.finalAmount, 0), pending: data.fees.filter(f => f.month === i + 1 && f.status !== 'Paid').reduce((s, f) => s + f.finalAmount, 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} stroke="#9CA3AF" />
              <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
              <Legend wrapperStyle={{ color: '#6B7280' }} />
              <Bar dataKey="collected" fill="#10B981" name="Collected" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#EF4444" name="Pending" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Modal isOpen={showPayModal && !!selFee} onClose={() => setShowPayModal(false)} title="Collect Fee Payment" size="md">
        {selFee && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 text-sm">
              {[["Tuition Fee", fmtCurrency(selFee.tuitionFee)], ["Transport Fee", fmtCurrency(selFee.transportFee)], ["Activity Fee", fmtCurrency(selFee.activityFee)], selFee.lateFine > 0 && ["Late Fine", fmtCurrency(selFee.lateFine)]].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">{k}</span><span className="font-medium text-gray-900 dark:text-gray-100">{v}</span></div>
              ))}
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2"><span className="font-bold text-gray-900 dark:text-gray-100">Total Due</span><span className="font-bold text-lg text-red-600 dark:text-red-400">{fmtCurrency(selFee.finalAmount)}</span></div>
            </div>
            <Input label="Amount to Pay *" type="number" value={payForm.amountPaid} onChange={e => setPayForm(p => ({ ...p, amountPaid: e.target.value }))} />
            <Select label="Payment Mode" value={payForm.paymentMode} onChange={e => setPayForm(p => ({ ...p, paymentMode: e.target.value }))} options={["Cash", "Cheque", "Online", "UPI", "BankTransfer"].map(m => ({ value: m, label: m }))} />
            {payForm.paymentMode !== 'Cash' && <Input label="Transaction ID" value={payForm.transactionId} onChange={e => setPayForm(p => ({ ...p, transactionId: e.target.value }))} />}
            <Textarea label="Notes" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowPayModal(false)}>Cancel</Button>
              <Button variant="success" onClick={handleCollectFee}>💳 Generate Receipt</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Generate Fee Record" size="md">
        <div className="space-y-4">
          <Select label="Student *" value={genForm.studentId} onChange={e => setGenForm(p => ({ ...p, studentId: e.target.value }))} options={data.students.filter(s => s.status === 'Approved').map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName} (${s.admissionNo})` }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Month *" value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: Number(e.target.value) }))} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            <Input label="Year *" type="number" value={genForm.year} onChange={e => setGenForm(p => ({ ...p, year: Number(e.target.value) }))} />
          </div>
          <Input label="Tuition Fee *" type="number" value={genForm.tuitionFee} onChange={e => setGenForm(p => ({ ...p, tuitionFee: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Transport Fee" type="number" value={genForm.transportFee} onChange={e => setGenForm(p => ({ ...p, transportFee: e.target.value }))} />
            <Input label="Activity Fee" type="number" value={genForm.activityFee} onChange={e => setGenForm(p => ({ ...p, activityFee: e.target.value }))} />
            <Input label="Other Fee" type="number" value={genForm.otherFee} onChange={e => setGenForm(p => ({ ...p, otherFee: e.target.value }))} />
          </div>
          <Input label="Due Date" type="date" value={genForm.dueDate} onChange={e => setGenForm(p => ({ ...p, dueDate: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowGenModal(false)}>Cancel</Button>
            <Button onClick={handleGenerateFee}>Generate Fee</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== PAYROLL VIEW ====================
const PayrollView = () => {
  const { data, refreshData, showToast } = useApp();
  const [selEmployee, setSelEmployee] = useState("");
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear, setSelYear] = useState(2024);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({ bonus: "", paymentMode: "BankTransfer" });

  const filtered = data.payroll.filter(p => !selEmployee || p.employeeId === selEmployee);

  const handleGenerate = () => {
    if (!selEmployee) return showToast("Select employee", "error");
    const emp = data.employees.find(e => e._id === selEmployee);
    if (!emp) return;
    const existing = data.payroll.find(p => p.employeeId === selEmployee && p.month === selMonth && p.year === selYear);
    if (existing) return showToast("Payroll already generated for this month", "error");
    const workingDays = 26; const daysPresent = 24; const daysAbsent = 2;
    const perDay = emp.monthlySalary / workingDays;
    const deductions = Math.round(daysAbsent * perDay);
    const bonus = Number(genForm.bonus) || 0;
    const net = emp.monthlySalary - deductions + bonus;
    const payroll = { _id: `pr${Date.now()}`, employeeId: selEmployee, month: selMonth, year: selYear, basicSalary: emp.monthlySalary, daysPresent, daysAbsent, daysLeave: 0, deductions, bonus, netSalary: net, status: "Pending", paymentMode: genForm.paymentMode, academicYear: "ay1" };
    StorageAPI.create('payroll', payroll); refreshData();
    showToast("Payroll generated!", "success"); setShowGenModal(false);
  };

  const markPaid = (pr) => {
    StorageAPI.update('payroll', pr._id, { status: 'Paid', paymentDate: new Date().toISOString().split('T')[0] }); refreshData();
    showToast("Marked as paid!", "success");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Payroll Management" breadcrumbs={["Home", "Payroll"]}
        actions={<Button onClick={() => setShowGenModal(true)}>+ Generate Payroll</Button>} />
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <select value={selEmployee} onChange={e => setSelEmployee(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            <option value="">All Employees</option>
            {data.employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
          <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </Card>
      <Card>
        <Table columns={[
          { header: "Employee", render: r => { const e = data.employees.find(emp => emp._id === r.employeeId); return e ? <div className="flex items-center gap-2"><Avatar name={e.name} size={7} /><span className="font-medium text-sm">{e.name}</span></div> : '-'; } },
          { header: "Month", render: r => `${MONTHS[r.month - 1]} ${r.year}` },
          { header: "Basic", render: r => fmtCurrency(r.basicSalary) },
          { header: "Present", key: "daysPresent" }, { header: "Absent", key: "daysAbsent" },
          { header: "Deductions", render: r => <span className="text-red-500">-{fmtCurrency(r.deductions)}</span> },
          { header: "Bonus", render: r => r.bonus > 0 ? <span className="text-green-600">+{fmtCurrency(r.bonus)}</span> : '-' },
          { header: "Net Salary", render: r => <span className="font-bold text-emerald-600 text-sm">{fmtCurrency(r.netSalary)}</span> },
          { header: "Status", render: r => <Badge status={r.status} /> },
          { header: "Actions", render: r => r.status === 'Pending' ? <Button size="sm" variant="success" onClick={() => markPaid(r)}>Mark Paid</Button> : <Button size="sm" variant="outline">Payslip</Button> },
        ]} data={filtered} emptyMsg="No payroll records" />
      </Card>
      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Generate Payroll" size="sm">
        <div className="space-y-4">
          <Select label="Employee *" value={selEmployee} onChange={e => setSelEmployee(e.target.value)} options={data.employees.map(e => ({ value: e._id, label: e.name }))} />
          <Select label="Month *" value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
          <Input label="Bonus (optional)" type="number" value={genForm.bonus} onChange={e => setGenForm(p => ({ ...p, bonus: e.target.value }))} placeholder="0" />
          <Select label="Payment Mode" value={genForm.paymentMode} onChange={e => setGenForm(p => ({ ...p, paymentMode: e.target.value }))} options={["Cash", "BankTransfer", "Cheque"].map(m => ({ value: m, label: m }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowGenModal(false)}>Cancel</Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== HOMEWORK VIEW ====================
const HomeworkView = ({ userRole }) => {
  const { data, refreshData, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ classId: "", subjectId: "", title: "", description: "", dueDate: "" });
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);
  const filteredSubs = data.subjects.filter(s => !form.classId || s.classId === form.classId);

  const handleCreate = () => {
    if (!form.classId || !form.subjectId || !form.title || !form.dueDate) return showToast("Fill required fields", "error");
    const hw = { _id: `hw${Date.now()}`, ...form, teacherId: "emp1", academicYear: "ay1", createdAt: new Date().toISOString() };
    StorageAPI.create('homework', hw); refreshData();
    showToast("Homework assigned!", "success"); setShowModal(false);
    setForm({ classId: "", subjectId: "", title: "", description: "", dueDate: "" });
  };

  const sorted = [...data.homework].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-5">
      <PageHeader title="Homework" breadcrumbs={["Home", "Homework"]}
        actions={userRole !== 'parent' && <Button onClick={() => setShowModal(true)}>+ Assign Homework</Button>} />
      <Card>
        <div className="p-4 space-y-3">
          {sorted.map(hw => {
            const cls = classes.find(c => c._id === hw.classId);
            const sub = data.subjects.find(s => s._id === hw.subjectId);
            const isOverdue = new Date(hw.dueDate) < new Date();
            return (
              <div key={hw._id} className={`p-4 rounded-xl border ${isOverdue ? 'border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">{sub?.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{cls?.displayName}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{hw.title}</h4>
                    {hw.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{hw.description}</p>}
                  </div>
                  <div className="text-right text-xs"><p className="text-gray-400 dark:text-gray-500">Due Date</p><p className={`font-semibold ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{fmt(hw.dueDate)}</p></div>
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && <div className="text-center py-8 text-gray-400 dark:text-gray-500">📭 No homework assigned yet</div>}
        </div>
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Homework" size="md">
        <div className="space-y-4">
          <Select label="Class *" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, subjectId: "" }))} options={classes.map(c => ({ value: c._id, label: c.displayName }))} />
          <Select label="Subject *" value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} options={filteredSubs.map(s => ({ value: s._id, label: s.name }))} />
          <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Chapter 5 Exercise" />
          <Textarea label="Description / Instructions" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          <Input label="Due Date *" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Assign</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== TIMETABLE VIEW ====================
const TimetableView = () => {
  const { data } = useApp();
  const [selClass, setSelClass] = useState("cls3");
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);
  const tt = data.timetable.find(t => t.classId === selClass);
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-5">
      <PageHeader title="Timetable" breadcrumbs={["Home", "Timetable"]} />
      <Card className="p-4">
        <select value={selClass} onChange={e => setSelClass(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
        </select>
      </Card>
      {tt ? (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-600 dark:bg-indigo-700 text-white">
                <th className="px-4 py-3 text-left font-semibold">Period</th>
                {DAYS.filter(d => tt.schedule.find(s => s.day === d)).map(d => <th key={d} className="px-4 py-3 font-semibold">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map(p => (
                <tr key={p} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <div>Period {p}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{tt.schedule[0]?.periods.find(per => per.periodNo === p)?.startTime} - {tt.schedule[0]?.periods.find(per => per.periodNo === p)?.endTime}</div>
                  </td>
                  {DAYS.filter(d => tt.schedule.find(s => s.day === d)).map(day => {
                    const daySchedule = tt.schedule.find(s => s.day === day);
                    const period = daySchedule?.periods.find(per => per.periodNo === p);
                    const sub = period ? data.subjects.find(s => s._id === period.subjectId) : null;
                    const teacher = period ? data.employees.find(e => e._id === period.teacherId) : null;
                    return (
                      <td key={day} className="px-4 py-3 text-center">
                        {sub ? (
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"><p className="font-medium text-indigo-700 dark:text-indigo-300 text-xs">{sub.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{teacher?.name?.split(' ')[0]}</p></div>
                        ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-8 text-center text-gray-400"><p className="text-4xl mb-2">🗓️</p><p>No timetable configured for this class</p></Card>
      )}
    </div>
  );
};

// ==================== NOTICES VIEW ====================
const NoticesView = ({ userRole }) => {
  const { data, refreshData, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", targetRoles: ["parent"], priority: "Normal", publishDate: new Date().toISOString().split('T')[0], expiryDate: "" });

  const handleCreate = () => {
    if (!form.title || !form.content) return showToast("Fill required fields", "error");
    const notice = { _id: `ntc${Date.now()}`, ...form, createdBy: "usr1", academicYear: "ay1" };
    StorageAPI.create('notices', notice); refreshData();
    showToast("Notice published!", "success"); setShowModal(false);
    setForm({ title: "", content: "", targetRoles: ["parent"], priority: "Normal", publishDate: new Date().toISOString().split('T')[0], expiryDate: "" });
  };

  const handleDelete = (id) => {
    StorageAPI.delete('notices', id); refreshData();
    showToast("Notice deleted", "success");
  };

  const sorted = [...data.notices].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

  return (
    <div className="space-y-5">
      <PageHeader title="Notice Board" breadcrumbs={["Home", "Notices"]}
        actions={(userRole === 'admin' || userRole === 'principal') && <Button onClick={() => setShowModal(true)}>+ Create Notice</Button>} />
      <div className="space-y-3">
        {sorted.map(n => (
          <Card key={n._id} className={`p-5 border-l-4 ${n.priority === 'Urgent' ? 'border-red-400' : n.priority === 'Important' ? 'border-amber-400' : 'border-blue-400'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{n.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.priority === 'Urgent' ? 'bg-red-100 text-red-700' : n.priority === 'Important' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{n.priority}</span>
                </div>
                <p className="text-sm text-gray-600">{n.content}</p>
              </div>
              <div className="text-right text-xs whitespace-nowrap">
                <p className="text-gray-400">{fmt(n.publishDate)}</p>
                <div className="flex gap-1 mt-1 justify-end">
                  {(Array.isArray(n.targetRoles) ? n.targetRoles : []).map(r => <span key={r} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs capitalize">{r}</span>)}
                </div>
                {(userRole === 'admin' || userRole === 'principal') && (
                  <button onClick={() => handleDelete(n._id)} className="mt-2 text-red-400 hover:text-red-600 text-xs">Delete</button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {sorted.length === 0 && <Card className="p-8 text-center text-gray-400"><p className="text-4xl mb-2">📢</p><p>No notices yet</p></Card>}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Notice" size="md">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Content *" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} />
          <Select label="Priority" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} options={[{ value: 'Normal', label: 'Normal' }, { value: 'Important', label: 'Important' }, { value: 'Urgent', label: 'Urgent' }]} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Target Audience</label>
            <div className="flex gap-3">
              {['parent', 'teacher', 'admin'].map(r => (
                <label key={r} className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={(form.targetRoles || []).includes(r)} onChange={e => setForm(p => ({ ...p, targetRoles: e.target.checked ? [...(p.targetRoles || []), r] : (p.targetRoles || []).filter(x => x !== r) }))} />
                  <span className="text-sm capitalize">{r}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Publish Date" type="date" value={form.publishDate} onChange={e => setForm(p => ({ ...p, publishDate: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Publish Notice</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== LEAVES VIEW ====================
const LeavesView = ({ userRole }) => {
  const { data, refreshData, showToast } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leaveType: "Casual", fromDate: "", toDate: "", reason: "" });
  const [remarkModal, setRemarkModal] = useState(false);
  const [selLeave, setSelLeave] = useState(null);
  const [action, setAction] = useState("");
  const [remark, setRemark] = useState("");

  const myLeaves = userRole === 'teacher' ? data.leaves.filter(l => l.employeeId === "emp1") : data.leaves;

  const handleApply = () => {
    if (!form.fromDate || !form.toDate || !form.reason) return showToast("Fill all fields", "error");
    const days = Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1;
    const leave = { _id: `lv${Date.now()}`, employeeId: "emp1", ...form, totalDays: days, status: "Pending", academicYear: "ay1" };
    StorageAPI.create('leaves', leave); refreshData();
    showToast("Leave application submitted!", "success"); setShowModal(false);
    setForm({ leaveType: "Casual", fromDate: "", toDate: "", reason: "" });
  };

  const handleAction = () => {
    StorageAPI.update('leaves', selLeave._id, { status: action, approvalRemark: remark, approvedBy: "usr2" }); refreshData();
    showToast(`Leave ${action.toLowerCase()}!`, action === 'Approved' ? "success" : "error");
    setRemarkModal(false); setRemark("");
  };

  return (
    <div className="space-y-5">
      <PageHeader title={userRole === 'teacher' ? 'My Leaves' : 'Leave Requests'} breadcrumbs={["Home", "Leaves"]}
        actions={userRole === 'teacher' && <Button onClick={() => setShowModal(true)}>+ Apply Leave</Button>} />
      <Card>
        <Table columns={[
          ...(userRole !== 'teacher' ? [{ header: "Employee", render: r => { const e = data.employees.find(emp => emp._id === r.employeeId); return e ? <div className="flex items-center gap-2"><Avatar name={e.name} size={7} /><span className="font-medium text-sm">{e.name}</span></div> : '-'; } }] : []),
          { header: "Type", key: "leaveType" },
          { header: "From", render: r => fmt(r.fromDate) },
          { header: "To", render: r => fmt(r.toDate) },
          { header: "Days", key: "totalDays" },
          { header: "Reason", render: r => <span className="text-sm text-gray-600 max-w-xs truncate block">{r.reason}</span> },
          { header: "Status", render: r => <Badge status={r.status} /> },
          {
            header: "Actions", render: r => (userRole === 'admin' || userRole === 'principal') && r.status === 'Pending' ? (
              <div className="flex gap-1">
                <button onClick={() => { setSelLeave(r); setAction('Approved'); setRemarkModal(true); }} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Approve</button>
                <button onClick={() => { setSelLeave(r); setAction('Rejected'); setRemarkModal(true); }} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Reject</button>
              </div>
            ) : <span className="text-xs text-gray-400">{r.approvalRemark || '-'}</span>
          },
        ]} data={myLeaves} emptyMsg="No leave records" />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave" size="sm">
        <div className="space-y-4">
          <Select label="Leave Type *" value={form.leaveType} onChange={e => setForm(p => ({ ...p, leaveType: e.target.value }))} options={["Sick", "Casual", "Earned", "Maternity", "Unpaid", "Other"].map(t => ({ value: t, label: t }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="From Date *" type="date" value={form.fromDate} onChange={e => setForm(p => ({ ...p, fromDate: e.target.value }))} />
            <Input label="To Date *" type="date" value={form.toDate} onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))} />
          </div>
          <Textarea label="Reason *" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleApply}>Submit Application</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={remarkModal} onClose={() => setRemarkModal(false)} title={`${action} Leave`} size="sm">
        <Textarea label="Remark" value={remark} onChange={e => setRemark(e.target.value)} placeholder="Optional remark..." />
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="outline" onClick={() => setRemarkModal(false)}>Cancel</Button>
          <Button variant={action === 'Approved' ? 'success' : 'danger'} onClick={handleAction}>{action}</Button>
        </div>
      </Modal>
    </div>
  );
};

// ==================== PROMOTE VIEW ====================
const PromoteView = () => {
  const { data, refreshData, showToast } = useApp();
  const [selClass, setSelClass] = useState("");
  const [students, setStudents] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);

  const load = () => {
    if (!selClass) return showToast("Select a class", "error");
    const clsStudents = data.students.filter(s => s.classId === selClass && s.status === 'Approved');
    const sorted = [...classes].sort((a, b) => a.order - b.order);
    const currentIdx = sorted.findIndex(c => c._id === selClass);
    const nextClass = sorted[currentIdx + 1] || null;
    setStudents(clsStudents.map(s => ({ ...s, result: 'Promoted', remark: '', nextClass: nextClass?._id || '' })));
  };

  const handlePromote = () => {
    students.forEach(s => {
      const updates = {
        classId: s.result === 'Promoted' ? (s.nextClass || s.classId) : s.classId,
        status: s.result === 'Left' ? 'Left' : 'Approved',
        rollNumber: s.result === 'Promoted' ? null : s.rollNumber
      };
      StorageAPI.update('students', s._id, updates);
    });
    refreshData();
    showToast(`Promotion complete! ${students.filter(s => s.result === 'Promoted').length} promoted, ${students.filter(s => s.result === 'Detained').length} detained`, "success");
    setShowConfirm(false); setStudents([]); setSelClass("");
  };

  const sorted = [...classes].sort((a, b) => a.order - b.order);
  const nextClass = sorted[sorted.findIndex(c => c._id === selClass) + 1];

  return (
    <div className="space-y-5">
      <PageHeader title="Student Promotion" subtitle="Promote students to next academic class" breadcrumbs={["Home", "Promote Students"]} />
      <Card className="p-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Select Class to Promote</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48"><Select label="From Class" value={selClass} onChange={e => setSelClass(e.target.value)} options={classes.map(c => ({ value: c._id, label: c.displayName }))} /></div>
          {selClass && nextClass && <div className="p-2 text-sm text-gray-500">→ <span className="font-semibold text-indigo-600">{nextClass.displayName}</span></div>}
          <Button onClick={load}>Load Students</Button>
        </div>
      </Card>
      {students.length > 0 && (
        <>
          <Card>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900 dark:text-gray-100">{students.length} Students</h4>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">Promoted: {students.filter(s => s.result === 'Promoted').length}</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Detained: {students.filter(s => s.result === 'Detained').length}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Roll</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Promote To</th>
                </tr></thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 text-xs text-gray-500 font-mono">{s.rollNumber}</td>
                      <td className="px-4 py-2 font-medium">{s.firstName} {s.lastName}</td>
                      <td className="px-4 py-2">
                        <select value={s.result} onChange={e => setStudents(d => d.map((x, j) => j === i ? { ...x, result: e.target.value } : x))} className="px-2 py-1 border border-gray-200 rounded text-sm bg-white">
                          <option value="Promoted">Promoted</option>
                          <option value="Detained">Detained</option>
                          <option value="Left">Left School</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        {s.result === 'Promoted' ? (
                          <select value={s.nextClass} onChange={e => setStudents(d => d.map((x, j) => j === i ? { ...x, nextClass: e.target.value } : x))} className="px-2 py-1 border border-gray-200 rounded text-sm bg-white">
                            {classes.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
                          </select>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setShowConfirm(true)}>⬆️ Execute Promotion</Button>
          </div>
          <Confirm isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handlePromote}
            title="Confirm Promotion" message={`This will promote ${students.filter(s => s.result === 'Promoted').length} students. Are you sure?`}
            confirmText="Yes, Promote" danger />
        </>
      )}
    </div>
  );
};

// ==================== SETTINGS VIEW ====================
const SettingsView = () => {
  const { data, refreshData, showToast } = useApp();
  const [tab, setTab] = useState("school");
  const [form, setForm] = useState({ ...data.schoolSettings });

  useEffect(() => { setForm({ ...data.schoolSettings }); }, [data.schoolSettings]);

  const handleSave = () => {
    StorageAPI.updateSettings(form); refreshData();
    showToast("Settings saved!", "success");
  };

  const handleReset = () => {
    StorageAPI.reset(SEED_DATA); refreshData();
    showToast("Database reset to defaults!", "success");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" breadcrumbs={["Home", "Settings"]} />
      <Tabs tabs={[{ value: 'school', label: 'School Info' }, { value: 'academic', label: 'Academic Year' }, { value: 'fees', label: 'Fee Settings' }, { value: 'danger', label: '⚠️ Reset' }]} activeTab={tab} onChange={setTab} />

      {tab === 'school' && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">School Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Input label="School Name" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="sm:col-span-2"><Textarea label="Address" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2} /></div>
            <Input label="Phone" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <Input label="Website" value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
            <Input label="Affiliation No" value={form.affiliationNo || ''} onChange={e => setForm(p => ({ ...p, affiliationNo: e.target.value }))} />
            <Input label="Board" value={form.board || ''} onChange={e => setForm(p => ({ ...p, board: e.target.value }))} />
            <div className="sm:col-span-2"><Textarea label="Declaration Text" value={form.declaration || ''} onChange={e => setForm(p => ({ ...p, declaration: e.target.value }))} rows={3} /></div>
          </div>
          <div className="mt-4"><Button onClick={handleSave}>Save Settings</Button></div>
        </Card>
      )}

      {tab === 'academic' && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Academic Years</h3>
          <div className="space-y-3">
            {data.academicYears.map(ay => (
              <div key={ay._id} className={`flex items-center justify-between p-4 rounded-xl border ${ay.isCurrent ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950' : 'border-gray-100 dark:border-gray-700 dark:bg-gray-800'}`}>
                <div><p className="font-semibold text-gray-900 dark:text-gray-100">{ay.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{fmt(ay.startDate)} — {fmt(ay.endDate)}</p></div>
                {ay.isCurrent ? <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-full font-medium">✓ Current</span> : <Button size="sm" variant="outline">Set Current</Button>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'fees' && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Fee Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Late Fine Per Day (₹)" type="number" value={form.lateFinePer || 10} onChange={e => setForm(p => ({ ...p, lateFinePer: Number(e.target.value) }))} />
            <Input label="Fee Due Day (of each month)" type="number" value={form.feeDueDay || 10} onChange={e => setForm(p => ({ ...p, feeDueDay: Number(e.target.value) }))} min={1} max={31} />
          </div>
          <div className="mt-4"><Button onClick={handleSave}>Save Settings</Button></div>
        </Card>
      )}

      {tab === 'danger' && (
        <Card className="p-6 border-red-200">
          <h3 className="font-bold text-red-600 mb-2">⚠️ Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">This will reset ALL data back to the original demo seed data. This action cannot be undone.</p>
          <Button variant="danger" onClick={handleReset}>Reset All Data to Defaults</Button>
        </Card>
      )}
    </div>
  );
};

// ==================== REPORTS VIEW ====================
const ReportsView = () => {
  const { data } = useApp();
  const classes = [...data.classrooms].filter(c => c.isActive).sort((a, b) => a.order - b.order);
  const classwiseData = classes.map(c => ({
    class: c.displayName.replace('Class ', 'C'),
    students: data.students.filter(s => s.classId === c._id && s.status === 'Approved').length,
  }));
  const feeMonthlyData = MONTHS.map((m, i) => ({
    month: m,
    collected: data.fees.filter(f => f.month === i + 1 && f.status === 'Paid').reduce((s, f) => s + f.finalAmount, 0),
    pending: data.fees.filter(f => f.month === i + 1 && (f.status === 'Pending' || f.status === 'Overdue')).reduce((s, f) => s + f.finalAmount, 0),
  }));

  return (
    <div className="space-y-5">
      <PageHeader title="Reports & Analytics" breadcrumbs={["Home", "Reports"]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Enquiries", value: data.enquiries.length, icon: "📋" },
          { label: "Total Admissions", value: data.students.length, icon: "🎓" },
          { label: "Fee Collection", value: fmtCurrency(data.fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.finalAmount, 0)), icon: "💰" },
          { label: "Active Employees", value: data.employees.filter(e => e.status === 'active').length, icon: "👨‍🏫" },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Class-wise Student Count</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={classwiseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.2} />
              <XAxis dataKey="class" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
              <Bar dataKey="students" fill="#6366F1" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Monthly Fee Summary</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={feeMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.2} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} stroke="#9CA3AF" />
              <Tooltip formatter={v => fmtCurrency(v)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} />
              <Legend wrapperStyle={{ color: '#6B7280' }} />
              <Bar dataKey="collected" fill="#10B981" name="Collected" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#EF4444" name="Pending" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

// ==================== PROFILE VIEW (PARENT) ====================
const ProfileView = ({ currentUser }) => {
  const { data } = useApp();
  const classes = [...data.classrooms].filter(c => c.isActive);
  const myStudent = data.students.find(s => s.userId === 'usr3') || data.students.find(s => s.status === 'Approved');
  const cls = classes.find(c => c._id === myStudent?.classId);
  if (!myStudent) return <div className="p-8 text-center text-gray-400">No student profile found</div>;
  return (
    <div className="space-y-5">
      <PageHeader title="Child Profile" breadcrumbs={["Home", "Profile"]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="text-center">
            <Avatar name={`${myStudent.firstName} ${myStudent.lastName}`} size={20} />
            <h3 className="font-bold text-gray-900 mt-3 text-lg">{myStudent.firstName} {myStudent.middleName} {myStudent.lastName}</h3>
            <p className="text-sm text-gray-500">{cls?.displayName}</p>
            <p className="text-xs text-gray-400 font-mono">{myStudent.admissionNo}</p>
            <div className="mt-2"><Badge status={myStudent.status} /></div>
          </div>
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            {[["Roll No", myStudent.rollNumber], ["DOB", fmt(myStudent.dateOfBirth)], ["Gender", myStudent.gender], ["Blood Group", myStudent.bloodGroup || '-']].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h4 className="font-bold text-gray-900 mb-3">Parent Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><h5 className="font-semibold text-gray-700 mb-2">👨 Father</h5><p>{myStudent.fatherName}</p><p className="text-gray-500">{myStudent.fatherPhone}</p><p className="text-gray-500 text-xs">{myStudent.fatherEmail}</p></div>
            <div><h5 className="font-semibold text-gray-700 mb-2">👩 Mother</h5><p>{myStudent.motherName}</p><p className="text-gray-500">{myStudent.motherPhone}</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================
export default function SchoolManagementSystem() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [data, setDataState] = useState(null);

  // Initialize storage on mount
  useEffect(() => {
    const db = StorageAPI.init(SEED_DATA);
    setDataState(db);
  }, []);

  // Re-read from localStorage (simulates API response)
  const refreshData = useCallback(() => {
    const db = StorageAPI.getDB();
    if (db) setDataState({ ...db });
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const handleLogin = (userData) => {
    if (userData.role === 'public') { setUser({ role: 'public' }); setCurrentPage('enquiry'); }
    else { setUser(userData); setCurrentPage('dashboard'); }
  };

  const handleLogout = () => { setUser(null); setCurrentPage('dashboard'); };

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-indigo-50"><div className="text-center"><div className="text-4xl mb-4">🌅</div><p className="text-gray-600 font-medium">Loading School Management System...</p></div></div>;

  const navConfig = user?.role && NAV_CONFIG[user.role] ? NAV_CONFIG[user.role] : [];
  const contextValue = { data, refreshData, showToast };

  const renderPage = () => {
    if (!user || user.role === 'public') return <PublicEnquiryView onBack={() => setUser(null)} />;
    const role = user.role;
    switch (currentPage) {
      case 'dashboard':
        if (role === 'admin') return <AdminDashboard />;
        if (role === 'principal') return <PrincipalDashboard />;
        if (role === 'teacher') return <TeacherDashboard currentUser={user} />;
        if (role === 'parent') return <ParentDashboard currentUser={user} />;
        return <AdminDashboard />;
      case 'enquiries': return <EnquiriesView userRole={role} />;
      case 'admissions': return <AdmissionsView />;
      case 'students': return <StudentsView userRole={role} />;
      case 'profile': return <ProfileView currentUser={user} />;
      case 'employees': return <EmployeesView />;
      case 'classrooms': return <ClassroomsView />;
      case 'subjects': return <SubjectsView />;
      case 'exams': case 'marks': return <ExamsView userRole={role} />;
      case 'student-attendance': return <AttendanceView type="student" />;
      case 'employee-attendance': return <AttendanceView type="employee" />;
      case 'fees': return <FeesView userRole={role} />;
      case 'payroll': return <PayrollView />;
      case 'homework': return <HomeworkView userRole={role} />;
      case 'timetable': return <TimetableView />;
      case 'notices': return <NoticesView userRole={role} />;
      case 'leaves': return <LeavesView userRole={role} />;
      case 'promote': return <PromoteView />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsView />;
      default: return <AdminDashboard />;
    }
  };

  if (!user) return (
    <AppContext.Provider value={contextValue}>
      <Toast toasts={toasts} removeToast={id => setToasts(t => t.filter(x => x.id !== id))} />
      <LoginView onLogin={handleLogin} />
    </AppContext.Provider>
  );

  if (user.role === 'public') return (
    <AppContext.Provider value={contextValue}>
      <Toast toasts={toasts} removeToast={id => setToasts(t => t.filter(x => x.id !== id))} />
      <PublicEnquiryView onBack={() => setUser(null)} />
    </AppContext.Provider>
  );

  const ROLE_COLORS = { admin: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20', principal: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20', teacher: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20', parent: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' };

  return (
    <AppContext.Provider value={contextValue}>
      <Toast toasts={toasts} removeToast={id => setToasts(t => t.filter(x => x.id !== id))} />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden text-gray-900 dark:text-gray-100">
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`fixed lg:relative z-40 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-md shadow-indigo-200 flex-shrink-0">🌅</div>
              <div className="min-w-0"><p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight truncate">{data.schoolSettings?.name || 'School'}</p><p className="text-xs text-gray-400 dark:text-gray-500 truncate">Management System</p></div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navConfig.map(section => (
              <div key={section.section} className="mb-2">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-2">{section.section}</p>
                {section.items.map(item => (
                  <button key={item.id} onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${currentPage === item.id ? 'bg-indigo-600 dark:bg-indigo-700 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={user.name || user.email} size={9} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user.name || user.email}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${ROLE_COLORS[user.role] || 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'}`}>{user.role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <span>🚪</span> <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-400 mb-1"></div><div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-400 mb-1"></div><div className="w-5 h-0.5 bg-gray-600 dark:bg-gray-400"></div>
              </button>
              <div><h2 className="font-bold text-gray-900 dark:text-gray-100 capitalize text-sm">{currentPage.replace(/-/g, ' ')}</h2><p className="text-xs text-gray-400 dark:text-gray-500">{data.schoolSettings?.name}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-gray-700">
                <Avatar name={user.name || user.email} size={8} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name || user.email}</p>
                  <p className={`text-xs capitalize font-medium ${ROLE_COLORS[user.role]?.split(' ')[0] || 'text-gray-500 dark:text-gray-400'}`}>{user.role}</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900">
            {renderPage()}
          </main>
          {/* Mobile bottom nav */}
          <nav className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-2 py-1 flex justify-around flex-shrink-0">
            {(navConfig[0]?.items?.slice(0, 1) || []).concat(navConfig.slice(1, 4).map(s => s.items[0]).filter(Boolean)).slice(0, 5).map((item, i) => (
              <button key={item?.id || i} onClick={() => item && setCurrentPage(item.id)} className={`flex flex-col items-center p-2 rounded-xl min-w-0 ${currentPage === item?.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                <span className="text-xl">{item?.icon}</span>
                <span className="text-xs mt-0.5 truncate max-w-14">{item?.label?.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </AppContext.Provider>
  );
}