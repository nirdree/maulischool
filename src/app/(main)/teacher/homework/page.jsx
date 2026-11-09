// pages/teacher/Homework.jsx
/**
 * TEACHER HOMEWORK PAGE
 * APIs Used:
 *   GET    /api/academic-years/current
 *   GET    /api/classrooms
 *   GET    /api/subjects              — by class
 *   GET    /api/homework              — list
 *   POST   /api/homework              — create
 *   PUT    /api/homework/:id          — update
 *   DELETE /api/homework/:id          — delete
 */
'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import {
  PageContent, PageHeader, Card, Table, Pagination, Button, Input, Select, Badge, Modal,
} from '@/components/ui.jsx';
import { validateHomework } from '@/lib/validation.js';

export default function HomeworkPage() {
  const [homework, setHomework] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [ayId, setAyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editHw, setEditHw] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const ay = await api.get(API.ACADEMIC_YEARS.CURRENT);
        const profile = await api.get(API.AUTH.ME);
        const employeeId = profile.data?.employeeId?._id || profile.data?.employeeId;
        if (!employeeId) throw new Error('Your account is not linked to a teacher profile.');
        const subjectResponse = await api.get(
          `${API.SUBJECTS.BASE}?teacherId=${encodeURIComponent(employeeId)}&academicYear=${encodeURIComponent(ay.data?._id || '')}&isActive=true`
        );
        const teachingClasses = [...new Map(
          (subjectResponse.data || [])
            .filter(subject => subject.classroom?._id)
            .map(subject => [subject.classroom._id, subject.classroom])
        ).values()];
        setTeacherId(employeeId);
        setAyId(ay.data?._id);
        setClassrooms(teachingClasses);
      } catch (err) {
        setPageError(err.response?.data?.message || err.message || 'Unable to load your teaching classes.');
        setLoading(false);
      }
    })();
  }, []);

  const fetchHomework = async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        academicYear: ayId,
        teacherId,
        page: String(page),
        limit: '20',
      });
      if (classFilter) params.set('classId', classFilter);
      const res = await api.get(`${API.HOMEWORK.BASE}?${params}`);
      setHomework(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      setPageError(err.response?.data?.message || err.message || 'Unable to load homework.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (ayId && teacherId) fetchHomework(); }, [classFilter, ayId, teacherId, page]);

  const handleDelete = async (id) => {
    if (!(await confirm('Delete this homework?'))) return;
    await api.delete(API.HOMEWORK.BY_ID(id));
    fetchHomework();
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();

  const columns = [
    {
      key: 'title', label: 'Assignment',
      render: (h) => (
        <div>
          <p className="font-medium text-white">{h.title}</p>
          {h.description && <p className="text-xs text-slate-500 line-clamp-1">{h.description}</p>}
        </div>
      ),
    },
    { key: 'classroom', label: 'Class', render: (h) => h.classroom?.displayName || '—' },
    { key: 'subject', label: 'Subject', render: (h) => <Badge label={h.subject?.name || '—'} color="indigo" /> },
    {
      key: 'dueDate', label: 'Due Date',
      render: (h) => (
        <span className={isOverdue(h.dueDate) ? 'text-rose-400 font-medium' : 'text-amber-400'}>
          {new Date(h.dueDate).toLocaleDateString('en-IN')}
          {isOverdue(h.dueDate) && <span className="ml-1 text-xs">(Overdue)</span>}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Assigned', render: (h) => new Date(h.createdAt).toLocaleDateString('en-IN') },
    {
      key: 'actions', label: '',
      render: (h) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditHw(h)}><Edit2 className="w-3 h-3" /></Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(h._id)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ),
    },
  ];

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classrooms.map(c => ({ value: c._id, label: c.displayName })),
  ];

  return (
    <PageContent>
      <PageHeader
        title="Homework"
        subtitle={`${total} assignments`}
        actions={<Button onClick={() => setAddOpen(true)} disabled={!classrooms.length}><Plus className="w-4 h-4" /> Assign Homework</Button>}
      />
      {pageError && <p className="mb-4 text-sm text-rose-400">{pageError}</p>}
      <div className="flex gap-3 mb-4">
        <Select options={classOptions} value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }} className="w-48" />
      </div>
      <Card className="!p-0">
        <Table columns={columns} data={homework} loading={loading} emptyMessage="No homework assigned" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      <HomeworkModal
        open={addOpen || !!editHw}
        onClose={() => { setAddOpen(false); setEditHw(null); }}
        homework={editHw}
        classrooms={classrooms}
        teacherId={teacherId}
        ayId={ayId}
        onSuccess={() => { fetchHomework(); setAddOpen(false); setEditHw(null); }}
      />
    </PageContent>
  );
}

