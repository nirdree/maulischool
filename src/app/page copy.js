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

  // Auth
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  register: (data) => api.post("/api/auth/register", data),
  getMe: () => api.get("/api/auth/me"),
  changePassword: (currentPassword, newPassword) => api.put("/api/auth/change-password", { currentPassword, newPassword }),

  // Academic Years
  getAcademicYears: () => api.get("/api/academic-years"),
  getCurrentAcademicYear: () => api.get("/api/academic-years/current"),
  createAcademicYear: (data) => api.post("/api/academic-years", data),
  updateAcademicYear: (id, data) => api.put(`/api/academic-years/${id}`, data),
  setCurrentAcademicYear: (id) => api.patch(`/api/academic-years/${id}/set-current`),
  deleteAcademicYear: (id) => api.delete(`/api/academic-years/${id}`),

  // Classrooms
  getClassrooms: (params = {}) => api.get(`/api/classrooms?${new URLSearchParams(params)}`),
  getClassroom: (id) => api.get(`/api/classrooms/${id}`),
  createClassroom: (data) => api.post("/api/classrooms", data),
  updateClassroom: (id, data) => api.put(`/api/classrooms/${id}`, data),
  toggleClassroom: (id) => api.patch(`/api/classrooms/${id}/toggle`),
  deleteClassroom: (id) => api.delete(`/api/classrooms/${id}`),

  // Employees
  getEmployees: (params = {}) => api.get(`/api/employees?${new URLSearchParams(params)}`),
  getEmployee: (id) => api.get(`/api/employees/${id}`),
  createEmployee: (data) => api.post("/api/employees", data),
  updateEmployee: (id, data) => api.put(`/api/employees/${id}`, data),
  updateEmployeeStatus: (id, status) => api.patch(`/api/employees/${id}/status`, { status }),
  deleteEmployee: (id) => api.delete(`/api/employees/${id}`),

  // Students
  getStudents: (params = {}) => api.get(`/api/students?${new URLSearchParams(params)}`),
  getStudent: (id) => api.get(`/api/students/${id}`),
  createStudent: (data) => api.post("/api/students", data),
  updateStudent: (id, data) => api.put(`/api/students/${id}`, data),
  updateStudentStatus: (id, data) => api.patch(`/api/students/${id}/status`, data),
  deleteStudent: (id) => api.delete(`/api/students/${id}`),

  // Subjects
  getSubjects: (params = {}) => api.get(`/api/subjects?${new URLSearchParams(params)}`),
  getSubject: (id) => api.get(`/api/subjects/${id}`),
  createSubjects: (data) => api.post("/api/subjects", data),
  updateSubject: (id, data) => api.put(`/api/subjects/${id}`, data),
  toggleSubject: (id) => api.patch(`/api/subjects/${id}/toggle`),
  deleteSubject: (id) => api.delete(`/api/subjects/${id}`),

  // Enquiries
  submitEnquiry: (data) => api.post("/api/enquiries", data),
  getEnquiries: (params = {}) => api.get(`/api/enquiries?${new URLSearchParams(params)}`),
  getEnquiry: (id) => api.get(`/api/enquiries/${id}`),
  updateEnquiry: (id, data) => api.put(`/api/enquiries/${id}`, data),
  deleteEnquiry: (id) => api.delete(`/api/enquiries/${id}`),

  // Attendance
  getStudentAttendance: (params = {}) => api.get(`/api/attendance/students?${new URLSearchParams(params)}`),
  markStudentAttendance: (records) => api.post("/api/attendance/students", { records }),
  getAttendanceSummary: (params = {}) => api.get(`/api/attendance/students/summary?${new URLSearchParams(params)}`),
  getEmployeeAttendance: (params = {}) => api.get(`/api/attendance/employees?${new URLSearchParams(params)}`),
  markEmployeeAttendance: (records) => api.post("/api/attendance/employees", { records }),

  // Exams & Marks
  getExams: (params = {}) => api.get(`/api/exams?${new URLSearchParams(params)}`),
  getExam: (id) => api.get(`/api/exams/${id}`),
  createExam: (data) => api.post("/api/exams", data),
  updateExam: (id, data) => api.put(`/api/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/api/exams/${id}`),
  getMarks: (examId) => api.get(`/api/exams/${examId}/marks`),
  saveMarks: (examId, marks) => api.post(`/api/exams/${examId}/marks`, { marks }),
  getAllMarks: (params = {}) => api.get(`/api/marks?${new URLSearchParams(params)}`),

  // Fees
  getFees: (params = {}) => api.get(`/api/fees?${new URLSearchParams(params)}`),
  getFee: (id) => api.get(`/api/fees/${id}`),
  createFee: (data) => api.post("/api/fees", data),
  updateFee: (id, data) => api.put(`/api/fees/${id}`, data),
  collectPayment: (id, data) => api.post(`/api/fees/${id}/pay`, data),
  getFeePayments: (id) => api.get(`/api/fees/${id}/payments`),
  getAllReceipts: (params = {}) => api.get(`/api/fees/receipts/all?${new URLSearchParams(params)}`),

  // Payroll
  getPayroll: (params = {}) => api.get(`/api/payroll?${new URLSearchParams(params)}`),
  getPayrollById: (id) => api.get(`/api/payroll/${id}`),
  generatePayroll: (data) => api.post("/api/payroll", data),
  markPayrollPaid: (id) => api.patch(`/api/payroll/${id}/pay`),
  updatePayroll: (id, data) => api.put(`/api/payroll/${id}`, data),

  // Leaves
  getLeaves: (params = {}) => api.get(`/api/leaves?${new URLSearchParams(params)}`),
  applyLeave: (data) => api.post("/api/leaves", data),
  leaveAction: (id, data) => api.patch(`/api/leaves/${id}/action`, data),
  updateLeave: (id, data) => api.put(`/api/leaves/${id}`, data),
  deleteLeave: (id) => api.delete(`/api/leaves/${id}`),

  // Homework
  getHomework: (params = {}) => api.get(`/api/homework?${new URLSearchParams(params)}`),
  assignHomework: (data) => api.post("/api/homework", data),
  updateHomework: (id, data) => api.put(`/api/homework/${id}`, data),
  deleteHomework: (id) => api.delete(`/api/homework/${id}`),

  // Notices
  getNotices: (params = {}) => api.get(`/api/notices?${new URLSearchParams(params)}`),
  getNotice: (id) => api.get(`/api/notices/${id}`),
  createNotice: (data) => api.post("/api/notices", data),
  updateNotice: (id, data) => api.put(`/api/notices/${id}`, data),
  deleteNotice: (id) => api.delete(`/api/notices/${id}`),

  // Timetable
  getTimetables: (params = {}) => api.get(`/api/timetable?${new URLSearchParams(params)}`),
  getTimetableForClass: (classId, params = {}) => api.get(`/api/timetable/${classId}?${new URLSearchParams(params)}`),
  saveTimetable: (data) => api.post("/api/timetable", data),

  // Promote
  previewPromotions: (params = {}) => api.get(`/api/promote/preview?${new URLSearchParams(params)}`),
  executePromotions: (promotions) => api.post("/api/promote", { promotions }),

  // Settings
  getSettings: () => api.get("/api/settings"),
  updateSettings: (data) => api.put("/api/settings", data),

  // Reports
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

  // Health
  health: () => api.get("/api/health"),
};

// ==================== CONTEXT ====================
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ==================== HELPERS ====================
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtCur = (n) => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";

const STATUS_STYLE = {
  New: "background:#dbeafe;color:#1e40af", Contacted: "background:#fef9c3;color:#854d0e",
  AdmissionDone: "background:#dcfce7;color:#166534", Cancelled: "background:#fee2e2;color:#991b1b",
  Approved: "background:#dcfce7;color:#166534", UnderReview: "background:#dbeafe;color:#1e40af",
  Rejected: "background:#fee2e2;color:#991b1b", OnHold: "background:#fed7aa;color:#9a3412",
  Left: "background:#f3f4f6;color:#374151", Alumni: "background:#d1fae5;color:#065f46",
  Paid: "background:#dcfce7;color:#166534", Pending: "background:#fef9c3;color:#854d0e",
  Overdue: "background:#fee2e2;color:#991b1b", PartiallyPaid: "background:#fed7aa;color:#9a3412",
  Waived: "background:#f3f4f6;color:#374151", Present: "background:#dcfce7;color:#166534",
  Absent: "background:#fee2e2;color:#991b1b", Late: "background:#fef9c3;color:#854d0e",
  HalfDay: "background:#fed7aa;color:#9a3412", Holiday: "background:#dbeafe;color:#1e40af",
  active: "background:#dcfce7;color:#166534", inactive: "background:#f3f4f6;color:#374151",
  resigned: "background:#fee2e2;color:#991b1b",
  Normal: "background:#dbeafe;color:#1e40af", Important: "background:#fef9c3;color:#854d0e",
  Urgent: "background:#fee2e2;color:#991b1b",
};

