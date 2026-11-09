// pages/teacher/Exams.jsx
/**
 * TEACHER EXAMS PAGE
 * APIs Used:
 *   GET    /api/academic-years/current
 *   GET    /api/classrooms              — teacher's classes
 *   GET    /api/subjects                — by class
 *   GET    /api/exams                   — list exams
 *   POST   /api/exams                   — create exam
 *   GET    /api/exams/:id/marks         — get marks
 *   POST   /api/exams/:id/marks         — save marks
 *   GET    /api/students                — for marks entry
 */
'use client';
import { useEffect, useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import {
  PageContent, PageHeader, Card, Table, Pagination, Button, Input, Select, Badge, Modal,
} from '@/components/ui.jsx';
import { validateExam } from '@/lib/validation.js';
const EXAM_TYPES = ['UnitTest1', 'UnitTest2', 'MidTerm', 'FinalExam', 'Project', 'Other'];

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [ayId, setAyId] = useState('');
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [marksExam, setMarksExam] = useState(null);

  useEffect(() => {
    (async () => {
      setPageError('');
      try {
        const ay = await api.get(API.ACADEMIC_YEARS.CURRENT);
        const profile = await api.get(API.AUTH.ME);
        const employeeId = profile.data?.employeeId?._id || profile.data?.employeeId;
        if (!employeeId) throw new Error('Your account is not linked to a teacher profile.');
        const [subjectResponse, classroomResponse] = await Promise.all([
          api.get(
            `${API.SUBJECTS.BASE}?teacherId=${encodeURIComponent(employeeId)}&academicYear=${encodeURIComponent(ay.data?._id || '')}&isActive=true`
          ),
          api.get(`${API.CLASSROOMS.BASE}?isActive=true&academicYear=${encodeURIComponent(ay.data?._id || '')}`),
        ]);
        const assignedClassIds = new Set(
          (subjectResponse.data || []).map(subject => String(subject.classroom?._id || subject.classroom || ''))
        );
        const allClasses = classroomResponse.data || [];
        const teacherClasses = allClasses.filter(classroom =>
          assignedClassIds.has(String(classroom._id))
          || String(classroom.classTeacher?._id || classroom.classTeacher || '') === String(employeeId)
        );
        setTeacherId(employeeId || '');
        setAyId(ay.data?._id);
        setClassrooms(teacherClasses);
        setClassFilter('');
      } catch (err) {
        setPageError(err.response?.data?.message || err.message || 'Unable to load your classrooms.');
        setLoading(false);
      }
    })();
  }, []);

  const fetchExams = async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYear: ayId, page: String(page), limit: '20' });
      if (classFilter) params.set('classId', classFilter);
      const res = await api.get(`${API.EXAMS.BASE}?${params}`);
      setExams(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      setPageError(err.response?.data?.message || err.message || 'Unable to load exams.');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (ayId) fetchExams(); }, [classFilter, ayId, page]);

  const columns = [
    { key: 'name', label: 'Exam', render: (e) => <span className="font-medium text-white">{e.name}</span> },
    { key: 'examType', label: 'Type', render: (e) => <Badge label={e.examType} color="indigo" /> },
    { key: 'classroom', label: 'Class', render: (e) => e.classroom?.displayName || '—' },
    { key: 'subject', label: 'Subject', render: (e) => e.subject?.name || '—' },
    { key: 'totalMarks', label: 'Marks', render: (e) => <span className="text-amber-400">{e.totalMarks}</span> },
    { key: 'examDate', label: 'Date', render: (e) => new Date(e.examDate).toLocaleDateString('en-IN') },
    {
      key: 'actions', label: '',
      render: (e) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setMarksExam({
            ...e,
            canEditMarks: Boolean(teacherId && String(e.subject?.teacher?._id || e.subject?.teacher || '') === String(teacherId)),
          })}
        >
          <ClipboardList className="w-3 h-3 mr-1" />
          {teacherId && String(e.subject?.teacher?._id || e.subject?.teacher || '') === String(teacherId) ? 'Enter Marks' : 'View Marks'}
        </Button>
      ),
    },
  ];

  const classOptions = classrooms.map(c => ({ value: c._id, label: c.displayName }));

  return (
    <PageContent>
      <PageHeader
        title="Exams & Marks"
        subtitle={`${total} exams`}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Create Exam</Button>}
      />
      {pageError && <p className="mb-4 text-sm text-rose-400">{pageError}</p>}
      <div className="flex gap-3 mb-4">
        <Select options={[{ value: '', label: 'All Classes' }, ...classOptions]} value={classFilter}
          onChange={e => { setClassFilter(e.target.value); setPage(1); }} className="w-48" />
      </div>
      <Card className="!p-0">
        <Table columns={columns} data={exams} loading={loading} emptyMessage="No exams found" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      <ExamCreateModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        classrooms={classrooms}
        teacherId={teacherId}
        ayId={ayId}
        onSuccess={() => { fetchExams(); setAddOpen(false); }}
      />

      {marksExam && (
        <MarksModal exam={marksExam} onClose={() => setMarksExam(null)} ayId={ayId} />
      )}
    </PageContent>
  );
}

