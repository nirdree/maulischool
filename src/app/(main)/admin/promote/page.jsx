// pages/admin/Promote.jsx
/**
 * PROMOTE PAGE
 * APIs Used:
 *   GET  /api/promote/preview  — preview students
 *   POST /api/promote          — execute promotion
 *   GET  /api/classrooms       — dropdowns
 */
'use client';
import { useEffect, useState } from 'react';
import { ArrowUpCircle, Search, Filter } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Button, Select, Badge, Modal } from '@/components/ui.jsx';

export default function PromotePage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [sourceYearId, setSourceYearId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [preview, setPreview] = useState(null);
  const [promotions, setPromotions] = useState({});
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [result, setResult] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [yearResponse, currentResponse] = await Promise.all([
          api.get(`${API.ACADEMIC_YEARS.BASE}?limit=100`),
          api.get(API.ACADEMIC_YEARS.CURRENT).catch(() => null),
        ]);
        const years = yearResponse.data || [];
        setAcademicYears(years);
        const today = new Date();
        const source = years.find(year => new Date(year.startDate) <= today && new Date(year.endDate) >= today)
          || currentResponse?.data
          || years[0];
        if (source) {
          setSourceYearId(source._id);
          const next = years
            .filter(year => new Date(year.startDate) > new Date(source.endDate))
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];
          if (next) setTargetYearId(next._id);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!sourceYearId) {
      setClassrooms([]);
      setClassFilter('');
      setPreview(null);
      return;
    }
    let cancelled = false;
    api.get(`${API.CLASSROOMS.BASE}?isActive=true&academicYear=${sourceYearId}`)
      .then(response => {
        if (cancelled) return;
        const sourceClasses = response.data || [];
        setClassrooms(sourceClasses);
        setClassFilter(current => sourceClasses.some(item => item._id === current) ? current : '');
        setPreview(null);
      })
      .catch(error => {
        if (!cancelled) alert(error.response?.data?.message || error.message);
      });
    return () => { cancelled = true; };
  }, [sourceYearId]);

  const handlePreview = async () => {
    if (!classFilter || !sourceYearId || !targetYearId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: classFilter,
        sourceAcademicYear: sourceYearId,
        targetAcademicYear: targetYearId,
      });
      const res = await api.get(`${API.PROMOTE.PREVIEW}?${params}`);
      setPreview(res.data);
      const initMap = {};
      (res.data.students || []).forEach(s => {
        initMap[s._id] = { action: 'Promoted', nextClassId: res.data.nextClass?._id || '' };
      });
      setPromotions(initMap);
      setResult(null);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleSetupNextYear = async () => {
    if (!sourceYearId || !targetYearId) return;
    setSettingUp(true);
    try {
      const response = await api.post(API.PROMOTE.SETUP, {
        sourceAcademicYearId: sourceYearId,
        targetAcademicYearId: targetYearId,
      });
      alert(
        `Next-year setup ready. Created ${response.data.classroomsCreated} classroom(s), `
        + `${response.data.subjectsCreated} subject(s), and ${response.data.timetablesCreated} timetable(s).`,
      );
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSettingUp(false);
    }
  };

  const handleExecute = async () => {
    if (!(await confirm(`Enroll these students in ${preview.targetAcademicYear.name}? Previous-year records will be retained.`))) return;
    setExecuting(true);
    try {
      const promoArr = Object.entries(promotions).map(([studentId, val]) => ({
        studentId, ...val,
      }));
      const res = await api.post(API.PROMOTE.EXECUTE, {
        promotions: promoArr,
        sourceAcademicYearId: sourceYearId,
        targetAcademicYearId: targetYearId,
      });
      setResult(res.data);
      setPreview(null);
    } catch (err) { alert(err.message); } finally { setExecuting(false); }
  };

  const updatePromotionAction = (studentId, action) => {
    setPromotions(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        action,
        nextClassId: action === 'Detained'
          ? preview.sameClass?._id || ''
          : action === 'Promoted' ? preview.nextClass?._id || '' : '',
      },
    }));
  };

  const updatePromotionDestination = (studentId, nextClassId) => {
    setPromotions(prev => ({ ...prev, [studentId]: { ...prev[studentId], nextClassId } }));
  };

  const targetYears = academicYears.filter(year =>
    sourceYearId && new Date(year.startDate) > new Date(academicYears.find(item => item._id === sourceYearId)?.endDate || 0),
  );
  const sourceYearOptions = academicYears.map(year => ({ value: year._id, label: year.name }));
  const targetYearOptions = targetYears.map(year => ({ value: year._id, label: year.name }));
  const classOptions = [
    { value: '', label: 'Select Class' },
    ...classrooms.map(c => ({ value: c._id, label: c.displayName })),
  ];

  const nextClassOptions = [
    { value: '', label: 'Select next-year class' },
    ...(preview?.targetClasses || []).map(c => ({ value: c._id, label: c.displayName })),
  ];

  return (
    <PageContent>
      <PageHeader
        title="Promote Students"
        subtitle="Prepare next-year classrooms and enroll students while keeping prior-year records"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setFilterOpen(true)} className="sm:hidden">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        }
      />

      <Card className="mb-6 hidden sm:block">
        <div className="flex gap-3 items-end">
          <Select label="From academic year" options={sourceYearOptions} value={sourceYearId}
            onChange={e => { setSourceYearId(e.target.value); setTargetYearId(''); setClassFilter(''); setPreview(null); }} className="w-44" />
          <Select label="To academic year" options={targetYearOptions} value={targetYearId}
            onChange={e => { setTargetYearId(e.target.value); setPreview(null); }} className="w-44" />
          <Select label="Select Class to Preview" options={classOptions} value={classFilter}
            onChange={e => setClassFilter(e.target.value)} className="w-52" />
          <Button variant="ghost" onClick={handleSetupNextYear} disabled={!sourceYearId || !targetYearId || settingUp}>
            {settingUp ? 'Setting up...' : 'Copy next-year setup'}
          </Button>
          <Button onClick={handlePreview} disabled={!classFilter || !sourceYearId || !targetYearId || loading}>
            <Search className="w-4 h-4" /> {loading ? 'Loading...' : 'Load Preview'}
          </Button>
        </div>
      </Card>

      {/* Filters modal (mobile) */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" width="max-w-md">
        <div className="space-y-4">
          <Select label="From academic year" options={sourceYearOptions} value={sourceYearId}
            onChange={e => { setSourceYearId(e.target.value); setTargetYearId(''); setClassFilter(''); setPreview(null); }} />
          <Select label="To academic year" options={targetYearOptions} value={targetYearId}
            onChange={e => { setTargetYearId(e.target.value); setPreview(null); }} />
          <Select label="Select Class to Preview" options={classOptions} value={classFilter}
            onChange={e => setClassFilter(e.target.value)} />
        </div>
        <div className="mt-6 border-t border-slate-700 pt-4">
          <p className="text-xs text-slate-400 mb-2">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleSetupNextYear} disabled={!sourceYearId || !targetYearId || settingUp}>
              {settingUp ? 'Setting up...' : 'Copy next-year setup'}
            </Button>
            <Button onClick={() => { handlePreview(); setFilterOpen(false); }} disabled={!classFilter || !sourceYearId || !targetYearId || loading}>
              <Search className="w-4 h-4 mr-1" /> {loading ? 'Loading...' : 'Load Preview'}
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => { setClassFilter(''); }}>Clear</Button>
          <Button onClick={() => { setFilterOpen(false); }}>Close</Button>
        </div>
      </Modal>

      {result && (
        <Card className="mb-6 border-emerald-800 bg-emerald-900/10">
          <h3 className="text-emerald-400 font-semibold mb-2">Promotion Complete!</h3>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><span className="text-slate-400">Promoted: </span><span className="text-white font-bold">{result.promoted}</span></div>
            <div><span className="text-slate-400">Detained: </span><span className="text-white font-bold">{result.detained}</span></div>
            <div><span className="text-slate-400">Left: </span><span className="text-white font-bold">{result.left}</span></div>
            <div><span className="text-slate-400">Graduated: </span><span className="text-white font-bold">{result.graduated || 0}</span></div>
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-3">
              <p className="text-rose-400 text-xs font-medium">Errors:</p>
              {result.errors.map((e, i) => <p key={i} className="text-xs text-rose-300">{e}</p>)}
            </div>
          )}
        </Card>
      )}

      {preview && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">{preview.currentClass?.displayName}</h3>
              <p className="text-xs text-slate-500">{preview.sourceAcademicYear?.name} → {preview.targetAcademicYear?.name}</p>
              <p className="text-slate-400 text-sm">{preview.totalCount} eligible students</p>
            </div>
            <div className="flex gap-3">
              {preview.nextClass && <span className="text-slate-400 text-sm">Next Class: <span className="text-white">{preview.nextClass.displayName}</span></span>}
              <Button onClick={handleExecute} disabled={executing || Object.values(promotions).some(value => ['Promoted', 'Detained'].includes(value.action) && !value.nextClassId)}>
                <ArrowUpCircle className="w-4 h-4" /> {executing ? 'Executing...' : 'Execute Promotion'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-xs text-slate-400 uppercase">Student</th>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 uppercase">Action</th>
                  <th className="text-left py-2 px-3 text-xs text-slate-400 uppercase">Move To</th>
                </tr>
              </thead>
              <tbody>
                {preview.students.map(s => (
                  <tr key={s._id} className="border-b border-slate-800/50">
                    <td className="py-2 px-3 text-white">{s.firstName} {s.lastName} <span className="text-slate-500">#{s.rollNumber}</span></td>
                    <td className="py-2 px-3">
                      <select
                        value={promotions[s._id]?.action || 'Promoted'}
                        onChange={e => updatePromotionAction(s._id, e.target.value)}
                        className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Promoted">Promoted</option>
                        <option value="Detained">Detained</option>
                        <option value="Left">Left</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      {['Promoted', 'Detained'].includes(promotions[s._id]?.action) && (
                        <select
                          value={promotions[s._id]?.nextClassId || ''}
                          onChange={e => updatePromotionDestination(s._id, e.target.value)}
                          className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {nextClassOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageContent>
  );
}