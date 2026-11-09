// pages/admin/Attendance.jsx
/**
 * ATTENDANCE PAGE (Admin)
 * APIs Used:
 *   GET  /api/attendance/students    — list records
 *   POST /api/attendance/students    — bulk save
 *   GET  /api/attendance/employees   — employee records
 *   POST /api/attendance/employees   — bulk save employee
 *   GET  /api/classrooms             — populate class dropdown
 *   GET  /api/students               — student list for marking
 *   GET  /api/employees              — employee list for marking
 */
'use client';
import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Save, RefreshCw, Users, UserCheck } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Button, Select, Badge, Modal } from '@/components/ui.jsx';

const STUDENT_STATUSES = ['Present', 'Absent', 'Late', 'HalfDay', 'Holiday'];
const EMPLOYEE_STATUSES = ['Present', 'Absent', 'Late', 'HalfDay', 'OnLeave', 'Holiday'];

function statusColor(s) {
  const map = { Present: 'green', Absent: 'red', Late: 'yellow', HalfDay: 'blue', Holiday: 'purple', OnLeave: 'indigo' };
  return map[s] || 'slate';
}

function statusTextClass(s) {
  const map = {
    Present: 'text-emerald-400',
    Absent: 'text-rose-400',
    Late: 'text-amber-400',
    HalfDay: 'text-sky-400',
    Holiday: 'text-violet-400',
    OnLeave: 'text-indigo-400',
  };
  return map[s] || 'text-slate-400';
}

function toDateOnly(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
}

