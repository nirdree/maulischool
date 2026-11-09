// pages/teacher/Leaves.jsx
/**
 * TEACHER LEAVES PAGE
 * APIs Used:
 *   GET    /api/academic-years/current
 *   GET    /api/leaves                — teacher's own leaves
 *   POST   /api/leaves                — apply for leave
 *   DELETE /api/leaves/:id            — cancel pending leave
 */
'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import {
  PageContent, PageHeader, Card, Table, Pagination, Button, Input, Select, leaveStatusBadge, Badge, Modal,
} from '@/components/ui.jsx';
import { validateApplyLeave } from '@/lib/validation.js';

const LEAVE_TYPES = ['Sick', 'Casual', 'Earned', 'Maternity', 'Unpaid', 'Other'];

export default function TeacherLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ pendingCount: 0, approvedCount: 0, approvedDays: 0 });
  const [ayId, setAyId] = useState('');
  const [ayError, setAyError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [ay, profile] = await Promise.all([
          api.get(API.ACADEMIC_YEARS.CURRENT),
          api.get(API.AUTH.ME),
        ]);
        if (cancelled) return;
        setAyId(ay?.data?._id || '');
        const linkedEmployeeId = profile.data?.employeeId?._id || profile.data?.employeeId;
        if (!linkedEmployeeId) {
          setAyError('Your account is not linked to an employee profile.');
          return;
        }
        setEmployeeId(String(linkedEmployeeId));
        setAyError('');
      } catch (err) {
        if (cancelled) return;
        setAyId('');
        setAyError(err?.message || 'Unable to load the current academic year.');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (ayId) params.set('academicYear', ayId);
      const query = `?${params}`;
      const res = await api.get(`${API.LEAVES.BASE}${query}`);
      setLeaves(Array.isArray(res?.data) ? res.data : []);
      setTotal(res.meta?.total || 0);
      setSummary({
        pendingCount: res.meta?.pendingCount || 0,
        approvedCount: res.meta?.approvedCount || 0,
        approvedDays: res.meta?.approvedDays || 0,
      });
    } catch (err) {
      console.error('Failed to load leave applications', err);
      setLeaves([]);
    } finally { setLoading(false); }
  }, [ayId, page]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleDelete = async (id) => {
    if (!(await confirm('Cancel this leave application?'))) return;
    try {
      await api.delete(API.LEAVES.BY_ID(id));
      fetchLeaves();
    } catch (err) { alert(err.message); }
  };

  // Summary counts
  const columns = [
    { key: 'leaveType', label: 'Type', render: (l) => <Badge label={l.leaveType} color="indigo" /> },
    {
      key: 'dates', label: 'Duration',
      render: (l) => (
        <div>
          <p className="text-sm text-white">
            {new Date(l.fromDate).toLocaleDateString('en-IN')} — {new Date(l.toDate).toLocaleDateString('en-IN')}
          </p>
          <p className="text-xs text-slate-500">{l.totalDays} day(s)</p>
        </div>
      ),
    },
    { key: 'reason', label: 'Reason', render: (l) => <span className="text-slate-300 text-sm">{l.reason}</span> },
    { key: 'status', label: 'Status', render: (l) => leaveStatusBadge(l.status) },
    {
      key: 'approvalRemark', label: 'Remark',
      render: (l) => l.approvalRemark
        ? <span className="text-xs text-slate-400">{l.approvalRemark}</span>
        : <span className="text-xs text-slate-600">—</span>,
    },
    {
      key: 'actions', label: '',
      render: (l) => l.status === 'Pending' && (
        <Button size="sm" variant="danger" onClick={() => handleDelete(l._id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      ),
    },
  ];

  return (
    <PageContent>
      <PageHeader
        title="My Leaves"
        subtitle="Apply and track your leave applications"
        actions={<Button onClick={() => setApplyOpen(true)} disabled={!ayId || !employeeId}><Plus className="w-4 h-4" /> Apply Leave</Button>}
      />

      {ayError && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {ayError}
        </div>
      )}

      {/* Leaves Overview — single compact row */}
      <Card>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Leaves Overview</h3>
        <div className="flex items-center gap-6 overflow-x-auto pb-1">
          <div className="min-w-[90px] text-center">
            <div className="text-lg font-extrabold text-amber-400">{summary.pendingCount}</div>
            <div className="text-[11px] text-slate-500">Pending</div>
          </div>
          <div className="min-w-[90px] text-center">
            <div className="text-lg font-extrabold text-emerald-400">{summary.approvedCount}</div>
            <div className="text-[11px] text-slate-500">Approved</div>
          </div>
          <div className="min-w-[120px] text-center">
            <div className="text-lg font-extrabold text-sky-400">{summary.approvedDays}</div>
            <div className="text-[11px] text-slate-500">Approved Days</div>
          </div>
        </div>
      </Card>

      <Card className="!p-0">
        <Table columns={columns} data={leaves} loading={loading} emptyMessage="No leave applications" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      <ApplyLeaveModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        ayId={ayId}
        employeeId={employeeId}
        onSuccess={() => { fetchLeaves(); setApplyOpen(false); }}
      />
    </PageContent>
  );
}