function ExamCreateModal({ open, onClose, classrooms, teacherId, ayId, onSuccess }) {
  const initialForm = {
    name: '', examType: 'UnitTest1', classroom: '', subject: '',
    totalMarks: '', examDate: '', description: '',
  };
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

  // Recompute all errors when form changes; display gated by touched/submitted
  useEffect(() => {
    const v = validateExam(form);
    setErrors(v.errors || {});
  }, [form]);

  // Reset when modal opens
  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  const handleClassChange = async (classId) => {
    set('classroom', classId);
    set('subject', '');
    setSubjects([]);
    if (classId) {
      try {
        const res = await api.get(
          `${API.SUBJECTS.BASE}?classId=${encodeURIComponent(classId)}&teacherId=${encodeURIComponent(teacherId)}&academicYear=${encodeURIComponent(ayId)}&isActive=true`
        );
        setSubjects(res.data || []);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const v = validateExam(form);
    setErrors(v.errors || {});
    if (!v.valid) return;
    setSaving(true);
    try {
      await api.post(API.EXAMS.BASE, { ...form, academicYear: ayId, teacher: teacherId });
      resetForm();
      onSuccess();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };


  return (
    <Modal open={open} onClose={onClose} title="Create Exam">
      <div className="space-y-4">
        <Input
          label="Exam Name *"
          value={form.name}
          onChange={e => { const v = e.target.value; set('name', v); }}
          onBlur={() => setTouched(t => ({ ...t, name: true }))}
          placeholder="Unit Test 1"
          error={(submitted || touched.name) ? errors.name : null}
        />
        <Select
          label="Exam Type *"
          value={form.examType}
          onChange={e => { const v = e.target.value; set('examType', v); }}
          onBlur={() => setTouched(t => ({ ...t, examType: true }))}
          options={EXAM_TYPES.map(t => ({ value: t, label: t }))}
          error={(submitted || touched.examType) ? errors.examType : null}
        />
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
          onChange={e => { const v = e.target.value; set('subject', v); }}
          onBlur={() => setTouched(t => ({ ...t, subject: true }))}
          options={[{ value: '', label: 'Select Subject' }, ...subjects.map(s => ({ value: s._id, label: s.name }))]}
          error={(submitted || touched.subject) ? errors.subject : null}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Marks *"
            type="number"
            value={form.totalMarks}
            onChange={e => { const v = e.target.value; set('totalMarks', v); }}
            onBlur={() => setTouched(t => ({ ...t, totalMarks: true }))}
            onKeyDown={e => { if (['e','E','+','-','.'].includes(e.key)) e.preventDefault(); }}
            placeholder="25"
            error={(submitted || touched.totalMarks) ? errors.totalMarks : null}
          />
          <Input
            label="Exam Date *"
            type="date"
            value={form.examDate}
            onChange={e => { const v = e.target.value; set('examDate', v); }}
            onBlur={() => setTouched(t => ({ ...t, examDate: true }))}
            error={(submitted || touched.examDate) ? errors.examDate : null}
          />
        </div>
        <Input
          label="Description"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Optional"
        />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
      </div>
    </Modal>
  );
}

function MarksModal({ exam, onClose, ayId }) {
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [absent, setAbsent] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const classId = exam.classroom?._id || exam.classroom;
        const [stuRes, marksRes] = await Promise.all([
          api.get(`${API.STUDENTS.BASE}?classId=${classId}&status=Approved&academicYear=${ayId}&limit=100`),
          api.get(API.EXAMS.MARKS(exam._id)),
        ]);
        if (!active) return;
        setStudents(stuRes.data || []);
        const mMap = {}, aMap = {};
        (marksRes.data || []).forEach(m => {
          mMap[m.student?._id || m.student] = m.marksObtained;
          aMap[m.student?._id || m.student] = m.isAbsent;
        });
        setMarks(mMap);
        setAbsent(aMap);
      } catch (err) {
        if (active) setError(err.response?.data?.message || err.message || 'Unable to load marks.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [exam._id, exam.classroom, ayId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const marksArr = students.map(s => ({
        student: s._id,
        marksObtained: absent[s._id] ? 0 : Number(marks[s._id] || 0),
        isAbsent: absent[s._id] || false,
      }));
      await api.post(API.EXAMS.MARKS(exam._id), { marks: marksArr });
      alert('Marks saved!');
      onClose();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Marks — ${exam.name} (/${exam.totalMarks})`} width="max-w-2xl">
      {!exam.canEditMarks && (
        <p className="mb-3 text-sm text-slate-400">View only. Marks can be entered or changed only for your assigned subjects.</p>
      )}
      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading marks...</p>
      ) : error ? (
        <p className="py-8 text-center text-rose-400">{error}</p>
      ) : <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900">
            <tr className="border-b border-slate-800">
              <th className="text-left py-2 px-3 text-xs text-slate-400">Student</th>
              <th className="text-left py-2 px-3 text-xs text-slate-400">Marks (/{exam.totalMarks})</th>
              <th className="text-left py-2 px-3 text-xs text-slate-400">Absent</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s._id} className="border-b border-slate-800/50">
                <td className="py-2 px-3 text-white">
                  {s.firstName} {s.lastName}
                  <span className="text-slate-500 text-xs ml-1">({s.rollNumber})</span>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number" min={0} max={exam.totalMarks}
                    disabled={!exam.canEditMarks || absent[s._id]}
                    value={marks[s._id] ?? ''}
                    onChange={e => setMarks(prev => ({ ...prev, [s._id]: e.target.value }))}
                    className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40"
                  />
                </td>
                <td className="py-2 px-3">
                  <input type="checkbox" checked={absent[s._id] || false} disabled={!exam.canEditMarks}
                    onChange={e => setAbsent(prev => ({ ...prev, [s._id]: e.target.checked }))}
                    className="w-4 h-4 rounded" />
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={3} className="py-8 text-center text-slate-500">No students found for this classroom.</td></tr>
            )}
          </tbody>
        </table>
      </div>}
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        {exam.canEditMarks && (
          <Button onClick={handleSave} disabled={saving || loading || Boolean(error) || students.length === 0}>
            {saving ? 'Saving...' : 'Save Marks'}
          </Button>
        )}
      </div>
    </Modal>
  );
}