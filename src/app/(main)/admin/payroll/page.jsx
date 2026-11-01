// pages/admin/Payroll.jsx
/**
 * PAYROLL PAGE — Full Featured
 * APIs:
 *   GET    /api/payroll                 — list
 *   GET    /api/payroll/preview         — salary preview before generating
 *   POST   /api/payroll                 — generate single
 *   POST   /api/payroll/generate-all    — bulk auto-generate
 *   PUT    /api/payroll/:id             — edit (only Pending)
 *   PATCH  /api/payroll/:id/pay         — mark paid (LOCKS record)
 *   DELETE /api/payroll/:id             — delete (only Pending)
 *   GET    /api/employees               — dropdown
 *   GET    /api/attendance/employees    — attendance for preview
 */
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, CheckCircle, RefreshCw, Zap, Edit2,
  Trash2, Eye, Lock, AlertCircle, Calculator,
  TrendingUp, Filter,
} from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import {
  PageContent, PageHeader, Card, Table, Pagination, Button,
  Input, Select, Badge, Modal,
} from '@/components/ui.jsx';
import { validateGeneratePayroll } from '@/lib/validation.js';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

// ─── main page ──────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const [payroll,   setPayroll]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [ayId,      setAyId]      = useState('');
  const [ayStartDate, setAyStartDate] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalPayable: 0, totalPaid: 0 });

  // filters
  const [monthFilter,  setMonthFilter]  = useState(currentMonth);
  const [yearFilter,   setYearFilter]   = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState('');
  const [empFilter,    setEmpFilter]    = useState('');

  // modals
  const [addOpen,       setAddOpen]       = useState(false);
  const [editPayroll,   setEditPayroll]   = useState(null);
  const [viewPayroll,   setViewPayroll]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [autoGenOpen,   setAutoGenOpen]   = useState(false);
  const [filterOpen,    setFilterOpen]    = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const ay  = await api.get(API.ACADEMIC_YEARS.CURRENT);
        setAyId(ay.data?._id);
        setAyStartDate(ay.data?.startDate || ay.data?.start || null);
        const emp = await api.get(`${API.EMPLOYEES.BASE}?status=active`);
        setEmployees(emp.data || []);
      } catch {}
    })();
  }, []);

  const fetchPayroll = useCallback(async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: monthFilter, year: yearFilter, academicYear: ayId, page: String(page), limit: '20',
      });
      if (statusFilter) params.set('status',     statusFilter);
      if (empFilter)    params.set('employeeId', empFilter);
      const res = await api.get(`${API.PAYROLL.BASE}?${params}`);
      setPayroll(res.data || []);
      setTotal(res.meta?.total || 0);
      setSummary({
        totalPayable: res.meta?.totalPayable || 0,
        totalPaid: res.meta?.totalPaid || 0,
      });
    } catch {} finally { setLoading(false); }
  }, [ayId, monthFilter, yearFilter, statusFilter, empFilter, page]);

  useEffect(() => { if (ayId) fetchPayroll(); }, [fetchPayroll]);

  const handlePay = async (id) => {
    if (!(await window.confirm('Mark as Paid? This will LOCK the record — no further edits, attendance changes, or leave approvals will be allowed for this month.'))) return;
    try {
      await api.patch(API.PAYROLL.PAY(id));
      fetchPayroll();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleDelete = async (rec) => {
    try {
      await api.delete(`${API.PAYROLL.BASE}/${rec._id}`);
      fetchPayroll();
      setDeleteConfirm(null);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const monthOptions  = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
  const yearOptions   = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: y, label: String(y) }));
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Paid',    label: 'Paid' },
  ];
  const empOptions = [
    { value: '', label: 'All Employees' },
    ...employees.map(e => ({ value: e._id, label: `${e.name} (${e.employeeId})` })),
  ];

  const totalPending = summary.totalPayable - summary.totalPaid;

  const columns = [
    {
      key: 'employee', label: 'Employee',
      render: (p) => (
        <div>
          <div className="flex items-center gap-1">
            <p className="font-medium text-white">{p.employee?.name}</p>
            {p.status === 'Paid' && <Lock className="w-3 h-3 text-amber-400" title="Locked" />}
          </div>
          <p className="text-xs text-slate-500">{p.employee?.employeeId} · {p.employee?.role}</p>
        </div>
      ),
    },
    {
      key: 'basic', label: 'Basic',
      render: (p) => <span className="text-slate-300">₹{p.basicSalary?.toLocaleString()}</span>,
    },
    {
      key: 'attendance', label: 'Attendance',
      render: (p) => (
        <div className="text-xs">
          <p className="text-emerald-400">{p.daysPresent}d present</p>
          <p className="text-slate-500">{p.workingDays}d working · {p.holidays}d holiday</p>
        </div>
      ),
    },
    {
      key: 'deductions', label: 'Deductions',
      render: (p) => (
        <div className="text-xs">
          <p className="text-rose-400">-₹{p.deductions?.toLocaleString()}</p>
          {p.extraDeductions > 0 && <p className="text-rose-300">extra -₹{p.extraDeductions}</p>}
        </div>
      ),
    },
    {
      key: 'bonus', label: 'Bonus',
      render: (p) => p.bonus > 0
        ? <span className="text-sky-400 text-sm">+₹{p.bonus?.toLocaleString()}</span>
        : <span className="text-slate-600">—</span>,
    },
    {
      key: 'netSalary', label: 'Net Salary',
      render: (p) => <span className="text-white font-bold">₹{p.netSalary?.toLocaleString()}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (p) => (
        <div>
          <Badge label={p.status} color={p.status === 'Paid' ? 'green' : 'yellow'} />
          {p.paymentDate && (
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(p.paymentDate).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions', label: '',
      render: (p) => (
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant="ghost" onClick={() => setViewPayroll(p)} title="View Details">
            <Eye className="w-3 h-3" />
          </Button>
          {p.status === 'Paid' ? (
            <span title="Locked — salary disbursed">
              <Lock className="w-4 h-4 text-amber-400 opacity-60 mt-1" />
            </span>
          ) : (
            <>
              <Button size="sm" variant="success" onClick={() => handlePay(p._id)} title="Mark Paid">
                <CheckCircle className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditPayroll(p)} title="Edit">
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(p)} title="Delete">
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContent>
      <PageHeader
        title="Payroll"
        subtitle={`${MONTHS[monthFilter - 1]} ${yearFilter} · ${total} records`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => setFilterOpen(true)} className="sm:hidden">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button variant="warning" onClick={() => setAutoGenOpen(true)} className="hidden sm:inline-flex">
              <Zap className="w-4 h-4 mr-1" /> Auto-Generate All
            </Button>
            <Button onClick={() => setAddOpen(true)} className="hidden sm:inline-flex">
              <Plus className="w-4 h-4 mr-1" /> Generate
            </Button>
          </div>
        }
      />

      {/* Payroll Overview — single compact card */}
      <Card>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Payroll Overview</h3>
        <div className="flex items-center gap-6 overflow-x-auto pb-1">
          <div className="min-w-[110px] text-center">
            <div className="text-lg font-extrabold text-white">₹{summary.totalPayable.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500">Total Payable</div>
          </div>
          <div className="min-w-[110px] text-center">
            <div className="text-lg font-extrabold text-emerald-400">₹{summary.totalPaid.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500">Disbursed</div>
          </div>
          <div className="min-w-[110px] text-center">
            <div className="text-lg font-extrabold text-rose-400">₹{totalPending.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500">Pending</div>
          </div>
        </div>
      </Card>

      <div className="h-4" />

      {/* Filters */}
      <div className="hidden sm:flex flex-wrap gap-3 mb-4 items-center">
        <Select options={monthOptions}  value={monthFilter}  onChange={e => { setMonthFilter(Number(e.target.value)); setPage(1); }}  className="w-36" />
        <Select options={yearOptions}   value={yearFilter}   onChange={e => { setYearFilter(Number(e.target.value)); setPage(1); }}   className="w-28" />
        <Select options={statusOptions} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}          className="w-36" />
        <Select options={empOptions}    value={empFilter}    onChange={e => { setEmpFilter(e.target.value); setPage(1); }}             className="w-52" />
        <Button variant="ghost" onClick={fetchPayroll}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {/* Filters modal (mobile) */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" width="max-w-md">
        <div className="space-y-4">
          <Select label="Month"  value={monthFilter}  onChange={e => setMonthFilter(Number(e.target.value))} options={monthOptions} />
          <Input  label="Year"   value={yearFilter} readOnly disabled />
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} />
          <Select label="Employee" value={empFilter} onChange={e => setEmpFilter(e.target.value)} options={empOptions} />
        </div>
        <div className="mt-6 border-t border-slate-700 pt-4">
          <p className="text-xs text-slate-400 mb-2">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="warning" onClick={() => { setAutoGenOpen(true); setFilterOpen(false); }}>
              <Zap className="w-4 h-4 mr-1" /> Auto-Generate All
            </Button>
            <Button onClick={() => { setAddOpen(true); setFilterOpen(false); }}>
              <Plus className="w-4 h-4 mr-1" /> Generate
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => { setStatusFilter(''); setEmpFilter(''); setPage(1); }}>Clear</Button>
          <Button onClick={() => { setPage(1); fetchPayroll(); setFilterOpen(false); }}>Apply</Button>
        </div>
      </Modal>

      <Card className="!p-0">
        <Table columns={columns} data={payroll} loading={loading} emptyMessage="No payroll records for this period" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      {/* Modals */}
      {addOpen && (
        <GeneratePayrollModal
          employees={employees}
          ayId={ayId}
          ayStartDate={ayStartDate}
          defaultMonth={monthFilter}
          defaultYear={yearFilter}
          onClose={() => setAddOpen(false)}
          onSuccess={() => { fetchPayroll(); setAddOpen(false); }}
        />
      )}

      {editPayroll && (
        <EditPayrollModal
          payroll={editPayroll}
          onClose={() => setEditPayroll(null)}
          onSuccess={() => { fetchPayroll(); setEditPayroll(null); }}
        />
      )}

      {viewPayroll && (
        <ViewPayrollModal payroll={viewPayroll} onClose={() => setViewPayroll(null)} />
      )}

      {deleteConfirm && (
        <Modal open={true} onClose={() => setDeleteConfirm(null)} title="Delete Payroll Record">
          <div className="mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white">Delete payroll record for <span className="text-amber-400">{deleteConfirm.employee?.name}</span>?</p>
              <p className="text-slate-400 text-sm mt-1">
                {MONTHS[deleteConfirm.month - 1]} {deleteConfirm.year} · ₹{deleteConfirm.netSalary?.toLocaleString()}
              </p>
              <p className="text-slate-500 text-xs mt-2">Only pending records can be deleted. You can regenerate it later.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
          </div>
        </Modal>
      )}

      {autoGenOpen && (
        <AutoGenerateModal
          ayId={ayId}
          ayStartDate={ayStartDate}
          defaultMonth={monthFilter}
          defaultYear={yearFilter}
          employees={employees}
          onClose={() => setAutoGenOpen(false)}
          onSuccess={() => { fetchPayroll(); setAutoGenOpen(false); }}
        />
      )}
    </PageContent>
  );
}

// ─── Generate Single Payroll Modal ───────────────────────────────────────────

function GeneratePayrollModal({ employees, ayId, ayStartDate, defaultMonth, defaultYear, onClose, onSuccess }) {
  const [form, setForm] = useState({
    employee: '', month: defaultMonth, year: defaultYear,
    bonus: 0, extraDeductions: 0,
    paymentMode: 'BankTransfer', manualOverride: false,
    daysPresent: '', holidays: '', absent: '',
  });
  const [preview, setPreview] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const recomputeErrors = (next) => {
    const { errors } = validateGeneratePayroll(next);
    setErrors(errors);
  };
  const set = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      setPreview(null);
      recomputeErrors(next);
      return next;
    });
  };

  const fetchPreview = async () => {
    if (!form.employee) return alert('Select an employee first');
    setLoading(true);
    try {
      const params = new URLSearchParams({
        employeeId:      form.employee,
        month:           form.month,
        year:            form.year,
        bonus:           form.bonus,
        extraDeductions: form.extraDeductions,
        ...(form.manualOverride && form.holidays !== '' && { manualHolidays: form.holidays }),
        ...(form.manualOverride && form.daysPresent !== '' && { manualDaysPresent: form.daysPresent }),
        ...(form.manualOverride && form.absent !== '' && { manualDaysAbsent: form.absent }),
      });
      const res = await api.get(`${API.PAYROLL.BASE}/preview?${params}`);
      setPreview(res.data);
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const { valid, errors } = validateGeneratePayroll(form);
    setErrors(errors);
    if (!valid) return;
    setSaving(true);
    try {
      await api.post(API.PAYROLL.BASE, { ...form, academicYear: ayId });
      onSuccess();
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  const startMonth = ayStartDate ? new Date(ayStartDate).getMonth() + 1 : 4;
  const startYear  = ayStartDate ? new Date(ayStartDate).getFullYear() : currentYear;
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = startYear + (m < startMonth ? 1 : 0);
    return { value: m, label: `${MONTHS[m - 1]} (${y})` };
  });
  const onMonthChange = (mNum) => {
    const y = startYear + (mNum < startMonth ? 1 : 0);
    const next = { ...form, month: mNum, year: y };
    setForm(next);
    const { errors } = validateGeneratePayroll(next);
    setErrors(errors);
  };
  const modeOptions  = ['Cash', 'BankTransfer', 'Cheque'].map(m => ({ value: m, label: m }));
  const empOptions   = [
    { value: '', label: 'Select Employee' },
    ...employees.map(e => ({ value: e._id, label: `${e.name} — ₹${e.monthlySalary?.toLocaleString()}` })),
  ];
  const onNumberKeyDown = (e) => { if (['e','E','+','-','.'].includes(e.key)) e.preventDefault(); };
  const setNonNegative = (k, raw) => {
    const n = Number(raw);
    const val = Number.isFinite(n) ? Math.max(0, n) : '';
    set(k, val);
  };
  const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const setBoundedNonNegative = (k, raw) => {
    const n = Number(raw);
    const val = Number.isFinite(n) ? Math.max(0, n) : '';
    const dim = daysInMonth(form.year, form.month);
    let next = { ...form };
    if (k === 'daysPresent') {
      const holidays = Number(next.holidays || 0);
      const absent   = Number(next.absent || 0);
      const maxPresent = Math.max(0, dim - holidays - absent);
      next.daysPresent = Math.min(maxPresent, val);
    } else if (k === 'holidays') {
      const present = Number(next.daysPresent || 0);
      const absent  = Number(next.absent || 0);
      const maxHolidays = Math.max(0, dim - present - absent);
      next.holidays = Math.min(maxHolidays, val);
    } else if (k === 'absent') {
      const present = Number(next.daysPresent || 0);
      const holidays= Number(next.holidays || 0);
      const maxAbsent = Math.max(0, dim - present - holidays);
      next.absent = Math.min(maxAbsent, val);
    } else {
      next[k] = val;
    }
    setForm(next);
    recomputeErrors(next);
  };

  return (
    <Modal open={true} onClose={onClose} title="Generate Payroll" width="max-w-2xl">
      <div className="space-y-3">
        <Select label="Employee *" error={errors.employee} value={form.employee} onChange={e => set('employee', e.target.value)} options={empOptions} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Month *" error={errors.month} value={form.month} onChange={e => onMonthChange(Number(e.target.value))} options={monthOptions} />
          <Input label="Year" value={form.year} disabled readOnly />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Bonus (₹)"            type="number" onKeyDown={onNumberKeyDown} value={form.bonus}            onChange={e => setNonNegative('bonus', e.target.value)} error={errors.bonus} />
          <Input label="Extra Deductions (₹)" type="number" onKeyDown={onNumberKeyDown} value={form.extraDeductions}  onChange={e => setNonNegative('extraDeductions', e.target.value)} error={errors.extraDeductions} />
        </div>
        <Select label="Payment Mode" error={errors.paymentMode} value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)} options={modeOptions} />

        {/* Manual override */}
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" className="accent-amber-500" checked={form.manualOverride}
            onChange={e => set('manualOverride', e.target.checked)} />
          Manual override (enter attendance values directly)
        </label>

        {form.manualOverride && (
          <div className="grid grid-cols-3 gap-3 pl-2 border-l-2 border-amber-500/40">
            <Input label="Days Present" type="number" onKeyDown={onNumberKeyDown} value={form.daysPresent} onChange={e => setBoundedNonNegative('daysPresent', e.target.value)} />
            <Input label="Holidays (paid)" type="number" onKeyDown={onNumberKeyDown} value={form.holidays} onChange={e => setBoundedNonNegative('holidays', e.target.value)} />
            <Input label="Absent (unpaid)" type="number" onKeyDown={onNumberKeyDown} value={form.absent} onChange={e => setBoundedNonNegative('absent', e.target.value)} />
          </div>
        )}
      </div>

      {/* Preview panel */}
      <div className="mt-4">
        <Button variant="ghost" onClick={fetchPreview} disabled={loading}>
          <Calculator className="w-4 h-4 mr-1" /> {loading ? 'Loading...' : 'Preview Salary'}
        </Button>
      </div>

      {(form.manualOverride
        ? (() => {
            const emp = employees.find(e => e._id === form.employee);
            const salary = Number(emp?.monthlySalary || 0);
            const dim = daysInMonth(form.year, form.month);
            const holidays = Number(form.holidays || 0);
            const absent   = Number(form.absent || 0);
            const perDay   = dim > 0 ? salary / dim : 0; // paid holidays included
            const present  = Number(form.daysPresent || 0);
            const payableDays = Math.max(0, dim - absent); // present + holidays - absent = total - absent
            const earned  = Math.round(perDay * payableDays * 100) / 100;
            const bonus   = Number(form.bonus || 0);
            const extra   = Number(form.extraDeductions || 0);
            const net     = Math.max(0, Math.round((earned + bonus - extra) * 100) / 100);
            const localPreview = {
              totalDays: dim,
              holidays,
              workingDays: dim, // display as calendar days
              perDay,
              effectivePresentDays: present,
              daysAbsent: absent,
              payableDays,
              earned,
              bonus,
              extraDeductions: extra,
              netSalary: net,
            };
            return <SalaryPreviewCard preview={localPreview} />;
          })()
        : (preview && <SalaryPreviewCard preview={preview} />))}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Generating...' : 'Generate'}</Button>
      </div>
    </Modal>
  );
}