function ApplyLeaveModal({ open, onClose, ayId, employeeId, onSuccess }) {
  const initialForm = { leaveType: 'Sick', fromDate: '', toDate: '', reason: '' };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  };

  useEffect(() => { if (open) resetForm(); }, [open]);

  const calcDays = () => {
    if (!form.fromDate || !form.toDate) return 0;
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    const ms = to - from;
    if (Number.isNaN(ms) || ms < 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;
  };

  useEffect(() => {
    const v = validateApplyLeave({ ...form, employee: employeeId });
    setErrors(v.errors || {});
  }, [form, employeeId]);

  const handleSubmit = async () => {
    setSubmitted(true);
    const v = validateApplyLeave({ ...form, employee: employeeId });
    setErrors(v.errors || {});
    if (!v.valid) return;
    if (!ayId) {
      alert('The current academic year is not available right now. Please contact the administrator.');
      return;
    }
    setSaving(true);
    try {
      await api.post(API.LEAVES.BASE, { ...form, employee: employeeId, academicYear: ayId });
      resetForm();
      onSuccess();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave">
      <div className="space-y-4">
        <Select
          label="Leave Type *"
          value={form.leaveType}
          onChange={e => set('leaveType', e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, leaveType: true }))}
          options={LEAVE_TYPES.map(t => ({ value: t, label: t }))}
          error={(submitted || touched.leaveType) ? errors.leaveType : null}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="From Date *"
            type="date"
            value={form.fromDate}
            onChange={e => set('fromDate', e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, fromDate: true }))}
            error={(submitted || touched.fromDate) ? errors.fromDate : null}
          />
          <Input
            label="To Date *"
            type="date"
            value={form.toDate}
            onChange={e => set('toDate', e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, toDate: true }))}
            min={form.fromDate || undefined}
            error={(submitted || touched.toDate) ? errors.toDate : null}
          />
        </div>
        {calcDays() > 0 && (
          <p className="text-xs text-emerald-400 font-medium">Total: {calcDays()} day(s)</p>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Reason *</label>
          <textarea
            value={form.reason}
            onChange={e => set('reason', e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, reason: true }))}
            className={`w-full px-3 py-2 rounded-lg bg-slate-800 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${ (submitted || touched.reason) && errors.reason ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-700'}`}
            rows={3}
            placeholder="State the reason for leave..."
          />
          {(submitted || touched.reason) && errors.reason && (
            <p className="text-xs text-rose-400 mt-1">{errors.reason}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={() => { resetForm(); onClose(); }}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Submitting...' : 'Apply'}</Button>
      </div>
    </Modal>
  );
}
