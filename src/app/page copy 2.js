'use client';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ==================== API LAYER ====================
const BASE_URL = "http://localhost:5000";

const api = {
  _token: null,
  setToken(t) { this._token = t; },
  getToken() { return this._token; },

  async req(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (this._token) headers["Authorization"] = `Bearer ${this._token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(`${BASE_URL}${path}`, opts);
      const json = await res.json();
      return { ok: res.ok, status: res.status, data: json };
    } catch (err) {
      return { ok: false, status: 0, data: { message: "Network error — is the server running?" } };
    }
  },

  get: (path) => api.req("GET", path),
  post: (path, body) => api.req("POST", path, body),
  put: (path, body) => api.req("PUT", path, body),
  patch: (path, body) => api.req("PATCH", path, body),
  delete: (path) => api.req("DELETE", path),

  login: (email, password) => api.post("/api/auth/login", { email, password }),
  register: (data) => api.post("/api/auth/register", data),
  getMe: () => api.get("/api/auth/me"),
  changePassword: (currentPassword, newPassword) => api.put("/api/auth/change-password", { currentPassword, newPassword }),

  getAcademicYears: () => api.get("/api/academic-years"),
  getCurrentAcademicYear: () => api.get("/api/academic-years/current"),
  createAcademicYear: (data) => api.post("/api/academic-years", data),
  updateAcademicYear: (id, data) => api.put(`/api/academic-years/${id}`, data),
  setCurrentAcademicYear: (id) => api.patch(`/api/academic-years/${id}/set-current`),
  deleteAcademicYear: (id) => api.delete(`/api/academic-years/${id}`),

  getClassrooms: (params = {}) => api.get(`/api/classrooms?${new URLSearchParams(params)}`),
  getClassroom: (id) => api.get(`/api/classrooms/${id}`),
  createClassroom: (data) => api.post("/api/classrooms", data),
  updateClassroom: (id, data) => api.put(`/api/classrooms/${id}`, data),
  toggleClassroom: (id) => api.patch(`/api/classrooms/${id}/toggle`),
  deleteClassroom: (id) => api.delete(`/api/classrooms/${id}`),

  getEmployees: (params = {}) => api.get(`/api/employees?${new URLSearchParams(params)}`),
  getEmployee: (id) => api.get(`/api/employees/${id}`),
  createEmployee: (data) => api.post("/api/employees", data),
  updateEmployee: (id, data) => api.put(`/api/employees/${id}`, data),
  updateEmployeeStatus: (id, status) => api.patch(`/api/employees/${id}/status`, { status }),
  deleteEmployee: (id) => api.delete(`/api/employees/${id}`),

  getStudents: (params = {}) => api.get(`/api/students?${new URLSearchParams(params)}`),
  getStudent: (id) => api.get(`/api/students/${id}`),
  createStudent: (data) => api.post("/api/students", data),
  updateStudent: (id, data) => api.put(`/api/students/${id}`, data),
  updateStudentStatus: (id, data) => api.patch(`/api/students/${id}/status`, data),
  deleteStudent: (id) => api.delete(`/api/students/${id}`),

  getSubjects: (params = {}) => api.get(`/api/subjects?${new URLSearchParams(params)}`),
  getSubject: (id) => api.get(`/api/subjects/${id}`),
  createSubjects: (data) => api.post("/api/subjects", data),
  updateSubject: (id, data) => api.put(`/api/subjects/${id}`, data),
  toggleSubject: (id) => api.patch(`/api/subjects/${id}/toggle`),
  deleteSubject: (id) => api.delete(`/api/subjects/${id}`),

  submitEnquiry: (data) => api.post("/api/enquiries", data),
  getEnquiries: (params = {}) => api.get(`/api/enquiries?${new URLSearchParams(params)}`),
  getEnquiry: (id) => api.get(`/api/enquiries/${id}`),
  updateEnquiry: (id, data) => api.put(`/api/enquiries/${id}`, data),
  deleteEnquiry: (id) => api.delete(`/api/enquiries/${id}`),

  getStudentAttendance: (params = {}) => api.get(`/api/attendance/students?${new URLSearchParams(params)}`),
  markStudentAttendance: (records) => api.post("/api/attendance/students", { records }),
  getAttendanceSummary: (params = {}) => api.get(`/api/attendance/students/summary?${new URLSearchParams(params)}`),
  getEmployeeAttendance: (params = {}) => api.get(`/api/attendance/employees?${new URLSearchParams(params)}`),
  markEmployeeAttendance: (records) => api.post("/api/attendance/employees", { records }),

  getExams: (params = {}) => api.get(`/api/exams?${new URLSearchParams(params)}`),
  getExam: (id) => api.get(`/api/exams/${id}`),
  createExam: (data) => api.post("/api/exams", data),
  updateExam: (id, data) => api.put(`/api/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/api/exams/${id}`),
  getMarks: (examId) => api.get(`/api/exams/${examId}/marks`),
  saveMarks: (examId, marks) => api.post(`/api/exams/${examId}/marks`, { marks }),
  getAllMarks: (params = {}) => api.get(`/api/marks?${new URLSearchParams(params)}`),

  getFees: (params = {}) => api.get(`/api/fees?${new URLSearchParams(params)}`),
  getFee: (id) => api.get(`/api/fees/${id}`),
  createFee: (data) => api.post("/api/fees", data),
  updateFee: (id, data) => api.put(`/api/fees/${id}`, data),
  collectPayment: (id, data) => api.post(`/api/fees/${id}/pay`, data),
  getFeePayments: (id) => api.get(`/api/fees/${id}/payments`),
  getAllReceipts: (params = {}) => api.get(`/api/fees/receipts/all?${new URLSearchParams(params)}`),

  getPayroll: (params = {}) => api.get(`/api/payroll?${new URLSearchParams(params)}`),
  getPayrollById: (id) => api.get(`/api/payroll/${id}`),
  generatePayroll: (data) => api.post("/api/payroll", data),
  markPayrollPaid: (id) => api.patch(`/api/payroll/${id}/pay`),
  updatePayroll: (id, data) => api.put(`/api/payroll/${id}`, data),

  getLeaves: (params = {}) => api.get(`/api/leaves?${new URLSearchParams(params)}`),
  applyLeave: (data) => api.post("/api/leaves", data),
  leaveAction: (id, data) => api.patch(`/api/leaves/${id}/action`, data),
  updateLeave: (id, data) => api.put(`/api/leaves/${id}`, data),
  deleteLeave: (id) => api.delete(`/api/leaves/${id}`),

  getHomework: (params = {}) => api.get(`/api/homework?${new URLSearchParams(params)}`),
  assignHomework: (data) => api.post("/api/homework", data),
  updateHomework: (id, data) => api.put(`/api/homework/${id}`, data),
  deleteHomework: (id) => api.delete(`/api/homework/${id}`),

  getNotices: (params = {}) => api.get(`/api/notices?${new URLSearchParams(params)}`),
  getNotice: (id) => api.get(`/api/notices/${id}`),
  createNotice: (data) => api.post("/api/notices", data),
  updateNotice: (id, data) => api.put(`/api/notices/${id}`, data),
  deleteNotice: (id) => api.delete(`/api/notices/${id}`),

  getTimetables: (params = {}) => api.get(`/api/timetable?${new URLSearchParams(params)}`),
  getTimetableForClass: (classId, params = {}) => api.get(`/api/timetable/${classId}?${new URLSearchParams(params)}`),
  saveTimetable: (data) => api.post("/api/timetable", data),

  previewPromotions: (params = {}) => api.get(`/api/promote/preview?${new URLSearchParams(params)}`),
  executePromotions: (promotions) => api.post("/api/promote", { promotions }),

  getSettings: () => api.get("/api/settings"),
  updateSettings: (data) => api.put("/api/settings", data),

  getOverview: (params = {}) => api.get(`/api/reports/overview?${new URLSearchParams(params)}`),
  getFeeCollection: (params = {}) => api.get(`/api/reports/fee-collection?${new URLSearchParams(params)}`),
  getFeeDefaulters: (params = {}) => api.get(`/api/reports/fee-defaulters?${new URLSearchParams(params)}`),
  getAttendanceSummaryReport: (params = {}) => api.get(`/api/reports/attendance-summary?${new URLSearchParams(params)}`),
  getLowAttendance: (params = {}) => api.get(`/api/reports/low-attendance?${new URLSearchParams(params)}`),
  getExamResults: (params = {}) => api.get(`/api/reports/exam-results?${new URLSearchParams(params)}`),
  getStudentResultCard: (params = {}) => api.get(`/api/reports/student-result-card?${new URLSearchParams(params)}`),
  getPayrollSummary: (params = {}) => api.get(`/api/reports/payroll-summary?${new URLSearchParams(params)}`),
  getClasswiseStudents: (params = {}) => api.get(`/api/reports/classwise-students?${new URLSearchParams(params)}`),
  getEmployeeAttendanceSummary: (params = {}) => api.get(`/api/reports/employee-attendance-summary?${new URLSearchParams(params)}`),

  health: () => api.get("/api/health"),
};

// ==================== CONTEXT ====================
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ==================== HELPERS ====================
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtCur = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";

// ==================== BADGE ====================
const badgeClasses = {
  New: "bg-blue-100 text-blue-800",
  Contacted: "bg-yellow-100 text-yellow-800",
  AdmissionDone: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Approved: "bg-green-100 text-green-800",
  UnderReview: "bg-blue-100 text-blue-800",
  Rejected: "bg-red-100 text-red-800",
  OnHold: "bg-orange-100 text-orange-800",
  Left: "bg-gray-100 text-gray-700",
  Alumni: "bg-emerald-100 text-emerald-800",
  Paid: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Overdue: "bg-red-100 text-red-800",
  PartiallyPaid: "bg-orange-100 text-orange-800",
  Waived: "bg-gray-100 text-gray-700",
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  Late: "bg-yellow-100 text-yellow-800",
  HalfDay: "bg-orange-100 text-orange-800",
  Holiday: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-700",
  resigned: "bg-red-100 text-red-800",
  Normal: "bg-blue-100 text-blue-800",
  Important: "bg-yellow-100 text-yellow-800",
  Urgent: "bg-red-100 text-red-800",
};

const Badge = ({ s, l }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${badgeClasses[s] || "bg-gray-100 text-gray-700"}`}>
    {l || s}
  </span>
);

// ==================== UI PRIMITIVES ====================
const Field = ({ label, required, error, children }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const Inp = ({ label, required, error, className: extClass, ...props }) => (
  <Field label={label} required={required} error={error}>
    <input
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors ${extClass || ""}`}
      {...props}
    />
  </Field>
);

const Sel = ({ label, required, options = [], value, onChange, className: extClass }) => (
  <Field label={label} required={required}>
    <select
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors ${extClass || ""}`}
      value={value || ""}
      onChange={onChange}
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </Field>
);

const Textarea = ({ label, required, ...props }) => (
  <Field label={label} required={required}>
    <textarea
      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors resize-y min-h-[72px]"
      {...props}
    />
  </Field>
);

const variantClasses = {
  primary: "bg-[#1e3a5f] text-white border-[#1e3a5f] hover:bg-[#162d4a]",
  danger: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  success: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  outline: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
};

const Btn = ({ children, variant = "primary", onClick, loading, type = "button", className: extClass }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors disabled:opacity-60 ${variantClasses[variant] || variantClasses.outline} ${extClass || ""}`}
  >
    {loading && <span className="text-xs animate-spin">⟳</span>}
    {children}
  </button>
);

const Modal = ({ open, onClose, title, children, width = "max-w-lg" }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none bg-none border-none cursor-pointer">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const PageHdr = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
    <div>
      <h2 className="text-xl font-semibold text-gray-900 m-0">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-1 m-0">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
  </div>
);

const StatCard = ({ label, value, sub, color = "text-[#1e3a5f]" }) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
    <p className="text-xs font-medium text-gray-500 m-0">{label}</p>
    <p className={`text-2xl font-semibold mt-1.5 m-0 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1 m-0">{sub}</p>}
  </div>
);

