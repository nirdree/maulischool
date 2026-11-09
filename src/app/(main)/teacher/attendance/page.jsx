// pages/teacher/Attendance.jsx
/**
 * TEACHER ATTENDANCE PAGE
 * APIs Used:
 *   GET  /api/academic-years/current
 *   GET  /api/classrooms              — teacher's classes
 *   GET  /api/students                — students in selected class
 *   GET  /api/attendance/students     — fetch existing records for a date
 *   POST /api/attendance/students     — bulk save attendance
 */
'use client';
import { useEffect, useState } from 'react';
import { Save, RefreshCw, CheckCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Button, Select, Modal } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext';
const STATUSES = ['Present', 'Absent', 'Late', 'HalfDay', 'Holiday'];
const MY_ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'HalfDay', 'OnLeave', 'Holiday'];

function attendanceStatusClass(status) {
  const styles = {
    Present: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Absent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    Late: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    HalfDay: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    OnLeave: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    Holiday: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };
  return styles[status] || 'bg-slate-700 text-slate-400 border-slate-600';
}

function statusBtnClass(s, active) {
  if (!active) return 'border border-slate-700 text-slate-400 hover:border-slate-500 px-2 py-1 rounded text-xs font-medium transition';
  const map = {
    Present: 'bg-emerald-600 text-white',
    Absent: 'bg-rose-600 text-white',
    Late: 'bg-amber-500 text-white',
    HalfDay: 'bg-sky-600 text-white',
    Holiday: 'bg-violet-600 text-white',
  };
  return `${map[s] || 'bg-slate-600 text-white'} px-2 py-1 rounded text-xs font-medium transition`;
}

