// pages/admin/Students.jsx
/**
 * STUDENTS PAGE — Full admission + lifecycle management
 *
 * APIs:
 *   GET    /api/students/search-parents?q=      — search existing parent accounts
 *   GET    /api/students                         — list
 *   GET    /api/students/:id                     — detail
 *   POST   /api/students                         — create admission
 *   PUT    /api/students/:id                     — edit profile
 *   PATCH  /api/students/:id/status              — change status (syncs parent)
 *   PATCH  /api/students/:id/link-parent         — change linked parent account
 *   PATCH  /api/students/:id/block-parent        — block/unblock parent login
 *   PATCH  /api/students/:id/parent-password     — reset parent password
 *   DELETE /api/students/:id                     — delete (cascade)
 *   GET    /api/classrooms
 *   GET    /api/academic-years/current
 */
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Edit2, Trash2,
  KeyRound, ShieldOff, ShieldCheck, CheckCircle2,
  UserPlus, LogOut, UserX, UserCheck, ChevronRight, X, Eye, EyeOff, MoreVertical, Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/api/client';
import { API } from '@/api/constants';
import {
  PageContent, PageHeader, Card, Table, Pagination, Button, Input, Select, Badge, Modal,
} from '@/components/ui.jsx';

// ─── Constants ───────────────────────────────────────────────

const STATUS_COLOR = {
  Approved: 'green', UnderReview: 'yellow', Rejected: 'red',
  OnHold: 'orange', Left: 'gray', Alumni: 'indigo',
};

