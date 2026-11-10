// pages/parent/Attendance.jsx
/**
 * PARENT ATTENDANCE PAGE
 * APIs Used:
 *   GET /api/academic-years/current
 *   GET /api/students               — parent's children
 *   GET /api/attendance/students    — attendance records
 *   GET /api/attendance/students/summary — monthly summary
 */
'use client';
import { useEffect, useMemo, useState } from 'react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Select } from '@/components/ui.jsx';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function firstMonthOfYear(year) {
  const start = new Date(year.startDate);
  return new Date(start.getFullYear(), start.getMonth(), 1);
}

function getAdmissionDate(student) {
  const enrollmentYears = [
    ...(student?.academicHistory || []).map(enrollment => enrollment.academicYear),
    student?.academicYear,
  ].filter(Boolean);
  const dates = enrollmentYears
    .map(year => new Date(year.startDate))
    .filter(date => !Number.isNaN(date.getTime()));
  return dates.length
    ? new Date(Math.min(...dates.map(date => date.getTime())))
    : new Date(student.createdAt);
}

function getCurrentAcademicYear(years) {
  const now = new Date();
  return years.find(year => new Date(year.startDate) <= now && new Date(year.endDate) >= now)
    || years.find(year => year.isCurrent)
    || years[0];
}

function getMonthsInYear(year) {
  const start = firstMonthOfYear(year);
  const endDate = new Date(year.endDate);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const months = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
    months.push(new Date(cursor));
  }
  return months;
}

function statusColor(s) {
  const map = {
    Present: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Absent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    Late: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    HalfDay: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    Holiday: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };
  return map[s] || 'bg-slate-700 text-slate-400 border-slate-600';
}

