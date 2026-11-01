// pages/admin/Subjects.jsx
/**
 * SUBJECTS PAGE
 * APIs Used:
 *   GET    /api/subjects          — list
 *   POST   /api/subjects          — create (single or bulk)
 *   PUT    /api/subjects/:id      — update
 *   PATCH  /api/subjects/:id/toggle — toggle active
 *   DELETE /api/subjects/:id      — delete
 *   GET    /api/classrooms        — populate class dropdown
 *   GET    /api/employees         — populate teacher dropdown
 */
"use client";
import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, MoreVertical, Filter } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Table, Pagination, Button, Input, Select, Badge, Modal } from '@/components/ui.jsx';
import { validateSubject, validateSubjectName, validateSubjectClassroom, validateSubjectTeacher, validateSubjectTotalMarks } from '@/lib/validation';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [ayId, setAyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ay = await api.get(API.ACADEMIC_YEARS.CURRENT);
        setAyId(ay.data?._id);
        const [cls, emps] = await Promise.all([
          api.get(`${API.CLASSROOMS.BASE}?isActive=true&academicYear=${ay.data?._id}`),
          api.get(`${API.EMPLOYEES.BASE}?role=teacher&status=active`),
        ]);
        setClassrooms(cls.data || []);
        setTeachers(emps.data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (classFilter) params.set('classId', classFilter);
      if (ayId) params.set('academicYear', ayId);
      const res = await api.get(`${API.SUBJECTS.BASE}?${params}`);
      setSubjects(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (ayId) fetchSubjects(); }, [classFilter, ayId, page]);

  const handleToggle = async (id) => {
    await api.patch(API.SUBJECTS.TOGGLE(id));
    fetchSubjects();
  };

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this subject?'))) return;
    await api.delete(API.SUBJECTS.BY_ID(id));
    fetchSubjects();
  };

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classrooms.map(c => ({ value: c._id, label: c.displayName })),
  ];

  const RowActions = ({ s }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, []);
    return (
      <div className="relative" ref={ref}>
        <Button size="sm" variant="ghost" title="Actions" onClick={() => setOpen(v => !v)}>
          <MoreVertical className="w-4 h-4" />
        </Button>
        {open && (
          <div className="absolute right-0 mt-2 z-50 rounded-lg bg-slate-900 border border-slate-700 shadow-lg py-1 min-w-[200px]">
            <button onClick={() => { setOpen(false); setEditSubject(s); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </button>
            <button onClick={() => { setOpen(false); handleToggle(s._id); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
              {s.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
              <span className="text-sm">{s.isActive ? 'Deactivate' : 'Activate'}</span>
            </button>
            <button onClick={() => { setOpen(false); handleDelete(s._id); }}
              className="w-full px-3 py-2 flex items-center gap-2 rounded-md hover:bg-slate-800 text-slate-200">
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const columns = [
    { key: 'name', label: 'Subject', render: (s) => <span className="font-medium text-white">{s.name}</span> },
    { key: 'classroom', label: 'Class', render: (s) => s.classroom?.displayName || '—' },
    { key: 'teacher', label: 'Teacher', render: (s) => s.teacher?.name || <span className="text-slate-500">Unassigned</span> },
    { key: 'totalMarks', label: 'Total Marks', render: (s) => <span className="text-indigo-400">{s.totalMarks}</span> },
    {
      key: 'isActive', label: 'Status',
      render: (s) => <Badge label={s.isActive ? 'Active' : 'Inactive'} color={s.isActive ? 'green' : 'slate'} />,
    },
    {
      key: 'actions', label: '',
      render: (s) => (<RowActions s={s} />),
    },
  ];

  return (
    <PageContent>
      <PageHeader
        title="Subjects"
        subtitle={`${total} subjects`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setFilterOpen(true)} className="sm:hidden">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Subject</span>
            </Button>
          </>
        }
      />
      <div className="hidden sm:flex gap-3 mb-4">
        <Select options={classOptions} value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }} className="w-48" />
      </div>
      <Card className="!p-0">
        <Table columns={columns} data={subjects} loading={loading} emptyMessage="No subjects found" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      <SubjectModal
        open={addOpen || !!editSubject}
        onClose={() => { setAddOpen(false); setEditSubject(null); }}
        subject={editSubject}
        classrooms={classrooms}
        teachers={teachers}
        ayId={ayId}
        onSuccess={() => { fetchSubjects(); setAddOpen(false); setEditSubject(null); }}
      />

      {/* Filters modal (mobile) */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" width="max-w-md">
        <div className="space-y-4">
          <Select label="Class" value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            options={classOptions} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => { setClassFilter(''); setPage(1); }}>Clear</Button>
          <Button onClick={() => { setPage(1); fetchSubjects(); setFilterOpen(false); }}>Apply</Button>
        </div>
      </Modal>
    </PageContent>
  );
}

function SubjectModal({ open, onClose, subject, classrooms, teachers, ayId, onSuccess }) {
  const isEdit = !!subject;
  const [form, setForm] = useState({ name: '', classroom: '', teacher: '', totalMarks: 100 });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setFieldErrors({});
    if (subject) {
      setForm({
        name: subject.name || '',
        classroom: subject.classroom?._id || '',
        teacher: subject.teacher?._id || '',
        totalMarks: subject.totalMarks || 100,
      });
    } else {
      setForm({ name: '', classroom: '', teacher: '', totalMarks: 100 });
    }
  }, [subject]);

  // Auto-select teacher when exactly one available and none chosen
  useEffect(() => {
    if (!form.teacher && teachers.length === 1) {
      setForm(f => ({ ...f, teacher: teachers[0]._id }));
    }
  }, [teachers, form.teacher]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    let msg = null;
    switch (k) {
      case 'name':       msg = validateSubjectName(v); break;
      case 'classroom':  msg = validateSubjectClassroom(v); break;
      case 'teacher':    msg = validateSubjectTeacher(v); break;
      case 'totalMarks': msg = validateSubjectTotalMarks(v); break;
      default: break;
    }
    setFieldErrors((fe) => {
      const next = { ...fe };
      if (msg) next[k] = msg; else delete next[k];
      return next;
    });
  };

  const handleSubmit = async () => {
    const { valid, errors } = validateSubject(form);
    if (!valid) { setFieldErrors(errors); return; }
    setFieldErrors({});

    setSaving(true);
    try {
      const payload = { ...form, academicYear: ayId, totalMarks: Number(form.totalMarks ?? 0) };
      if (isEdit) {
        await api.put(API.SUBJECTS.BY_ID(subject._id), payload);
      } else {
        await api.post(API.SUBJECTS.BASE, payload);
      }
      onSuccess();
    } catch (err) { alert(err.response?.data?.message || err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Subject' : 'Add Subject'}>
      <div className="space-y-4">
        <Input label="Subject Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mathematics" error={fieldErrors.name} />
        <Select
          label="Classroom *"
          value={form.classroom}
          onChange={e => set('classroom', e.target.value)}
          options={[{ value: '', label: 'Select Class' }, ...classrooms.map(c => ({ value: c._id, label: c.displayName }))]}
          error={fieldErrors.classroom}
        />
        <Select
          label="Teacher *"
          value={form.teacher}
          onChange={e => set('teacher', e.target.value)}
          options={[...teachers.map(t => ({ value: t._id, label: t.name }))]}
          error={fieldErrors.teacher}
        />
        <Input
          label="Total Marks *"
          type="number"
          inputMode="numeric"
          min={0}
          max={500}
          step={1}
          value={form.totalMarks}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\D/g, '');
            const next = cleaned === '' ? '' : String(Math.min(500, parseInt(cleaned, 10)));
            set('totalMarks', next);
            const msg = validateSubjectTotalMarks(next);
            setFieldErrors(errs => ({ ...errs, totalMarks: msg || undefined }));
          }}
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '.') e.preventDefault();
          }}
          error={fieldErrors.totalMarks}
        />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}</Button>
      </div>
    </Modal>
  );
}