// ─── Edit Payroll Modal ──────────────────────────────────────────────────────

function EditPayrollModal({ payroll: rec, onClose, onSuccess }) {
  const [form, setForm] = useState({
    daysPresent:     rec.daysPresent,
    holidays:        rec.holidays,
    bonus:           rec.bonus,
    extraDeductions: rec.extraDeductions,
    paymentMode:     rec.paymentMode,
    notes:           rec.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Live calculation preview
  const workingDays = Math.max(1, rec.totalDays - Number(form.holidays || 0));
  const perDay      = rec.basicSalary / workingDays;
  const earned      = Math.round(perDay * Number(form.daysPresent || 0) * 100) / 100;
  const net         = Math.round((earned + Number(form.bonus || 0)) * 100) / 100;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.put(`${API.PAYROLL.BASE}/${rec._id}`, form);
      onSuccess();
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  const modeOptions = ['Cash', 'BankTransfer', 'Cheque'].map(m => ({ value: m, label: m }));

  return (
    <Modal open={true} onClose={onClose} title="Edit Payroll">
      <div className="mb-3 p-3 bg-slate-800 rounded-lg text-sm">
        <p className="text-white font-medium">{rec.employee?.name}</p>
        <p className="text-slate-400">{MONTHS[rec.month - 1]} {rec.year} · Basic: ₹{rec.basicSalary?.toLocaleString()} · Total Days: {rec.totalDays}</p>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Holidays"     type="number" value={form.holidays}        onChange={e => set('holidays', e.target.value)} />
          <Input label="Days Present" type="number" value={form.daysPresent}     onChange={e => set('daysPresent', e.target.value)} />
          <Input label="Bonus (₹)"   type="number" value={form.bonus}           onChange={e => set('bonus', e.target.value)} />
          <Input label="Extra Deductions (₹)" type="number" value={form.extraDeductions} onChange={e => set('extraDeductions', e.target.value)} />
        </div>
        <Select label="Payment Mode" value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)} options={modeOptions} />
        <Input label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />

        {/* Live preview */}
        <div className="bg-slate-800 rounded-lg p-3 text-sm space-y-1">
          <p className="text-slate-500 text-xs mb-2">Live Calculation</p>
          <div className="flex justify-between"><span className="text-slate-400">Working Days</span><span className="text-white">{workingDays}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Per Day Rate</span><span className="text-white">₹{perDay.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Earned ({form.daysPresent}d)</span><span className="text-white">₹{earned.toLocaleString()}</span></div>
          <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="text-slate-300 font-medium">Net Salary</span>
            <span className="text-amber-400 font-bold text-base">₹{net.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </Modal>
  );
}

// ─── Auto Generate All Modal ─────────────────────────────────────────────────

function AutoGenerateModal({ ayId, ayStartDate, defaultMonth, defaultYear, employees, onClose, onSuccess }) {
  const [form, setForm] = useState({
    month:       defaultMonth,
    year:        defaultYear,
    paymentMode: 'BankTransfer',
  });
  const [preview, setPreview] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setPreview(null); };

  const fetchPreview = async () => {
    try {
      const res = await api.post(`${API.PAYROLL.BASE}/generate-all`, {
        ...form, academicYear: ayId, preview: true,
      });
      setPreview(res.data);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleGenerate = async () => {
    if (!(await window.confirm(`Generate payroll for ${MONTHS[form.month - 1]} ${form.year} for all active employees?`))) return;
    setSaving(true);
    try {
      const res = await api.post(`${API.PAYROLL.BASE}/generate-all`, { ...form, academicYear: ayId });
      alert(`Generated: ${res.data?.created ?? 0} · Skipped: ${res.data?.skipped ?? 0}`);
      onSuccess();
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setSaving(false); }
  };

  const startMonth = ayStartDate ? new Date(ayStartDate).getMonth() + 1 : 4;
  const startYear  = ayStartDate ? new Date(ayStartDate).getFullYear() : currentYear;
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = startYear + (m < startMonth ? 1 : 0);
    return { value: m, label: `${MONTHS[m - 1]} (${y})` };
  });
  const onMonthChange = (mNum) => {
    const y = startYear + (mNum < startMonth ? 1 : 0);
    setForm(f => ({ ...f, month: mNum, year: y }));
  };
  const modeOptions  = ['Cash', 'BankTransfer', 'Cheque'].map(m => ({ value: m, label: m }));

  return (
    <Modal open={true} onClose={onClose} title="Auto-Generate Payroll for All Employees" width="max-w-2xl">
      <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 flex gap-2">
        <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Generates payroll for all active employees based on their attendance records. Existing records are skipped.</span>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Month *" value={form.month} onChange={e => onMonthChange(Number(e.target.value))} options={monthOptions} />
          <Input label="Year" value={form.year} disabled readOnly />
        </div>
        <Select label="Default Payment Mode" value={form.paymentMode}
          onChange={e => set('paymentMode', e.target.value)} options={modeOptions} />
      </div>

      {preview && (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg text-sm">
          <p className="text-slate-400 mb-2 font-medium">Preview — {preview.toCreate} to create, {preview.skipped} to skip</p>
          <div className="max-h-52 overflow-y-auto space-y-2">
            {preview.previews?.map(p => (
              <div key={p.employee?._id} className="flex items-center justify-between py-1 border-b border-slate-700">
                <div>
                  <span className="text-white text-sm">{p.employee?.name}</span>
                  <span className="text-slate-500 text-xs ml-2">{p.daysPresent}d / {p.workingDays}d</span>
                </div>
                <span className="text-amber-400 font-semibold text-sm">₹{p.netSalary?.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between">
            <span className="text-slate-400">Total Payable</span>
            <span className="text-amber-400 font-bold">
              ₹{preview.previews?.reduce((s, p) => s + (p.netSalary || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Button variant="ghost" onClick={fetchPreview}>
          <TrendingUp className="w-4 h-4 mr-1" /> Preview
        </Button>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleGenerate} disabled={saving}>
          {saving ? 'Generating...' : 'Generate All'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── View Payroll Detail Modal ───────────────────────────────────────────────

function ViewPayrollModal({ payroll: p, onClose }) {
  const rows = [
    ['Employee',        `${p.employee?.name} (${p.employee?.employeeId})`],
    ['Role',             p.employee?.role],
    ['Period',          `${MONTHS[p.month - 1]} ${p.year}`],
    ['Basic Salary',    `₹${p.basicSalary?.toLocaleString()}`],
    ['Total Days',       p.totalDays],
    ['Holidays',         p.holidays],
    ['Working Days',     p.workingDays],
    ['Per Day Rate',    `₹${p.perDaySalary?.toFixed(2)}`],
    ['Days Present',     p.daysPresent],
    ['Days Absent',      p.daysAbsent],
    ['Days Late',        p.daysLate],
    ['Days Half-Day',    p.daysHalfDay],
    ['Days On Leave',    p.daysOnLeave],
    ['Earned Amount',   `₹${p.earnedAmount?.toLocaleString()}`],
    ['Bonus',           `₹${p.bonus?.toLocaleString()}`],
    ['Deductions',      `-₹${p.deductions?.toLocaleString()}`],
    ['Extra Deductions',`-₹${p.extraDeductions?.toLocaleString()}`],
    ['Net Salary',      `₹${p.netSalary?.toLocaleString()}`],
    ['Payment Mode',     p.paymentMode],
    ['Status',           p.status],
    ...(p.paymentDate ? [['Payment Date', new Date(p.paymentDate).toLocaleDateString('en-IN')]] : []),
    ...(p.paidBy      ? [['Paid By',      p.paidBy?.name]] : []),
    ...(p.notes       ? [['Notes',        p.notes]] : []),
    ...(p.manualOverride ? [['Override', 'Manual values used']] : []),
  ];

  return (
    <Modal open={true} onClose={onClose} title="Payroll Details">
      {p.status === 'Paid' && (
        <div className="mb-4 flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
          <Lock className="w-4 h-4" /> This record is locked — salary has been disbursed
        </div>
      )}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {rows.map(([label, val]) => (
          <div key={label} className="flex gap-3 py-1.5 border-b border-slate-800">
            <span className="text-slate-500 text-sm w-40 flex-shrink-0">{label}</span>
            <span className={`text-sm ${
              label === 'Net Salary' ? 'text-amber-400 font-bold text-base'
              : label === 'Status' && val === 'Paid' ? 'text-emerald-400 font-semibold'
              : 'text-white'
            }`}>{String(val ?? '—')}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

// ─── Salary Preview Card ─────────────────────────────────────────────────────

function SalaryPreviewCard({ preview: p }) {
  return (
    <div className="mt-4 p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-sm space-y-1.5">
      <p className="text-slate-400 text-xs font-medium mb-2">Salary Preview</p>
      {[
        ['Total Days in Month', p.totalDays],
        ['Holidays (paid)',     p.holidays],
        ['Absent (unpaid)',     p.daysAbsent ?? 0],
        ['Payable Days',        p.payableDays ?? Math.max(0, (p.totalDays || 0) - (p.daysAbsent || 0))],
        ['Per Day Rate',       `₹${p.perDay?.toFixed(2)}`],
        ['Days Present',        p.effectivePresentDays],
        ['Earned',             `₹${p.earned?.toLocaleString()}`],
        ['Bonus',              `+₹${p.bonus}`],
        ['Extra Deductions',   `-₹${p.extraDeductions}`],
      ].map(([l, v]) => (
        <div key={l} className="flex justify-between">
          <span className="text-slate-500">{l}</span>
          <span className="text-white">{v}</span>
        </div>
      ))}
      <div className="flex justify-between pt-1.5 mt-1 border-t border-slate-600">
        <span className="text-slate-300 font-semibold">Net Salary</span>
        <span className="text-amber-400 font-bold text-base">₹{p.netSalary?.toLocaleString()}</span>
      </div>
    </div>
  );
}