const Badge = ({ s, l }) => (
  <span style={{ ...parseStyle(STATUS_STYLE[s] || "background:#f3f4f6;color:#374151"), padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{l || s}</span>
);

function parseStyle(str = "") {
  return str.split(";").reduce((acc, p) => {
    const [k, v] = p.split(":");
    if (k && v) acc[k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v.trim();
    return acc;
  }, {});
}

// ==================== UI PRIMITIVES ====================
const ss = {
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
  input: { width: "100%", padding: "8px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 },
  select: { width: "100%", padding: "8px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 13, outline: "none", boxSizing: "border-box" },
  btn: (v = "primary") => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--border-radius-md)",
    fontSize: 12, fontWeight: 500, cursor: "pointer", border: "0.5px solid",
    ...(v === "primary" ? { background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" } :
      v === "danger" ? { background: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" } :
      v === "success" ? { background: "#dcfce7", color: "#166534", borderColor: "#86efac" } :
      v === "warning" ? { background: "#fef9c3", color: "#854d0e", borderColor: "#fde047" } :
      { background: "var(--color-background-secondary)", color: "var(--color-text-primary)", borderColor: "var(--color-border-secondary)" })
  }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 },
};

const Field = ({ label, required, error, children }) => (
  <div style={{ marginBottom: 0 }}>
    {label && <label style={ss.label}>{label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}</label>}
    {children}
    {error && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{error}</p>}
  </div>
);

const Inp = ({ label, required, error, style: extStyle, ...props }) => (
  <Field label={label} required={required} error={error}>
    <input style={{ ...ss.input, ...extStyle }} {...props} />
  </Field>
);

const Sel = ({ label, required, options = [], value, onChange, style: extStyle }) => (
  <Field label={label} required={required}>
    <select style={{ ...ss.select, ...extStyle }} value={value || ""} onChange={onChange}>
      <option value="">Select…</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </Field>
);

const Textarea = ({ label, required, ...props }) => (
  <Field label={label} required={required}>
    <textarea style={{ ...ss.input, resize: "vertical", minHeight: 72 }} {...props} />
  </Field>
);

const Btn = ({ children, variant = "primary", onClick, loading, type = "button", style: extStyle }) => (
  <button type={type} onClick={onClick} disabled={loading} style={{ ...ss.btn(variant), opacity: loading ? 0.6 : 1, ...extStyle }}>
    {loading && <span style={{ fontSize: 10 }}>⟳</span>}{children}
  </button>
);

const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...ss.card, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--color-text-secondary)" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const PageHdr = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
  </div>
);

const StatCard = ({ label, value, sub, color = "#1e3a5f" }) => (
  <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
    <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</p>
    <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 500, color }}>{value}</p>
    {sub && <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>{sub}</p>}
  </div>
);