function HomeworkModal({ open, onClose, homework, classrooms, teacherId, ayId, onSuccess }) {
  const isEdit = !!homework;
  const initialForm = { title: '', description: '', classroom: '', subject: '', dueDate: '' };
  const [form, setForm] = useState(initialForm);
  const [subjects, setSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm(initialForm);
    setSubjects([]);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  };

  // Prefill on edit; reset on create/open
  useEffect(() => {
    if (homework) {
      setForm({
        title: homework.title || '',
        description: homework.description || '',
        classroom: homework.classroom?._id || '',
        subject: homework.subject?._id || '',
        dueDate: homework.dueDate ? homework.dueDate.split('T')[0] : '',
      });
      if (homework.classroom?._id) loadSubjects(homework.classroom._id);
    } else if (open) {
      resetForm();
    }
  }, [homework, open]);

  // Recompute errors when form changes
  useEffect(() => {
    const v = validateHomework(form);
    setErrors(v.errors || {});
  }, [form]);

  const loadSubjects = async (classId) => {
    try {
      const res = await api.get(
        `${API.SUBJECTS.BASE}?classId=${encodeURIComponent(classId)}&teacherId=${encodeURIComponent(teacherId)}&academicYear=${encodeURIComponent(ayId)}&isActive=true`
      );
      setSubjects(res.data || []);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Unable to load assigned subjects.');
    }
  };

  const handleClassChange = (classId) => {
    set('classroom', classId);
    set('subject', '');
    if (classId) loadSubjects(classId);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const v = validateHomework(form);
    setErrors(v.errors || {});
    if (!v.valid) return;
    setSaving(true);
    try {
      const payload = { ...form, academicYear: ayId, teacher: teacherId };
      if (isEdit) {
        await api.put(API.HOMEWORK.BY_ID(homework._id), payload);
      } else {
        await api.post(API.HOMEWORK.BASE, payload);
      }
      resetForm();
      onSuccess();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Homework' : 'Assign Homework'}>
      <div className="space-y-4">
        <Input
          label="Title *"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, title: true }))}
          placeholder="Chapter 5 Exercise"
          error={(submitted || touched.title) ? errors.title : null}
        />
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, description: true }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={3}
            placeholder="Details about the assignment..."
          />
          {(submitted || touched.description) && errors.description && (
            <p className="text-xs text-rose-400 mt-1">{errors.description}</p>
          )}
        </div>
        <Select
          label="Class *"
          value={form.classroom}
          onChange={e => handleClassChange(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, classroom: true }))}
          options={[{ value: '', label: 'Select Class' }, ...classrooms.map(c => ({ value: c._id, label: c.displayName }))]}
          error={(submitted || touched.classroom) ? errors.classroom : null}
        />
        <Select
          label="Subject *"
          value={form.subject}
          onChange={e => set('subject', e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, subject: true }))}
          options={[{ value: '', label: 'Select Subject' }, ...subjects.map(s => ({ value: s._id, label: s.name }))]}
          error={(submitted || touched.subject) ? errors.subject : null}
        />
        <Input
          label="Due Date *"
          type="date"
          value={form.dueDate}
          onChange={e => set('dueDate', e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, dueDate: true }))}
          min={new Date().toISOString().slice(0,10)}
          error={(submitted || touched.dueDate) ? errors.dueDate : null}
        />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Assign'}</Button>
      </div>
    </Modal>
  );
}