const STATUS_OPTIONS = [
  { value: '',            label: 'All Status'   },
  { value: 'Approved',    label: 'Approved'     },
  { value: 'UnderReview', label: 'Under Review' },
  { value: 'Rejected',    label: 'Rejected'     },
  { value: 'OnHold',      label: 'On Hold'      },
  { value: 'Left',        label: 'Left'         },
  { value: 'Alumni',      label: 'Alumni'       },
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

// ─── Page ─────────────────────────────────────────────────────

export default function StudentsPage() {
   const router = useRouter();
  const [students,     setStudents]     = useState([]);
  const [classrooms,   setClassrooms]   = useState([]);
  const [admissionClassrooms, setAdmissionClassrooms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [ayId,         setAyId]         = useState('');
  const [currentAyId,  setCurrentAyId]  = useState('');
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const searchRef = useRef(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter,  setClassFilter]  = useState('');
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);

  const [addOpen,       setAddOpen]       = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [pwTarget,      setPwTarget]      = useState(null);
  const [statusTarget,  setStatusTarget]  = useState(null);  // { student, desiredStatus }
  const [leaveTarget,   setLeaveTarget]   = useState(null);  // student obj for leave modal
  const [filterOpen,    setFilterOpen]    = useState(false);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const [yearResponse, currentResponse] = await Promise.all([
          api.get(`${API.ACADEMIC_YEARS.BASE}?limit=100`),
          api.get(API.ACADEMIC_YEARS.CURRENT),
        ]);
        setAcademicYears(yearResponse.data || []);
        const currentId = currentResponse.data?._id || '';
        setCurrentAyId(currentId);
        setAyId(currentId);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!ayId) return undefined;
    let cancelled = false;
    api.get(`${API.CLASSROOMS.BASE}?academicYear=${ayId}&limit=100`)
      .then(response => {
        if (cancelled) return;
        const yearClassrooms = response.data || [];
        setClassrooms(yearClassrooms);
        setClassFilter(current => yearClassrooms.some(classroom => classroom._id === current) ? current : '');
        setPage(1);
      })
      .catch(error => {
        if (!cancelled) alert(error.response?.data?.message || error.message);
      });
    return () => { cancelled = true; };
  }, [ayId]);

  useEffect(() => {
    if (!currentAyId) return undefined;
    let cancelled = false;
    api.get(`${API.CLASSROOMS.BASE}?academicYear=${currentAyId}&limit=100`)
      .then(response => {
        if (!cancelled) setAdmissionClassrooms(response.data || []);
      })
      .catch(error => {
        if (!cancelled) alert(error.response?.data?.message || error.message);
      });
    return () => { cancelled = true; };
  }, [currentAyId]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (searchRef.current) params.set('search', searchRef.current);
      if (statusFilter) params.set('status',       statusFilter);
      if (classFilter)  params.set('classId',      classFilter);
      if (ayId)         params.set('academicYear', ayId);
      const res = await api.get(`${API.STUDENTS.BASE}?${params}`);
      setStudents(res.data  || []);
      setTotal(res.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, statusFilter, classFilter, ayId]);

  useEffect(() => { if (ayId) fetchStudents(); }, [fetchStudents, ayId]);

  const handleBlockParent = async (id, blocked) => {
    if (!(await confirm(`${blocked ? 'Block' : 'Unblock'} parent login for this student?`))) return;
    try {
      await api.patch(API.STUDENTS.BLOCK_PARENT(id), { target: 'both', blocked });
      fetchStudents();
    } catch (err) { alert(err?.response?.data?.message || err.message); }
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this student? Orphaned parent accounts will also be removed.'))) return;
    try {
      await api.delete(API.STUDENTS.BY_ID(id));
      fetchStudents();
    } catch (err) { alert(err?.response?.data?.message || err.message); }
  };

  const handleQuickStatus = async (id, status) => {
    try {
      await api.patch(API.STUDENTS.STATUS(id), { status });
      fetchStudents();
    } catch (err) { alert(err?.response?.data?.message || err.message); }
  };

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classrooms.map((c) => ({ value: c._id, label: c.displayName })),
  ];
  const academicYearOptions = academicYears.map(year => ({ value: year._id, label: year.name }));
  const pages = Math.ceil(total / 20);

  // Row actions popover (controlled, closes on outside click)
  const RowActions = ({ s }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    const parentBlocked = s.fatherUser?.status === 'inactive' || s.motherUser?.status === 'inactive';
    const hasParent     = !!(s.fatherUser || s.motherUser);
    return (
      <div className="relative" ref={ref}>
        <Button size="sm" variant="ghost" title="Actions" onClick={() => setOpen((v) => !v)}>
          <MoreVertical className="w-4 h-4" />
        </Button>
        {open && (
          <div className="absolute right-0 mt-2 z-50 rounded-lg bg-slate-900 border border-slate-700 shadow-lg py-1 min-w-[200px]">
            {s.status === 'UnderReview' && (
              <>
                <button onClick={() => { setOpen(false); handleQuickStatus(s._id, 'Approved'); }}
                  className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Approve</span>
                </button>
                <button onClick={() => { setOpen(false); handleQuickStatus(s._id, 'Rejected'); }}
                  className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                  <X className="w-4 h-4" />
                  <span className="text-sm">Reject</span>
                </button>
              </>
            )}
            {s.status === 'Approved' && (
              <button onClick={() => { setOpen(false); setLeaveTarget(s); }}
                className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Mark Left</span>
              </button>
            )}
            <button onClick={() => { setOpen(false); setEditTarget(s); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </button>
            {hasParent && (
              <>
                <button onClick={() => { setOpen(false); handleBlockParent(s._id, !parentBlocked); }}
                  className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                  {parentBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                  <span className="text-sm">{parentBlocked ? 'Unblock Parent' : 'Block Parent'}</span>
                </button>
                <button onClick={() => { setOpen(false); setPwTarget(s); }}
                  className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
                  <KeyRound className="w-4 h-4" />
                  <span className="text-sm">Reset Parent Password</span>
                </button>
              </>
            )}
            <button onClick={() => { setOpen(false); handleDelete(s._id); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-rose-400 hover:text-white">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const columns = [
    { key: 'admissionNo', label: 'Adm No' },
    {
      key: 'name', label: 'Student',
      render: (s) => (
        <div>
          <button onClick={() => router.push(`/admin/students/${s._id}`)} className="font-medium text-indigo-400 hover:text-indigo-300">
            {s.firstName} {s.middleName} {s.lastName}
          </button>
          <p className="text-xs text-slate-500">{s.gender} · {s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : '—'}</p>
        </div>
      ),
    },
    {
      key: 'classroom', label: 'Class',
      render: s => (
        <div>
          <p>{s.classroom?.displayName || '—'}</p>
          <p className="text-xs text-slate-500">{s.academicYear?.name || ''}</p>
        </div>
      ),
    },
    {
      key: 'enrollmentOutcome', label: 'Year outcome',
      render: s => {
        const outcome = s.enrollmentOutcome;
        if (!outcome) return <span className="text-slate-600">Current</span>;
        if (outcome === 'Promoted' || outcome === 'Detained') {
          if (s.isHistoricalEnrollment) {
            return (
              <span className="text-sky-300">
                {outcome} to {s.nextEnrollmentClass?.displayName || 'next-year class'}
                {s.nextEnrollmentYear?.name ? ` · ${s.nextEnrollmentYear.name}` : ''}
              </span>
            );
          }
          return (
            <span className="text-sky-300">
              {outcome}{s.enrolledFromClass?.displayName ? ` from ${s.enrolledFromClass.displayName}` : ''}
              {s.enrolledFromYear?.name ? ` · ${s.enrolledFromYear.name}` : ''}
            </span>
          );
        }
        return <Badge label={outcome} color={outcome === 'Left' ? 'slate' : 'indigo'} />;
      },
    },
    {
      key: 'parents', label: 'Parents',
      render: (s) => (
        <div className="space-y-0.5 min-w-[140px]">
          {s.fatherName && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{s.fatherName}</span>
              {s.fatherUser && (
                <span className={`text-xs px-1 rounded ${s.fatherUser.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.fatherUser.status === 'active' ? '●' : '○'}
                </span>
              )}
            </div>
          )}
          {s.motherName && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">{s.motherName}</span>
              {s.motherUser && (
                <span className={`text-xs ${s.motherUser.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {s.motherUser.status === 'active' ? '●' : '○'}
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (s) => <Badge label={s.status} color={STATUS_COLOR[s.status] || 'gray'} />,
    },
    {
      key: 'actions', label: '',
      render: s => s.isHistoricalEnrollment
        ? <span className="text-xs text-slate-500">History</span>
        : <RowActions s={s} />,
    },
  ];

  return (
    <PageContent>
      <PageHeader
        title="Students"
        subtitle={`${total} student${total !== 1 ? 's' : ''}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setFilterOpen(true)} className="sm:hidden">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </>
        }
      />

      <div className="hidden sm:flex flex-wrap gap-3 mb-4">
        <Select
          options={academicYearOptions}
          value={ayId}
          onChange={event => {
            setAyId(event.target.value);
            setClassFilter('');
            setPage(1);
          }}
          className="w-40"
        />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Name, admission no, parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (page === 1) fetchStudents();
                else setPage(1);
              }
            }}
          />
        </div>
        <Select options={STATUS_OPTIONS} value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-40" />
        <Select options={classOptions} value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} className="w-44" />
        <Button variant="ghost" onClick={fetchStudents}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Filters modal (mobile) */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" width="max-w-md">
        <div className="space-y-4">
          <Select
            options={academicYearOptions}
            value={ayId}
            onChange={event => { setAyId(event.target.value); setClassFilter(''); setPage(1); }}
          />
          <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, admission no, parent..." />
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
          <Select label="Class" value={classFilter} onChange={(e) => setClassFilter(e.target.value)} options={classOptions} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => { setSearch(''); setStatusFilter(''); setClassFilter(''); setPage(1); }}>Clear</Button>
          <Button onClick={() => { setPage(1); fetchStudents(); setFilterOpen(false); }}>Apply</Button>
        </div>
      </Modal>

      <Card className="!p-0">
        <Table columns={columns} data={students} loading={loading} emptyMessage="No students found" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      <AdmissionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        classrooms={admissionClassrooms}
        ayId={currentAyId}
        onSuccess={fetchStudents}
      />
      <EditStudentModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        student={editTarget}
        classrooms={admissionClassrooms}
        onSuccess={() => { fetchStudents(); setEditTarget(null); }}
      />
      <ParentPasswordModal
        open={!!pwTarget}
        onClose={() => setPwTarget(null)}
        student={pwTarget}
        onSuccess={() => setPwTarget(null)}
      />
      <LeaveModal
        open={!!leaveTarget}
        onClose={() => setLeaveTarget(null)}
        student={leaveTarget}
        onSuccess={() => { fetchStudents(); setLeaveTarget(null); }}
      />
    </PageContent>
  );
}

// ─── Parent Search Widget ─────────────────────────────────────
// Reusable typeahead to pick an existing parent or enter new details

function ParentSearchWidget({ label, value, onChange, errors }) {
  // value = { mode: 'existing'|'new'|null, user?, name, phone, email, occupation, password }
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const debounce   = useRef(null);
  const wrapRef    = useRef(null);

  const mode = value?.mode || null;

  const search = (q) => {
    clearTimeout(debounce.current);
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`${API.STUDENTS.BASE}/search-parents?q=${encodeURIComponent(q)}`);
        setResults(res.data || []);
        setOpen(true);
      } catch {} finally { setLoading(false); }
    }, 300);
  };

  const selectExisting = (user) => {
    onChange({ mode: 'existing', existingUserId: user._id, name: user.name, email: user.email });
    setQuery(user.name);
    setOpen(false);
    setResults([]);
  };

  const switchToNew = () => {
    onChange({ mode: 'new', name: query, email: '', phone: '', occupation: '', password: '' });
    setOpen(false);
  };

  const clearSelection = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  const set = (k, v) => onChange({ ...value, [k]: v });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="col-span-2 space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>

      {/* Selected existing parent chip */}
      {mode === 'existing' && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
          <div>
            <p className="text-sm text-white font-medium">{value.name}</p>
            <p className="text-xs text-slate-400">{value.email} · Existing account</p>
          </div>
          <button onClick={clearSelection} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search box — shown when no selection yet */}
      {mode !== 'existing' && (
        <div ref={wrapRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search existing parent by name / email, or type to create new..."
              value={query}
              onChange={(e) => search(e.target.value)}
              onFocus={() => results.length && setOpen(true)}
            />
          </div>

          {/* Dropdown results */}
          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
              {loading && <p className="px-4 py-3 text-xs text-slate-400">Searching…</p>}
              {!loading && results.map((u) => (
                <button
                  key={u._id}
                  onClick={() => selectExisting(u)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-700 text-left transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    {u.studentIds?.length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {u.studentIds.length} child{u.studentIds.length > 1 ? 'ren' : ''}:{' '}
                        {u.studentIds.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                </button>
              ))}
              {!loading && query.length >= 2 && (
                <button
                  onClick={switchToNew}
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-slate-700 text-left transition-colors border-t border-slate-700"
                >
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-indigo-400">Create new parent account for &quot;{query}&quot;</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* New parent fields */}
      {mode === 'new' && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="col-span-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">New account details</p>
            <button onClick={clearSelection} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
          </div>
          <Input label="Full Name *" value={value.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Parent name" error={errors?.name} />
          <Input label="Phone *" value={value.phone || ''} onChange={(e) => {
            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
            set('phone', cleaned);
          }} placeholder="9999999999" error={errors?.phone} />
          <Input label="Email *" type="email" value={value.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="parent@example.com" error={errors?.email} />
          <Input label="Occupation"  value={value.occupation || ''} onChange={(e) => set('occupation', e.target.value)} placeholder="Engineer" error={errors?.occupation} />
          <Input label="Login Password" type="password" value={value.password || ''} onChange={(e) => set('password', e.target.value)} placeholder="Default: phone number" className="col-span-2" error={errors?.password} />
          <p className="col-span-2 text-xs text-slate-500">
            A parent login account will be created. Password defaults to phone number if left blank.
          </p>
        </div>
      )}

      {/* If no selection at all and query is short */}
      {!mode && !query && (
        <button
          onClick={() => onChange({ mode: 'new', name: '', email: '', phone: '', occupation: '', password: '' })}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add new parent directly
        </button>
      )}
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────

function SuccessScreen({ student, onClose }) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">Admission Created!</h3>
      <p className="text-slate-400 text-sm mb-5">{student.firstName} {student.lastName} admitted successfully.</p>

      <div className="w-full rounded-xl border border-slate-700 divide-y divide-slate-700 text-left mb-6">
        <InfoRow label="Admission No" value={student.admissionNo} />
        <InfoRow label="Class"        value={student.classroom?.displayName || '—'} />
        <InfoRow label="Status"       value={student.status} />
        {student.fatherUser && (
          <InfoRow label="Father Login" value={student.fatherUser.email || '—'} sub="Account linked" />
        )}
        {student.motherUser && String(student.motherUser._id || student.motherUser) !== String(student.fatherUser?._id || student.fatherUser) && (
          <InfoRow label="Mother Login" value={student.motherUser.email || '—'} sub="Account linked" />
        )}
        {!student.fatherUser && !student.motherUser && (
          <InfoRow label="Parent Login" value="No account created (no email provided)" />
        )}
      </div>
      <Button onClick={onClose} className="w-full">Done</Button>
    </div>
  );
}

function InfoRow({ label, value, sub }) {
  return (
    <div className="flex justify-between items-start px-4 py-3">
      <span className="text-xs text-slate-500 pt-0.5">{label}</span>
      <div className="text-right">
        <span className="text-sm text-white">{value}</span>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Admission Modal ──────────────────────────────────────────

const STUDENT_TABS = ['Student Info', 'Father', 'Mother', 'Previous School'];

const EMPTY_STUDENT = {
  firstName: '', middleName: '', lastName: '', gender: 'Male',
  dateOfBirth: '', classroom: '', bloodGroup: '', religion: '',
  caste: '', motherTongue: '', placeOfBirth: '', penNumber: '',
  previousSchoolName: '', previousClass: '', isRTE: false, rteFee: 0,
};

import { validateStudent, BLOOD_GROUPS, validateStudentName, validateStudentMiddleName, validateStudentDOB, validateStudentClassroom, validateBloodGroup, validateMax50, validatePlaceOfBirth, validatePenNumber, validateStudentRteFee, validateParentName, validateParentPhone, validateParentEmail, validateParentOccupation, validateParentPassword } from '@/lib/validation';

function AdmissionModal({ open, onClose, classrooms, ayId, onSuccess }) {
  const [tab,     setTab]     = useState(0);
  const [form,    setForm]    = useState(EMPTY_STUDENT);
  const [fieldErrors, setFieldErrors] = useState({});
  const [father,  setFather]  = useState(null);
  const [mother,  setMother]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (open) {
      setTab(0); setForm(EMPTY_STUDENT); setFather(null); setMother(null);
      setError(''); setCreated(null); setFieldErrors({});
    }
  }, [open]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    let msg = null;
    switch (k) {
      case 'firstName':   msg = validateStudentName(v, 'First Name'); break;
      case 'lastName':    msg = validateStudentName(v, 'Last Name'); break;
      case 'middleName':  msg = validateStudentMiddleName(v); break;
      case 'gender':      msg = validateGender(v); break;
      case 'dateOfBirth': msg = validateStudentDOB(v); break;
      case 'classroom':   msg = validateStudentClassroom(v); break;
      case 'rteFee':      msg = validateStudentRteFee(v); break;
      case 'bloodGroup':  msg = validateBloodGroup(v); break;
      case 'religion':    msg = validateMax50(v, 'Religion'); break;
      case 'caste':       msg = validateMax50(v, 'Caste'); break;
      case 'motherTongue': msg = validateMax50(v, 'Mother Tongue'); break;
      case 'placeOfBirth': msg = validatePlaceOfBirth(v); break;
      case 'penNumber':    msg = validatePenNumber(v); break;
      default: break;
    }
    setFieldErrors((fe) => {
      const next = { ...fe };
      if (msg) next[k] = msg; else delete next[k];
      if (Object.keys(next).length === 0) setError('');
      return next;
    });
  };

  const buildPayload = () => {
    const payload = { ...form, academicYear: ayId };

    // Father
    if (father?.mode === 'existing') {
      payload.fatherExistingUserId = father.existingUserId;
      payload.fatherName  = father.name;
      payload.fatherEmail = father.email;
    } else if (father?.mode === 'new') {
      payload.fatherName        = father.name;
      payload.fatherPhone       = father.phone;
      payload.fatherEmail       = father.email;
      payload.fatherOccupation  = father.occupation;
      payload.fatherPassword    = father.password;
    }

    // Mother
    if (mother?.mode === 'existing') {
      payload.motherExistingUserId = mother.existingUserId;
      payload.motherName  = mother.name;
      payload.motherEmail = mother.email;
    } else if (mother?.mode === 'new') {
      payload.motherName        = mother.name;
      payload.motherPhone       = mother.phone;
      payload.motherEmail       = mother.email;
      payload.motherOccupation  = mother.occupation;
      payload.motherPassword    = mother.password;
    }

    return payload;
  };

  // Tab gating helpers
  const validateNewParent = (p) => {
    const e = {};
    e.name = validateParentName(p?.name);
    e.phone = validateParentPhone(p?.phone);
    e.email = validateParentEmail(p?.email);
    e.occupation = validateParentOccupation(p?.occupation);
    e.password = validateParentPassword(p?.password);
    Object.keys(e).forEach((k) => { if (e[k] == null) delete e[k]; });
    return e;
  };

  const validateCurrentTab = () => {
    // Validate only fields in the current tab; show inline errors and block forward nav
    if (tab === 0) {
      const { errors } = validateStudent(form);
      const pick = ['firstName','lastName','middleName','gender','dateOfBirth','classroom','rteFee','bloodGroup','religion','caste','motherTongue','placeOfBirth','penNumber'];
      const subset = {};
      pick.forEach((k) => { if (errors[k]) subset[k] = errors[k]; });
      setFieldErrors((fe) => ({ ...fe, ...subset }));
      return Object.keys(subset).length === 0;
    }
    if (tab === 1) {
      if (father?.mode === 'existing') return true;
      const e = validateNewParent(father || {});
      setFieldErrors((fe) => ({ ...fe, _father: e }));
      return Object.keys(e).length === 0;
    }
    if (tab === 2) {
      if (mother?.mode === 'existing') return true;
      const e = validateNewParent(mother || {});
      setFieldErrors((fe) => ({ ...fe, _mother: e }));
      return Object.keys(e).length === 0;
    }
    return true; // Previous School tab has no required fields
  };

  const handleNext = () => { if (validateCurrentTab()) setTab((t) => t + 1); };

  // Live parent error recompute on change
  const rebuildParentErrors = (f, m) => {
    const out = {};
    if (f?.mode === 'new') out._father = validateNewParent(f);
    if (m?.mode === 'new') out._mother = validateNewParent(m);
    const fPhone = f?.mode === 'new' ? (f.phone || '').trim() : '';
    const mPhone = m?.mode === 'new' ? (m.phone || '').trim() : '';
    const fEmail = f?.mode === 'new' ? (f.email || '').trim().toLowerCase() : '';
    const mEmail = m?.mode === 'new' ? (m.email || '').trim().toLowerCase() : '';
    if (fPhone && mPhone && fPhone === mPhone) {
      out._father = out._father || {}; out._mother = out._mother || {};
      out._father.phone = 'Father and Mother phone must be different.';
      out._mother.phone = 'Father and Mother phone must be different.';
    }
    if (fEmail && mEmail && fEmail === mEmail) {
      out._father = out._father || {}; out._mother = out._mother || {};
      out._father.email = 'Father and Mother email must be different.';
      out._mother.email = 'Father and Mother email must be different.';
    }
    return out;
  };

  const handleFatherChange = (next) => {
    setFather(next);
    const pe = rebuildParentErrors(next, mother);
    setFieldErrors((fe) => {
      const copy = { ...fe };
      delete copy._father; delete copy._mother;
      if (pe._father) copy._father = pe._father;
      if (pe._mother) copy._mother = pe._mother;
      return copy;
    });
  };

  const handleMotherChange = (next) => {
    setMother(next);
    const pe = rebuildParentErrors(father, next);
    setFieldErrors((fe) => {
      const copy = { ...fe };
      delete copy._father; delete copy._mother;
      if (pe._father) copy._father = pe._father;
      if (pe._mother) copy._mother = pe._mother;
      return copy;
    });
  };

  const handleSubmit = async () => {
    setError('');
    const { valid, errors } = validateStudent(form);

    // Parent validations for new accounts
    const parentErrors = {};
    const validateNewParent = (p) => {
      const e = {};
      e.name = validateParentName(p?.name);
      e.phone = validateParentPhone(p?.phone);
      e.email = validateParentEmail(p?.email);
      e.occupation = validateParentOccupation(p?.occupation);
      e.password = validateParentPassword(p?.password);
      Object.keys(e).forEach((k) => { if (e[k] == null) delete e[k]; });
      return e;
    };

    if (father?.mode === 'new') parentErrors._father = validateNewParent(father);
    if (mother?.mode === 'new') parentErrors._mother = validateNewParent(mother);

    // Cross-parent uniqueness: phone/email must differ
    const fPhone = father?.mode === 'new' ? (father.phone || '').trim() : '';
    const mPhone = mother?.mode === 'new' ? (mother.phone || '').trim() : '';
    const fEmail = father?.mode === 'new' ? (father.email || '').trim().toLowerCase() : '';
    const mEmail = mother?.mode === 'new' ? (mother.email || '').trim().toLowerCase() : '';
    if (fPhone && mPhone && fPhone === mPhone) {
      parentErrors._father = parentErrors._father || {};
      parentErrors._mother = parentErrors._mother || {};
      parentErrors._father.phone = 'Father and Mother phone must be different.';
      parentErrors._mother.phone = 'Father and Mother phone must be different.';
    }
    if (fEmail && mEmail && fEmail === mEmail) {
      parentErrors._father = parentErrors._father || {};
      parentErrors._mother = parentErrors._mother || {};
      parentErrors._father.email = 'Father and Mother email must be different.';
      parentErrors._mother.email = 'Father and Mother email must be different.';
    }

    const combinedErrors = { ...errors, ...parentErrors };
    if (!valid || Object.keys(parentErrors).some((k) => Object.keys(parentErrors[k] || {}).length)) {
      setFieldErrors(combinedErrors);
      return;
    }

    setFieldErrors({});

    setSaving(true);
    try {
      const payload = buildPayload();
      // Default parent password to phone when blank
      if (father?.mode === 'new') payload.fatherPassword = father.password || father.phone || '';
      if (mother?.mode === 'new') payload.motherPassword = mother.password || mother.phone || '';

      const res = await api.post(API.STUDENTS.BASE, payload);
      setCreated(res.data);
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const classOptions = [
    { value: '', label: 'Select classroom' },
    ...classrooms.map((c) => ({ value: c._id, label: c.displayName })),
  ];

  if (created) {
    return (
      <Modal open={open} onClose={onClose} title="Admission Successful" width="max-w-lg">
        <SuccessScreen student={created} onClose={onClose} />
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="New Student Admission" width="max-w-2xl">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1">
        {STUDENT_TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => {
              if (i <= tab) { setTab(i); return; }
              if (i === tab + 1) { if (validateCurrentTab()) setTab(i); }
            }}
            className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${tab === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {tab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name *"   value={form.firstName}   onChange={(e) => set('firstName',   e.target.value)} placeholder="Arjun" error={fieldErrors.firstName} />
          <Input label="Last Name *"    value={form.lastName}    onChange={(e) => set('lastName',    e.target.value)} placeholder="Sharma" error={fieldErrors.lastName} />
          <Input label="Middle Name"    value={form.middleName}  onChange={(e) => set('middleName',  e.target.value)} placeholder="Kumar" error={fieldErrors.middleName} />
          <Select label="Gender *" value={form.gender} onChange={(e) => set('gender', e.target.value)} options={GENDER_OPTIONS} error={fieldErrors.gender} />
          <Input label="Date of Birth *" type="date" max={new Date(Date.now()-24*60*60*1000).toISOString().split('T')[0]} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} error={fieldErrors.dateOfBirth} />
          <Select label="Classroom *" value={form.classroom} onChange={(e) => {
            const selected = classrooms.find(c => c._id === e.target.value);
            set('classroom', e.target.value);
            if (!form.rteFee && selected?.rteFee) set('rteFee', selected.rteFee);
          }} options={classOptions} error={fieldErrors.classroom} />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.isRTE} onChange={e => set('isRTE', e.target.checked)} />
            RTE student
          </label>
          <Input label="Government Contribution (₹)" type="number" inputMode="decimal" min={0} step={0.01} value={form.rteFee} onChange={(e) => {
            const cleaned = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            set('rteFee', cleaned);
          }} onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault(); }} error={fieldErrors.rteFee} />
          <Select label="Blood Group" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} options={[{ value: '', label: 'Select' }, ...BLOOD_GROUPS.map(bg => ({ value: bg, label: bg }))]} error={fieldErrors.bloodGroup} />
          <Input label="Religion"       value={form.religion}     onChange={(e) => set('religion',     e.target.value)} placeholder="Hindu" error={fieldErrors.religion} />
          <Input label="Caste"          value={form.caste}        onChange={(e) => set('caste',        e.target.value)} placeholder="General" error={fieldErrors.caste} />
          <Input label="Mother Tongue"  value={form.motherTongue} onChange={(e) => set('motherTongue', e.target.value)} placeholder="Marathi" error={fieldErrors.motherTongue} />
          <Input label="Place of Birth" value={form.placeOfBirth} onChange={(e) => set('placeOfBirth', e.target.value)} placeholder="Pune" error={fieldErrors.placeOfBirth} />
          <Input label="PEN Number"     value={form.penNumber}    onChange={(e) => set('penNumber',    e.target.value)} placeholder="Optional" error={fieldErrors.penNumber} />
        </div>
      )}

      {tab === 1 && (
        <div className="grid grid-cols-2 gap-4">
          <ParentSearchWidget label="Father" value={father} onChange={handleFatherChange} errors={fieldErrors._father || {}} />
        </div>
      )}

      {tab === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <ParentSearchWidget label="Mother" value={mother} onChange={handleMotherChange} errors={fieldErrors._mother || {}} />
        </div>
      )}

      {tab === 3 && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Previous School" value={form.previousSchoolName} onChange={(e) => set('previousSchoolName', e.target.value)} placeholder="ABC Primary School" className="col-span-2" />
          <Input label="Previous Class"  value={form.previousClass}      onChange={(e) => set('previousClass',      e.target.value)} placeholder="Class 4" />
        </div>
      )}

      <div className="flex justify-between gap-3 mt-6">
        <div>{tab > 0 && <Button variant="ghost" onClick={() => setTab((t) => t - 1)}>← Back</Button>}</div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {tab < STUDENT_TABS.length - 1
            ? <Button onClick={handleNext}>Next →</Button>
            : <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Create Admission'}</Button>
          }
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit Student Modal ───────────────────────────────────────

const EDIT_TABS = ['Student Info', 'Father', 'Mother', 'Previous School', 'Status'];

function EditStudentModal({ open, onClose, student, classrooms, onSuccess }) {
  const [tab,    setTab]    = useState(0);
  const [form,   setForm]   = useState({});
  const [father, setFather] = useState(null);
  const [mother, setMother] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!student) return;
    setTab(0); setError('');
    setForm({
      firstName: student.firstName || '', middleName: student.middleName || '',
      lastName:  student.lastName  || '', gender: student.gender || 'Male',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      classroom: student.classroom?._id || student.classroom || '',
      bloodGroup: student.bloodGroup || '', religion: student.religion || '',
      caste: student.caste || '', motherTongue: student.motherTongue || '',
      placeOfBirth: student.placeOfBirth || '', penNumber: student.penNumber || '',
      previousSchoolName: student.previousSchoolName || '', previousClass: student.previousClass || '',
      isRTE: !!student.isRTE, rteFee: student.rteFee ?? 0,
      status: student.status || 'UnderReview',
      rejectionRemark: student.rejectionRemark || '', holdRemark: student.holdRemark || '',
      leavingReason: student.leavingReason || '',
      leavingDate: student.leavingDate ? student.leavingDate.split('T')[0] : '',
    });
    // Pre-fill parent widgets from populated data
    setFather(student.fatherUser
      ? { mode: 'existing', existingUserId: student.fatherUser._id || student.fatherUser, name: student.fatherUser.name, email: student.fatherUser.email }
      : null);
    setMother(student.motherUser
      ? { mode: 'existing', existingUserId: student.motherUser._id || student.motherUser, name: student.motherUser.name, email: student.motherUser.email }
      : null);
  }, [student]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');

    // Validate student profile fields
    const { valid, errors } = validateStudent(form);

    // Status-specific
    if (form.status === 'Left' && !form.leavingDate) errors.leavingDate = 'Leaving Date is required.';

    // Validate parents (new accounts) and cross uniqueness
    const parentErrors = {};
    const validateNew = (p) => {
      const e = {};
      e.name = validateParentName(p?.name);
      e.phone = validateParentPhone(p?.phone);
      e.email = validateParentEmail(p?.email);
      e.occupation = validateParentOccupation(p?.occupation);
      e.password = validateParentPassword(p?.password);
      Object.keys(e).forEach((k) => { if (e[k] == null) delete e[k]; });
      return e;
    };
    if (father?.mode === 'new') parentErrors._father = validateNew(father);
    if (mother?.mode === 'new') parentErrors._mother = validateNew(mother);
    const fPhone = father?.mode === 'new' ? (father.phone || '').trim() : '';
    const mPhone = mother?.mode === 'new' ? (mother.phone || '').trim() : '';
    const fEmail = father?.mode === 'new' ? (father.email || '').trim().toLowerCase() : '';
    const mEmail = mother?.mode === 'new' ? (mother.email || '').trim().toLowerCase() : '';
    if (fPhone && mPhone && fPhone === mPhone) {
      parentErrors._father = parentErrors._father || {}; parentErrors._mother = parentErrors._mother || {};
      parentErrors._father.phone = 'Father and Mother phone must be different.';
      parentErrors._mother.phone = 'Father and Mother phone must be different.';
    }
    if (fEmail && mEmail && fEmail === mEmail) {
      parentErrors._father = parentErrors._father || {}; parentErrors._mother = parentErrors._mother || {};
      parentErrors._father.email = 'Father and Mother email must be different.';
      parentErrors._mother.email = 'Father and Mother email must be different.';
    }

    const combinedErrors = { ...errors, ...parentErrors };
    if (!valid || Object.keys(combinedErrors).length) {
      setFieldErrors(combinedErrors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const { status, rejectionRemark, holdRemark, leavingReason, leavingDate, ...profileData } = form;

      // Profile update
      await api.put(API.STUDENTS.BY_ID(student._id), profileData);

      // Status update (only if changed)
      if (status !== student.status) {
        await api.patch(API.STUDENTS.STATUS(student._id), {
          status, rejectionRemark, holdRemark, leavingReason, leavingDate,
        });
      }

      // Re-link father if changed
      const origFatherId = String(student.fatherUser?._id || student.fatherUser || '');
      const newFatherId  = String(father?.existingUserId || '');
      if (father?.mode === 'new' || (father?.mode === 'existing' && newFatherId !== origFatherId) || (!father && origFatherId)) {
        await api.patch(API.STUDENTS.LINK_PARENT(student._id), {
          slot: 'father',
          existingUserId: father?.existingUserId,
          email: father?.email, name: father?.name,
          phone: father?.phone,
          password: father?.password || father?.phone || '',
        });
      }

      // Re-link mother if changed
      const origMotherId = String(student.motherUser?._id || student.motherUser || '');
      const newMotherId  = String(mother?.existingUserId || '');
      if (mother?.mode === 'new' || (mother?.mode === 'existing' && newMotherId !== origMotherId) || (!mother && origMotherId)) {
        await api.patch(API.STUDENTS.LINK_PARENT(student._id), {
          slot: 'mother',
          existingUserId: mother?.existingUserId,
          email: mother?.email, name: mother?.name,
          phone: mother?.phone,
          password: mother?.password || mother?.phone || '',
        });
      }

      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const classOptions = [
    { value: '', label: 'Select classroom' },
    ...classrooms.map((c) => ({ value: c._id, label: c.displayName })),
  ];
  const statusOptions = [
    { value: 'UnderReview', label: 'Under Review' },
    { value: 'Approved',    label: 'Approved'     },
    { value: 'Rejected',    label: 'Rejected'     },
    { value: 'OnHold',      label: 'On Hold'      },
    { value: 'Left',        label: 'Left'         },
    { value: 'Alumni',      label: 'Alumni'       },
  ];

  // Edit validation helpers
  const setEditField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    let msg = null;
    switch (k) {
      case 'firstName':   msg = validateStudentName(v, 'First Name'); break;
      case 'lastName':    msg = validateStudentName(v, 'Last Name'); break;
      case 'middleName':  msg = validateStudentMiddleName(v); break;
      case 'gender':      msg = validateGender(v); break;
      case 'dateOfBirth': msg = validateStudentDOB(v); break;
      case 'classroom':   msg = validateStudentClassroom(v); break;
      case 'rteFee':      msg = validateStudentRteFee(v); break;
      case 'bloodGroup':  msg = validateBloodGroup(v); break;
      case 'religion':    msg = validateMax50(v, 'Religion'); break;
      case 'caste':       msg = validateMax50(v, 'Caste'); break;
      case 'motherTongue': msg = validateMax50(v, 'Mother Tongue'); break;
      case 'placeOfBirth': msg = validatePlaceOfBirth(v); break;
      case 'penNumber':    msg = validatePenNumber(v); break;
      case 'leavingDate':  msg = form.status === 'Left' && !v ? 'Leaving Date is required.' : null; break;
      default: break;
    }
    setFieldErrors((fe) => {
      const next = { ...fe };
      if (msg) next[k] = msg; else delete next[k];
      return next;
    });
  };
  const validateNewParentEdit = (p) => {
    const e = {};
    e.name = validateParentName(p?.name);
    e.phone = validateParentPhone(p?.phone);
    e.email = validateParentEmail(p?.email);
    e.occupation = validateParentOccupation(p?.occupation);
    e.password = validateParentPassword(p?.password);
    Object.keys(e).forEach((k) => { if (e[k] == null) delete e[k]; });
    return e;
  };
  const rebuildParentErrorsEdit = (f, m) => {
    const out = {};
    if (f?.mode === 'new') out._father = validateNewParentEdit(f);
    if (m?.mode === 'new') out._mother = validateNewParentEdit(m);
    const fPhone = f?.mode === 'new' ? (f.phone || '').trim() : '';
    const mPhone = m?.mode === 'new' ? (m.phone || '').trim() : '';
    const fEmail = f?.mode === 'new' ? (f.email || '').trim().toLowerCase() : '';
    const mEmail = m?.mode === 'new' ? (m.email || '').trim().toLowerCase() : '';
    if (fPhone && mPhone && fPhone === mPhone) {
      out._father = out._father || {}; out._mother = out._mother || {};
      out._father.phone = 'Father and Mother phone must be different.';
      out._mother.phone = 'Father and Mother phone must be different.';
    }
    if (fEmail && mEmail && fEmail === mEmail) {
      out._father = out._father || {}; out._mother = out._mother || {};
      out._father.email = 'Father and Mother email must be different.';
      out._mother.email = 'Father and Mother email must be different.';
    }
    return out;
  };
  const handleEditFatherChange = (next) => {
    setFather(next);
    const pe = rebuildParentErrorsEdit(next, mother);
    setFieldErrors((fe) => {
      const copy = { ...fe };
      delete copy._father; delete copy._mother;
      if (pe._father) copy._father = pe._father;
      if (pe._mother) copy._mother = pe._mother;
      return copy;
    });
  };
  const handleEditMotherChange = (next) => {
    setMother(next);
    const pe = rebuildParentErrorsEdit(father, next);
    setFieldErrors((fe) => {
      const copy = { ...fe };
      delete copy._father; delete copy._mother;
      if (pe._father) copy._father = pe._father;
      if (pe._mother) copy._mother = pe._mother;
      return copy;
    });
  };
  const validateEditCurrentTab = () => {
    if (tab === 0) {
      const { errors } = validateStudent(form);
      const pick = ['firstName','lastName','middleName','gender','dateOfBirth','classroom','rteFee','bloodGroup','religion','caste','motherTongue','placeOfBirth','penNumber'];
      const subset = {};
      pick.forEach((k) => { if (errors[k]) subset[k] = errors[k]; });
      if (form.status === 'Left' && !form.leavingDate) subset.leavingDate = 'Leaving Date is required.';
      setFieldErrors((fe) => ({ ...fe, ...subset }));
      return Object.keys(subset).length === 0;
    }
    if (tab === 1) {
      if (father?.mode === 'existing') return true;
      const e = validateNewParentEdit(father || {});
      setFieldErrors((fe) => ({ ...fe, _father: e }));
      return Object.keys(e).length === 0;
    }
    if (tab === 2) {
      if (mother?.mode === 'existing') return true;
      const e = validateNewParentEdit(mother || {});
      setFieldErrors((fe) => ({ ...fe, _mother: e }));
      return Object.keys(e).length === 0;
    }
    return true;
  };

  const handleEditNext = () => { if (validateEditCurrentTab()) setTab((t) => t + 1); };

  return (
    <Modal open={open} onClose={onClose} title="Edit Student" width="max-w-2xl">
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 flex-wrap">
        {EDIT_TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => {
              if (i <= tab) { setTab(i); return; }
              if (i === tab + 1) { if (validateEditCurrentTab()) setTab(i); }
            }}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors min-w-[60px] ${tab === i ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {tab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name *"   value={form.firstName || ''}   onChange={(e) => setEditField('firstName',   e.target.value)} error={fieldErrors.firstName} />
          <Input label="Last Name *"    value={form.lastName || ''}    onChange={(e) => setEditField('lastName',    e.target.value)} error={fieldErrors.lastName} />
          <Input label="Middle Name"    value={form.middleName || ''}  onChange={(e) => setEditField('middleName',  e.target.value)} error={fieldErrors.middleName} />
          <Select label="Gender" value={form.gender} onChange={(e) => setEditField('gender', e.target.value)} options={GENDER_OPTIONS} error={fieldErrors.gender} />
          <Input label="Date of Birth" type="date" value={form.dateOfBirth || ''} onChange={(e) => setEditField('dateOfBirth', e.target.value)} error={fieldErrors.dateOfBirth} />
          <Select label="Classroom" value={form.classroom || ''} onChange={(e) => {
            const selected = classrooms.find(c => c._id === e.target.value);
            setEditField('classroom', e.target.value);
            if (!form.rteFee && selected?.rteFee) setEditField('rteFee', selected.rteFee);
          }} options={classOptions} error={fieldErrors.classroom} />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={!!form.isRTE} onChange={(e) => setEditField('isRTE', e.target.checked)} />
            RTE student
          </label>
          <Input label="Government Contribution (₹)" type="number" min="0" value={form.rteFee ?? 0} onChange={(e) => setEditField('rteFee', e.target.value)} error={fieldErrors.rteFee} />
          <Input label="Blood Group"    value={form.bloodGroup || ''}   onChange={(e) => setEditField('bloodGroup',   e.target.value)} error={fieldErrors.bloodGroup} />
          <Input label="Religion"       value={form.religion || ''}     onChange={(e) => setEditField('religion',     e.target.value)} error={fieldErrors.religion} />
          <Input label="Caste"          value={form.caste || ''}        onChange={(e) => setEditField('caste',        e.target.value)} error={fieldErrors.caste} />
          <Input label="Mother Tongue"  value={form.motherTongue || ''} onChange={(e) => setEditField('motherTongue', e.target.value)} error={fieldErrors.motherTongue} />
          <Input label="Place of Birth" value={form.placeOfBirth || ''} onChange={(e) => setEditField('placeOfBirth', e.target.value)} error={fieldErrors.placeOfBirth} />
          <Input label="PEN Number"     value={form.penNumber || ''}    onChange={(e) => setEditField('penNumber',    e.target.value)} error={fieldErrors.penNumber} />
        </div>
      )}

      {tab === 1 && (
        <div className="grid grid-cols-2 gap-4">
          <ParentSearchWidget label="Father" value={father} onChange={(v) => {
            handleEditFatherChange(v);
          }} errors={fieldErrors._father || {}} />
        </div>
      )}

      {tab === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <ParentSearchWidget label="Mother" value={mother} onChange={(v) => {
            handleEditMotherChange(v);
          }} errors={fieldErrors._mother || {}} />
        </div>
      )}

      {tab === 3 && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Previous School" value={form.previousSchoolName || ''} onChange={(e) => setEditField('previousSchoolName', e.target.value)} className="col-span-2" />
          <Input label="Previous Class"  value={form.previousClass || ''}      onChange={(e) => setEditField('previousClass',      e.target.value)} />
        </div>
      )}

      {tab === 4 && (
        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" value={form.status} onChange={(e) => setEditField('status', e.target.value)} options={statusOptions} className="col-span-2" />
          {form.status === 'Rejected' && (
            <Input label="Rejection Remark" value={form.rejectionRemark || ''} onChange={(e) => setEditField('rejectionRemark', e.target.value)} className="col-span-2" />
          )}
          {form.status === 'OnHold' && (
            <Input label="Hold Remark" value={form.holdRemark || ''} onChange={(e) => setEditField('holdRemark', e.target.value)} className="col-span-2" />
          )}
          {form.status === 'Left' && (
            <>
              <Input label="Leaving Date"   type="date" value={form.leavingDate   || ''} onChange={(e) => setEditField('leavingDate',   e.target.value)} error={fieldErrors.leavingDate} />
              <Input label="Leaving Reason" value={form.leavingReason || ''}             onChange={(e) => setEditField('leavingReason', e.target.value)} />
            </>
          )}
          <div className="col-span-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            Changing status to Left or Rejected will automatically deactivate parent login
            if they have no other active children.
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        {tab < EDIT_TABS.length - 1
          ? <Button onClick={handleEditNext}>Next →</Button>
          : <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        }
      </div>
    </Modal>
  );
}

// ─── Leave Modal ──────────────────────────────────────────────

function LeaveModal({ open, onClose, student, onSuccess }) {
  const [form,   setForm]   = useState({ leavingDate: '', leavingReason: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (open) { setForm({ leavingDate: '', leavingReason: '' }); setError(''); }
  }, [open]);

  const handleSubmit = async () => {
    setError('');
    if (!form.leavingDate) { setError('Leaving date is required.'); return; }
    setSaving(true);
    try {
      await api.patch(API.STUDENTS.STATUS(student._id), {
        status: 'Left', ...form,
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mark Student as Left" width="max-w-md">
      {student && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
          <p className="text-sm text-white font-medium">{student.firstName} {student.lastName}</p>
          <p className="text-xs text-slate-400">{student.admissionNo} · {student.classroom?.displayName}</p>
        </div>
      )}
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mb-4">
        This will mark the student as Left and deactivate parent login accounts if they
        have no other active children.
      </div>
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Leaving Date *" type="date" value={form.leavingDate}   onChange={(e) => setForm((f) => ({ ...f, leavingDate:   e.target.value }))} className="col-span-2" />
        <Input label="Reason"         value={form.leavingReason} onChange={(e) => setForm((f) => ({ ...f, leavingReason: e.target.value }))} placeholder="Transfer, family relocation…" className="col-span-2" />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : 'Mark as Left'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Parent Password Modal ────────────────────────────────────

function ParentPasswordModal({ open, onClose, student, onSuccess }) {
  const [target,   setTarget]   = useState('father');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword(''); setConfirm(''); setError(''); setFieldErrors({});
    setShowPw(false); setShowConfirm(false);
    if (student?.fatherUser)      setTarget('father');
    else if (student?.motherUser) setTarget('mother');
  }, [open, student]);

  const hasFather    = !!student?.fatherUser;
  const hasMother    = !!student?.motherUser;
  const sameAccount  = hasFather && hasMother &&
    String(student.fatherUser._id || student.fatherUser) ===
    String(student.motherUser._id || student.motherUser);

  const validatePasswordLocal = (p) => {
    if (!p) return 'Password is required.';
    if (p.length < 6) return 'Minimum 6 characters.';
    return null;
  };
  const validateConfirmLocal = (c, p) => {
    if (!c) return 'Confirm your password.';
    if (c !== p) return 'Passwords do not match.';
    return null;
  };

  const onPasswordChange = (p) => {
    setPassword(p);
    const pwErr = validatePasswordLocal(p);
    const cfErr = confirm ? validateConfirmLocal(confirm, p) : null;
    setFieldErrors((fe) => {
      const next = { ...fe };
      if (pwErr) next.password = pwErr; else delete next.password;
      if (cfErr) next.confirm  = cfErr;  else if (confirm) delete next.confirm;
      return next;
    });
  };

  const onConfirmChange = (c) => {
    setConfirm(c);
    const cfErr = validateConfirmLocal(c, password);
    setFieldErrors((fe) => {
      const next = { ...fe };
      if (cfErr) next.confirm = cfErr; else delete next.confirm;
      return next;
    });
  };

  const handleSubmit = async () => {
    setError('');
    const pwErr = validatePasswordLocal(password);
    const cfErr = validateConfirmLocal(confirm, password);
    const errs = {};
    if (pwErr) errs.password = pwErr;
    if (cfErr) errs.confirm  = cfErr;
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setSaving(true);
    try {
      await api.patch(API.STUDENTS.PARENT_PASSWORD(student._id), { target, password });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reset Parent Password" width="max-w-md">
      {student && (
        <p className="mb-4 text-sm text-slate-400">
          Student: <span className="text-white font-medium">{student.firstName} {student.lastName}</span>
        </p>
      )}
      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}
      {!sameAccount && (hasFather || hasMother) && (
        <div className="flex gap-2 mb-4">
          {hasFather && (
            <button onClick={() => setTarget('father')}
              className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${target === 'father' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              Father<br/><span className="text-xs opacity-70">{student.fatherUser?.email}</span>
            </button>
          )}
          {hasMother && (
            <button onClick={() => setTarget('mother')}
              className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${target === 'mother' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              Mother<br/><span className="text-xs opacity-70">{student.motherUser?.email}</span>
            </button>
          )}
        </div>
      )}
      {sameAccount && (
        <p className="mb-4 text-xs text-slate-500">Both parents share the same account ({student.fatherUser?.email}).</p>
      )}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Input label="New Password *" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="Min 6 characters" error={fieldErrors.password} className="pr-10" />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-200" aria-label={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <Input label="Confirm Password *" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => onConfirmChange(e.target.value)} placeholder="Repeat new password" error={fieldErrors.confirm} className="pr-10" onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-200" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Updating…' : 'Update Password'}</Button>
      </div>
    </Modal>
  );
}