export default function AttendancePage() {
  const { user } = useAuth();

  const [view, setView] = useState('students');
  const [classrooms, setClassrooms] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [ayId, setAyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myAttendanceLoading, setMyAttendanceLoading] = useState(false);
  const [myAttendanceError, setMyAttendanceError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
  (async () => {
    try {
      const ay = await api.get(API.ACADEMIC_YEARS.CURRENT);
      const ayId = ay.data?._id;
      setAyId(ayId);

      const cls = await api.get(
        `${API.CLASSROOMS.BASE}?isActive=true&academicYear=${ayId}`
      );

      const classes = cls.data || [];
      const myClasses = classes.filter(
        (c) => c.classTeacher?.name === user?.name
      );
      setClassrooms(myClasses);
      if (myClasses.length > 0) {
        setClassFilter(myClasses[0]._id);
      }
    } catch (err) {
      console.log(err);
    }
  })();
}, [user]);

  useEffect(() => {
    if (classFilter && ayId) fetchAttendance();
  }, [classFilter, date, ayId]);

  useEffect(() => {
    if (view !== 'mine' || !ayId) return;
    fetchMyAttendance();
  }, [view, date, ayId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const [stuRes, attRes] = await Promise.all([
        api.get(`${API.STUDENTS.BASE}?classId=${classFilter}&status=Approved&academicYear=${ayId}&limit=100`),
        api.get(`${API.ATTENDANCE.STUDENTS}?classId=${classFilter}&date=${date}&academicYear=${ayId}`),
      ]);
      const stuList = stuRes.data || [];
      setStudents(stuList);

      const existing = {};
      (attRes.data || []).forEach(r => {
        existing[r.student?._id || r.student] = r.status;
      });
      const init = {};
      stuList.forEach(s => { init[s._id] = existing[s._id] || 'Present'; });
      setAttendance(init);
    } catch {} finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    setMyAttendanceLoading(true);
    try {
      const [year, month] = date.split('-').map(Number);
      const monthDays = new Date(year, month, 0).getDate();
      const params = new URLSearchParams({
        academicYear: ayId,
        fromDate: `${date.slice(0, 7)}-01`,
        toDate: `${date.slice(0, 7)}-${String(monthDays).padStart(2, '0')}T23:59:59.999Z`,
      });
      const res = await api.get(`${API.ATTENDANCE.EMPLOYEES}?${params}`);
      setMyAttendance(res.data || []);
      setMyAttendanceError('');
    } catch (err) {
      setMyAttendance([]);
      setMyAttendanceError(err.response?.data?.message || err.message || 'Unable to load your attendance.');
    } finally {
      setMyAttendanceLoading(false);
    }
  };

  const changeMyAttendanceMonth = (offset) => {
    const [year, month] = date.slice(0, 7).split('-').map(Number);
    const nextMonth = new Date(Date.UTC(year, month - 1 + offset, 1));
    setDate(`${nextMonth.toISOString().slice(0, 7)}-01`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        student: s._id,
        classroom: classFilter,
        date,
        status: attendance[s._id] || 'Present',
        academicYear: ayId,
      }));
      await api.post(API.ATTENDANCE.STUDENTS, { records });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const next = {};
    students.forEach(s => { next[s._id] = status; });
    setAttendance(next);
  };

  const summary = {
    present: Object.values(attendance).filter(s => s === 'Present').length,
    absent: Object.values(attendance).filter(s => s === 'Absent').length,
    late: Object.values(attendance).filter(s => s === 'Late').length,
  };

  const classOptions = classrooms.map(c => ({ value: c._id, label: c.displayName }));
  const [calendarYear, calendarMonth] = date.slice(0, 7).split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(calendarYear, calendarMonth, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(calendarYear, calendarMonth - 1, 1)).getUTCDay();
  const attendanceByDate = new Map(
    myAttendance.map(record => [new Date(record.date).toISOString().slice(0, 10), record])
  );
  const monthlyAttendanceSummary = MY_ATTENDANCE_STATUSES.reduce((counts, status) => {
    counts[status] = myAttendance.filter(record => record.status === status).length;
    return counts;
  }, {});
  return (
    <PageContent>
      <PageHeader
        title={view === 'students' ? 'Mark Attendance' : 'My Attendance'}
        subtitle={view === 'students' ? 'Record daily student attendance' : 'View your attendance records'}
        actions={
          view === 'students' && <Button onClick={handleSave} disabled={saving || students.length === 0}>
            {saved ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Attendance'}
          </Button>
        }
      />

      <div className="flex gap-2 mb-6">
        <Button variant={view === 'students' ? 'primary' : 'ghost'} onClick={() => setView('students')}>
          Student Attendance
        </Button>
        <Button variant={view === 'mine' ? 'primary' : 'ghost'} onClick={() => setView('mine')}>
          My Attendance
        </Button>
        {/* Mobile Filters trigger */}
        <Button className="sm:hidden ml-auto" variant="ghost" onClick={() => setFiltersOpen(true)}>
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {/* Controls (hidden on phones, moved to Filters modal) */}
      <div className="hidden sm:flex flex-wrap gap-3 mb-4 items-end">
        {view === 'students' && <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>}
        {view === 'students' && <Select
          label="Class"
          options={classOptions}
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="w-44"
        />}
        <Button variant="ghost" onClick={view === 'students' ? fetchAttendance : fetchMyAttendance}><RefreshCw className="w-4 h-4" /></Button>

        {view === 'students' && students.length > 0 && (
          <div className="flex gap-2 ml-auto">
            {['Present', 'Absent', 'Holiday'].map(s => (
              <Button key={s} size="sm" variant="ghost" onClick={() => markAll(s)}>
                All {s}
              </Button>
            ))}
          </div>
        )}
      </div>

      {view === 'mine' && (
        <Card>
          {myAttendanceLoading ? (
            <div className="py-12 text-center text-slate-500">Loading your attendance...</div>
          ) : myAttendanceError ? (
            <div className="py-12 text-center text-rose-400">{myAttendanceError}</div>
          ) : (
            <div>
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="!px-2"
                    onClick={() => changeMyAttendanceMonth(-1)}
                    aria-label="Previous month"
                    title="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <label className="sr-only" htmlFor="my-attendance-month">Choose month and year</label>
                  <input
                    id="my-attendance-month"
                    type="month"
                    value={date.slice(0, 7)}
                    onChange={event => {
                      if (event.target.value) setDate(`${event.target.value}-01`);
                    }}
                    className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-center text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button
                    variant="ghost"
                    className="!px-2"
                    onClick={() => changeMyAttendanceMonth(1)}
                    aria-label="Next month"
                    title="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-xs text-slate-400">{myAttendance.length} recorded day{myAttendance.length !== 1 ? 's' : ''}</span>
              </div>

              {myAttendance.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                  {MY_ATTENDANCE_STATUSES.filter(status => monthlyAttendanceSummary[status] > 0).map(status => (
                    <span key={status} className="text-xs text-slate-400">
                      {status === 'HalfDay' ? 'Half day' : status === 'OnLeave' ? 'On leave' : status}:
                      {' '}<span className="font-semibold text-white">{monthlyAttendanceSummary[status]}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-1 text-center text-xs font-medium text-slate-500">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstWeekday }, (_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const dateKey = `${date.slice(0, 7)}-${String(day).padStart(2, '0')}`;
                  const record = attendanceByDate.get(dateKey);
                  const isToday = dateKey === new Date().toISOString().slice(0, 10);
                  return (
                    <div
                      key={dateKey}
                      title={record?.remark || record?.status || undefined}
                      className={`min-h-[64px] rounded-lg border p-1.5 flex flex-col items-center gap-1 ${
                        isToday ? 'border-violet-500 bg-violet-500/5' : 'border-slate-800'
                      }`}
                    >
                      <span className={`text-xs font-medium ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>{day}</span>
                      {record && (
                        <span className={`max-w-full rounded border px-1 py-0.5 text-center text-[9px] font-medium leading-tight ${attendanceStatusClass(record.status)}`}>
                          {record.status === 'HalfDay' ? 'Half day' : record.status === 'OnLeave' ? 'On leave' : record.status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {myAttendance.length === 0 && (
                <p className="mt-4 text-center text-sm text-slate-500">No attendance records for this month.</p>
              )}

              <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-800 pt-4">
                {MY_ATTENDANCE_STATUSES.map(status => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${attendanceStatusClass(status)}`}>
                      {status === 'HalfDay' ? 'Half day' : status === 'OnLeave' ? 'On leave' : status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Summary bar */}
      {view === 'students' && students.length > 0 && (
        <div className="flex gap-4 mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <span className="text-xs text-slate-400">Total: <span className="text-white font-bold">{students.length}</span></span>
          <span className="text-xs text-slate-400">Present: <span className="text-emerald-400 font-bold">{summary.present}</span></span>
          <span className="text-xs text-slate-400">Absent: <span className="text-rose-400 font-bold">{summary.absent}</span></span>
          <span className="text-xs text-slate-400">Late: <span className="text-amber-400 font-bold">{summary.late}</span></span>
        </div>
      )}

      {view === 'students' && <Card className="!p-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading students...</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Roll No</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      No students found. Select a class.
                    </td>
                  </tr>
                ) : (
                  students.map((s, i) => (
                    <tr key={s._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="py-3 px-4 text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4 text-white font-medium">{s.firstName} {s.lastName}</td>
                      <td className="py-3 px-4 text-slate-400">{s.rollNumber || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {STATUSES.map(st => (
                            <button
                              key={st}
                              onClick={() => setAttendance(prev => ({ ...prev, [s._id]: st }))}
                              className={statusBtnClass(st, attendance[s._id] === st)}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>}

      {filtersOpen && (
        <Modal open onClose={() => setFiltersOpen(false)} title="Filters">
          <div className="space-y-4">
            {view === 'students' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                />
              </div>
            )}

            {view === 'students' && (
              <Select
                label="Class"
                options={classOptions}
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
              />
            )}

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={view === 'students' ? fetchAttendance : fetchMyAttendance}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>

              {view === 'students' && students.length > 0 && (
                <div className="flex gap-2">
                  {['Present', 'Absent', 'Holiday'].map(s => (
                    <Button key={s} size="sm" variant="ghost" onClick={() => markAll(s)}>
                      All {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setFiltersOpen(false)}>Done</Button>
          </div>
        </Modal>
      )}

    </PageContent>
  );
}