export default function AttendanceAdminPage() {
  const [tab, setTab] = useState('students');
  const [classrooms, setClassrooms] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [ayId, setAyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monthlyViewOpen, setMonthlyViewOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ay = await api.get(API.ACADEMIC_YEARS.CURRENT);
        setAyId(ay.data?._id);
        const cls = await api.get(`${API.CLASSROOMS.BASE}?isActive=true&academicYear=${ay.data?._id}`);
        setClassrooms(cls.data || []);
      } catch {}
    })();
  }, []);

  const fetchStudentAttendance = async () => {
    if (!classFilter || !ayId) return;
    setLoading(true);
    try {
      // Load students
      const stuRes = await api.get(`${API.STUDENTS.BASE}?classId=${classFilter}&status=Approved&academicYear=${ayId}&limit=100`);
      setStudents(stuRes.data || []);

      // Load existing attendance for the day
      const attRes = await api.get(`${API.ATTENDANCE.STUDENTS}?classId=${classFilter}&date=${date}&academicYear=${ayId}`);
      const existing = {};
      (attRes.data || []).forEach(r => { existing[r.student._id || r.student] = r.status; });
      // Default all to Present if not marked
      const initial = {};
      (stuRes.data || []).forEach(s => { initial[s._id] = existing[s._id] || 'Present'; });
      setAttendance(initial);
    } catch {} finally { setLoading(false); }
  };

  const fetchEmployeeAttendance = async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const empRes = await api.get(`${API.EMPLOYEES.BASE}?status=active`);
      setEmployees(empRes.data || []);
      const attRes = await api.get(`${API.ATTENDANCE.EMPLOYEES}?date=${date}&academicYear=${ayId}`);
      const existing = {};
      (attRes.data || []).forEach(r => { existing[r.employee._id || r.employee] = r.status; });
      const initial = {};
      (empRes.data || []).forEach(e => { initial[e._id] = existing[e._id] || 'Present'; });
      setAttendance(initial);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'students') fetchStudentAttendance();
    else fetchEmployeeAttendance();
  }, [tab, classFilter, date, ayId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'students') {
        const records = students.map(s => ({
          student: s._id, classroom: classFilter, date, status: attendance[s._id] || 'Present', academicYear: ayId,
        }));
        await api.post(API.ATTENDANCE.STUDENTS, { records });
      } else {
        const records = eligibleEmployees.map(e => ({
          employee: e._id, date, status: attendance[e._id] || 'Present', academicYear: ayId,
        }));
        await api.post(API.ATTENDANCE.EMPLOYEES, { records });
      }
      alert('Attendance saved!');
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const classOptions = [
    { value: '', label: 'Select Class' },
    ...classrooms.map(c => ({ value: c._id, label: c.displayName })),
  ];

  const markAll = (status) => {
    const list = tab === 'students' ? students : eligibleEmployees;
    const newAtt = {};
    list.forEach(item => { newAtt[item._id] = status; });
    setAttendance(newAtt);
  };

  const eligibleEmployees = employees.filter(employee =>
    Boolean(toDateOnly(employee.dateOfJoining)) && toDateOnly(employee.dateOfJoining) <= date
  );
  const attendanceItems = tab === 'students' ? students : eligibleEmployees;

  return (
    <PageContent>
      <PageHeader title="Attendance" subtitle="Mark and view attendance" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button variant={tab === 'students' ? 'primary' : 'ghost'} onClick={() => { setTab('students'); setAttendance({}); }}>
          <Users className="w-4 h-4" /> Students
        </Button>
        <Button variant={tab === 'employees' ? 'primary' : 'ghost'} onClick={() => { setTab('employees'); setAttendance({}); }}>
          <UserCheck className="w-4 h-4" /> Employees
        </Button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4 items-end">
        <div className="col-span-1 w-full sm:w-auto">
          <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <Button
          variant="ghost"
          className="col-start-2 row-start-1 justify-self-end sm:order-3 sm:self-end"
          onClick={tab === 'students' ? fetchStudentAttendance : fetchEmployeeAttendance}
          aria-label="Refresh attendance"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        {tab === 'employees' && (
          <Button
            variant="ghost"
            className="col-start-3 row-start-1 !px-2 text-xs sm:order-4 sm:col-span-1 sm:w-auto sm:!px-4 sm:text-sm"
            onClick={() => setMonthlyViewOpen(true)}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="sm:hidden">Month</span>
            <span className="hidden sm:inline">Monthly View</span>
          </Button>
        )}
        {tab === 'students' && (
          <Select options={classOptions} value={classFilter} onChange={e => setClassFilter(e.target.value)} className="col-span-3 w-full sm:order-2 sm:col-span-1 sm:w-44" label="Class" />
        )}
        <div className="col-span-3 grid grid-cols-2 gap-2 sm:order-5 sm:ml-auto sm:flex">
          {['Present', 'Absent', 'Holiday'].map(s => (
            <Button key={s} size="sm" variant="ghost" className="w-full sm:w-auto" onClick={() => markAll(s)}>All {s}</Button>
          ))}
          <Button
            className="w-full sm:w-auto"
            onClick={handleSave}
            disabled={saving || (tab === 'employees' && eligibleEmployees.length === 0)}
          >
            <Save className="w-4 h-4" />
            <span className="sm:hidden">{saving ? 'Saving...' : 'Save'}</span>
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Attendance'}</span>
          </Button>
        </div>
      </div>
      {tab === 'employees' && employees.length > eligibleEmployees.length && (
        <p className="mb-3 text-xs text-amber-400">
          {employees.length - eligibleEmployees.length} employee(s) who had not joined by {date} are excluded.
        </p>
      )}

      <Card className="!p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Name</th>
                  {tab === 'students' && <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Roll No</th>}
                  {tab === 'employees' && <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Role</th>}
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceItems.map((item, i) => (
                  <tr key={item._id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-400">{i + 1}</td>
                    <td className="py-3 px-4 text-white font-medium">
                      {tab === 'students' ? `${item.firstName} ${item.lastName}` : item.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {tab === 'students' ? item.rollNumber : item.role}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(tab === 'students' ? STUDENT_STATUSES : EMPLOYEE_STATUSES).map(s => (
                          <button key={s}
                            onClick={() => setAttendance(prev => ({ ...prev, [item._id]: s }))}
                            className={`px-2 py-1 rounded text-xs font-medium transition border ${
                              attendance[item._id] === s
                                ? `border-transparent ${s === 'Present' ? 'bg-emerald-600 text-white' : s === 'Absent' ? 'bg-rose-600 text-white' : s === 'Late' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'}`
                                : 'border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                          >{s}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {attendanceItems.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-500">
                    {tab === 'students'
                      ? 'Select a class to mark attendance'
                      : employees.length
                        ? 'No employees had joined by the selected date'
                        : 'No employees found'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {monthlyViewOpen && (
        <EmployeeAttendanceCalendar onClose={() => setMonthlyViewOpen(false)} />
      )}
    </PageContent>
  );
}

function EmployeeAttendanceCalendar({ onClose }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    let active = true;
    const [year, monthNumber] = month.split('-').map(Number);
    const fromDate = `${month}-01`;
    const toDate = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
    const params = new URLSearchParams({ fromDate, toDate });

    Promise.all([
      api.get(API.EMPLOYEES.BASE),
      api.get(`${API.ATTENDANCE.EMPLOYEES}?${params}`),
    ])
      .then(([employeeResponse, attendanceResponse]) => {
        if (!active) return;
        setEmployees(employeeResponse.data || []);
        setRecords(attendanceResponse.data || []);
      })
      .catch(err => {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Unable to load monthly attendance');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [month]);

  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const visibleRecords = records.filter(record => {
    const employeeId = record.employee?._id || record.employee;
    return (!employeeFilter || String(employeeId) === employeeFilter)
      && (!statusFilter || record.status === statusFilter);
  });
  const recordsByDate = new Map();
  visibleRecords.forEach(record => {
    const recordDate = toDateOnly(record.date);
    if (!recordsByDate.has(recordDate)) recordsByDate.set(recordDate, []);
    recordsByDate.get(recordDate).push(record);
  });
  const employeeOptions = [
    { value: '', label: 'All employees' },
    ...employees.map(employee => ({ value: employee._id, label: employee.name })),
  ];
  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...EMPLOYEE_STATUSES.map(status => ({ value: status, label: status })),
  ];

  const changeMonth = offset => {
    const [currentYear, currentMonth] = month.split('-').map(Number);
    const nextMonth = new Date(Date.UTC(currentYear, currentMonth - 1 + offset, 1));
    setLoading(true);
    setError('');
    setMonth(nextMonth.toISOString().slice(0, 7));
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Monthly Employee Attendance"
      width="max-w-[calc(100vw-2rem)] lg:max-w-[96vw]"
    >
      <p className="mb-4 text-sm text-slate-400">
        View only. Attendance records cannot be changed from this calendar.
      </p>

      <div className="mb-4 flex items-center justify-center gap-2 overflow-x-auto pb-2">
        <Select
          options={employeeOptions}
          value={employeeFilter}
          onChange={event => setEmployeeFilter(event.target.value)}
          className="w-36 shrink-0"
        />
        <Button
          variant="ghost"
          className="!px-2"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="w-36 shrink-0">
          <label htmlFor="attendance-month" className="sr-only">Choose month and year</label>
          <input
            id="attendance-month"
            type="month"
            value={month}
            onChange={event => {
              if (!event.target.value) return;
              setLoading(true);
              setError('');
              setMonth(event.target.value);
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-center text-sm font-medium text-white"
          />
        </div>
        <Button
          variant="ghost"
          className="!px-2"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="w-36 shrink-0"
        />
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading monthly attendance…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-400">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 bg-slate-800">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="border-b border-r border-slate-700 px-2 py-2 text-center text-xs font-medium text-slate-300">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstWeekday }, (_, index) => (
                <div key={`empty-${index}`} className="aspect-square border-b border-r border-slate-800 bg-slate-950/40" />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const dateKey = `${month}-${String(day).padStart(2, '0')}`;
                const dayRecords = recordsByDate.get(dateKey) || [];
                return (
                  <div key={dateKey} className="flex aspect-square flex-col overflow-hidden border-b border-r border-slate-800 p-1.5 sm:p-2">
                    <p className="mb-1 text-xs font-semibold text-slate-400">{day}</p>
                    {dayRecords.length > 0 && (
                      <div className="min-h-0 space-y-1 overflow-hidden">
                        {dayRecords.slice(0, 2).map(record => (
                          <div key={record._id} className="rounded bg-slate-800 px-1 py-0.5">
                            <p className="truncate text-[9px] font-medium leading-tight text-white sm:text-[10px]">
                              {record.employee?.name || 'Unknown employee'}
                            </p>
                            <p className={`truncate text-[8px] leading-tight ${statusTextClass(record.status)}`}>
                              {record.status}
                            </p>
                          </div>
                        ))}
                        {dayRecords.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setSelectedDate(dateKey)}
                            className="w-full truncate rounded bg-indigo-500/15 px-1 py-0.5 text-left text-[9px] font-semibold text-indigo-300 hover:bg-indigo-500/25 sm:text-[10px]"
                            aria-label={`Show ${dayRecords.length - 2} more attendance records for ${dateKey}`}
                          >
                            +{dayRecords.length - 2} more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      {selectedDate && (
        <Modal
          open
          onClose={() => setSelectedDate('')}
          title={`Attendance — ${selectedDate}`}
          width="max-w-md"
        >
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {(recordsByDate.get(selectedDate) || []).map(record => (
              <div key={record._id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 px-3 py-2">
                <span className="min-w-0 truncate text-sm font-medium text-white">
                  {record.employee?.name || 'Unknown employee'}
                </span>
                <Badge label={record.status} color={statusColor(record.status)} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="ghost" onClick={() => setSelectedDate('')}>Close</Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}