export default function ParentAttendance() {
  const [children, setChildren] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadedAttendanceKey, setLoadedAttendanceKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [yearsResponse, childrenResponse] = await Promise.all([
          api.get(`${API.ACADEMIC_YEARS.BASE}?limit=100`),
          api.get(`${API.STUDENTS.BASE}?limit=100`),
        ]);
        const years = yearsResponse.data || [];
        const kids = childrenResponse.data || [];
        setAcademicYears(years);
        setChildren(kids);
        if (kids.length > 0) {
          const child = kids[0];
          setSelectedChild(child._id);
          const admissionDate = getAdmissionDate(child);
          const eligibleYears = years.filter(academicYear =>
            new Date(academicYear.endDate) >= admissionDate
            && new Date(academicYear.startDate) <= new Date(),
          );
          const currentYear = getCurrentAcademicYear(eligibleYears);
          if (currentYear) {
            setSelectedAcademicYear(currentYear._id);
            const months = getMonthsInYear(currentYear);
            const now = new Date();
            const initialMonth = months.find(date =>
              date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(),
            ) || months[0];
            if (initialMonth) setSelectedMonth(monthKey(initialMonth));
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Unable to load attendance options.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedChild || !selectedAcademicYear || !selectedMonth) return;
    let cancelled = false;
    const [year, month] = selectedMonth.split('-').map(Number);
    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const requestKey = `${selectedChild}:${selectedAcademicYear}:${selectedMonth}`;
    Promise.all([
      api.get(`${API.ATTENDANCE.STUDENTS}?studentId=${selectedChild}&fromDate=${fromDate}&toDate=${toDate}&academicYear=${selectedAcademicYear}`),
      api.get(`${API.ATTENDANCE.STUDENTS_SUMMARY}?studentId=${selectedChild}&month=${month}&year=${year}&academicYear=${selectedAcademicYear}`),
    ])
      .then(([recordResponse, summaryResponse]) => {
        if (cancelled) return;
        setRecords(recordResponse.data || []);
        setSummary((summaryResponse.data || [])[0] || null);
      })
      .catch(err => {
        if (cancelled) return;
        console.error(err);
        setRecords([]);
        setSummary(null);
        setError(err.response?.data?.message || err.message || 'Unable to load attendance.');
      })
      .finally(() => { if (!cancelled) setLoadedAttendanceKey(requestKey); });

    return () => { cancelled = true; };
  }, [selectedChild, selectedAcademicYear, selectedMonth]);

  const attendanceKey = `${selectedChild}:${selectedAcademicYear}:${selectedMonth}`;
  const loading = Boolean(selectedChild && selectedAcademicYear && selectedMonth)
    && loadedAttendanceKey !== attendanceKey;

  const childYears = useMemo(() => {
    const child = children.find(item => item._id === selectedChild);
    if (!child) return [];
    const admissionDate = getAdmissionDate(child);
    const today = new Date();
    return academicYears.filter(academicYear =>
      new Date(academicYear.endDate) >= admissionDate
      && new Date(academicYear.startDate) <= today,
    );
  }, [academicYears, children, selectedChild]);

  const activeAcademicYear = childYears.find(item => item._id === selectedAcademicYear);
  const months = activeAcademicYear ? getMonthsInYear(activeAcademicYear) : [];
  const [year, month] = selectedMonth
    ? selectedMonth.split('-').map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  const childOptions = children.map(c => ({
    value: c._id,
    label: `${c.firstName} ${c.lastName} (${c.classroom?.displayName || ''})`,
  }));
  const academicYearOptions = childYears.map(academicYear => ({
    value: academicYear._id,
    label: academicYear.name,
  }));
  const monthOptions = months.map(date => ({
    value: monthKey(date),
    label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
  }));

  const handleChildChange = childId => {
    setSelectedChild(childId);
    const child = children.find(item => item._id === childId);
    if (!child) return;
    const admissionDate = getAdmissionDate(child);
    const eligibleYears = academicYears.filter(academicYear =>
      new Date(academicYear.endDate) >= admissionDate
      && new Date(academicYear.startDate) <= new Date(),
    );
    const academicYear = getCurrentAcademicYear(eligibleYears);
    setSelectedAcademicYear(academicYear?._id || '');
    const eligibleMonths = academicYear ? getMonthsInYear(academicYear) : [];
    const now = new Date();
    const initialMonth = eligibleMonths.find(date =>
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(),
    ) || eligibleMonths[0];
    setSelectedMonth(initialMonth ? monthKey(initialMonth) : '');
    setRecords([]);
    setSummary(null);
  };

  const handleAcademicYearChange = academicYearId => {
    setSelectedAcademicYear(academicYearId);
    const academicYear = childYears.find(item => item._id === academicYearId);
    const eligibleMonths = academicYear ? getMonthsInYear(academicYear) : [];
    const now = new Date();
    const initialMonth = eligibleMonths.find(date =>
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(),
    ) || eligibleMonths[0];
    setSelectedMonth(initialMonth ? monthKey(initialMonth) : '');
  };

  // Build calendar grid
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const getRecord = (day) => {
    const d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find(r => r.date?.startsWith(d));
  };

  return (
    <PageContent>
      <PageHeader title="Attendance" subtitle="Monthly attendance tracker" />

      {/* Filters */}
      {error && (
        <Card className="mb-4 border border-rose-500/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 mb-6 items-end max-w-[760px] sm:grid-cols-3">
        <Select options={childOptions} value={selectedChild} onChange={e => handleChildChange(e.target.value)} className="w-full" label="Child" />
        <Select
          options={academicYearOptions}
          value={selectedAcademicYear}
          onChange={e => handleAcademicYearChange(e.target.value)}
          className="w-full"
          label="Academic year"
        />
        <Select options={monthOptions} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full" label="Month" />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Present', value: summary.present, color: 'text-emerald-400' },
            { label: 'Absent', value: summary.absent, color: 'text-rose-400' },
            { label: 'Late', value: summary.late || 0, color: 'text-amber-400' },
            {
              label: 'Percentage', value: `${summary.percentage}%`,
              color: summary.percentage >= 75 ? 'text-emerald-400' : 'text-rose-400',
            },
          ].map(s => (
            <Card key={s.label}>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar Grid */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-4">
          {MONTHS[month - 1]} {year}
        </h3>
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">{d}</div>
              ))}
            </div>
            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const rec = getRecord(day);
                const today = new Date();
                const isToday = day === today.getDate()
                  && month === today.getMonth() + 1
                  && year === today.getFullYear();
                return (
                  <div
                    key={day}
                    className={`rounded-lg p-1.5 min-h-[52px] flex flex-col items-center gap-1 border ${
                      isToday ? 'border-violet-500 bg-violet-500/5' : 'border-slate-800'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>{day}</span>
                    {rec ? (
                      <span className={`text-[9px] px-1 py-0.5 rounded border font-medium leading-tight text-center ${statusColor(rec.status)}`}>
                        {rec.status === 'HalfDay' ? 'Half' : rec.status.slice(0, 4)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-800">
              {['Present','Absent','Late','HalfDay','Holiday'].map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${statusColor(s)}`}>
                    {s === 'HalfDay' ? 'Half' : s.slice(0,4)}
                  </span>
                  <span className="text-xs text-slate-500">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </PageContent>
  );
}