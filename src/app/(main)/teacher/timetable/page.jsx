// pages/teacher/Timetable.jsx
/**
 * TEACHER TIMETABLE PAGE
 * APIs Used:
 *   GET /api/academic-years/current
 *   GET /api/timetable/teacher/:teacherId?academicYear=:ayId
 */
'use client';
import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Badge, Select } from '@/components/ui.jsx';
import { useAuth } from '@/context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function TeacherTimetable() {
  const { user, initialized } = useAuth();
  const [academicYear, setAcademicYear] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [viewMode, setViewMode] = useState('teacher');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!initialized) return () => { active = false; };

    (async () => {
      try {
        const ay = await api.get(API.ACADEMIC_YEARS.CURRENT);
        const yearId = ay.data?._id;
        if (!yearId) throw new Error('No current academic year is configured.');

        const classes = await api.get(
          `${API.CLASSROOMS.BASE}?isActive=true&academicYear=${encodeURIComponent(yearId)}`
        );
        if (active) {
          setAcademicYear(yearId);
          setClassrooms(classes.data || []);
          setSelectedClassId(current => current || classes.data?.[0]?._id || '');
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || err.message || 'Unable to load classrooms.');
          setLoading(false);
        }
      }
    })();

    return () => { active = false; };
  }, [initialized]);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!initialized || !academicYear) return;

      setLoading(true);
      setError('');
      try {
        if (viewMode === 'teacher') {
          const profile = await api.get(API.AUTH.ME);
          const teacherId = profile.data?.employeeId?._id || profile.data?.employeeId;
          if (!teacherId) throw new Error('Your account is not linked to a teacher profile.');

          const res = await api.get(
            `${API.TIMETABLE.BY_TEACHER(teacherId)}?academicYear=${encodeURIComponent(academicYear)}`
          );
          if (active) setTimetables(res.data || []);
        } else if (selectedClassId) {
          const res = await api.get(
            `${API.TIMETABLE.BY_CLASS(selectedClassId)}?academicYear=${encodeURIComponent(academicYear)}`
          );
          if (active) setTimetables(res.data ? [res.data] : []);
        } else if (active) {
          setTimetables([]);
        }
      } catch (err) {
        if (active) {
          setTimetables([]);
          if (viewMode === 'class' && err.response?.status === 404) {
            setError('');
          } else {
            setError(err.response?.data?.message || err.message || 'Unable to load schedule.');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [initialized, academicYear, viewMode, selectedClassId]);

  const periodsByDayAndNumber = new Map();
  const timesByPeriod = new Map();
  let totalPeriods = 0;
  timetables.forEach(timetable => {
    timetable.schedule?.forEach(day => {
      day.periods.forEach(period => {
        totalPeriods++;
        const cellKey = `${day.day}|${period.periodNo}`;
        if (!periodsByDayAndNumber.has(cellKey)) periodsByDayAndNumber.set(cellKey, []);
        periodsByDayAndNumber.get(cellKey).push({
          classroom: timetable.classroom?.displayName || 'Class not set',
          subject: period.subject?.name || 'Subject not set',
          teacher: period.teacher?.name || '',
          isBreak: period.isBreak,
          breakLabel: period.breakLabel || 'Break',
        });

        if (period.startTime || period.endTime) {
          if (!timesByPeriod.has(period.periodNo)) timesByPeriod.set(period.periodNo, new Set());
          timesByPeriod.get(period.periodNo).add(`${period.startTime || ''}–${period.endTime || ''}`);
        }
      });
    });
  });

  const periodNumbers = [...new Set(
    timetables.flatMap(timetable =>
      (timetable.schedule || []).flatMap(day => day.periods.map(period => period.periodNo))
    ),
  )].sort((a, b) => a - b);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageContent>
      <PageHeader
        title="Teacher Schedule View"
        subtitle={viewMode === 'teacher'
          ? `${user?.name || 'Your'} weekly teaching schedule`
          : `${classrooms.find(classroom => classroom._id === selectedClassId)?.displayName || 'Class'} weekly schedule`}
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Select
            label="Schedule view"
            value={viewMode}
            onChange={event => setViewMode(event.target.value)}
            options={[
              { value: 'teacher', label: 'My teacher schedule' },
              { value: 'class', label: 'Class-wise schedule' },
            ]}
          />
        </div>
        {viewMode === 'class' && (
          <div className="w-56">
            <Select
              label="Class"
              value={selectedClassId}
              onChange={event => setSelectedClassId(event.target.value)}
              options={[
                { value: '', label: 'Select class' },
                ...classrooms.map(classroom => ({ value: classroom._id, label: classroom.displayName })),
              ]}
            />
          </div>
        )}
      </div>

      {loading ? (
        <Card className="py-16 text-center text-slate-500">Loading timetable…</Card>
      ) : error ? (
        <Card className="py-16 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500/50" />
          <p className="text-slate-400 text-sm">{error}</p>
        </Card>
      ) : timetables.length === 0 || totalPeriods === 0 ? (
        <Card className="py-16 text-center text-slate-500">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>{viewMode === 'teacher'
            ? 'No periods are assigned to you this academic year.'
            : selectedClassId ? 'No timetable found for this class.' : 'Select a class to view its timetable.'}</p>
        </Card>
      ) : (
        <>
          <div className="mb-3">
            <Badge label={`${totalPeriods} period${totalPeriods !== 1 ? 's' : ''} / week`} color="blue" />
          </div>
          <Card className="!p-0 overflow-hidden">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full min-w-max border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-800">
                  <tr>
                    <th className="border-b border-r border-slate-700 bg-slate-800 px-3 py-2 text-slate-300">Period</th>
                    <th className="border-b border-r border-slate-700 bg-slate-800 px-3 py-2 text-slate-300">Time</th>
                    {ALL_DAYS.map(day => (
                      <th key={day} className="min-w-36 border-b border-slate-700 px-3 py-2 font-medium text-white">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periodNumbers.map(periodNo => (
                    <tr key={periodNo} className="border-b border-slate-800 last:border-0">
                      <th className="border-r border-slate-700 px-3 py-2 align-top font-medium text-slate-300">
                        P{periodNo}
                      </th>
                      <td className="border-r border-slate-700 px-3 py-2 align-top text-slate-400">
                        {[...(timesByPeriod.get(periodNo) || [])].join(', ') || '—'}
                      </td>
                      {ALL_DAYS.map(day => {
                        const entries = periodsByDayAndNumber.get(`${day}|${periodNo}`) || [];
                        return (
                          <td key={day} className="px-3 py-2 align-top">
                            {entries.length ? (
                              <div className="flex flex-col gap-1">
                                {entries.map((entry, index) => (
                                  <div key={`${entry.classroom}-${entry.subject}-${index}`} className="rounded bg-slate-800 px-2 py-1">
                                    {entry.isBreak ? (
                                      <span className="font-medium text-amber-400">{entry.breakLabel}</span>
                                    ) : (
                                      <>
                                        {viewMode === 'teacher' && <span className="block font-medium text-white">{entry.classroom}</span>}
                                        <span className="text-slate-300">{entry.subject}</span>
                                        {viewMode === 'class' && entry.teacher && <span className="block text-slate-400">{entry.teacher}</span>}
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : <span className="text-slate-600">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </PageContent>
  );
}