const Table = ({ cols, rows = [], onRow, emptyMsg = "No data" }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="border-b border-gray-100">
          {cols.map((c, i) => (
            <th key={i} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              {c.h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={cols.length} className="px-3 py-8 text-center text-gray-400 text-sm">
              {emptyMsg}
            </td>
          </tr>
        ) : rows.map((r, i) => (
          <tr
            key={i}
            onClick={onRow ? () => onRow(r) : undefined}
            className={`border-b border-gray-50 transition-colors ${onRow ? "cursor-pointer hover:bg-blue-50/50" : ""}`}
          >
            {cols.map((c, j) => (
              <td key={j} className="px-3 py-2.5 whitespace-nowrap text-gray-800">
                {c.r ? c.r(r) : r[c.k]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-0 mb-4 border-b border-gray-200">
    {tabs.map(t => (
      <button
        key={t.v}
        onClick={() => onChange(t.v)}
        className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-x-0 border-t-0 ${
          active === t.v
            ? "border-b-[#1e3a5f] text-[#1e3a5f]"
            : "border-b-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        {t.l}
      </button>
    ))}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#1e3a5f] rounded-full animate-spin" />
  </div>
);

const Toast = ({ toasts, remove }) => (
  <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`px-4 py-2.5 rounded-xl shadow-lg text-white text-xs font-medium flex gap-3 items-center max-w-xs ${
          t.type === "success" ? "bg-green-700" : t.type === "error" ? "bg-red-700" : "bg-[#1e3a5f]"
        }`}
      >
        <span className="flex-1">{t.msg}</span>
        <button onClick={() => remove(t.id)} className="bg-transparent border-none text-white cursor-pointer text-sm leading-none">&times;</button>
      </div>
    ))}
  </div>
);

const avatarColors = ["bg-[#1e3a5f]", "bg-green-800", "bg-yellow-700", "bg-orange-800", "bg-purple-800"];
const Avt = ({ name = "?", size = 8 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colorIdx = name.charCodeAt(0) % avatarColors.length;
  return (
    <div className={`w-${size} h-${size} rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ width: size * 4, height: size * 4, fontSize: size * 1.4 }}>
      {initials}
    </div>
  );
};

// ==================== NAV CONFIG ====================
const NAV = {
  admin: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard" }] },
    { section: "Admissions", items: [{ id: "enquiries", l: "Enquiries" }, { id: "admissions", l: "Admissions" }, { id: "students", l: "Students" }] },
    { section: "Academic", items: [{ id: "employees", l: "Employees" }, { id: "classrooms", l: "Classrooms" }, { id: "subjects", l: "Subjects" }, { id: "exams", l: "Exams & Marks" }, { id: "timetable", l: "Timetable" }, { id: "homework", l: "Homework" }] },
    { section: "Attendance", items: [{ id: "student-att", l: "Student Attendance" }, { id: "emp-att", l: "Staff Attendance" }] },
    { section: "Finance", items: [{ id: "fees", l: "Fees" }, { id: "payroll", l: "Payroll" }] },
    { section: "Management", items: [{ id: "notices", l: "Notices" }, { id: "leaves", l: "Leave Requests" }, { id: "promote", l: "Promote Students" }] },
    { section: "More", items: [{ id: "reports", l: "Reports" }, { id: "settings", l: "Settings" }] },
  ],
  principal: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard" }] },
    { section: "Admissions", items: [{ id: "enquiries", l: "Enquiries" }, { id: "admissions", l: "Admissions" }, { id: "students", l: "Students" }] },
    { section: "Academic", items: [{ id: "employees", l: "Employees" }, { id: "classrooms", l: "Classrooms" }, { id: "exams", l: "Exams" }, { id: "timetable", l: "Timetable" }] },
    { section: "Attendance", items: [{ id: "student-att", l: "Student Attendance" }, { id: "emp-att", l: "Staff Attendance" }] },
    { section: "Management", items: [{ id: "notices", l: "Notices" }, { id: "leaves", l: "Leave Requests" }, { id: "reports", l: "Reports" }] },
  ],
  teacher: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard" }] },
    { section: "My Class", items: [{ id: "students", l: "Students" }, { id: "student-att", l: "Mark Attendance" }, { id: "timetable", l: "Timetable" }] },
    { section: "Academic", items: [{ id: "exams", l: "Exams" }, { id: "homework", l: "Homework" }] },
    { section: "Personal", items: [{ id: "leaves", l: "My Leaves" }, { id: "notices", l: "Notices" }] },
  ],
  parent: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard" }] },
    { section: "My Child", items: [{ id: "student-att", l: "Attendance" }, { id: "exams", l: "Marks" }] },
    { section: "School", items: [{ id: "fees", l: "Fees" }, { id: "homework", l: "Homework" }, { id: "timetable", l: "Timetable" }, { id: "notices", l: "Notices" }] },
  ],
};

// ==================== HOOKS ====================
function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await fn();
    if (res.ok) setData(res.data?.data ?? res.data);
    else setError(res.data?.message || "Failed to load");
    setLoading(false);
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ==================== LOGIN ====================
const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState("admin@school.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serverOk, setServerOk] = useState(null);

  useEffect(() => {
    api.health().then(r => setServerOk(r.ok));
  }, []);

  const DEMOS = [
    { label: "Admin", email: "admin@school.com", password: "Admin@123" },
    { label: "Principal", email: "principal@school.com", password: "Principal@123" },
    { label: "Teacher", email: "priya.patel@school.com", password: "Teacher@123" },
    { label: "Parent", email: "anil.gupta@gmail.com", password: "Parent@123" },
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true); setError("");
    const res = await api.login(email, password);
    if (res.ok && res.data?.data?.token) {
      api.setToken(res.data.data.token);
      localStorage.setItem("sms_token", res.data.data.token);
      onLogin(res.data.data.user, res.data.data.token);
    } else {
      setError(res.data?.message || "Login failed. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#1e3a5f] rounded-xl flex items-center justify-center mx-auto mb-3 text-2xl">🏫</div>
          <h1 className="text-xl font-semibold text-gray-900 m-0">School Management System</h1>
          <p className="text-xs text-gray-500 mt-1 m-0">Sign in to your account</p>
        </div>

        {serverOk === false && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 mb-3">
            ⚠ Backend server not reachable at {BASE_URL}. Start the server first, then log in.
          </div>
        )}
        {serverOk === true && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700 mb-3">
            ✓ Server connected at {BASE_URL}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <Inp label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Inp label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Btn type="submit" loading={loading} className="w-full justify-center py-2.5 mt-1">Sign In</Btn>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map(d => (
                <button
                  key={d.label}
                  onClick={() => { setEmail(d.email); setPassword(d.password); }}
                  className="p-2.5 border border-gray-100 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer text-left transition-colors"
                >
                  <p className="text-xs font-semibold text-gray-800 m-0">{d.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 m-0 truncate">{d.email}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 text-center">
            <button
              onClick={() => onLogin({ role: "public" }, null)}
              className="text-xs text-[#1e3a5f] underline bg-transparent border-none cursor-pointer"
            >
              Submit Enquiry (Public)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PUBLIC ENQUIRY ====================
const PublicEnquiry = ({ onBack }) => {
  const { toast } = useApp();
  const [form, setForm] = useState({
    classApplying: "", childName: "", fatherName: "", residentialAddress: "",
    pinCode: "", phoneNo: "", mobileNo: "", email: "", gender: "Male",
    age: "", dateOfBirth: "", preferredAdmissionDate: "", remark: ""
  });
  const [classes, setClasses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    api.getClassrooms({ isActive: "true" }).then(r => { if (r.ok) setClasses(r.data?.data || []); });
  }, []);

  const submit = async () => {
    setSubmitting(true);
    const res = await api.submitEnquiry({ ...form, academicYear: "", age: Number(form.age) });
    if (res.ok) { setDone(res.data?.data); toast("Enquiry submitted!", "success"); }
    else toast(res.data?.message || "Error", "error");
    setSubmitting(false);
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-3">✓</div>
        <h3 className="text-lg font-semibold m-0 mb-2">Enquiry Submitted!</h3>
        <p className="text-xs text-gray-500 mb-4">Enquiry ID: <strong className="text-gray-900">{done.enquiryId}</strong></p>
        <Btn onClick={onBack}>Back to Login</Btn>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Btn variant="outline" onClick={onBack}>← Back</Btn>
          <h2 className="text-lg font-semibold m-0">Admission Enquiry</h2>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Sel label="Class Applying For *" value={form.classApplying} onChange={f("classApplying")}
              options={(classes || []).sort((a, b) => a.order - b.order).map(c => ({ value: c._id, label: c.displayName }))} />
          </div>
          <Inp label="Child's Name *" value={form.childName} onChange={f("childName")} />
          <Inp label="Father's Name *" value={form.fatherName} onChange={f("fatherName")} />
          <div className="col-span-2">
            <Textarea label="Residential Address *" value={form.residentialAddress} onChange={f("residentialAddress")} />
          </div>
          <Inp label="Pin Code *" value={form.pinCode} onChange={f("pinCode")} maxLength={6} />
          <Inp label="Phone No *" value={form.phoneNo} onChange={f("phoneNo")} maxLength={10} />
          <Inp label="Mobile No *" value={form.mobileNo} onChange={f("mobileNo")} maxLength={10} />
          <Inp label="Email *" type="email" value={form.email} onChange={f("email")} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
            <div className="flex gap-4 pt-1.5">
              {["Male", "Female", "Other"].map(g => (
                <label key={g} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={f("gender")} />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <Inp label="Age *" type="number" value={form.age} onChange={f("age")} min={1} max={20} />
          <Inp label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")} />
          <Inp label="Preferred Admission Date" type="date" value={form.preferredAdmissionDate} onChange={f("preferredAdmissionDate")} />
          <div className="col-span-2">
            <Textarea label="Remarks" value={form.remark} onChange={f("remark")} />
          </div>
          <div className="col-span-2">
            <Btn loading={submitting} onClick={submit} className="w-full justify-center py-2.5">Submit Enquiry</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD ====================
const Dashboard = ({ user }) => {
  const { ayId } = useApp();
  const { data: overview, loading } = useFetch(() => api.getOverview(ayId ? { academicYear: ayId } : {}), [ayId]);
  const { data: feeData } = useFetch(() => api.getFeeCollection({ year: 2024, ...(ayId ? { academicYear: ayId } : {}) }), [ayId]);
  const { data: classwiseData } = useFetch(() => api.getClasswiseStudents(ayId ? { academicYear: ayId } : {}), [ayId]);

  const collectionChart = (feeData || []).slice(0, 6).map(d => ({
    month: MONTHS[d.month - 1], collected: d.totalCollected || 0, pending: d.totalPending || 0,
  }));
  const classwiseChart = (classwiseData || []).slice(0, 8).map(d => ({
    name: d._id?.displayName?.replace("Class ", "C") || "—", count: d.approved || 0,
  }));

  if (loading) return <Spinner />;
  const ov = overview || {};

  return (
    <div>
      <PageHdr title="Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Students" value={ov.students?.approved || 0} sub={`${ov.students?.underReview || 0} pending`} />
        <StatCard label="Total Employees" value={ov.employees?.active || 0} sub="Active" color="text-green-700" />
        <StatCard label="Fee Collected" value={fmtCur(ov.fees?.collected)} sub="This year" color="text-yellow-700" />
        <StatCard label="Pending Leaves" value={ov.leaves?.pending || 0} color={(ov.leaves?.pending || 0) > 0 ? "text-red-700" : "text-green-700"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">Monthly Fee Collection</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={collectionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip formatter={v => fmtCur(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" fill="#1e3a5f" name="Collected" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pending" fill="#cbd5e1" name="Pending" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">Class-wise Students</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classwiseChart} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e3a5f" radius={[0, 3, 3, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">Fee Overview</h3>
          <div className="flex flex-col gap-2">
            {[
              ["Total Expected", fmtCur(ov.fees?.total), "text-[#1e3a5f]"],
              ["Collected", fmtCur(ov.fees?.collected), "text-green-700"],
              ["Pending", fmtCur(ov.fees?.pending), "text-red-700"]
            ].map(([l, v, c]) => (
              <div key={l} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500">{l}</span>
                <span className={`text-sm font-semibold ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-3">Quick Stats</h3>
          <div className="flex flex-col gap-2">
            {[
              ["Total Students", ov.students?.total || 0],
              ["Under Review", ov.students?.underReview || 0],
              ["Active Employees", ov.employees?.active || 0],
              ["Total Classes", ov.classes?.total || 0],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500">{l}</span>
                <span className="text-sm font-semibold text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ENQUIRIES ====================
const Enquiries = () => {
  const { ayId, toast } = useApp();
  const [params, setParams] = useState({ page: 1, limit: 50 });
  const [editData, setEditData] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const { data: enqRes, loading, reload } = useFetch(
    () => api.getEnquiries({ ...params, ...(ayId ? { academicYear: ayId } : {}) }), [params, ayId]
  );
  const enquiries = enqRes?.data || enqRes || [];

  const handleUpdate = async () => {
    const res = await api.updateEnquiry(editData._id, editData);
    if (res.ok) { toast("Updated!", "success"); reload(); setShowEdit(false); }
    else toast(res.data?.message, "error");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this enquiry?")) return;
    const res = await api.deleteEnquiry(id);
    if (res.ok) { toast("Deleted", "success"); reload(); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr
        title="Enquiries"
        subtitle={`${Array.isArray(enquiries) ? enquiries.length : 0} records`}
        actions={
          <select
            className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none focus:border-blue-500"
            onChange={e => setParams(p => ({ ...p, status: e.target.value || undefined }))}
          >
            <option value="">All Status</option>
            {["New", "Contacted", "AdmissionDone", "Cancelled", "PlanningFuture", "Other"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        }
      />
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              { h: "Enquiry ID", r: r => <span className="font-mono text-xs text-[#1e3a5f]">{r.enquiryId}</span> },
              { h: "Child", r: r => <span className="font-semibold">{r.childName}</span> },
              { h: "Class", r: r => r.classApplying?.displayName || "—" },
              { h: "Father", k: "fatherName" },
              { h: "Mobile", k: "mobileNo" },
              { h: "Date", r: r => fmt(r.createdAt) },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (
                  <div className="flex gap-1.5">
                    <Btn variant="outline" onClick={() => { setEditData({ ...r, classApplying: r.classApplying?._id || r.classApplying }); setShowEdit(true); }}>Edit</Btn>
                    <Btn variant="danger" onClick={() => handleDelete(r._id)}>Del</Btn>
                  </div>
                )
              },
            ]}
            rows={Array.isArray(enquiries) ? enquiries : []}
          />
        </div>
      )}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit Enquiry — ${editData?.enquiryId}`} width="max-w-xl">
        {editData && (
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Child Name" value={editData.childName || ""} onChange={e => setEditData(p => ({ ...p, childName: e.target.value }))} />
            <Inp label="Father Name" value={editData.fatherName || ""} onChange={e => setEditData(p => ({ ...p, fatherName: e.target.value }))} />
            <Inp label="Mobile" value={editData.mobileNo || ""} onChange={e => setEditData(p => ({ ...p, mobileNo: e.target.value }))} />
            <Sel label="Status" value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))}
              options={["New", "Contacted", "AdmissionDone", "Cancelled", "PlanningFuture", "Other"].map(s => ({ value: s, label: s }))} />
            <div className="col-span-2">
              <Textarea label="Admin Remark" value={editData.adminRemark || ""} onChange={e => setEditData(p => ({ ...p, adminRemark: e.target.value }))} />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setShowEdit(false)}>Cancel</Btn>
              <Btn onClick={handleUpdate}>Save Changes</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==================== ADMISSIONS ====================
const Admissions = () => {
  const { ayId, toast } = useApp();
  const [tab, setTab] = useState("UnderReview");
  const [selected, setSelected] = useState(null);
  const [showReject, setShowReject] = useState(false);
  const [remark, setRemark] = useState("");
  const { data: studentsRes, loading, reload } = useFetch(
    () => api.getStudents({ status: tab, ...(ayId ? { academicYear: ayId } : {}), limit: 100 }), [tab, ayId]
  );
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const students = studentsRes?.data || studentsRes || [];

  const handleStatus = async (student, status, extra = {}) => {
    const res = await api.updateStudentStatus(student._id, { status, ...extra });
    if (res.ok) { toast(`Status updated to ${status}`, "success"); reload(); setSelected(null); }
    else toast(res.data?.message, "error");
  };

  const cls = (id) => (classes || []).find(c => c._id === id || c._id === id?._id);

  return (
    <div>
      <PageHdr title="Admissions" subtitle="Manage student admissions" />
      <Tabs
        tabs={["UnderReview", "Approved", "OnHold", "Rejected"].map(t => ({ v: t, l: t }))}
        active={tab}
        onChange={t => { setTab(t); setSelected(null); }}
      />
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              { h: "Adm No", r: r => <span className="font-mono text-xs text-[#1e3a5f]">{r.admissionNo}</span> },
              {
                h: "Student", r: r => (
                  <div className="flex items-center gap-2">
                    <Avt name={`${r.firstName} ${r.lastName}`} size={7} />
                    <span className="font-semibold">{r.firstName} {r.lastName}</span>
                  </div>
                )
              },
              { h: "Class", r: r => cls(r.classroom)?.displayName || "—" },
              { h: "Father", k: "fatherName" },
              { h: "Father Phone", k: "fatherPhone" },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (
                  <div className="flex gap-1.5">
                    {r.status === "UnderReview" && <>
                      <Btn variant="success" onClick={() => handleStatus(r, "Approved")}>Approve</Btn>
                      <Btn variant="warning" onClick={() => { setSelected(r); setShowReject("OnHold"); }}>Hold</Btn>
                      <Btn variant="danger" onClick={() => { setSelected(r); setShowReject("Rejected"); }}>Reject</Btn>
                    </>}
                    {r.status !== "UnderReview" && <Badge s={r.status} />}
                  </div>
                )
              },
            ]}
            rows={Array.isArray(students) ? students : []}
          />
        </div>
      )}
      <Modal open={!!showReject} onClose={() => setShowReject(false)} title={showReject === "Rejected" ? "Reject Admission" : "Put On Hold"} width="max-w-sm">
        <div className="flex flex-col gap-3">
          <Textarea label={showReject === "Rejected" ? "Rejection Reason *" : "Hold Reason *"} value={remark} onChange={e => setRemark(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowReject(false)}>Cancel</Btn>
            <Btn
              variant={showReject === "Rejected" ? "danger" : "warning"}
              onClick={() => {
                if (!remark) return;
                handleStatus(selected, showReject, showReject === "Rejected" ? { rejectionRemark: remark } : { holdRemark: remark });
                setShowReject(false); setRemark("");
              }}
            >Confirm</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== STUDENTS ====================
const Students = () => {
  const { ayId, toast } = useApp();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Approved");
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState("info");

  const { data: studentsRes, loading, reload } = useFetch(
    () => api.getStudents({ ...(ayId ? { academicYear: ayId } : {}), ...(classFilter ? { classId: classFilter } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}), limit: 200 }),
    [ayId, classFilter, statusFilter, search]
  );
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const { data: marks } = useFetch(() => selected ? api.getAllMarks({ studentId: selected._id, ...(ayId ? { academicYear: ayId } : {}) }) : Promise.resolve({ ok: true, data: [] }), [selected?._id]);
  const { data: attendance } = useFetch(() => selected ? api.getStudentAttendance({ studentId: selected._id }) : Promise.resolve({ ok: true, data: [] }), [selected?._id]);
  const { data: fees } = useFetch(() => selected ? api.getFees({ studentId: selected._id }) : Promise.resolve({ ok: true, data: [] }), [selected?._id]);

  const students = studentsRes?.data || studentsRes || [];
  const cls = (id) => (classes || []).find(c => c._id === id || c._id === id?._id);
  const att = attendance?.data || attendance || [];
  const pct = att.length > 0 ? Math.round((att.filter(a => a.status === "Present").length / att.length) * 100) : 0;
  const markList = marks?.data || marks || [];
  const feeList = fees?.data || fees || [];

  if (selected) return (
    <div>
      <PageHdr
        title={`${selected.firstName} ${selected.lastName}`}
        actions={<Btn variant="outline" onClick={() => setSelected(null)}>← Back</Btn>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-center mb-4">
            <Avt name={`${selected.firstName} ${selected.lastName}`} size={16} />
            <h3 className="mt-2.5 mb-1 text-sm font-semibold">{selected.firstName} {selected.middleName} {selected.lastName}</h3>
            <p className="text-xs text-gray-500 m-0">{cls(selected.classroom)?.displayName}</p>
            <div className="mt-2"><Badge s={selected.status} /></div>
          </div>
          {[["Adm No", selected.admissionNo], ["Roll", selected.rollNumber || "—"], ["DOB", fmt(selected.dateOfBirth)], ["Gender", selected.gender], ["Blood", selected.bloodGroup || "—"]].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-gray-50 text-xs">
              <span className="text-gray-400">{k}</span>
              <span className="font-medium text-gray-800">{v}</span>
            </div>
          ))}
        </div>
        <div>
          <Tabs tabs={[{ v: "info", l: "Family" }, { v: "fees", l: "Fees" }, { v: "marks", l: "Marks" }, { v: "att", l: "Attendance" }]} active={detailTab} onChange={setDetailTab} />
          {detailTab === "info" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-6">
              {[["Father", ["fatherName", "fatherPhone", "fatherEmail", "fatherOccupation"]], ["Mother", ["motherName", "motherPhone", "motherEmail", "motherOccupation"]]].map(([title, fields]) => (
                <div key={title}>
                  <h4 className="text-xs font-semibold text-gray-900 m-0 mb-3 uppercase tracking-wide">{title}</h4>
                  {fields.map(f => selected[f] && (
                    <div key={f} className="mb-2">
                      <p className="text-xs text-gray-400 m-0">{f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                      <p className="text-sm text-gray-800 m-0 mt-0.5">{selected[f]}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {detailTab === "fees" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Table cols={[
                { h: "Month", r: r => `${MONTHS[r.month - 1]} ${r.year}` },
                { h: "Amount", r: r => fmtCur(r.finalAmount) },
                { h: "Status", r: r => <Badge s={r.status} /> },
                { h: "Due", r: r => fmt(r.dueDate) }
              ]} rows={feeList} />
            </div>
          )}
          {detailTab === "marks" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Table cols={[
                { h: "Subject", r: r => r.subject?.name || "—" },
                { h: "Exam", r: r => r.exam?.name || "—" },
                { h: "Marks", r: r => r.isAbsent ? "Absent" : `${r.marksObtained}/${r.exam?.totalMarks}` },
                { h: "Grade", r: r => <span className={`font-bold ${r.grade === "F" ? "text-red-600" : "text-green-700"}`}>{r.grade}</span> }
              ]} rows={markList} />
            </div>
          )}
          {detailTab === "att" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[["Total", att.length], ["Present", att.filter(a => a.status === "Present").length], ["Absent", att.filter(a => a.status === "Absent").length], ["Attendance %", `${pct}%`]].map(([l, v]) => (
                  <StatCard key={l} label={l} value={v} />
                ))}
              </div>
              <Table cols={[{ h: "Date", r: r => fmt(r.date) }, { h: "Status", r: r => <Badge s={r.status} /> }, { h: "Remark", k: "remark" }]} rows={att.slice(0, 20)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHdr
        title="Students"
        subtitle={`${Array.isArray(students) ? students.length : 0} students`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <input className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none focus:border-blue-500 w-44" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {(classes || []).sort((a, b) => a.order - b.order).map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {["UnderReview", "Approved", "OnHold", "Rejected", "Left"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }
      />
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              { h: "Adm No", r: r => <span className="font-mono text-xs text-[#1e3a5f]">{r.admissionNo}</span> },
              {
                h: "Student", r: r => (
                  <div className="flex items-center gap-2">
                    <Avt name={`${r.firstName} ${r.lastName}`} size={7} />
                    <div>
                      <p className="m-0 font-semibold text-xs">{r.firstName} {r.lastName}</p>
                      <p className="m-0 text-xs text-gray-400">Roll: {r.rollNumber || "—"}</p>
                    </div>
                  </div>
                )
              },
              { h: "Class", r: r => cls(r.classroom)?.displayName || "—" },
              { h: "Gender", k: "gender" },
              { h: "Father", k: "fatherName" },
              { h: "Status", r: r => <Badge s={r.status} /> },
              { h: "Action", r: r => <Btn variant="outline" onClick={() => { setSelected(r); setDetailTab("info"); }}>View</Btn> },
            ]}
            rows={Array.isArray(students) ? students : []}
            onRow={r => { setSelected(r); setDetailTab("info"); }}
          />
        </div>
      )}
    </div>
  );
};

// ==================== EMPLOYEES ====================
const Employees = () => {
  const { ayId, toast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [form, setForm] = useState({ name: "", email: "", mobileNo: "", role: "teacher", monthlySalary: "", dateOfJoining: "", gender: "Female", bloodGroup: "", dateOfBirth: "", homeAddress: "", education: "", experience: "" });
  const { data: empRes, loading, reload } = useFetch(() => api.getEmployees({ ...(roleFilter ? { role: roleFilter } : {}), ...(search ? { search } : {}), status: "active" }), [roleFilter, search]);
  const employees = empRes?.data || empRes || [];
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    const res = await api.createEmployee({ ...form, monthlySalary: Number(form.monthlySalary), ...(ayId ? { academicYear: ayId } : {}) });
    if (res.ok) { toast("Employee created!", "success"); reload(); setShowAdd(false); }
    else toast(res.data?.message, "error");
  };

  const handleStatusChange = async (emp, status) => {
    const res = await api.updateEmployeeStatus(emp._id, status);
    if (res.ok) { toast("Status updated", "success"); reload(); setSelected(null); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr
        title="Employees"
        subtitle={`${Array.isArray(employees) ? employees.length : 0} employees`}
        actions={
          <div className="flex gap-2">
            <input className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none w-40" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {["teacher", "principal", "admin", "accountant", "support"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Btn onClick={() => setShowAdd(true)}>+ Add Employee</Btn>
          </div>
        }
      />
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              {
                h: "Employee", r: r => (
                  <div className="flex items-center gap-2">
                    <Avt name={r.name} size={7} />
                    <div>
                      <p className="m-0 font-semibold text-xs">{r.name}</p>
                      <p className="m-0 text-xs text-gray-400 font-mono">{r.employeeId}</p>
                    </div>
                  </div>
                )
              },
              { h: "Role", r: r => <span className="capitalize">{r.role}</span> },
              { h: "Mobile", k: "mobileNo" },
              { h: "Salary", r: r => fmtCur(r.monthlySalary) },
              { h: "Joined", r: r => fmt(r.dateOfJoining) },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (
                  <div className="flex gap-1.5">
                    <Btn variant="outline" onClick={() => setSelected(r)}>View</Btn>
                    {r.status === "active"
                      ? <Btn variant="danger" onClick={() => handleStatusChange(r, "inactive")}>Deactivate</Btn>
                      : <Btn variant="success" onClick={() => handleStatusChange(r, "active")}>Activate</Btn>}
                  </div>
                )
              },
            ]}
            rows={Array.isArray(employees) ? employees : []}
          />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee" width="max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Inp label="Full Name *" value={form.name} onChange={f("name")} /></div>
          <Inp label="Email *" type="email" value={form.email} onChange={f("email")} />
          <Inp label="Mobile *" value={form.mobileNo} onChange={f("mobileNo")} maxLength={10} />
          <Inp label="Monthly Salary *" type="number" value={form.monthlySalary} onChange={f("monthlySalary")} />
          <Inp label="Date of Joining *" type="date" value={form.dateOfJoining} onChange={f("dateOfJoining")} />
          <Sel label="Role *" value={form.role} onChange={f("role")} options={["teacher", "principal", "admin", "accountant", "support"].map(r => ({ value: r, label: r }))} />
          <Sel label="Gender" value={form.gender} onChange={f("gender")} options={["Male", "Female", "Other"].map(g => ({ value: g, label: g }))} />
          <Inp label="Date of Birth" type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")} />
          <Sel label="Blood Group" value={form.bloodGroup} onChange={f("bloodGroup")} options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(b => ({ value: b, label: b }))} />
          <Inp label="Education" value={form.education} onChange={f("education")} />
          <Inp label="Experience" value={form.experience} onChange={f("experience")} />
          <div className="col-span-2"><Textarea label="Home Address" value={form.homeAddress} onChange={f("homeAddress")} /></div>
          <div className="col-span-2 flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Create Employee</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ""} width="max-w-lg">
        {selected && (
          <div>
            <div className="flex gap-3 items-center mb-4">
              <Avt name={selected.name} size={12} />
              <div>
                <h3 className="m-0 text-base font-semibold">{selected.name}</h3>
                <p className="m-0 text-xs text-gray-500 capitalize">{selected.role} — {selected.employeeId}</p>
                <div className="mt-1"><Badge s={selected.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["Email", selected.email], ["Mobile", selected.mobileNo], ["Salary", fmtCur(selected.monthlySalary)], ["Joined", fmt(selected.dateOfJoining)], ["Education", selected.education], ["Experience", selected.experience], ["Blood Group", selected.bloodGroup], ["Address", selected.homeAddress]].map(([k, v]) => v && (
                <div key={k} className="px-3 py-2 bg-gray-50 rounded-xl">
                  <p className="m-0 text-xs text-gray-400">{k}</p>
                  <p className="m-0 text-xs text-gray-800 mt-0.5 font-medium">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ==================== CLASSROOMS ====================
const Classrooms = () => {
  const { ayId, toast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ className: "", section: "", monthlyFees: "", capacity: 40 });
  const { data: clsRes, loading, reload } = useFetch(() => api.getClassrooms(ayId ? { academicYear: ayId } : {}), [ayId]);
  const { data: teachers } = useFetch(() => api.getEmployees({ role: "teacher", status: "active" }));
  const classes = (clsRes?.data || clsRes || []).sort((a, b) => a.order - b.order);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    const display = form.section ? `${form.className} - ${form.section}` : form.className;
    const res = await api.createClassroom({ ...form, displayName: display, monthlyFees: Number(form.monthlyFees), ...(ayId ? { academicYear: ayId } : {}), isActive: true });
    if (res.ok) { toast("Classroom created!", "success"); reload(); setShowAdd(false); }
    else toast(res.data?.message, "error");
  };

  const handleToggle = async (cls) => {
    const res = await api.toggleClassroom(cls._id);
    if (res.ok) { toast(`${cls.isActive ? "Deactivated" : "Activated"}`, "success"); reload(); }
    else toast(res.data?.message, "error");
  };

  const teacherList = teachers?.data || teachers || [];

  return (
    <div>
      <PageHdr title="Classrooms" subtitle={`${classes.length} classrooms`} actions={<Btn onClick={() => setShowAdd(true)}>+ Add Classroom</Btn>} />
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {classes.map(cls => {
            const teacher = teacherList.find(t => t._id === cls.classTeacher?._id || t._id === cls.classTeacher);
            return (
              <div key={cls._id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${cls.isActive ? "" : "opacity-60"}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="m-0 text-base font-semibold text-gray-900">{cls.displayName}</h3>
                  <Badge s={cls.isActive ? "active" : "inactive"} />
                </div>
                <p className="m-0 text-xs text-gray-400 mb-3">{teacher?.name || "No class teacher"}</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="m-0 text-xs text-gray-400">Monthly Fee</p>
                    <p className="m-0 text-sm font-semibold text-gray-900 mt-0.5">{fmtCur(cls.monthlyFees)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="m-0 text-xs text-gray-400">Capacity</p>
                    <p className="m-0 text-sm font-semibold text-gray-900 mt-0.5">{cls.capacity || "—"}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(cls)}
                  className={`w-full py-1.5 border border-gray-200 rounded-xl bg-transparent cursor-pointer text-xs font-medium transition-colors ${cls.isActive ? "text-red-600 hover:bg-red-50" : "text-green-700 hover:bg-green-50"}`}
                >
                  {cls.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Classroom" width="max-w-sm">
        <div className="flex flex-col gap-3">
          <Inp label="Class Name *" value={form.className} onChange={f("className")} placeholder="e.g. Class 1, Nursery" />
          <Inp label="Section" value={form.section} onChange={f("section")} placeholder="e.g. A, B" />
          <Inp label="Monthly Fees *" type="number" value={form.monthlyFees} onChange={f("monthlyFees")} />
          <Inp label="Capacity" type="number" value={form.capacity} onChange={f("capacity")} />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Create</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== SUBJECTS ====================
const Subjects = () => {
  const { ayId, toast } = useApp();
  const [classFilter, setClassFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [rows, setRows] = useState([{ name: "", totalMarks: 100, teacherId: "" }]);
  const [selClass, setSelClass] = useState("");
  const { data: subRes, loading, reload } = useFetch(() => api.getSubjects({ ...(ayId ? { academicYear: ayId } : {}), ...(classFilter ? { classId: classFilter } : {}) }), [ayId, classFilter]);
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const { data: teachers } = useFetch(() => api.getEmployees({ role: "teacher", status: "active" }));
  const subjects = subRes?.data || subRes || [];
  const teacherList = teachers?.data || teachers || [];
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);

  const handleCreate = async () => {
    if (!selClass) return toast("Select a class", "error");
    const payload = rows.filter(r => r.name).map(r => ({ name: r.name, totalMarks: Number(r.totalMarks), classroom: selClass, teacher: r.teacherId || undefined, ...(ayId ? { academicYear: ayId } : {}) }));
    if (!payload.length) return toast("Add at least one subject", "error");
    const res = await api.createSubjects(payload.length === 1 ? payload[0] : payload);
    if (res.ok) { toast("Subject(s) created!", "success"); reload(); setShowAdd(false); setRows([{ name: "", totalMarks: 100, teacherId: "" }]); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr
        title="Subjects"
        subtitle={`${Array.isArray(subjects) ? subjects.length : 0} subjects`}
        actions={
          <div className="flex gap-2">
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
            <Btn onClick={() => setShowAdd(true)}>+ Assign Subjects</Btn>
          </div>
        }
      />
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              { h: "Subject", r: r => <span className="font-semibold">{r.name}</span> },
              { h: "Class", r: r => r.classroom?.displayName || "—" },
              { h: "Teacher", r: r => r.teacher?.name || "Not assigned" },
              { h: "Total Marks", r: r => <span className="font-semibold text-[#1e3a5f]">{r.totalMarks}</span> },
              { h: "Status", r: r => <Badge s={r.isActive ? "active" : "inactive"} /> },
              {
                h: "Actions", r: r => (
                  <Btn variant="outline" onClick={async () => {
                    const res = await api.toggleSubject(r._id);
                    if (res.ok) { toast("Toggled", "success"); reload(); }
                  }}>Toggle</Btn>
                )
              },
            ]}
            rows={Array.isArray(subjects) ? subjects : []}
          />
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Assign Subjects" width="max-w-2xl">
        <div className="flex flex-col gap-3">
          <Sel label="Select Class *" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          <div className="grid grid-cols-[3fr_1fr_2fr_24px] gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
            <span>Subject Name</span><span>Marks</span><span>Teacher</span><span></span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[3fr_1fr_2fr_24px] gap-2 items-end">
              <Inp value={row.name} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g. Mathematics" />
              <Inp type="number" value={row.totalMarks} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, totalMarks: e.target.value } : x))} />
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={row.teacherId} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, teacherId: e.target.value } : x))}>
                <option value="">Select…</option>
                {teacherList.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {rows.length > 1 && (
                <button onClick={() => setRows(r => r.filter((_, j) => j !== i))} className="bg-transparent border-none cursor-pointer text-red-500 text-lg pb-1">×</button>
              )}
            </div>
          ))}
          <button onClick={() => setRows(r => [...r, { name: "", totalMarks: 100, teacherId: "" }])} className="bg-transparent border-none cursor-pointer text-[#1e3a5f] text-xs text-left p-0 font-medium">+ Add more</button>
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Assign</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== EXAMS & MARKS ====================
const Exams = () => {
  const { ayId, toast } = useApp();
  const [tab, setTab] = useState("exams");
  const [showAdd, setShowAdd] = useState(false);
  const [marksClass, setMarksClass] = useState("");
  const [marksExam, setMarksExam] = useState("");
  const [marksData, setMarksData] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [form, setForm] = useState({ classId: "", subjectId: "", examType: "UnitTest1", name: "", totalMarks: "", examDate: "" });
  const { data: examsRes, loading, reload } = useFetch(() => api.getExams(ayId ? { academicYear: ayId } : {}), [ayId]);
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const { data: subjects } = useFetch(() => api.getSubjects({ ...(form.classId ? { classId: form.classId } : {}), ...(ayId ? { academicYear: ayId } : {}) }), [form.classId, ayId]);
  const exams = examsRes?.data || examsRes || [];
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const classExams = (exams || []).filter(e => (!marksClass || e.classroom?._id === marksClass));

  const loadMarks = async () => {
    if (!marksExam) return;
    setLoadingMarks(true);
    const [marksRes, studRes] = await Promise.all([
      api.getMarks(marksExam),
      api.getStudents({ classId: marksClass, status: "Approved", limit: 100 })
    ]);
    const existingMarks = marksRes.ok ? (marksRes.data?.data || marksRes.data || []) : [];
    const stud = studRes.ok ? (studRes.data?.data || studRes.data || []) : [];
    setMarksData(stud.sort((a, b) => a.rollNumber - b.rollNumber).map(s => {
      const ex = existingMarks.find(m => m.student?._id === s._id || m.student === s._id);
      return { studentId: s._id, student: s, marksObtained: ex?.marksObtained ?? "", isAbsent: ex?.isAbsent || false, remarks: ex?.remarks || "" };
    }));
    setLoadingMarks(false);
  };

  const saveMarks = async () => {
    const res = await api.saveMarks(marksExam, marksData.map(m => ({ student: m.studentId, marksObtained: m.isAbsent ? 0 : Number(m.marksObtained), isAbsent: m.isAbsent, remarks: m.remarks })));
    if (res.ok) toast("Marks saved!", "success");
    else toast(res.data?.message, "error");
  };

  const handleCreate = async () => {
    const res = await api.createExam({ name: form.name, examType: form.examType, subject: form.subjectId, classroom: form.classId, totalMarks: Number(form.totalMarks), examDate: form.examDate, ...(ayId ? { academicYear: ayId } : {}) });
    if (res.ok) { toast("Exam created!", "success"); reload(); setShowAdd(false); }
    else toast(res.data?.message, "error");
  };

  const EXAM_TYPES = ["UnitTest1", "UnitTest2", "MidTerm", "FinalExam", "Project", "Other"];

  return (
    <div>
      <PageHdr title="Exams & Marks" actions={<Btn onClick={() => setShowAdd(true)}>+ Create Exam</Btn>} />
      <Tabs tabs={[{ v: "exams", l: "Exams" }, { v: "marks", l: "Enter Marks" }, { v: "results", l: "Results" }]} active={tab} onChange={setTab} />

      {tab === "exams" && (
        loading ? <Spinner /> : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Table
              cols={[
                { h: "Exam", r: r => <span className="font-semibold">{r.name}</span> },
                { h: "Class", r: r => r.classroom?.displayName || "—" },
                { h: "Subject", r: r => r.subject?.name || "—" },
                { h: "Type", k: "examType" },
                { h: "Marks", r: r => <span className="font-semibold text-[#1e3a5f]">{r.totalMarks}</span> },
                { h: "Date", r: r => fmt(r.examDate) },
                {
                  h: "Action", r: r => (
                    <Btn variant="danger" onClick={async () => {
                      if (!confirm("Delete exam and all marks?")) return;
                      const res = await api.deleteExam(r._id);
                      if (res.ok) { toast("Deleted", "success"); reload(); } else toast(res.data?.message, "error");
                    }}>Delete</Btn>
                  )
                },
              ]}
              rows={Array.isArray(exams) ? exams : []}
            />
          </div>
        )
      )}

      {tab === "marks" && (
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-40">
              <Sel label="Class" value={marksClass} onChange={e => { setMarksClass(e.target.value); setMarksExam(""); setMarksData([]); }} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
            </div>
            <div className="flex-1 min-w-40">
              <Sel label="Exam" value={marksExam} onChange={e => setMarksExam(e.target.value)} options={(classExams || []).map(e => ({ value: e._id, label: `${e.name} (${e.subject?.name})` }))} />
            </div>
            <Btn onClick={loadMarks} loading={loadingMarks}>Load Students</Btn>
            {marksData.length > 0 && <Btn variant="success" onClick={saveMarks}>Save Marks</Btn>}
          </div>
          {marksData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex gap-2 mb-3">
                <Btn variant="outline" onClick={() => setMarksData(d => d.map(x => ({ ...x, isAbsent: false })))}>All Present</Btn>
                <Btn variant="outline" onClick={() => setMarksData(d => d.map(x => ({ ...x, isAbsent: true, marksObtained: "" })))}>All Absent</Btn>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Roll", "Student", "Marks", "Absent", "Remarks"].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marksData.map((m, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{m.student.rollNumber}</td>
                        <td className="px-3 py-2 font-semibold text-gray-800">{m.student.firstName} {m.student.lastName}</td>
                        <td className="px-3 py-2 text-center">
                          <input type="number" value={m.marksObtained} disabled={m.isAbsent}
                            onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, marksObtained: e.target.value } : x))}
                            className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={m.isAbsent}
                            onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, isAbsent: e.target.checked, marksObtained: e.target.checked ? "" : x.marksObtained } : x))} />
                        </td>
                        <td className="px-3 py-2">
                          <input value={m.remarks}
                            onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, remarks: e.target.value } : x))}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none w-36" placeholder="Optional" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "results" && <ExamResults exams={exams} ayId={ayId} />}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Exam" width="max-w-md">
        <div className="flex flex-col gap-3">
          <Sel label="Class *" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, subjectId: "" }))} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          <Sel label="Subject *" value={form.subjectId} onChange={f("subjectId")} options={(subjects?.data || subjects || []).map(s => ({ value: s._id, label: s.name }))} />
          <Sel label="Exam Type *" value={form.examType} onChange={f("examType")} options={EXAM_TYPES.map(t => ({ value: t, label: t }))} />
          <Inp label="Exam Name *" value={form.name} onChange={f("name")} placeholder="e.g. Unit Test 1 - Mathematics" />
          <Inp label="Total Marks *" type="number" value={form.totalMarks} onChange={f("totalMarks")} />
          <Inp label="Exam Date *" type="date" value={form.examDate} onChange={f("examDate")} />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Create Exam</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ExamResults = ({ exams, ayId }) => {
  const { data: resultsData } = useFetch(() => api.getExamResults(ayId ? { academicYear: ayId } : {}), [ayId]);
  const results = resultsData?.data || resultsData || [];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <Table
        cols={[
          { h: "Exam", r: r => r._id?.exam?.name || "—" },
          { h: "Class", r: r => r._id?.classroom?.displayName || "—" },
          { h: "Students", k: "totalStudents" },
          { h: "Present", k: "presentStudents" },
          { h: "Absent", k: "absentStudents" },
          { h: "Avg Marks", r: r => <span className="font-semibold">{r.averageMarks || 0}</span> },
          { h: "Highest", r: r => <span className="text-green-700 font-semibold">{r.highestMarks || 0}</span> },
          { h: "A+ Count", r: r => r.gradeAPlus || 0 },
          { h: "Fail Count", r: r => <span className={r.gradeF > 0 ? "text-red-600" : ""}>{r.gradeF || 0}</span> },
        ]}
        rows={Array.isArray(results) ? results : []}
      />
    </div>
  );
};

// ==================== ATTENDANCE ====================
const AttendanceView = ({ type = "student" }) => {
  const { ayId, toast } = useApp();
  const [selClass, setSelClass] = useState("");
  const [selDate, setSelDate] = useState(new Date().toISOString().split("T")[0]);
  const [attData, setAttData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);
  const STU_STATUS = ["Present", "Absent", "Late", "HalfDay", "Holiday"];
  const EMP_STATUS = ["Present", "Absent", "Late", "HalfDay", "OnLeave", "Holiday"];
  const statuses = type === "student" ? STU_STATUS : EMP_STATUS;

  const loadData = async () => {
    if (type === "student" && !selClass) return toast("Select class", "error");
    setLoading(true);
    if (type === "student") {
      const [studRes, attRes] = await Promise.all([
        api.getStudents({ classId: selClass, status: "Approved", limit: 100 }),
        api.getStudentAttendance({ classId: selClass, date: selDate })
      ]);
      const students = studRes.ok ? (studRes.data?.data || studRes.data || []) : [];
      const existing = attRes.ok ? (attRes.data?.data || attRes.data || []) : [];
      setAttData(students.sort((a, b) => a.rollNumber - b.rollNumber).map(s => {
        const ex = existing.find(a => a.student?._id === s._id || a.student === s._id);
        return { id: s._id, name: `${s.firstName} ${s.lastName}`, rollNo: s.rollNumber, status: ex?.status || "Present", remark: ex?.remark || "" };
      }));
    } else {
      const [empRes, attRes] = await Promise.all([
        api.getEmployees({ status: "active" }),
        api.getEmployeeAttendance({ date: selDate })
      ]);
      const employees = empRes.ok ? (empRes.data?.data || empRes.data || []) : [];
      const existing = attRes.ok ? (attRes.data?.data || attRes.data || []) : [];
      setAttData(employees.map(e => {
        const ex = existing.find(a => a.employee?._id === e._id || a.employee === e._id);
        return { id: e._id, name: e.name, role: e.role, status: ex?.status || "Present", remark: ex?.remark || "" };
      }));
    }
    setLoading(false);
  };

  const saveAttendance = async () => {
    const records = attData.map(a => ({
      ...(type === "student" ? { student: a.id, classroom: selClass } : { employee: a.id }),
      date: selDate, status: a.status, remark: a.remark, ...(ayId ? { academicYear: ayId } : {})
    }));
    const res = type === "student" ? await api.markStudentAttendance(records) : await api.markEmployeeAttendance(records);
    if (res.ok) toast("Attendance saved!", "success");
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr title={type === "student" ? "Student Attendance" : "Staff Attendance"} />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex gap-3 flex-wrap items-end">
        {type === "student" && (
          <div className="min-w-44">
            <Sel label="Class" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:border-blue-500" value={selDate} onChange={e => setSelDate(e.target.value)} />
        </div>
        <Btn onClick={loadData} loading={loading}>Load</Btn>
        {attData.length > 0 && <>
          <Btn variant="outline" onClick={() => setAttData(d => d.map(x => ({ ...x, status: "Present" })))}>All Present</Btn>
          <Btn variant="outline" onClick={() => setAttData(d => d.map(x => ({ ...x, status: "Absent" })))}>All Absent</Btn>
          <Btn variant="success" onClick={saveAttendance}>Save Attendance</Btn>
        </>}
      </div>
      {attData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-x-auto">
          <p className="text-xs text-gray-500 mb-3">
            {fmt(selDate)} — Present: <strong>{attData.filter(a => a.status === "Present").length}</strong> / {attData.length}
          </p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {type === "student" && <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Roll</th>}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Name</th>
                {type === "employee" && <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Role</th>}
                {statuses.map(s => <th key={s} className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">{s}</th>)}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Remark</th>
              </tr>
            </thead>
            <tbody>
              {attData.map((a, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {type === "student" && <td className="px-3 py-2 font-mono text-xs text-gray-500">{a.rollNo}</td>}
                  <td className="px-3 py-2 font-semibold text-gray-800">{a.name}</td>
                  {type === "employee" && <td className="px-3 py-2 capitalize text-gray-500">{a.role}</td>}
                  {statuses.map(s => (
                    <td key={s} className="px-3 py-2 text-center">
                      <input type="radio" name={`att-${i}`} checked={a.status === s}
                        onChange={() => setAttData(d => d.map((x, j) => j === i ? { ...x, status: s } : x))} />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <input value={a.remark}
                      onChange={e => setAttData(d => d.map((x, j) => j === i ? { ...x, remark: e.target.value } : x))}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none w-28" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ==================== FEES ====================
const Fees = () => {
  const { ayId, toast } = useApp();
  const [tab, setTab] = useState("list");
  const [selFee, setSelFee] = useState(null);
  const [showPay, setShowPay] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [payForm, setPayForm] = useState({ amountPaid: "", paymentMode: "Cash", transactionId: "", notes: "" });
  const [genForm, setGenForm] = useState({ studentId: "", month: new Date().getMonth() + 1, year: 2024, tuitionFee: "", transportFee: 0, activityFee: 0, otherFee: 0, discount: 0 });
  const { data: feesRes, loading, reload } = useFetch(() => api.getFees({ ...(ayId ? { academicYear: ayId } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(classFilter ? { classId: classFilter } : {}) }), [ayId, statusFilter, classFilter]);
  const { data: students } = useFetch(() => api.getStudents({ status: "Approved", limit: 200 }));
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const { data: defaulters } = useFetch(() => api.getFeeDefaulters(ayId ? { academicYear: ayId } : {}), [ayId]);
  const { data: receiptsRes } = useFetch(() => api.getAllReceipts({ ...(ayId ? { academicYear: ayId } : {}), limit: 50 }), [ayId]);
  const fees = feesRes?.data || feesRes || [];
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);
  const studentList = students?.data || students || [];
  const defaulterList = defaulters?.data || defaulters || [];
  const receipts = receiptsRes?.data || receiptsRes || [];

  const handleCollect = async () => {
    const res = await api.collectPayment(selFee._id, { ...payForm, amountPaid: Number(payForm.amountPaid) });
    if (res.ok) { toast(`Receipt: ${res.data?.data?.receiptNo}`, "success"); reload(); setShowPay(false); }
    else toast(res.data?.message, "error");
  };

  const handleGenerate = async () => {
    const student = studentList.find(s => s._id === genForm.studentId);
    if (!student) return toast("Select student", "error");
    const total = Number(genForm.tuitionFee) + Number(genForm.transportFee) + Number(genForm.activityFee) + Number(genForm.otherFee);
    const res = await api.createFee({ ...genForm, classroom: student.classroom?._id || student.classroom, totalAmount: total, finalAmount: total - Number(genForm.discount), dueDate: `${genForm.year}-${String(genForm.month).padStart(2, "0")}-10`, ...(ayId ? { academicYear: ayId } : {}) });
    if (res.ok) { toast("Fee created!", "success"); reload(); setShowGen(false); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr title="Fee Management" actions={<Btn onClick={() => setShowGen(true)}>+ Generate Fee</Btn>} />
      <Tabs tabs={[{ v: "list", l: "Fee List" }, { v: "defaulters", l: "Defaulters" }, { v: "receipts", l: "Receipts" }]} active={tab} onChange={setTab} />

      {tab === "list" && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {["Pending", "Paid", "Overdue", "PartiallyPaid"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
          </div>
          {loading ? <Spinner /> : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Table
                cols={[
                  {
                    h: "Student", r: r => (
                      <div>
                        <p className="m-0 font-semibold text-xs">{r.student?.firstName} {r.student?.lastName}</p>
                        <p className="m-0 text-xs text-gray-400">{r.student?.admissionNo}</p>
                      </div>
                    )
                  },
                  { h: "Class", r: r => r.classroom?.displayName || "—" },
                  { h: "Month", r: r => `${MONTHS[(r.month || 1) - 1]} ${r.year}` },
                  { h: "Amount", r: r => <span className="font-semibold">{fmtCur(r.finalAmount)}</span> },
                  { h: "Status", r: r => <Badge s={r.status} /> },
                  { h: "Due Date", r: r => fmt(r.dueDate) },
                  {
                    h: "Actions", r: r => (
                      <div className="flex gap-1.5">
                        {r.status !== "Paid" && r.status !== "Waived" && (
                          <Btn variant="success" onClick={() => { setSelFee(r); setPayForm({ amountPaid: r.finalAmount, paymentMode: "Cash", transactionId: "", notes: "" }); setShowPay(true); }}>Collect</Btn>
                        )}
                        {r.status === "Paid" && <Badge s="Paid" />}
                      </div>
                    )
                  },
                ]}
                rows={Array.isArray(fees) ? fees : []}
              />
            </div>
          )}
        </div>
      )}

      {tab === "defaulters" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              { h: "Student", r: r => <span className="font-semibold">{r.student?.firstName} {r.student?.lastName}</span> },
              { h: "Class", r: r => r.classroom?.displayName || "—" },
              { h: "Month", r: r => `${MONTHS[(r.month || 1) - 1]} ${r.year}` },
              { h: "Due Amount", r: r => <span className="text-red-600 font-bold">{fmtCur(r.finalAmount)}</span> },
              { h: "Status", r: r => <Badge s={r.status} /> },
              { h: "Father Phone", r: r => r.student?.fatherPhone || "—" },
            ]}
            rows={Array.isArray(defaulterList) ? defaulterList : []}
          />
        </div>
      )}

      {tab === "receipts" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              { h: "Receipt No", r: r => <span className="font-mono text-xs text-[#1e3a5f]">{r.receiptNo}</span> },
              { h: "Student", r: r => `${r.student?.firstName} ${r.student?.lastName}` },
              { h: "Amount", r: r => <span className="font-semibold text-green-700">{fmtCur(r.amountPaid)}</span> },
              { h: "Mode", k: "paymentMode" },
              { h: "Date", r: r => fmt(r.paymentDate) },
            ]}
            rows={Array.isArray(receipts) ? receipts : []}
          />
        </div>
      )}

      <Modal open={showPay && !!selFee} onClose={() => setShowPay(false)} title="Collect Payment" width="max-w-sm">
        {selFee && (
          <div className="flex flex-col gap-3">
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between">
              <span className="text-xs text-gray-500">Total Due</span>
              <span className="text-base font-bold text-red-600">{fmtCur(selFee.finalAmount)}</span>
            </div>
            <Inp label="Amount to Pay *" type="number" value={payForm.amountPaid} onChange={e => setPayForm(p => ({ ...p, amountPaid: e.target.value }))} />
            <Sel label="Payment Mode" value={payForm.paymentMode} onChange={e => setPayForm(p => ({ ...p, paymentMode: e.target.value }))} options={["Cash", "Cheque", "Online", "UPI", "BankTransfer"].map(m => ({ value: m, label: m }))} />
            {payForm.paymentMode !== "Cash" && <Inp label="Transaction ID" value={payForm.transactionId} onChange={e => setPayForm(p => ({ ...p, transactionId: e.target.value }))} />}
            <Textarea label="Notes" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Btn variant="outline" onClick={() => setShowPay(false)}>Cancel</Btn>
              <Btn variant="success" onClick={handleCollect}>Generate Receipt</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showGen} onClose={() => setShowGen(false)} title="Generate Fee Record" width="max-w-md">
        <div className="flex flex-col gap-3">
          <Sel label="Student *" value={genForm.studentId} onChange={e => setGenForm(p => ({ ...p, studentId: e.target.value }))} options={studentList.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName} (${s.admissionNo})` }))} />
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Month *" value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: Number(e.target.value) }))} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            <Inp label="Year *" type="number" value={genForm.year} onChange={e => setGenForm(p => ({ ...p, year: Number(e.target.value) }))} />
          </div>
          <Inp label="Tuition Fee *" type="number" value={genForm.tuitionFee} onChange={e => setGenForm(p => ({ ...p, tuitionFee: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <Inp label="Transport" type="number" value={genForm.transportFee} onChange={e => setGenForm(p => ({ ...p, transportFee: e.target.value }))} />
            <Inp label="Activity" type="number" value={genForm.activityFee} onChange={e => setGenForm(p => ({ ...p, activityFee: e.target.value }))} />
            <Inp label="Discount" type="number" value={genForm.discount} onChange={e => setGenForm(p => ({ ...p, discount: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowGen(false)}>Cancel</Btn>
            <Btn onClick={handleGenerate}>Generate</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== PAYROLL ====================
const Payroll = () => {
  const { ayId, toast } = useApp();
  const [showGen, setShowGen] = useState(false);
  const [monthFilter, setMonthFilter] = useState("");
  const [genForm, setGenForm] = useState({ employeeId: "", month: new Date().getMonth() + 1, year: 2024, bonus: 0, paymentMode: "BankTransfer" });
  const { data: payrollRes, loading, reload } = useFetch(() => api.getPayroll({ ...(monthFilter ? { month: monthFilter } : {}), ...(ayId ? { academicYear: ayId } : {}) }), [monthFilter, ayId]);
  const { data: employees } = useFetch(() => api.getEmployees({ status: "active" }));
  const payroll = payrollRes?.data || payrollRes || [];
  const empList = employees?.data || employees || [];
  const f = (k) => (e) => setGenForm(p => ({ ...p, [k]: e.target.value }));

  const handleGenerate = async () => {
    if (!genForm.employeeId) return toast("Select employee", "error");
    const res = await api.generatePayroll({ employee: genForm.employeeId, month: Number(genForm.month), year: Number(genForm.year), bonus: Number(genForm.bonus), paymentMode: genForm.paymentMode, ...(ayId ? { academicYear: ayId } : {}) });
    if (res.ok) { toast("Payroll generated!", "success"); reload(); setShowGen(false); }
    else toast(res.data?.message, "error");
  };

  const handleMarkPaid = async (id) => {
    const res = await api.markPayrollPaid(id);
    if (res.ok) { toast("Marked as paid!", "success"); reload(); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr
        title="Payroll Management"
        actions={
          <div className="flex gap-2">
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <Btn onClick={() => setShowGen(true)}>+ Generate Payroll</Btn>
          </div>
        }
      />
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              {
                h: "Employee", r: r => (
                  <div className="flex items-center gap-2">
                    <Avt name={r.employee?.name || "?"} size={7} />
                    <span className="font-semibold">{r.employee?.name}</span>
                  </div>
                )
              },
              { h: "Month", r: r => `${MONTHS[(r.month || 1) - 1]} ${r.year}` },
              { h: "Basic", r: r => fmtCur(r.basicSalary) },
              { h: "Present", k: "daysPresent" },
              { h: "Absent", k: "daysAbsent" },
              { h: "Deductions", r: r => <span className="text-red-600">-{fmtCur(r.deductions)}</span> },
              { h: "Bonus", r: r => r.bonus > 0 ? <span className="text-green-700">+{fmtCur(r.bonus)}</span> : "—" },
              { h: "Net Salary", r: r => <span className="font-bold text-green-700">{fmtCur(r.netSalary)}</span> },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => r.status === "Pending"
                  ? <Btn variant="success" onClick={() => handleMarkPaid(r._id)}>Mark Paid</Btn>
                  : <span className="text-xs text-green-700">Paid {fmt(r.paymentDate)}</span>
              },
            ]}
            rows={Array.isArray(payroll) ? payroll : []}
          />
        </div>
      )}
      <Modal open={showGen} onClose={() => setShowGen(false)} title="Generate Payroll" width="max-w-sm">
        <div className="flex flex-col gap-3">
          <Sel label="Employee *" value={genForm.employeeId} onChange={f("employeeId")} options={empList.map(e => ({ value: e._id, label: `${e.name} (${e.employeeId})` }))} />
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Month" value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: Number(e.target.value) }))} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            <Inp label="Year" type="number" value={genForm.year} onChange={f("year")} />
          </div>
          <Inp label="Bonus" type="number" value={genForm.bonus} onChange={f("bonus")} />
          <Sel label="Payment Mode" value={genForm.paymentMode} onChange={f("paymentMode")} options={["Cash", "BankTransfer", "Cheque"].map(m => ({ value: m, label: m }))} />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowGen(false)}>Cancel</Btn>
            <Btn onClick={handleGenerate}>Generate</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== LEAVES ====================
const Leaves = ({ role }) => {
  const { ayId, toast } = useApp();
  const [showApply, setShowApply] = useState(false);
  const [remarkModal, setRemarkModal] = useState(false);
  const [selLeave, setSelLeave] = useState(null);
  const [action, setAction] = useState("");
  const [remark, setRemark] = useState("");
  const [form, setForm] = useState({ leaveType: "Casual", fromDate: "", toDate: "", reason: "" });
  const { data: leavesRes, loading, reload } = useFetch(() => api.getLeaves({ ...(ayId ? { academicYear: ayId } : {}) }), [ayId]);
  const { data: employees } = useFetch(() => api.getEmployees({ status: "active" }));
  const leaves = leavesRes?.data || leavesRes || [];
  const [empId, setEmpId] = useState("");
  const empList = employees?.data || employees || [];
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleApply = async () => {
    const id = role === "teacher" ? (empList[0]?._id) : empId;
    if (!id || !form.fromDate || !form.toDate || !form.reason) return toast("Fill all fields", "error");
    const days = Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1;
    const res = await api.applyLeave({ employee: id, ...form, totalDays: days, ...(ayId ? { academicYear: ayId } : {}) });
    if (res.ok) { toast("Leave applied!", "success"); reload(); setShowApply(false); }
    else toast(res.data?.message, "error");
  };

  const handleAction = async () => {
    const res = await api.leaveAction(selLeave._id, { status: action, approvalRemark: remark });
    if (res.ok) { toast(`Leave ${action.toLowerCase()}!`, action === "Approved" ? "success" : "error"); reload(); setRemarkModal(false); setRemark(""); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr title={role === "teacher" ? "My Leaves" : "Leave Requests"} actions={<Btn onClick={() => setShowApply(true)}>+ Apply Leave</Btn>} />
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            cols={[
              ...(role !== "teacher" ? [{ h: "Employee", r: (r) => <span className="font-semibold">{r.employee?.name || "—"}</span> }] : []),
              { h: "Type", k: "leaveType" },
              { h: "From", r: r => fmt(r.fromDate) },
              { h: "To", r: r => fmt(r.toDate) },
              { h: "Days", k: "totalDays" },
              { h: "Reason", r: r => <span className="max-w-48 block truncate">{r.reason}</span> },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (role === "admin" || role === "principal") && r.status === "Pending" ? (
                  <div className="flex gap-1.5">
                    <Btn variant="success" onClick={() => { setSelLeave(r); setAction("Approved"); setRemarkModal(true); }}>Approve</Btn>
                    <Btn variant="danger" onClick={() => { setSelLeave(r); setAction("Rejected"); setRemarkModal(true); }}>Reject</Btn>
                  </div>
                ) : <span className="text-xs text-gray-400">{r.approvalRemark || "—"}</span>
              },
            ]}
            rows={Array.isArray(leaves) ? leaves : []}
          />
        </div>
      )}

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave" width="max-w-sm">
        <div className="flex flex-col gap-3">
          {(role === "admin" || role === "principal") && (
            <Sel label="Employee *" value={empId} onChange={e => setEmpId(e.target.value)} options={empList.map(e => ({ value: e._id, label: e.name }))} />
          )}
          <Sel label="Leave Type *" value={form.leaveType} onChange={f("leaveType")} options={["Sick", "Casual", "Earned", "Maternity", "Unpaid", "Other"].map(t => ({ value: t, label: t }))} />
          <div className="grid grid-cols-2 gap-3">
            <Inp label="From Date *" type="date" value={form.fromDate} onChange={f("fromDate")} />
            <Inp label="To Date *" type="date" value={form.toDate} onChange={f("toDate")} />
          </div>
          <Textarea label="Reason *" value={form.reason} onChange={f("reason")} />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowApply(false)}>Cancel</Btn>
            <Btn onClick={handleApply}>Submit</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={remarkModal} onClose={() => setRemarkModal(false)} title={`${action} Leave`} width="max-w-xs">
        <div className="flex flex-col gap-3">
          <Textarea label="Remark (optional)" value={remark} onChange={e => setRemark(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setRemarkModal(false)}>Cancel</Btn>
            <Btn variant={action === "Approved" ? "success" : "danger"} onClick={handleAction}>{action}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== HOMEWORK ====================
const Homework = ({ role }) => {
  const { ayId, toast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [form, setForm] = useState({ classId: "", subjectId: "", title: "", description: "", dueDate: "" });
  const { data: hwRes, loading, reload } = useFetch(() => api.getHomework({ ...(ayId ? { academicYear: ayId } : {}), ...(classFilter ? { classId: classFilter } : {}) }), [ayId, classFilter]);
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const { data: subjects } = useFetch(() => api.getSubjects({ ...(form.classId ? { classId: form.classId } : {}), ...(ayId ? { academicYear: ayId } : {}) }), [form.classId, ayId]);
  const homework = hwRes?.data || hwRes || [];
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.classId || !form.subjectId || !form.title || !form.dueDate) return toast("Fill required fields", "error");
    const res = await api.assignHomework({ classroom: form.classId, subject: form.subjectId, title: form.title, description: form.description, dueDate: form.dueDate, ...(ayId ? { academicYear: ayId } : {}), teacher: "" });
    if (res.ok) { toast("Homework assigned!", "success"); reload(); setShowAdd(false); }
    else toast(res.data?.message, "error");
  };

  const handleDelete = async (id) => {
    const res = await api.deleteHomework(id);
    if (res.ok) { toast("Deleted", "success"); reload(); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr
        title="Homework"
        actions={
          <div className="flex gap-2">
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-xs text-gray-700 outline-none" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
            {role !== "parent" && <Btn onClick={() => setShowAdd(true)}>+ Assign Homework</Btn>}
          </div>
        }
      />
      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-3">
          {(Array.isArray(homework) ? homework : []).map(hw => {
            const overdue = new Date(hw.dueDate) < new Date();
            return (
              <div key={hw._id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 ${overdue ? "border-l-red-400" : "border-l-[#1e3a5f]"}`}>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex gap-2 items-center mb-1.5">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{hw.subject?.name || "—"}</span>
                      <span className="text-xs text-gray-400">{hw.classroom?.displayName || "—"}</span>
                    </div>
                    <h4 className="m-0 text-sm font-semibold text-gray-900">{hw.title}</h4>
                    {hw.description && <p className="m-0 text-xs text-gray-500 mt-1">{hw.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="m-0 text-xs text-gray-400">Due</p>
                    <p className={`m-0 text-sm font-semibold ${overdue ? "text-red-600" : "text-gray-900"}`}>{fmt(hw.dueDate)}</p>
                    {role !== "parent" && (
                      <button onClick={() => handleDelete(hw._id)} className="mt-1.5 bg-transparent border-none cursor-pointer text-xs text-red-500">Delete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {(!homework || !homework.length) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No homework found</div>
          )}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Assign Homework" width="max-w-md">
        <div className="flex flex-col gap-3">
          <Sel label="Class *" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, subjectId: "" }))} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          <Sel label="Subject *" value={form.subjectId} onChange={f("subjectId")} options={(subjects?.data || subjects || []).map(s => ({ value: s._id, label: s.name }))} />
          <Inp label="Title *" value={form.title} onChange={f("title")} />
          <Textarea label="Description" value={form.description} onChange={f("description")} />
          <Inp label="Due Date *" type="date" value={form.dueDate} onChange={f("dueDate")} />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Assign</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== TIMETABLE ====================
const Timetable = () => {
  const { ayId, toast } = useApp();
  const [selClass, setSelClass] = useState("");
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const { data: ttData } = useFetch(() => selClass ? api.getTimetableForClass(selClass, ayId ? { academicYear: ayId } : {}) : Promise.resolve({ ok: true, data: null }), [selClass, ayId]);
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);
  const tt = ttData?.data || ttData;
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div>
      <PageHdr title="Timetable" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <Sel label="Select Class" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
      </div>
      {tt && tt.schedule ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="px-3 py-3 text-left font-semibold">Period</th>
                {DAYS.filter(d => tt.schedule.some(s => s.day === d)).map(d => (
                  <th key={d} className="px-3 py-3 text-center font-semibold">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(p => {
                const anyPeriod = tt.schedule.some(s => s.periods?.some(per => per.periodNo === p));
                if (!anyPeriod) return null;
                return (
                  <tr key={p} className="border-b border-gray-50">
                    <td className="px-3 py-2.5 font-semibold">
                      <p className="m-0">P{p}</p>
                      <p className="m-0 text-xs text-gray-400">
                        {tt.schedule[0]?.periods?.find(per => per.periodNo === p)?.startTime}–{tt.schedule[0]?.periods?.find(per => per.periodNo === p)?.endTime}
                      </p>
                    </td>
                    {DAYS.filter(d => tt.schedule.some(s => s.day === d)).map(day => {
                      const ds = tt.schedule.find(s => s.day === day);
                      const per = ds?.periods?.find(per => per.periodNo === p);
                      return (
                        <td key={day} className="px-3 py-2.5 text-center">
                          {per?.subject ? (
                            <div className="bg-gray-50 rounded-xl px-2 py-1.5">
                              <p className="m-0 font-semibold text-[#1e3a5f] text-xs">{per.subject?.name || "—"}</p>
                              <p className="m-0 text-xs text-gray-400 mt-0.5">{per.teacher?.name?.split(" ")[0] || "—"}</p>
                            </div>
                          ) : <span className="text-gray-200">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : selClass ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No timetable configured for this class</div>
      ) : null}
    </div>
  );
};

// ==================== NOTICES ====================
const Notices = ({ role }) => {
  const { ayId, toast } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", targetRoles: ["parent", "teacher"], priority: "Normal", publishDate: new Date().toISOString().split("T")[0], expiryDate: "" });
  const { data: noticesRes, loading, reload } = useFetch(() => api.getNotices(ayId ? { academicYear: ayId } : {}), [ayId]);
  const notices = noticesRes?.data || noticesRes || [];
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.title || !form.content) return toast("Fill required fields", "error");
    const res = await api.createNotice({ ...form, ...(ayId ? { academicYear: ayId } : {}) });
    if (res.ok) { toast("Notice published!", "success"); reload(); setShowAdd(false); }
    else toast(res.data?.message, "error");
  };

  const handleDelete = async (id) => {
    const res = await api.deleteNotice(id);
    if (res.ok) { toast("Deleted", "success"); reload(); }
    else toast(res.data?.message, "error");
  };

  const priorityLeft = { Normal: "border-l-blue-400", Important: "border-l-yellow-400", Urgent: "border-l-red-400" };
  const priorityBg = { Normal: "bg-blue-50", Important: "bg-yellow-50", Urgent: "bg-red-50" };

  return (
    <div>
      <PageHdr
        title="Notice Board"
        actions={(role === "admin" || role === "principal") && <Btn onClick={() => setShowAdd(true)}>+ Create Notice</Btn>}
      />
      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-3">
          {(Array.isArray(notices) ? notices : []).map(n => (
            <div key={n._id} className={`rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 ${priorityLeft[n.priority] || "border-l-blue-400"} ${priorityBg[n.priority] || "bg-white"}`}>
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex gap-2 items-center mb-1.5">
                    <h4 className="m-0 text-sm font-semibold text-gray-900">{n.title}</h4>
                    <Badge s={n.priority} />
                  </div>
                  <p className="m-0 text-sm text-gray-700">{n.content}</p>
                  <div className="flex gap-1.5 mt-2">
                    {(n.targetRoles || []).map(r => (
                      <span key={r} className="text-xs px-2 py-0.5 bg-white/60 rounded-full capitalize text-gray-600">{r}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="m-0 text-xs text-gray-500">{fmt(n.publishDate)}</p>
                  {(role === "admin" || role === "principal") && (
                    <button onClick={() => handleDelete(n._id)} className="mt-1.5 bg-transparent border-none cursor-pointer text-xs text-red-500">Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!notices || !notices.length) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No notices</div>
          )}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Notice" width="max-w-lg">
        <div className="flex flex-col gap-3">
          <Inp label="Title *" value={form.title} onChange={f("title")} />
          <Textarea label="Content *" value={form.content} onChange={f("content")} />
          <Sel label="Priority" value={form.priority} onChange={f("priority")} options={["Normal", "Important", "Urgent"].map(p => ({ value: p, label: p }))} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target Audience</label>
            <div className="flex gap-4">
              {["parent", "teacher", "admin"].map(r => (
                <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer capitalize">
                  <input type="checkbox" checked={(form.targetRoles || []).includes(r)}
                    onChange={e => setForm(p => ({ ...p, targetRoles: e.target.checked ? [...(p.targetRoles || []), r] : (p.targetRoles || []).filter(x => x !== r) }))} />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Publish Date" type="date" value={form.publishDate} onChange={f("publishDate")} />
            <Inp label="Expiry Date" type="date" value={form.expiryDate} onChange={f("expiryDate")} />
          </div>
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Publish</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ==================== PROMOTE ====================
const Promote = () => {
  const { ayId, toast } = useApp();
  const [selClass, setSelClass] = useState("");
  const [preview, setPreview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);

  const loadPreview = async () => {
    if (!selClass) return toast("Select class", "error");
    setLoading(true);
    const res = await api.previewPromotions({ classId: selClass, ...(ayId ? { academicYear: ayId } : {}) });
    if (res.ok) {
      const d = res.data?.data || res.data;
      setPreview(d);
      setStudents((d?.students || []).map(s => ({ ...s, action: "Promoted", nextClassId: d?.nextClass?._id || "" })));
    } else toast(res.data?.message, "error");
    setLoading(false);
  };

  const executePromote = async () => {
    if (!confirm(`Promote ${students.filter(s => s.action === "Promoted").length} students?`)) return;
    const res = await api.executePromotions(students.map(s => ({
      studentId: s._id, action: s.action,
      nextClassId: s.action === "Promoted" ? s.nextClassId : undefined,
      leavingReason: s.action === "Left" ? "End of year" : undefined
    })));
    if (res.ok) { toast("Promotion complete!", "success"); setPreview(null); setStudents([]); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr title="Promote Students" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex gap-3 items-end flex-wrap">
        <div className="flex-1 max-w-xs">
          <Sel label="From Class" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
        </div>
        <Btn onClick={loadPreview} loading={loading}>Load Preview</Btn>
        {students.length > 0 && <Btn variant="success" onClick={executePromote}>Execute Promotion</Btn>}
      </div>
      {preview && (
        <div>
          <div className="flex gap-3 mb-3 items-center flex-wrap">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1">
              <p className="m-0 text-xs text-gray-400">From Class</p>
              <p className="m-0 text-base font-semibold mt-1">{preview.currentClass?.displayName}</p>
            </div>
            <div className="text-gray-400 text-lg">→</div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1">
              <p className="m-0 text-xs text-gray-400">To Class</p>
              <p className="m-0 text-base font-semibold mt-1">{preview.nextClass?.displayName || "Not configured"}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1 text-center">
              <p className="m-0 text-xs text-gray-400">Total Students</p>
              <p className="m-0 text-2xl font-semibold mt-1">{preview.totalCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Roll", "Student", "Result", "Promote To"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id} className="border-b border-gray-50">
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.rollNumber}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-800">{s.firstName} {s.lastName}</td>
                    <td className="px-3 py-2.5">
                      <select className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white outline-none" value={s.action} onChange={e => setStudents(d => d.map((x, j) => j === i ? { ...x, action: e.target.value } : x))}>
                        <option value="Promoted">Promoted</option>
                        <option value="Detained">Detained</option>
                        <option value="Left">Left School</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      {s.action === "Promoted" ? (
                        <select className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white outline-none" value={s.nextClassId} onChange={e => setStudents(d => d.map((x, j) => j === i ? { ...x, nextClassId: e.target.value } : x))}>
                          {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
                        </select>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== REPORTS ====================
const Reports = () => {
  const { ayId } = useApp();
  const [tab, setTab] = useState("overview");
  const { data: overview } = useFetch(() => api.getOverview(ayId ? { academicYear: ayId } : {}), [ayId]);
  const { data: feeData } = useFetch(() => api.getFeeCollection({ year: new Date().getFullYear(), ...(ayId ? { academicYear: ayId } : {}) }), [ayId]);
  const { data: lowAtt } = useFetch(() => api.getLowAttendance({ threshold: 75, ...(ayId ? { academicYear: ayId } : {}) }), [ayId]);
  const { data: classwiseData } = useFetch(() => api.getClasswiseStudents(ayId ? { academicYear: ayId } : {}), [ayId]);
  const { data: payrollSummary } = useFetch(() => api.getPayrollSummary({ year: new Date().getFullYear() }), []);

  const feeChart = (feeData || []).map(d => ({ month: MONTHS[d.month - 1], collected: d.totalCollected || 0, pending: d.totalPending || 0 }));
  const cwChart = (classwiseData || []).map(d => ({ name: d._id?.displayName || "—", boys: d.boys || 0, girls: d.girls || 0 }));

  return (
    <div>
      <PageHdr title="Reports & Analytics" />
      <Tabs tabs={[{ v: "overview", l: "Overview" }, { v: "fees", l: "Fee Reports" }, { v: "attendance", l: "Attendance" }, { v: "payroll", l: "Payroll" }]} active={tab} onChange={setTab} />

      {tab === "overview" && overview && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total Students" value={overview.students?.total || 0} />
            <StatCard label="Approved" value={overview.students?.approved || 0} color="text-green-700" />
            <StatCard label="Active Employees" value={overview.employees?.active || 0} />
            <StatCard label="Fee Collected" value={fmtCur(overview.fees?.collected)} color="text-green-700" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">Class-wise Distribution (Boys vs Girls)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cwChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="boys" fill="#1e3a5f" name="Boys" radius={[2, 2, 0, 0]} />
                <Bar dataKey="girls" fill="#e879f9" name="Girls" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "fees" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 m-0 mb-4">Monthly Fee Collection</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={feeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip formatter={v => fmtCur(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" fill="#166534" name="Collected" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pending" fill="#991b1b" name="Pending" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "attendance" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 m-0">Low Attendance Students (below 75%)</h3>
          </div>
          <Table
            cols={[
              { h: "Student", r: r => <span className="font-semibold">{r._id?.firstName} {r._id?.lastName}</span> },
              { h: "Adm No", r: r => r._id?.admissionNo },
              { h: "Present", k: "present" },
              { h: "Total", k: "total" },
              { h: "Attendance %", r: r => <span className={`font-bold ${r.percentage < 60 ? "text-red-600" : "text-yellow-700"}`}>{r.percentage}%</span> },
            ]}
            rows={lowAtt?.data || lowAtt || []}
          />
        </div>
      )}

      {tab === "payroll" && (
        <div>
          {payrollSummary?.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <StatCard label="Total Employees" value={payrollSummary.summary.totalEmployees || 0} />
              <StatCard label="Total Basic" value={fmtCur(payrollSummary.summary.totalBasic)} />
              <StatCard label="Total Net Paid" value={fmtCur(payrollSummary.summary.totalNet)} color="text-green-700" />
              <StatCard label="Pending" value={payrollSummary.summary.pendingCount || 0} color="text-red-600" />
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Table
              cols={[
                { h: "Employee", r: r => r.employee?.name || "—" },
                { h: "Role", r: r => r.employee?.role || "—" },
                { h: "Basic", r: r => fmtCur(r.basicSalary) },
                { h: "Net", r: r => <span className="font-bold">{fmtCur(r.netSalary)}</span> },
                { h: "Status", r: r => <Badge s={r.status} /> },
              ]}
              rows={payrollSummary?.records || []}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== SETTINGS ====================
const Settings = () => {
  const { toast } = useApp();
  const [tab, setTab] = useState("school");
  const { data: settingsData, reload } = useFetch(() => api.getSettings());
  const [form, setForm] = useState({});
  const [changePass, setChangePass] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    if (settingsData) setForm(settingsData.data || settingsData);
  }, [settingsData]);

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    const res = await api.updateSettings(form);
    if (res.ok) { toast("Settings saved!", "success"); reload(); }
    else toast(res.data?.message, "error");
  };

  const handleChangePassword = async () => {
    if (!changePass.currentPassword || !changePass.newPassword) return toast("Fill both fields", "error");
    const res = await api.changePassword(changePass.currentPassword, changePass.newPassword);
    if (res.ok) { toast("Password changed!", "success"); setChangePass({ currentPassword: "", newPassword: "" }); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr title="Settings" />
      <Tabs tabs={[{ v: "school", l: "School Info" }, { v: "fees", l: "Fee Settings" }, { v: "password", l: "Change Password" }]} active={tab} onChange={setTab} />

      {tab === "school" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-3">
          <div className="col-span-2"><Inp label="School Name" value={form.name || ""} onChange={f("name")} /></div>
          <div className="col-span-2"><Textarea label="Address" value={form.address || ""} onChange={f("address")} /></div>
          <Inp label="Phone" value={form.phone || ""} onChange={f("phone")} />
          <Inp label="Email" type="email" value={form.email || ""} onChange={f("email")} />
          <Inp label="Website" value={form.website || ""} onChange={f("website")} />
          <Inp label="Affiliation No" value={form.affiliationNo || ""} onChange={f("affiliationNo")} />
          <Inp label="Board" value={form.board || ""} onChange={f("board")} />
          <div className="col-span-2"><Textarea label="Declaration" value={form.declaration || ""} onChange={f("declaration")} /></div>
          <div className="col-span-2"><Btn onClick={handleSave}>Save Settings</Btn></div>
        </div>
      )}

      {tab === "fees" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 gap-3 max-w-md">
          <Inp label="Late Fine Per Day (₹)" type="number" value={form.lateFinePer || 10} onChange={f("lateFinePer")} />
          <Inp label="Fee Due Day (of month)" type="number" value={form.feeDueDay || 10} onChange={f("feeDueDay")} min={1} max={31} />
          <Inp label="Min Attendance %" type="number" value={form.minAttendance || 75} onChange={f("minAttendance")} min={1} max={100} />
          <div className="col-span-2"><Btn onClick={handleSave}>Save Settings</Btn></div>
        </div>
      )}

      {tab === "password" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 max-w-sm flex flex-col gap-3">
          <Inp label="Current Password *" type="password" value={changePass.currentPassword} onChange={e => setChangePass(p => ({ ...p, currentPassword: e.target.value }))} />
          <Inp label="New Password *" type="password" value={changePass.newPassword} onChange={e => setChangePass(p => ({ ...p, newPassword: e.target.value }))} />
          <Btn onClick={handleChangePassword}>Change Password</Btn>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN APP ====================
export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [ayId, setAyId] = useState(null);
  const [ayList, setAyList] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("sms_token");
    if (saved) {
      api.setToken(saved);
      api.getMe().then(r => {
        if (r.ok && r.data?.data) {
          setUser(r.data.data);
          setToken(saved);
        } else {
          localStorage.removeItem("sms_token");
        }
      });
    }
    api.getAcademicYears().then(r => {
      if (r.ok) {
        const years = r.data?.data || r.data || [];
        setAyList(years);
        const current = years.find(y => y.isCurrent);
        if (current) setAyId(current._id);
      }
    });
  }, []);

  const toast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const handleLogin = (userData, tok) => {
    setUser(userData);
    setToken(tok);
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("sms_token");
    api.setToken(null);
    setUser(null);
    setToken(null);
    setPage("dashboard");
  };

  if (!user) {
    if (page === "enquiry") return (
      <AppCtx.Provider value={{ ayId, toast }}>
        <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
        <PublicEnquiry onBack={() => setPage("dashboard")} />
      </AppCtx.Provider>
    );
    return (
      <AppCtx.Provider value={{ ayId, toast }}>
        <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
        <LoginView onLogin={(u, t) => { if (u?.role === "public") setPage("enquiry"); else handleLogin(u, t); }} />
      </AppCtx.Provider>
    );
  }

  const role = user.role;
  const navSections = NAV[role] || NAV.admin;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard user={user} />;
      case "enquiries": return <Enquiries />;
      case "admissions": return <Admissions />;
      case "students": return <Students />;
      case "employees": return <Employees />;
      case "classrooms": return <Classrooms />;
      case "subjects": return <Subjects />;
      case "exams": return <Exams />;
      case "student-att": return <AttendanceView type="student" />;
      case "emp-att": return <AttendanceView type="employee" />;
      case "fees": return <Fees />;
      case "payroll": return <Payroll />;
      case "homework": return <Homework role={role} />;
      case "timetable": return <Timetable />;
      case "notices": return <Notices role={role} />;
      case "leaves": return <Leaves role={role} />;
      case "promote": return <Promote />;
      case "reports": return <Reports />;
      case "settings": return <Settings />;
      default: return <Dashboard user={user} />;
    }
  };

  const ctxVal = { ayId, setAyId, toast, user };

  return (
    <AppCtx.Provider value={ctxVal}>
      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
      <div className="flex h-screen overflow-hidden bg-gray-50">

        {/* Sidebar */}
        <aside className="w-[220px] shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden z-40">
          {/* Logo */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-white text-base shrink-0">🏫</div>
              <div>
                <p className="m-0 font-semibold text-xs text-gray-900 leading-tight">School Management</p>
                <p className="m-0 text-xs text-gray-400 leading-tight truncate max-w-[120px]">{BASE_URL}</p>
              </div>
            </div>
          </div>

          {/* Academic Year Selector */}
          {ayList.length > 0 && (
            <div className="px-3 py-2.5 border-b border-gray-100">
              <select
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 outline-none focus:border-blue-400"
                value={ayId || ""}
                onChange={e => setAyId(e.target.value)}
              >
                {ayList.map(ay => <option key={ay._id} value={ay._id}>{ay.name}{ay.isCurrent ? " ✓" : ""}</option>)}
              </select>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {navSections.map(section => (
              <div key={section.section} className="mb-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 pt-3 pb-1 m-0">
                  {section.section}
                </p>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl border-none cursor-pointer text-xs font-medium text-left transition-colors mb-0.5 ${
                      page === item.id
                        ? "bg-[#1e3a5f] text-white"
                        : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                  >
                    {item.l}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* User */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Avt name={user.name || user.email} size={7} />
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="m-0 text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-1.5 border border-gray-200 rounded-xl bg-transparent cursor-pointer text-xs text-red-500 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </AppCtx.Provider>
  );
}