const Table = ({ cols, rows = [], onRow, emptyMsg = "No data" }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>
          {cols.map((c, i) => <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "var(--color-text-secondary)", whiteSpace: "nowrap", fontSize: 11 }}>{c.h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ padding: "32px 12px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>{emptyMsg}</td></tr>
        ) : rows.map((r, i) => (
          <tr key={i} onClick={onRow ? () => onRow(r) : undefined} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", cursor: onRow ? "pointer" : "default", transition: "background 0.1s" }}
            onMouseEnter={e => { if (onRow) e.currentTarget.style.background = "var(--color-background-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; }}>
            {cols.map((c, j) => <td key={j} style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{c.r ? c.r(r) : r[c.k]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: 0 }}>
    {tabs.map(t => (
      <button key={t.v} onClick={() => onChange(t.v)} style={{ padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: active === t.v ? "#1e3a5f" : "var(--color-text-secondary)", borderBottom: active === t.v ? "2px solid #1e3a5f" : "2px solid transparent", marginBottom: -1 }}>
        {t.l}
      </button>
    ))}
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
    <div style={{ width: 32, height: 32, border: "2px solid var(--color-border-secondary)", borderTopColor: "#1e3a5f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Toast = ({ toasts, remove }) => (
  <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
    {toasts.map(t => (
      <div key={t.id} style={{ padding: "10px 16px", borderRadius: "var(--border-radius-md)", background: t.type === "success" ? "#166534" : t.type === "error" ? "#991b1b" : "#1e3a5f", color: "#fff", fontSize: 12, fontWeight: 500, display: "flex", gap: 12, alignItems: "center", maxWidth: 320 }}>
        <span style={{ flex: 1 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>×</button>
      </div>
    ))}
  </div>
);

const Avt = ({ name = "?", size = 32 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#1e3a5f", "#166534", "#854d0e", "#9a3412", "#6b21a8"];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size * 0.35, fontWeight: 500, flexShrink: 0 }}>{initials}</div>;
};

// ==================== NAV CONFIG ====================
const NAV = {
  admin: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard", icon: "▪" }] },
    { section: "Admissions", items: [{ id: "enquiries", l: "Enquiries", icon: "▪" }, { id: "admissions", l: "Admissions", icon: "▪" }, { id: "students", l: "Students", icon: "▪" }] },
    { section: "Academic", items: [{ id: "employees", l: "Employees", icon: "▪" }, { id: "classrooms", l: "Classrooms", icon: "▪" }, { id: "subjects", l: "Subjects", icon: "▪" }, { id: "exams", l: "Exams & Marks", icon: "▪" }, { id: "timetable", l: "Timetable", icon: "▪" }, { id: "homework", l: "Homework", icon: "▪" }] },
    { section: "Attendance", items: [{ id: "student-att", l: "Student Attendance", icon: "▪" }, { id: "emp-att", l: "Staff Attendance", icon: "▪" }] },
    { section: "Finance", items: [{ id: "fees", l: "Fees", icon: "▪" }, { id: "payroll", l: "Payroll", icon: "▪" }] },
    { section: "Management", items: [{ id: "notices", l: "Notices", icon: "▪" }, { id: "leaves", l: "Leave Requests", icon: "▪" }, { id: "promote", l: "Promote Students", icon: "▪" }] },
    { section: "More", items: [{ id: "reports", l: "Reports", icon: "▪" }, { id: "settings", l: "Settings", icon: "▪" }] },
  ],
  principal: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard", icon: "▪" }] },
    { section: "Admissions", items: [{ id: "enquiries", l: "Enquiries", icon: "▪" }, { id: "admissions", l: "Admissions", icon: "▪" }, { id: "students", l: "Students", icon: "▪" }] },
    { section: "Academic", items: [{ id: "employees", l: "Employees", icon: "▪" }, { id: "classrooms", l: "Classrooms", icon: "▪" }, { id: "exams", l: "Exams", icon: "▪" }, { id: "timetable", l: "Timetable", icon: "▪" }] },
    { section: "Attendance", items: [{ id: "student-att", l: "Student Attendance", icon: "▪" }, { id: "emp-att", l: "Staff Attendance", icon: "▪" }] },
    { section: "Management", items: [{ id: "notices", l: "Notices", icon: "▪" }, { id: "leaves", l: "Leave Requests", icon: "▪" }, { id: "reports", l: "Reports", icon: "▪" }] },
  ],
  teacher: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard", icon: "▪" }] },
    { section: "My Class", items: [{ id: "students", l: "Students", icon: "▪" }, { id: "student-att", l: "Mark Attendance", icon: "▪" }, { id: "timetable", l: "Timetable", icon: "▪" }] },
    { section: "Academic", items: [{ id: "exams", l: "Exams", icon: "▪" }, { id: "homework", l: "Homework", icon: "▪" }] },
    { section: "Personal", items: [{ id: "leaves", l: "My Leaves", icon: "▪" }, { id: "notices", l: "Notices", icon: "▪" }] },
  ],
  parent: [
    { section: "Overview", items: [{ id: "dashboard", l: "Dashboard", icon: "▪" }] },
    { section: "My Child", items: [{ id: "student-att", l: "Attendance", icon: "▪" }, { id: "exams", l: "Marks", icon: "▪" }] },
    { section: "School", items: [{ id: "fees", l: "Fees", icon: "▪" }, { id: "homework", l: "Homework", icon: "▪" }, { id: "timetable", l: "Timetable", icon: "▪" }, { id: "notices", l: "Notices", icon: "▪" }] },
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
    console.log("Logging in with", { email, password });
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background-tertiary)", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: "#1e3a5f", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22 }}>🏫</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>School Management System</h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>Sign in to your account</p>
        </div>

        {serverOk === false && (
          <div style={{ background: "#fee2e2", border: "0.5px solid #fca5a5", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 12 }}>
            ⚠ Backend server not reachable at {BASE_URL}. Start the server first, then log in.
          </div>
        )}
        {serverOk === true && (
          <div style={{ background: "#dcfce7", border: "0.5px solid #86efac", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: 12, color: "#166534", marginBottom: 12 }}>
            ✓ Server connected at {BASE_URL}
          </div>
        )}

        <div style={ss.card}>
          {error && <div style={{ background: "#fee2e2", borderRadius: "var(--border-radius-md)", padding: "10px 14px", fontSize: 12, color: "#991b1b", marginBottom: 14 }}>{error}</div>}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Inp label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Btn type="submit" loading={loading} style={{ width: "100%", justifyContent: "center", padding: "10px" }}>Sign In</Btn>
          </form>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10 }}>DEMO ACCOUNTS (seed.js credentials)</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {DEMOS.map(d => (
                <button key={d.label} onClick={() => { setEmail(d.email); setPassword(d.password); }} style={{ padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", cursor: "pointer", textAlign: "left" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{d.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-secondary)" }}>{d.email}</p>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <button onClick={() => onLogin({ role: "public" }, null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#1e3a5f", textDecoration: "underline" }}>Submit Enquiry (Public)</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== PUBLIC ENQUIRY ====================
const PublicEnquiry = ({ onBack }) => {
  const { toast } = useApp();
  const [form, setForm] = useState({ classApplying: "", childName: "", fatherName: "", residentialAddress: "", pinCode: "", phoneNo: "", mobileNo: "", email: "", gender: "Male", age: "", dateOfBirth: "", preferredAdmissionDate: "", remark: "" });
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background-tertiary)", padding: 16 }}>
      <div style={{ ...ss.card, maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Enquiry Submitted!</h3>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>Enquiry ID: <strong>{done.enquiryId}</strong></p>
        <Btn onClick={onBack}>Back to Login</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", padding: 24 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={onBack} style={ss.btn("outline")}>← Back</button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Admission Enquiry</h2>
        </div>
        <div style={{ ...ss.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Sel label="Class Applying For *" value={form.classApplying} onChange={f("classApplying")} options={(classes || []).sort((a, b) => a.order - b.order).map(c => ({ value: c._id, label: c.displayName }))} />
          </div>
          <Inp label="Child's Name *" value={form.childName} onChange={f("childName")} />
          <Inp label="Father's Name *" value={form.fatherName} onChange={f("fatherName")} />
          <div style={{ gridColumn: "1/-1" }}>
            <Textarea label="Residential Address *" value={form.residentialAddress} onChange={f("residentialAddress")} />
          </div>
          <Inp label="Pin Code *" value={form.pinCode} onChange={f("pinCode")} maxLength={6} />
          <Inp label="Phone No *" value={form.phoneNo} onChange={f("phoneNo")} maxLength={10} />
          <Inp label="Mobile No *" value={form.mobileNo} onChange={f("mobileNo")} maxLength={10} />
          <Inp label="Email *" type="email" value={form.email} onChange={f("email")} />
          <div>
            <label style={ss.label}>Gender *</label>
            <div style={{ display: "flex", gap: 16, paddingTop: 6 }}>
              {["Male", "Female", "Other"].map(g => (
                <label key={g} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={f("gender")} />
                  {g}
                </label>
              ))}
            </div>
          </div>
          <Inp label="Age *" type="number" value={form.age} onChange={f("age")} min={1} max={20} />
          <Inp label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")} />
          <Inp label="Preferred Admission Date" type="date" value={form.preferredAdmissionDate} onChange={f("preferredAdmissionDate")} />
          <div style={{ gridColumn: "1/-1" }}>
            <Textarea label="Remarks" value={form.remark} onChange={f("remark")} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Btn loading={submitting} onClick={submit} style={{ width: "100%", justifyContent: "center" }}>Submit Enquiry</Btn>
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
      <PageHdr title="Dashboard" subtitle={`Welcome, ${user?.name}`} />
      <div style={{ ...ss.grid4, marginBottom: 20 }}>
        <StatCard label="Total Students" value={ov.students?.approved || 0} sub={`${ov.students?.underReview || 0} pending`} />
        <StatCard label="Total Employees" value={ov.employees?.active || 0} sub="Active" color="#166534" />
        <StatCard label="Fee Collected" value={fmtCur(ov.fees?.collected)} sub="This year" color="#854d0e" />
        <StatCard label="Pending Leaves" value={ov.leaves?.pending || 0} color={ov.leaves?.pending > 0 ? "#991b1b" : "#166534"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={ss.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 500 }}>Monthly Fee Collection</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={collectionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip formatter={v => fmtCur(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="collected" fill="#1e3a5f" name="Collected" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pending" fill="#cbd5e1" name="Pending" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 500 }}>Class-wise Students</h3>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ ...ss.card, padding: "1rem" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Fee Overview</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[["Total Expected", fmtCur(ov.fees?.total), "#1e3a5f"], ["Collected", fmtCur(ov.fees?.collected), "#166534"], ["Pending", fmtCur(ov.fees?.pending), "#991b1b"]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...ss.card, padding: "1rem" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Quick Stats</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Total Students", ov.students?.total || 0],
              ["Under Review", ov.students?.underReview || 0],
              ["Active Employees", ov.employees?.active || 0],
              ["Total Classes", ov.classes?.total || 0],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{l}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{v}</span>
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
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const { data: enqRes, loading, reload } = useFetch(() => api.getEnquiries({ ...params, ...(ayId ? { academicYear: ayId } : {}) }), [params, ayId]);
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
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

  const clsOpts = (classes || []).sort((a, b) => a.order - b.order).map(c => ({ value: c._id, label: c.displayName }));

  return (
    <div>
      <PageHdr title="Enquiries" subtitle={`${Array.isArray(enquiries) ? enquiries.length : 0} records`}
        actions={<div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...ss.select, width: "auto" }} onChange={e => setParams(p => ({ ...p, status: e.target.value || undefined }))}>
            <option value="">All Status</option>
            {["New", "Contacted", "AdmissionDone", "Cancelled", "PlanningFuture", "Other"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>} />
      {loading ? <Spinner /> : (
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Enquiry ID", r: r => <span style={{ fontFamily: "monospace", fontSize: 11, color: "#1e3a5f" }}>{r.enquiryId}</span> },
              { h: "Child", r: r => <span style={{ fontWeight: 500 }}>{r.childName}</span> },
              { h: "Class", r: r => <span>{r.classApplying?.displayName || "—"}</span> },
              { h: "Father", k: "fatherName" },
              { h: "Mobile", k: "mobileNo" },
              { h: "Date", r: r => fmt(r.createdAt) },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (
                  <div style={{ display: "flex", gap: 6 }}>
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
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit Enquiry — ${editData?.enquiryId}`} width={600}>
        {editData && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Inp label="Child Name" value={editData.childName || ""} onChange={e => setEditData(p => ({ ...p, childName: e.target.value }))} />
            <Inp label="Father Name" value={editData.fatherName || ""} onChange={e => setEditData(p => ({ ...p, fatherName: e.target.value }))} />
            <Inp label="Mobile" value={editData.mobileNo || ""} onChange={e => setEditData(p => ({ ...p, mobileNo: e.target.value }))} />
            <Sel label="Status" value={editData.status} onChange={e => setEditData(p => ({ ...p, status: e.target.value }))} options={["New", "Contacted", "AdmissionDone", "Cancelled", "PlanningFuture", "Other"].map(s => ({ value: s, label: s }))} />
            <div style={{ gridColumn: "1/-1" }}>
              <Textarea label="Admin Remark" value={editData.adminRemark || ""} onChange={e => setEditData(p => ({ ...p, adminRemark: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
  const { data: studentsRes, loading, reload } = useFetch(() => api.getStudents({ status: tab, ...(ayId ? { academicYear: ayId } : {}), limit: 100 }), [tab, ayId]);
  const { data: classes } = useFetch(() => api.getClassrooms({ isActive: "true" }));
  const students = studentsRes?.data || studentsRes || [];

  const handleStatus = async (student, status, extra = {}) => {
    const res = await api.updateStudentStatus(student._id, { status, ...extra });
    if (res.ok) { toast(`Status updated to ${status}`, "success"); reload(); setSelected(null); }
    else toast(res.data?.message, "error");
  };

  const tabs = ["All", "UnderReview", "Approved", "OnHold", "Rejected"].map(t => ({ v: t, l: `${t} (${t === "All" ? "—" : "..."})` }));

  const cls = (id) => (classes || []).find(c => c._id === id || c._id === id?._id);

  return (
    <div>
      <PageHdr title="Admissions" subtitle="Manage student admissions" />
      <Tabs tabs={["UnderReview", "Approved", "OnHold", "Rejected"].map(t => ({ v: t, l: t }))} active={tab} onChange={t => { setTab(t); setSelected(null); }} />
      {loading ? <Spinner /> : (
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Adm No", r: r => <span style={{ fontFamily: "monospace", fontSize: 11, color: "#1e3a5f" }}>{r.admissionNo}</span> },
              { h: "Student", r: r => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avt name={`${r.firstName} ${r.lastName}`} size={28} /><span style={{ fontWeight: 500 }}>{r.firstName} {r.lastName}</span></div> },
              { h: "Class", r: r => cls(r.classroom)?.displayName || "—" },
              { h: "Father", k: "fatherName" },
              { h: "Father Phone", k: "fatherPhone" },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (
                  <div style={{ display: "flex", gap: 6 }}>
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
      <Modal open={!!showReject} onClose={() => setShowReject(false)} title={showReject === "Rejected" ? "Reject Admission" : "Put On Hold"} width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Textarea label={showReject === "Rejected" ? "Rejection Reason *" : "Hold Reason *"} value={remark} onChange={e => setRemark(e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="outline" onClick={() => setShowReject(false)}>Cancel</Btn>
            <Btn variant={showReject === "Rejected" ? "danger" : "warning"} onClick={() => {
              if (!remark) return;
              handleStatus(selected, showReject, showReject === "Rejected" ? { rejectionRemark: remark } : { holdRemark: remark });
              setShowReject(false); setRemark("");
            }}>Confirm</Btn>
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
  const { data: studentsRes, loading, reload } = useFetch(() => api.getStudents({ ...(ayId ? { academicYear: ayId } : {}), ...(classFilter ? { classId: classFilter } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}), limit: 200 }), [ayId, classFilter, statusFilter, search]);
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
      <PageHdr title={`${selected.firstName} ${selected.lastName}`}
        actions={<Btn variant="outline" onClick={() => setSelected(null)}>← Back</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
        <div style={ss.card}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Avt name={`${selected.firstName} ${selected.lastName}`} size={64} />
            <h3 style={{ margin: "10px 0 4px", fontSize: 15 }}>{selected.firstName} {selected.middleName} {selected.lastName}</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{cls(selected.classroom)?.displayName}</p>
            <div style={{ marginTop: 8 }}><Badge s={selected.status} /></div>
          </div>
          {[["Adm No", selected.admissionNo], ["Roll", selected.rollNumber || "—"], ["DOB", fmt(selected.dateOfBirth)], ["Gender", selected.gender], ["Blood", selected.bloodGroup || "—"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 12 }}>
              <span style={{ color: "var(--color-text-secondary)" }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <Tabs tabs={[{ v: "info", l: "Family" }, { v: "fees", l: "Fees" }, { v: "marks", l: "Marks" }, { v: "att", l: "Attendance" }]} active={detailTab} onChange={setDetailTab} />
          {detailTab === "info" && (
            <div style={{ ...ss.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 13 }}>Father</h4>
                {[["Name", selected.fatherName], ["Phone", selected.fatherPhone], ["Email", selected.fatherEmail], ["Occupation", selected.fatherOccupation]].map(([k, v]) => v && (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{k}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13 }}>{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{ margin: "0 0 12px", fontSize: 13 }}>Mother</h4>
                {[["Name", selected.motherName], ["Phone", selected.motherPhone], ["Email", selected.motherEmail], ["Occupation", selected.motherOccupation]].map(([k, v]) => v && (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{k}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {detailTab === "fees" && <div style={ss.card}><Table cols={[{ h: "Month", r: r => `${MONTHS[r.month - 1]} ${r.year}` }, { h: "Amount", r: r => fmtCur(r.finalAmount) }, { h: "Status", r: r => <Badge s={r.status} /> }, { h: "Due", r: r => fmt(r.dueDate) }]} rows={feeList} /></div>}
          {detailTab === "marks" && <div style={ss.card}><Table cols={[{ h: "Subject", r: r => r.subject?.name || "—" }, { h: "Exam", r: r => r.exam?.name || "—" }, { h: "Marks", r: r => r.isAbsent ? "Absent" : `${r.marksObtained}/${r.exam?.totalMarks}` }, { h: "Grade", r: r => <span style={{ fontWeight: 600, color: r.grade === "F" ? "#991b1b" : "#166534" }}>{r.grade}</span> }]} rows={markList} /></div>}
          {detailTab === "att" && (
            <div style={ss.card}>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                {[["Total", att.length], ["Present", att.filter(a => a.status === "Present").length], ["Absent", att.filter(a => a.status === "Absent").length], ["Attendance %", `${pct}%`]].map(([l, v]) => <StatCard key={l} label={l} value={v} />)}
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
      <PageHdr title="Students" subtitle={`${Array.isArray(students) ? students.length : 0} students`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...ss.input, width: 180 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...ss.select, width: "auto" }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {(classes || []).sort((a, b) => a.order - b.order).map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
            <select style={{ ...ss.select, width: "auto" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {["UnderReview", "Approved", "OnHold", "Rejected", "Left"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        } />
      {loading ? <Spinner /> : (
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Adm No", r: r => <span style={{ fontFamily: "monospace", fontSize: 11, color: "#1e3a5f" }}>{r.admissionNo}</span> },
              { h: "Student", r: r => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avt name={`${r.firstName} ${r.lastName}`} size={28} /><div><p style={{ margin: 0, fontWeight: 500, fontSize: 12 }}>{r.firstName} {r.lastName}</p><p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)" }}>Roll: {r.rollNumber || "—"}</p></div></div> },
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
      <PageHdr title="Employees" subtitle={`${Array.isArray(employees) ? employees.length : 0} employees`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...ss.input, width: 160 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...ss.select, width: "auto" }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {["teacher", "principal", "admin", "accountant", "support"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Btn onClick={() => setShowAdd(true)}>+ Add Employee</Btn>
          </div>
        } />
      {loading ? <Spinner /> : (
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Employee", r: r => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avt name={r.name} size={28} /><div><p style={{ margin: 0, fontWeight: 500, fontSize: 12 }}>{r.name}</p><p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{r.employeeId}</p></div></div> },
              { h: "Role", r: r => <span style={{ textTransform: "capitalize" }}>{r.role}</span> },
              { h: "Mobile", k: "mobileNo" },
              { h: "Salary", r: r => fmtCur(r.monthlySalary) },
              { h: "Joined", r: r => fmt(r.dateOfJoining) },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="outline" onClick={() => setSelected(r)}>View</Btn>
                    {r.status === "active" ? <Btn variant="danger" onClick={() => handleStatusChange(r, "inactive")}>Deactivate</Btn> : <Btn variant="success" onClick={() => handleStatusChange(r, "active")}>Activate</Btn>}
                  </div>
                )
              },
            ]}
            rows={Array.isArray(employees) ? employees : []}
          />
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Employee" width={640}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><Inp label="Full Name *" value={form.name} onChange={f("name")} /></div>
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
          <div style={{ gridColumn: "1/-1" }}><Textarea label="Home Address" value={form.homeAddress} onChange={f("homeAddress")} /></div>
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleCreate}>Create Employee</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ""} width={500}>
        {selected && (
          <div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <Avt name={selected.name} size={48} />
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{selected.name}</h3>
                <p style={{ margin: "2px 0", fontSize: 12, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{selected.role} — {selected.employeeId}</p>
                <Badge s={selected.status} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["Email", selected.email], ["Mobile", selected.mobileNo], ["Salary", fmtCur(selected.monthlySalary)], ["Joined", fmt(selected.dateOfJoining)], ["Education", selected.education], ["Experience", selected.experience], ["Blood Group", selected.bloodGroup], ["Address", selected.homeAddress]].map(([k, v]) => v && (
                <div key={k} style={{ padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{k}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12 }}>{v}</p>
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
      <PageHdr title="Classrooms" subtitle={`${classes.length} classrooms`}
        actions={<Btn onClick={() => setShowAdd(true)}>+ Add Classroom</Btn>} />
      {loading ? <Spinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {classes.map(cls => {
            const teacher = teacherList.find(t => t._id === cls.classTeacher?._id || t._id === cls.classTeacher);
            return (
              <div key={cls._id} style={{ ...ss.card, opacity: cls.isActive ? 1 : 0.6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{cls.displayName}</h3>
                  <Badge s={cls.isActive ? "active" : "inactive"} />
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-secondary)" }}>{teacher?.name || "No class teacher"}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                  <div style={{ padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Monthly Fee</p>
                    <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500 }}>{fmtCur(cls.monthlyFees)}</p>
                  </div>
                  <div style={{ padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Capacity</p>
                    <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500 }}>{cls.capacity || "—"}</p>
                  </div>
                </div>
                <button onClick={() => handleToggle(cls)} style={{ marginTop: 12, width: "100%", padding: "6px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "none", cursor: "pointer", fontSize: 11, color: cls.isActive ? "#991b1b" : "#166534" }}>
                  {cls.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Classroom" width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Inp label="Class Name *" value={form.className} onChange={f("className")} placeholder="e.g. Class 1, Nursery" />
          <Inp label="Section" value={form.section} onChange={f("section")} placeholder="e.g. A, B" />
          <Inp label="Monthly Fees *" type="number" value={form.monthlyFees} onChange={f("monthlyFees")} />
          <Inp label="Capacity" type="number" value={form.capacity} onChange={f("capacity")} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
      <PageHdr title="Subjects" subtitle={`${Array.isArray(subjects) ? subjects.length : 0} subjects`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ ...ss.select, width: "auto" }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
            <Btn onClick={() => setShowAdd(true)}>+ Assign Subjects</Btn>
          </div>
        } />
      {loading ? <Spinner /> : (
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Subject", r: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
              { h: "Class", r: r => r.classroom?.displayName || "—" },
              { h: "Teacher", r: r => r.teacher?.name || "Not assigned" },
              { h: "Total Marks", r: r => <span style={{ fontWeight: 500, color: "#1e3a5f" }}>{r.totalMarks}</span> },
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
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Assign Subjects" width={640}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sel label="Select Class *" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 2fr 24px", gap: 8, fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>
            <span>Subject Name</span><span>Marks</span><span>Teacher</span><span></span>
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 2fr 24px", gap: 8, alignItems: "end" }}>
              <Inp value={row.name} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g. Mathematics" />
              <Inp type="number" value={row.totalMarks} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, totalMarks: e.target.value } : x))} />
              <select style={ss.select} value={row.teacherId} onChange={e => setRows(r => r.map((x, j) => j === i ? { ...x, teacherId: e.target.value } : x))}>
                <option value="">Select…</option>
                {teacherList.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {rows.length > 1 && <button onClick={() => setRows(r => r.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b", fontSize: 16, paddingBottom: 4 }}>×</button>}
            </div>
          ))}
          <button onClick={() => setRows(r => [...r, { name: "", totalMarks: 100, teacherId: "" }])} style={{ background: "none", border: "none", cursor: "pointer", color: "#1e3a5f", fontSize: 12, textAlign: "left", padding: 0 }}>+ Add more</button>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
  const { data: marksSubjects } = useFetch(() => api.getSubjects({ ...(marksClass ? { classId: marksClass } : {}), ...(ayId ? { academicYear: ayId } : {}) }), [marksClass, ayId]);
  const { data: classStudents } = useFetch(() => marksClass ? api.getStudents({ classId: marksClass, status: "Approved", limit: 100 }) : Promise.resolve({ ok: true, data: [] }), [marksClass]);

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
          <div style={ss.card}>
            <Table
              cols={[
                { h: "Exam", r: r => <span style={{ fontWeight: 500 }}>{r.name}</span> },
                { h: "Class", r: r => r.classroom?.displayName || "—" },
                { h: "Subject", r: r => r.subject?.name || "—" },
                { h: "Type", k: "examType" },
                { h: "Marks", r: r => <span style={{ fontWeight: 500, color: "#1e3a5f" }}>{r.totalMarks}</span> },
                { h: "Date", r: r => fmt(r.examDate) },
                {
                  h: "Action", r: r => <Btn variant="danger" onClick={async () => {
                    if (!confirm("Delete exam and all marks?")) return;
                    const res = await api.deleteExam(r._id);
                    if (res.ok) { toast("Deleted", "success"); reload(); } else toast(res.data?.message, "error");
                  }}>Delete</Btn>
                },
              ]}
              rows={Array.isArray(exams) ? exams : []}
            />
          </div>
        )
      )}

      {tab === "marks" && (
        <div>
          <div style={{ ...ss.card, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Sel label="Class" value={marksClass} onChange={e => { setMarksClass(e.target.value); setMarksExam(""); setMarksData([]); }} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Sel label="Exam" value={marksExam} onChange={e => setMarksExam(e.target.value)} options={(classExams || []).map(e => ({ value: e._id, label: `${e.name} (${e.subject?.name})` }))} />
            </div>
            <Btn onClick={loadMarks} loading={loadingMarks}>Load Students</Btn>
            {marksData.length > 0 && <Btn variant="success" onClick={saveMarks}>Save Marks</Btn>}
          </div>
          {marksData.length > 0 && (
            <div style={ss.card}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Btn variant="outline" onClick={() => setMarksData(d => d.map(x => ({ ...x, isAbsent: false })))}>All Present</Btn>
                <Btn variant="outline" onClick={() => setMarksData(d => d.map(x => ({ ...x, isAbsent: true, marksObtained: "" })))}>All Absent</Btn>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Roll</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Student</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Marks</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Absent</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {marksData.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{m.student.rollNumber}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 500 }}>{m.student.firstName} {m.student.lastName}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <input type="number" value={m.marksObtained} disabled={m.isAbsent} onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, marksObtained: e.target.value } : x))} style={{ width: 60, textAlign: "center", ...ss.input, padding: "4px 8px" }} />
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <input type="checkbox" checked={m.isAbsent} onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, isAbsent: e.target.checked, marksObtained: e.target.checked ? "" : x.marksObtained } : x))} />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <input value={m.remarks} onChange={e => setMarksData(d => d.map((x, j) => j === i ? { ...x, remarks: e.target.value } : x))} style={{ ...ss.input, padding: "4px 8px", width: 140 }} placeholder="Optional" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "results" && (
        <ExamResults exams={exams} ayId={ayId} />
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Exam" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sel label="Class *" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, subjectId: "" }))} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          <Sel label="Subject *" value={form.subjectId} onChange={f("subjectId")} options={(subjects?.data || subjects || []).map(s => ({ value: s._id, label: s.name }))} />
          <Sel label="Exam Type *" value={form.examType} onChange={f("examType")} options={EXAM_TYPES.map(t => ({ value: t, label: t }))} />
          <Inp label="Exam Name *" value={form.name} onChange={f("name")} placeholder="e.g. Unit Test 1 - Mathematics" />
          <Inp label="Total Marks *" type="number" value={form.totalMarks} onChange={f("totalMarks")} />
          <Inp label="Exam Date *" type="date" value={form.examDate} onChange={f("examDate")} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
    <div style={ss.card}>
      <Table
        cols={[
          { h: "Exam", r: r => r._id?.exam?.name || "—" },
          { h: "Class", r: r => r._id?.classroom?.displayName || "—" },
          { h: "Students", k: "totalStudents" },
          { h: "Present", k: "presentStudents" },
          { h: "Absent", k: "absentStudents" },
          { h: "Avg Marks", r: r => <span style={{ fontWeight: 500 }}>{r.averageMarks || 0}</span> },
          { h: "Highest", r: r => <span style={{ color: "#166534", fontWeight: 500 }}>{r.highestMarks || 0}</span> },
          { h: "A+ Count", r: r => r.gradeAPlus || 0 },
          { h: "Fail Count", r: r => <span style={{ color: r.gradeF > 0 ? "#991b1b" : "" }}>{r.gradeF || 0}</span> },
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
      <div style={{ ...ss.card, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        {type === "student" && (
          <div style={{ minWidth: 180 }}>
            <Sel label="Class" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          </div>
        )}
        <div>
          <label style={ss.label}>Date</label>
          <input type="date" style={{ ...ss.input, width: "auto" }} value={selDate} onChange={e => setSelDate(e.target.value)} />
        </div>
        <Btn onClick={loadData} loading={loading}>Load</Btn>
        {attData.length > 0 && <>
          <Btn variant="outline" onClick={() => setAttData(d => d.map(x => ({ ...x, status: "Present" })))}>All Present</Btn>
          <Btn variant="outline" onClick={() => setAttData(d => d.map(x => ({ ...x, status: "Absent" })))}>All Absent</Btn>
          <Btn variant="success" onClick={saveAttendance}>Save Attendance</Btn>
        </>}
      </div>
      {attData.length > 0 && (
        <div style={{ ...ss.card, overflowX: "auto" }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--color-text-secondary)" }}>
            {fmt(selDate)} — Present: {attData.filter(a => a.status === "Present").length} / {attData.length}
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>
                {type === "student" && <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Roll</th>}
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Name</th>
                {type === "employee" && <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Role</th>}
                {statuses.map(s => <th key={s} style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{s}</th>)}
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {attData.map((a, i) => (
                <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  {type === "student" && <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{a.rollNo}</td>}
                  <td style={{ padding: "8px 12px", fontWeight: 500 }}>{a.name}</td>
                  {type === "employee" && <td style={{ padding: "8px 12px", textTransform: "capitalize", color: "var(--color-text-secondary)" }}>{a.role}</td>}
                  {statuses.map(s => (
                    <td key={s} style={{ padding: "8px 12px", textAlign: "center" }}>
                      <input type="radio" name={`att-${i}`} checked={a.status === s} onChange={() => setAttData(d => d.map((x, j) => j === i ? { ...x, status: s } : x))} />
                    </td>
                  ))}
                  <td style={{ padding: "8px 12px" }}>
                    <input value={a.remark} onChange={e => setAttData(d => d.map((x, j) => j === i ? { ...x, remark: e.target.value } : x))} style={{ ...ss.input, padding: "4px 8px", width: 120 }} />
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
      <PageHdr title="Fee Management"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => setShowGen(true)}>+ Generate Fee</Btn>
          </div>
        } />
      <Tabs tabs={[{ v: "list", l: "Fee List" }, { v: "defaulters", l: "Defaulters" }, { v: "receipts", l: "Receipts" }]} active={tab} onChange={setTab} />

      {tab === "list" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <select style={{ ...ss.select, width: "auto" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {["Pending", "Paid", "Overdue", "PartiallyPaid"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={{ ...ss.select, width: "auto" }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
          </div>
          {loading ? <Spinner /> : (
            <div style={ss.card}>
              <Table
                cols={[
                  { h: "Student", r: r => <div><p style={{ margin: 0, fontWeight: 500, fontSize: 12 }}>{r.student?.firstName} {r.student?.lastName}</p><p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)" }}>{r.student?.admissionNo}</p></div> },
                  { h: "Class", r: r => r.classroom?.displayName || "—" },
                  { h: "Month", r: r => `${MONTHS[(r.month || 1) - 1]} ${r.year}` },
                  { h: "Amount", r: r => <span style={{ fontWeight: 500 }}>{fmtCur(r.finalAmount)}</span> },
                  { h: "Status", r: r => <Badge s={r.status} /> },
                  { h: "Due Date", r: r => fmt(r.dueDate) },
                  {
                    h: "Actions", r: r => (
                      <div style={{ display: "flex", gap: 6 }}>
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
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Student", r: r => <span style={{ fontWeight: 500 }}>{r.student?.firstName} {r.student?.lastName}</span> },
              { h: "Class", r: r => r.classroom?.displayName || "—" },
              { h: "Month", r: r => `${MONTHS[(r.month || 1) - 1]} ${r.year}` },
              { h: "Due Amount", r: r => <span style={{ color: "#991b1b", fontWeight: 600 }}>{fmtCur(r.finalAmount)}</span> },
              { h: "Status", r: r => <Badge s={r.status} /> },
              { h: "Father Phone", r: r => r.student?.fatherPhone || "—" },
            ]}
            rows={Array.isArray(defaulterList) ? defaulterList : []}
          />
        </div>
      )}

      {tab === "receipts" && (
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Receipt No", r: r => <span style={{ fontFamily: "monospace", fontSize: 11, color: "#1e3a5f" }}>{r.receiptNo}</span> },
              { h: "Student", r: r => `${r.student?.firstName} ${r.student?.lastName}` },
              { h: "Amount", r: r => <span style={{ fontWeight: 500, color: "#166534" }}>{fmtCur(r.amountPaid)}</span> },
              { h: "Mode", k: "paymentMode" },
              { h: "Date", r: r => fmt(r.paymentDate) },
            ]}
            rows={Array.isArray(receipts) ? receipts : []}
          />
        </div>
      )}

      <Modal open={showPay && !!selFee} onClose={() => setShowPay(false)} title="Collect Payment" width={420}>
        {selFee && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Total Due</span>
                <span style={{ fontWeight: 600, fontSize: 16, color: "#991b1b" }}>{fmtCur(selFee.finalAmount)}</span>
              </div>
            </div>
            <Inp label="Amount to Pay *" type="number" value={payForm.amountPaid} onChange={e => setPayForm(p => ({ ...p, amountPaid: e.target.value }))} />
            <Sel label="Payment Mode" value={payForm.paymentMode} onChange={e => setPayForm(p => ({ ...p, paymentMode: e.target.value }))} options={["Cash", "Cheque", "Online", "UPI", "BankTransfer"].map(m => ({ value: m, label: m }))} />
            {payForm.paymentMode !== "Cash" && <Inp label="Transaction ID" value={payForm.transactionId} onChange={e => setPayForm(p => ({ ...p, transactionId: e.target.value }))} />}
            <Textarea label="Notes" value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="outline" onClick={() => setShowPay(false)}>Cancel</Btn>
              <Btn variant="success" onClick={handleCollect}>Generate Receipt</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showGen} onClose={() => setShowGen(false)} title="Generate Fee Record" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sel label="Student *" value={genForm.studentId} onChange={e => setGenForm(p => ({ ...p, studentId: e.target.value }))} options={studentList.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName} (${s.admissionNo})` }))} />
          <div style={ss.grid2}>
            <Sel label="Month *" value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: Number(e.target.value) }))} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            <Inp label="Year *" type="number" value={genForm.year} onChange={e => setGenForm(p => ({ ...p, year: Number(e.target.value) }))} />
          </div>
          <Inp label="Tuition Fee *" type="number" value={genForm.tuitionFee} onChange={e => setGenForm(p => ({ ...p, tuitionFee: e.target.value }))} />
          <div style={ss.grid3}>
            <Inp label="Transport" type="number" value={genForm.transportFee} onChange={e => setGenForm(p => ({ ...p, transportFee: e.target.value }))} />
            <Inp label="Activity" type="number" value={genForm.activityFee} onChange={e => setGenForm(p => ({ ...p, activityFee: e.target.value }))} />
            <Inp label="Discount" type="number" value={genForm.discount} onChange={e => setGenForm(p => ({ ...p, discount: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
      <PageHdr title="Payroll Management"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ ...ss.select, width: "auto" }} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <Btn onClick={() => setShowGen(true)}>+ Generate Payroll</Btn>
          </div>
        } />
      {loading ? <Spinner /> : (
        <div style={ss.card}>
          <Table
            cols={[
              { h: "Employee", r: r => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avt name={r.employee?.name || "?"} size={28} /><span style={{ fontWeight: 500 }}>{r.employee?.name}</span></div> },
              { h: "Month", r: r => `${MONTHS[(r.month || 1) - 1]} ${r.year}` },
              { h: "Basic", r: r => fmtCur(r.basicSalary) },
              { h: "Present", k: "daysPresent" },
              { h: "Absent", k: "daysAbsent" },
              { h: "Deductions", r: r => <span style={{ color: "#991b1b" }}>-{fmtCur(r.deductions)}</span> },
              { h: "Bonus", r: r => r.bonus > 0 ? <span style={{ color: "#166534" }}>+{fmtCur(r.bonus)}</span> : "—" },
              { h: "Net Salary", r: r => <span style={{ fontWeight: 600, color: "#166534" }}>{fmtCur(r.netSalary)}</span> },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => r.status === "Pending"
                  ? <Btn variant="success" onClick={() => handleMarkPaid(r._id)}>Mark Paid</Btn>
                  : <span style={{ fontSize: 11, color: "#166534" }}>Paid {fmt(r.paymentDate)}</span>
              },
            ]}
            rows={Array.isArray(payroll) ? payroll : []}
          />
        </div>
      )}
      <Modal open={showGen} onClose={() => setShowGen(false)} title="Generate Payroll" width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sel label="Employee *" value={genForm.employeeId} onChange={f("employeeId")} options={empList.map(e => ({ value: e._id, label: `${e.name} (${e.employeeId})` }))} />
          <div style={ss.grid2}>
            <Sel label="Month" value={genForm.month} onChange={e => setGenForm(p => ({ ...p, month: Number(e.target.value) }))} options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            <Inp label="Year" type="number" value={genForm.year} onChange={f("year")} />
          </div>
          <Inp label="Bonus" type="number" value={genForm.bonus} onChange={f("bonus")} />
          <Sel label="Payment Mode" value={genForm.paymentMode} onChange={f("paymentMode")} options={["Cash", "BankTransfer", "Cheque"].map(m => ({ value: m, label: m }))} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
      <PageHdr title={role === "teacher" ? "My Leaves" : "Leave Requests"}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => setShowApply(true)}>+ Apply Leave</Btn>
          </div>
        } />
      {loading ? <Spinner /> : (
        <div style={ss.card}>
          <Table
            cols={[
              ...(role !== "teacher" ? [{ h: "Employee", r: (r) => <span style={{ fontWeight: 500 }}>{r.employee?.name || "—"}</span> }] : []),
              { h: "Type", k: "leaveType" },
              { h: "From", r: r => fmt(r.fromDate) },
              { h: "To", r: r => fmt(r.toDate) },
              { h: "Days", k: "totalDays" },
              { h: "Reason", r: r => <span style={{ maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.reason}</span> },
              { h: "Status", r: r => <Badge s={r.status} /> },
              {
                h: "Actions", r: r => (role === "admin" || role === "principal") && r.status === "Pending" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="success" onClick={() => { setSelLeave(r); setAction("Approved"); setRemarkModal(true); }}>Approve</Btn>
                    <Btn variant="danger" onClick={() => { setSelLeave(r); setAction("Rejected"); setRemarkModal(true); }}>Reject</Btn>
                  </div>
                ) : <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{r.approvalRemark || "—"}</span>
              },
            ]}
            rows={Array.isArray(leaves) ? leaves : []}
          />
        </div>
      )}

      <Modal open={showApply} onClose={() => setShowApply(false)} title="Apply for Leave" width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(role === "admin" || role === "principal") && (
            <Sel label="Employee *" value={empId} onChange={e => setEmpId(e.target.value)} options={empList.map(e => ({ value: e._id, label: e.name }))} />
          )}
          <Sel label="Leave Type *" value={form.leaveType} onChange={f("leaveType")} options={["Sick", "Casual", "Earned", "Maternity", "Unpaid", "Other"].map(t => ({ value: t, label: t }))} />
          <div style={ss.grid2}>
            <Inp label="From Date *" type="date" value={form.fromDate} onChange={f("fromDate")} />
            <Inp label="To Date *" type="date" value={form.toDate} onChange={f("toDate")} />
          </div>
          <Textarea label="Reason *" value={form.reason} onChange={f("reason")} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn variant="outline" onClick={() => setShowApply(false)}>Cancel</Btn>
            <Btn onClick={handleApply}>Submit</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={remarkModal} onClose={() => setRemarkModal(false)} title={`${action} Leave`} width={360}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Textarea label="Remark (optional)" value={remark} onChange={e => setRemark(e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
      <PageHdr title="Homework"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ ...ss.select, width: "auto" }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="">All Classes</option>
              {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </select>
            {role !== "parent" && <Btn onClick={() => setShowAdd(true)}>+ Assign Homework</Btn>}
          </div>
        } />
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(Array.isArray(homework) ? homework : []).map(hw => {
            const overdue = new Date(hw.dueDate) < new Date();
            return (
              <div key={hw._id} style={{ ...ss.card, borderLeft: `3px solid ${overdue ? "#ef4444" : "#1e3a5f"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "#dbeafe", color: "#1e40af", borderRadius: 10, fontWeight: 500 }}>{hw.subject?.name || "—"}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{hw.classroom?.displayName || "—"}</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{hw.title}</h4>
                    {hw.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{hw.description}</p>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)" }}>Due</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: overdue ? "#991b1b" : "var(--color-text-primary)" }}>{fmt(hw.dueDate)}</p>
                    {role !== "parent" && (
                      <button onClick={() => handleDelete(hw._id)} style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#991b1b" }}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {(!homework || !homework.length) && <div style={{ ...ss.card, textAlign: "center", padding: "48px", color: "var(--color-text-tertiary)" }}>No homework found</div>}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Assign Homework" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Sel label="Class *" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, subjectId: "" }))} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
          <Sel label="Subject *" value={form.subjectId} onChange={f("subjectId")} options={(subjects?.data || subjects || []).map(s => ({ value: s._id, label: s.name }))} />
          <Inp label="Title *" value={form.title} onChange={f("title")} />
          <Textarea label="Description" value={form.description} onChange={f("description")} />
          <Inp label="Due Date *" type="date" value={form.dueDate} onChange={f("dueDate")} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
  const { data: ttData, reload } = useFetch(() => selClass ? api.getTimetableForClass(selClass, ayId ? { academicYear: ayId } : {}) : Promise.resolve({ ok: true, data: null }), [selClass, ayId]);
  const classList = (classes?.data || classes || []).sort((a, b) => a.order - b.order);
  const tt = ttData?.data || ttData;
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div>
      <PageHdr title="Timetable" />
      <div style={{ ...ss.card, marginBottom: 16 }}>
        <Sel label="Select Class" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
      </div>
      {tt && tt.schedule ? (
        <div style={{ ...ss.card, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#1e3a5f", color: "#fff" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500 }}>Period</th>
                {DAYS.filter(d => tt.schedule.some(s => s.day === d)).map(d => (
                  <th key={d} style={{ padding: "10px 12px", textAlign: "center", fontWeight: 500 }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(p => {
                const anyPeriod = tt.schedule.some(s => s.periods?.some(per => per.periodNo === p));
                if (!anyPeriod) return null;
                return (
                  <tr key={p} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                      <p style={{ margin: 0 }}>P{p}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-secondary)" }}>
                        {tt.schedule[0]?.periods?.find(per => per.periodNo === p)?.startTime}–{tt.schedule[0]?.periods?.find(per => per.periodNo === p)?.endTime}
                      </p>
                    </td>
                    {DAYS.filter(d => tt.schedule.some(s => s.day === d)).map(day => {
                      const ds = tt.schedule.find(s => s.day === day);
                      const per = ds?.periods?.find(per => per.periodNo === p);
                      return (
                        <td key={day} style={{ padding: "8px 12px", textAlign: "center" }}>
                          {per?.subject ? (
                            <div style={{ padding: "6px 8px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                              <p style={{ margin: 0, fontWeight: 500, color: "#1e3a5f", fontSize: 11 }}>{per.subject?.name || "—"}</p>
                              <p style={{ margin: "2px 0 0", fontSize: 10, color: "var(--color-text-tertiary)" }}>{per.teacher?.name?.split(" ")[0] || "—"}</p>
                            </div>
                          ) : <span style={{ color: "var(--color-border-secondary)" }}>—</span>}
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
        <div style={{ ...ss.card, textAlign: "center", padding: 48, color: "var(--color-text-tertiary)" }}>No timetable configured for this class</div>
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

  const priorityColor = { Normal: "#dbeafe", Important: "#fef9c3", Urgent: "#fee2e2" };
  const priorityBorder = { Normal: "#93c5fd", Important: "#fde047", Urgent: "#fca5a5" };

  return (
    <div>
      <PageHdr title="Notice Board"
        actions={(role === "admin" || role === "principal") && <Btn onClick={() => setShowAdd(true)}>+ Create Notice</Btn>} />
      {loading ? <Spinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(Array.isArray(notices) ? notices : []).map(n => (
            <div key={n._id} style={{ ...ss.card, borderLeft: `3px solid ${priorityBorder[n.priority] || "#93c5fd"}`, background: priorityColor[n.priority] || "var(--color-background-primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{n.title}</h4>
                    <Badge s={n.priority} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12 }}>{n.content}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {(n.targetRoles || []).map(r => <span key={r} style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.6)", borderRadius: 8, textTransform: "capitalize" }}>{r}</span>)}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{fmt(n.publishDate)}</p>
                  {(role === "admin" || role === "principal") && (
                    <button onClick={() => handleDelete(n._id)} style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#991b1b" }}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!notices || !notices.length) && <div style={{ ...ss.card, textAlign: "center", padding: 48, color: "var(--color-text-tertiary)" }}>No notices</div>}
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Notice" width={500}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Inp label="Title *" value={form.title} onChange={f("title")} />
          <Textarea label="Content *" value={form.content} onChange={f("content")} />
          <Sel label="Priority" value={form.priority} onChange={f("priority")} options={["Normal", "Important", "Urgent"].map(p => ({ value: p, label: p }))} />
          <div>
            <label style={ss.label}>Target Audience</label>
            <div style={{ display: "flex", gap: 16 }}>
              {["parent", "teacher", "admin"].map(r => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={(form.targetRoles || []).includes(r)} onChange={e => setForm(p => ({ ...p, targetRoles: e.target.checked ? [...(p.targetRoles || []), r] : (p.targetRoles || []).filter(x => x !== r) }))} />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <div style={ss.grid2}>
            <Inp label="Publish Date" type="date" value={form.publishDate} onChange={f("publishDate")} />
            <Inp label="Expiry Date" type="date" value={form.expiryDate} onChange={f("expiryDate")} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
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
    const res = await api.executePromotions(students.map(s => ({ studentId: s._id, action: s.action, nextClassId: s.action === "Promoted" ? s.nextClassId : undefined, leavingReason: s.action === "Left" ? "End of year" : undefined })));
    if (res.ok) { toast("Promotion complete!", "success"); setPreview(null); setStudents([]); }
    else toast(res.data?.message, "error");
  };

  return (
    <div>
      <PageHdr title="Promote Students" />
      <div style={{ ...ss.card, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1, maxWidth: 260 }}>
          <Sel label="From Class" value={selClass} onChange={e => setSelClass(e.target.value)} options={classList.map(c => ({ value: c._id, label: c.displayName }))} />
        </div>
        <Btn onClick={loadPreview} loading={loading}>Load Preview</Btn>
        {students.length > 0 && <Btn variant="success" onClick={executePromote}>Execute Promotion</Btn>}
      </div>
      {preview && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ ...ss.card, flex: 1, padding: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>From Class</p>
              <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 500 }}>{preview.currentClass?.displayName}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 18, color: "var(--color-text-secondary)" }}>→</div>
            <div style={{ ...ss.card, flex: 1, padding: "0.75rem" }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>To Class</p>
              <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 500 }}>{preview.nextClass?.displayName || "Not configured"}</p>
            </div>
            <div style={{ ...ss.card, flex: 1, padding: "0.75rem", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Total Students</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 500 }}>{preview.totalCount}</p>
            </div>
          </div>
          <div style={ss.card}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--color-border-secondary)" }}>
                  {["Roll", "Student", "Result", "Promote To"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 11 }}>{s.rollNumber}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{s.firstName} {s.lastName}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <select style={{ ...ss.select, width: "auto" }} value={s.action} onChange={e => setStudents(d => d.map((x, j) => j === i ? { ...x, action: e.target.value } : x))}>
                        <option value="Promoted">Promoted</option>
                        <option value="Detained">Detained</option>
                        <option value="Left">Left School</option>
                      </select>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {s.action === "Promoted" ? (
                        <select style={{ ...ss.select, width: "auto" }} value={s.nextClassId} onChange={e => setStudents(d => d.map((x, j) => j === i ? { ...x, nextClassId: e.target.value } : x))}>
                          {classList.map(c => <option key={c._id} value={c._id}>{c.displayName}</option>)}
                        </select>
                      ) : <span style={{ color: "var(--color-text-tertiary)" }}>—</span>}
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
          <div style={{ ...ss.grid4, marginBottom: 16 }}>
            <StatCard label="Total Students" value={overview.students?.total || 0} />
            <StatCard label="Approved" value={overview.students?.approved || 0} color="#166534" />
            <StatCard label="Active Employees" value={overview.employees?.active || 0} />
            <StatCard label="Fee Collected" value={fmtCur(overview.fees?.collected)} color="#166534" />
          </div>
          <div style={ss.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 500 }}>Class-wise Distribution (Boys vs Girls)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cwChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
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
        <div>
          <div style={ss.card}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 500 }}>Monthly Fee Collection</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={feeChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}k`} />
                <Tooltip formatter={v => fmtCur(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="collected" fill="#166534" name="Collected" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pending" fill="#991b1b" name="Pending" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div style={ss.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 500 }}>Low Attendance Students (below 75%)</h3>
          <Table
            cols={[
              { h: "Student", r: r => <span style={{ fontWeight: 500 }}>{r._id?.firstName} {r._id?.lastName}</span> },
              { h: "Adm No", r: r => r._id?.admissionNo },
              { h: "Present", k: "present" },
              { h: "Total", k: "total" },
              { h: "Attendance %", r: r => <span style={{ fontWeight: 600, color: r.percentage < 60 ? "#991b1b" : "#854d0e" }}>{r.percentage}%</span> },
            ]}
            rows={lowAtt?.data || lowAtt || []}
          />
        </div>
      )}

      {tab === "payroll" && (
        <div>
          {payrollSummary?.summary && (
            <div style={{ ...ss.grid4, marginBottom: 16 }}>
              <StatCard label="Total Employees" value={payrollSummary.summary.totalEmployees || 0} />
              <StatCard label="Total Basic" value={fmtCur(payrollSummary.summary.totalBasic)} />
              <StatCard label="Total Net Paid" value={fmtCur(payrollSummary.summary.totalNet)} color="#166534" />
              <StatCard label="Pending" value={payrollSummary.summary.pendingCount || 0} color="#991b1b" />
            </div>
          )}
          <div style={ss.card}>
            <Table
              cols={[
                { h: "Employee", r: r => r.employee?.name || "—" },
                { h: "Role", r: r => r.employee?.role || "—" },
                { h: "Basic", r: r => fmtCur(r.basicSalary) },
                { h: "Net", r: r => <span style={{ fontWeight: 600 }}>{fmtCur(r.netSalary)}</span> },
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
        <div style={{ ...ss.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><Inp label="School Name" value={form.name || ""} onChange={f("name")} /></div>
          <div style={{ gridColumn: "1/-1" }}><Textarea label="Address" value={form.address || ""} onChange={f("address")} /></div>
          <Inp label="Phone" value={form.phone || ""} onChange={f("phone")} />
          <Inp label="Email" type="email" value={form.email || ""} onChange={f("email")} />
          <Inp label="Website" value={form.website || ""} onChange={f("website")} />
          <Inp label="Affiliation No" value={form.affiliationNo || ""} onChange={f("affiliationNo")} />
          <Inp label="Board" value={form.board || ""} onChange={f("board")} />
          <div style={{ gridColumn: "1/-1" }}><Textarea label="Declaration" value={form.declaration || ""} onChange={f("declaration")} /></div>
          <div style={{ gridColumn: "1/-1" }}><Btn onClick={handleSave}>Save Settings</Btn></div>
        </div>
      )}

      {tab === "fees" && (
        <div style={{ ...ss.card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 500 }}>
          <Inp label="Late Fine Per Day (₹)" type="number" value={form.lateFinePer || 10} onChange={f("lateFinePer")} />
          <Inp label="Fee Due Day (of month)" type="number" value={form.feeDueDay || 10} onChange={f("feeDueDay")} min={1} max={31} />
          <Inp label="Min Attendance %" type="number" value={form.minAttendance || 75} onChange={f("minAttendance")} min={1} max={100} />
          <div style={{ gridColumn: "1/-1" }}><Btn onClick={handleSave}>Save Settings</Btn></div>
        </div>
      )}

      {tab === "password" && (
        <div style={{ ...ss.card, maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [ayId, setAyId] = useState(null);
  const [ayList, setAyList] = useState([]);

  // Restore token from localStorage
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
    // Load academic years
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
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-background-tertiary)" }}>
        {/* Sidebar */}
        {sidebarOpen && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 39 }} onClick={() => setSidebarOpen(false)} />}
        <aside style={{ width: 220, flexShrink: 0, background: "var(--color-background-primary)", borderRight: "0.5px solid var(--color-border-tertiary)", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 40 }}>
          {/* Logo */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "#1e3a5f", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>🏫</div>
              <div><p style={{ margin: 0, fontWeight: 500, fontSize: 12 }}>School Management</p><p style={{ margin: 0, fontSize: 10, color: "var(--color-text-secondary)" }}>{BASE_URL}</p></div>
            </div>
          </div>
          {/* AY Selector */}
          {ayList.length > 0 && (
            <div style={{ padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <select style={{ ...ss.select, fontSize: 11 }} value={ayId || ""} onChange={e => setAyId(e.target.value)}>
                {ayList.map(ay => <option key={ay._id} value={ay._id}>{ay.name}{ay.isCurrent ? " ✓" : ""}</option>)}
              </select>
            </div>
          )}
          {/* Nav */}
          <nav style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
            {navSections.map(section => (
              <div key={section.section} style={{ marginBottom: 4 }}>
                <p style={{ margin: "12px 8px 4px", fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{section.section}</p>
                {section.items.map(item => (
                  <button key={item.id} onClick={() => setPage(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: "var(--border-radius-md)", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, textAlign: "left", background: page === item.id ? "#1e3a5f" : "none", color: page === item.id ? "#fff" : "var(--color-text-secondary)", marginBottom: 1 }}>
                    {item.l}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          {/* User */}
          <div style={{ padding: "12px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Avt name={user.name || user.email} size={28} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{user.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} style={{ width: "100%", padding: "6px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "none", cursor: "pointer", fontSize: 11, color: "#991b1b" }}>Sign Out</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {renderPage()}
        </main>
      </div>
    </AppCtx.Provider>
  );
}