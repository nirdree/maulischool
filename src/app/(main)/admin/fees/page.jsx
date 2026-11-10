// pages/admin/Fees.jsx
/**
 * FEES PAGE (Admin) — Full Featured
 * APIs Used:
 *   GET    /api/fees                     — list fees
 *   POST   /api/fees                     — generate fee record
 *   PUT    /api/fees/:id                 — edit fee record
 *   DELETE /api/fees/:id                 — delete fee record
 *   POST   /api/fees/:id/pay             — collect payment (single)
 *   POST   /api/fees/pay-multiple        — pay multiple months at once
 *   GET    /api/fees/:id/payments        — payment history
 *   GET    /api/fees/receipts/all        — all receipts
 *   GET    /api/fees/receipts/:id        — printable receipt PDF
 *   POST   /api/fees/generate-auto       — auto-generate for all students
 *   GET    /api/classrooms               — dropdown
 *   GET    /api/students                 — dropdown / search
 *   GET    /api/academic-years/current   — current AY
 */
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, DollarSign, RefreshCw, Eye, Trash2, Edit2,
  Zap, CreditCard, Search, X, ChevronDown, CheckSquare,
  Square, Calendar, FileText, AlertCircle, Filter,
  Printer, MoreVertical,
} from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import {
  PageContent, PageHeader, Card, Table, Pagination, Button, Input,
  Select, feeStatusBadge, Modal,
} from '@/components/ui.jsx';

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthName  = (m) => SHORT_MONTHS[(m ?? 1) - 1] ?? m;
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-based

async function openFeeReceipt(receiptId) {
  const pdf = await api.get(API.FEES.RECEIPT(receiptId), { responseType: 'blob' });
  const url = URL.createObjectURL(pdf);
  const opened = window.open(url, '_blank');
  if (opened) opened.opener = null;
  if (!opened) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fee-receipt.pdf';
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Build month options starting from AY start month */
function buildMonthOptions(ayStartDate, includeAll = true) {
  const start = ayStartDate ? new Date(ayStartDate).getMonth() + 1 : 4; // default April
  const ordered = [];
  for (let i = 0; i < 12; i++) {
    const m = ((start - 1 + i) % 12) + 1;
    ordered.push({ value: m, label: MONTH_NAMES[m - 1] });
  }
  return includeAll ? [{ value: '', label: 'All Months' }, ...ordered] : ordered;
}

// ─── main component ─────────────────────────────────────────────────────────

export default function FeesPage() {
  const [fees, setFees]           = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [ayId, setAyId]           = useState('');
  const [ayStartDate, setAyStartDate] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ pendingCount: 0, overdueCount: 0, totalOutstanding: 0 });

  // filters
  const [classFilter, setClassFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter]   = useState('');
  const [yearFilter, setYearFilter]     = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const searchRef = useRef('');

  // modal state
  const [addOpen, setAddOpen]           = useState(false);
  const [editFee, setEditFee]           = useState(null);
  const [payFee, setPayFee]             = useState(null);
  const [multiPayStudent, setMultiPayStudent] = useState(null);
  const [viewMonths, setViewMonths] = useState(null);
  const [viewPayments, setViewPayments] = useState(null);
  const [allYearsStudent, setAllYearsStudent] = useState(null);
  const [studentFeesRefresh, setStudentFeesRefresh] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [autoGenOpen, setAutoGenOpen]   = useState(false);
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // selection for bulk actions
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const ay  = await api.get(API.ACADEMIC_YEARS.CURRENT);
        setAyId(ay.data?._id);
        setAyStartDate(ay.data?.startDate);
        const cls = await api.get(`${API.CLASSROOMS.BASE}?isActive=true&academicYear=${ay.data?._id}`);
        setClassrooms(cls.data || []);
      } catch {}
    })();
  }, []);

  const fetchFees = useCallback(async () => {
    if (!ayId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYear: ayId, page: String(page), limit: '20', groupByStudent: 'true' });
      if (classFilter)   params.set('classId', classFilter);
      if (statusFilter)  params.set('status', statusFilter);
      if (monthFilter)   params.set('month', monthFilter);
      if (yearFilter)    params.set('year', yearFilter);
      if (searchRef.current) params.set('search', searchRef.current);
      const res = await api.get(`${API.FEES.BASE}?${params}`);
      setFees(res.data || []);
      setTotal(res.meta?.total || 0);
      setSummary({
        pendingCount: res.meta?.pendingCount || 0,
        overdueCount: res.meta?.overdueCount || 0,
        totalOutstanding: res.meta?.totalOutstanding || 0,
      });
      setSelected([]);
    } catch {} finally { setLoading(false); }
  }, [ayId, classFilter, statusFilter, monthFilter, yearFilter, page]);

  useEffect(() => { if (ayId) fetchFees(); }, [ayId, fetchFees]);


  // debounced student search
  const searchTimer = useRef(null);
  const handleSearchChange = (val) => {
    setStudentSearch(val);
    searchRef.current = val;
    setPage(1);
    clearTimeout(searchTimer.current);
    if (page === 1) {
      searchTimer.current = setTimeout(() => fetchFees(), 400);
    }
  };

  const monthOptions = buildMonthOptions(ayStartDate, true);

  const classOptions = [
    { value: '', label: 'All Classes' },
    ...classrooms.map(c => ({ value: c._id, label: c.displayName })),
  ];
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Pending',       label: 'Pending' },
    { value: 'Paid',          label: 'Paid' },
    { value: 'Overdue',       label: 'Overdue' },
    { value: 'PartiallyPaid', label: 'Partially Paid' },
    { value: 'Waived',        label: 'Waived' },
  ];
  const yearOptions = [
    { value: '', label: 'All Years' },
    { value: currentYear - 1, label: String(currentYear - 1) },
    { value: currentYear,     label: String(currentYear) },
    { value: currentYear + 1, label: String(currentYear + 1) },
  ];

  const visibleFeeIds = fees.flatMap(group => group.records.map(fee => fee._id));

  // bulk select helpers
  const toggleAll = () =>
    setSelected(s => visibleFeeIds.every(id => s.includes(id))
      ? s.filter(id => !visibleFeeIds.includes(id))
      : [...new Set([...s, ...visibleFeeIds])]);
  const toggleGroup = (group) => {
    const ids = group.records.map(fee => fee._id);
    setSelected(current => ids.every(id => current.includes(id))
      ? current.filter(id => !ids.includes(id))
      : [...new Set([...current, ...ids])]);
  };

  const handleDelete = async (fee) => {
    try {
      await api.delete(`${API.FEES.BASE}/${fee._id}`);
      fetchFees();
      setDeleteConfirm(null);
    } catch (err) { alert(err.message); }
  };

  const handleBulkDelete = async () => {
    if (!(await window.confirm(`Delete ${selected.length} fee records?`))) return;
    try {
      await Promise.all(selected.map(id => api.delete(`${API.FEES.BASE}/${id}`)));
      fetchFees();
    } catch (err) { alert(err.message); }
  };

  const columns = [
    {
      key: 'select', label: (
        <button onClick={toggleAll} className="text-slate-400 hover:text-white">
          {visibleFeeIds.length > 0 && visibleFeeIds.every(id => selected.includes(id))
            ? <CheckSquare className="w-4 h-4 text-amber-400" />
            : <Square className="w-4 h-4" />}
        </button>
      ),
      render: (group) => (
        <button onClick={() => toggleGroup(group)} className="text-slate-400 hover:text-white">
          {group.records.every(fee => selected.includes(fee._id))
            ? <CheckSquare className="w-4 h-4 text-amber-400" />
            : <Square className="w-4 h-4" />}
        </button>
      ),
    },
    {
      key: 'student', label: 'Student',
      render: (group) => (
        <button
          className="text-left"
          onClick={() => setAllYearsStudent(group.student)}
          title="View this student's fees across academic years"
        >
          <p className="font-medium text-indigo-300 hover:text-indigo-200">
            {group.student?.firstName} {group.student?.lastName}
          </p>
          <p className="text-xs text-slate-500">{group.student?.admissionNo}</p>
        </button>
      ),
    },
    { key: 'classroom', label: 'Class', render: (group) => group.classroom?.displayName || '—' },
    {
      key: 'period', label: 'Fee Months',
      render: (group) => (
        <button className="text-left text-indigo-300 hover:text-indigo-200"
          onClick={() => setViewMonths(group)}>
          {group.records.length} month{group.records.length === 1 ? '' : 's'} · View
        </button>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: (group) => {
        const total = group.records.reduce((sum, fee) => sum + Number(fee.finalAmount || 0), 0);
        const outstanding = group.records.reduce((sum, fee) => sum + Number(fee.outstandingAmount || 0), 0);
        return (
        <div>
          <span className="text-white font-semibold">₹{total.toLocaleString('en-IN')}</span>
          <p className="text-xs text-amber-400">Due ₹{outstanding.toLocaleString('en-IN')}</p>
        </div>
        );
      },
    },
    {
      key: 'status', label: 'Status',
      render: (group) => {
        const outstanding = group.records.filter(fee => fee.outstandingAmount > 0 && fee.status !== 'Waived').length;
        return <span className="text-sm text-slate-300">{outstanding ? `${outstanding} due` : 'All cleared'}</span>;
      },
    },
    {
      key: 'actions', label: '',
      render: (group) => (
        <FeeGroupActions
          onView={() => setViewMonths(group)}
          onPayMultiple={() => setMultiPayStudent(group.student)}
          hasOutstanding={group.records.some(fee => fee.outstandingAmount > 0 && fee.status !== 'Waived')}
        />
      ),
    },
  ];

  return (
    <PageContent>
      <PageHeader
        title="Fees"
        subtitle={`${total} students · ${summary.pendingCount} pending months · ${summary.overdueCount} overdue months`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => setFilterOpen(true)} className="sm:hidden">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button variant="ghost" onClick={() => setReceiptsOpen(true)} className="hidden sm:inline-flex">
              <FileText className="w-4 h-4 mr-1" /> Receipts
            </Button>
            <Button variant="warning" onClick={() => setAutoGenOpen(true)} className="hidden sm:inline-flex">
              <Zap className="w-4 h-4 mr-1" /> Auto-Generate
            </Button>
            <Button onClick={() => setAddOpen(true)} className="hidden sm:inline-flex">
              <Plus className="w-4 h-4 mr-1" /> Generate Fee
            </Button>
          </div>
        }
      />

      {/* Fees Overview — single compact card */}
      <Card>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Fees Overview</h3>
        <div className="flex items-center gap-6 overflow-x-auto pb-1">
          <div className="min-w-[90px] text-center">
            <div className="text-lg font-extrabold text-amber-400">₹{summary.totalOutstanding.toLocaleString()}</div>
            <div className="text-[11px] text-slate-500">Outstanding</div>
          </div>
          <div className="min-w-[80px] text-center">
            <div className="text-lg font-extrabold text-rose-400">{summary.overdueCount}</div>
            <div className="text-[11px] text-slate-500">Overdue</div>
          </div>
          <div className="min-w-[80px] text-center">
            <div className="text-lg font-extrabold text-sky-400">{summary.pendingCount}</div>
            <div className="text-[11px] text-slate-500">Pending</div>
          </div>
        </div>
      </Card>

      <div className="h-4" />

      {/* Filters */}
      <div className="hidden sm:flex flex-wrap gap-3 mb-4 items-center">
        {/* Student search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-52"
            placeholder="Search student..."
            value={studentSearch}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {studentSearch && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              onClick={() => handleSearchChange('')}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <Select options={classOptions}  value={classFilter}  onChange={e => { setClassFilter(e.target.value); setPage(1); }}  className="w-44" />
        <Select options={statusOptions} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="w-40" />
        <Select options={monthOptions}  value={monthFilter}  onChange={e => { setMonthFilter(e.target.value); setPage(1); }}  className="w-36" />
        <Select options={yearOptions}   value={yearFilter}   onChange={e => { setYearFilter(e.target.value); setPage(1); }}   className="w-32" />
        <Button variant="ghost" onClick={fetchFees}><RefreshCw className="w-4 h-4" /></Button>
        {selected.length > 0 && (
          <Button variant="danger" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete ({selected.length})
          </Button>
        )}
      </div>

      {/* Filters modal (mobile) */}
      <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" width="max-w-md">
        <div className="space-y-4">
          <Input label="Search" value={studentSearch} onChange={e => handleSearchChange(e.target.value)} placeholder="Search student..." />
          <Select label="Class"  value={classFilter}   onChange={e => setClassFilter(e.target.value)} options={classOptions} />
          <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} />
          <Select label="Month"  value={monthFilter}  onChange={e => setMonthFilter(e.target.value)} options={monthOptions} />
          <Select label="Year"   value={yearFilter}   onChange={e => setYearFilter(e.target.value)} options={yearOptions} />
          <div className="pt-4 mt-2 border-t border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Quick actions</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => { setReceiptsOpen(true); setFilterOpen(false); }}>
                <FileText className="w-4 h-4 mr-1" /> Receipts
              </Button>
              <Button variant="warning" onClick={() => { setAutoGenOpen(true); setFilterOpen(false); }}>
                <Zap className="w-4 h-4 mr-1" /> Auto-Generate
              </Button>
              <Button onClick={() => { setAddOpen(true); setFilterOpen(false); }}>
                <Plus className="w-4 h-4 mr-1" /> Generate Fee
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => { setStudentSearch(''); searchRef.current=''; setClassFilter(''); setStatusFilter(''); setMonthFilter(''); setYearFilter(''); setPage(1); }}>Clear</Button>
          <Button onClick={() => { setPage(1); fetchFees(); setFilterOpen(false); }}>Apply</Button>
        </div>
      </Modal>

      <Card className="!p-0">
        <Table columns={columns} data={fees} loading={loading} emptyMessage="No fee records found" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      {/* Modals */}
      {addOpen && (
        <GenerateFeeModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          classrooms={classrooms}
          ayId={ayId}
          ayStartDate={ayStartDate}
          onSuccess={() => { fetchFees(); setAddOpen(false); }}
        />
      )}

      {editFee && (
        <EditFeeModal
          fee={editFee}
          onClose={() => setEditFee(null)}
          onSuccess={() => { fetchFees(); setEditFee(null); }}
        />
      )}

      {allYearsStudent && (
        <AllYearsStudentFeesModal
          key={allYearsStudent._id}
          student={allYearsStudent}
          refreshKey={studentFeesRefresh}
          onClose={() => setAllYearsStudent(null)}
          onCollect={fee => setPayFee(fee)}
          onHistory={fee => setViewPayments(fee)}
        />
      )}

      {payFee && (
        <CollectPaymentModal
          fee={payFee}
          onClose={() => setPayFee(null)}
          onSuccess={() => {
            fetchFees();
            setStudentFeesRefresh(value => value + 1);
            setPayFee(null);
          }}
        />
      )}

      {viewMonths && (
        <FeeMonthsModal
          group={viewMonths}
          onClose={() => setViewMonths(null)}
          onCollect={fee => { setViewMonths(null); setPayFee(fee); }}
          onHistory={fee => { setViewMonths(null); setViewPayments(fee); }}
          onEdit={fee => { setViewMonths(null); setEditFee(fee); }}
          onDelete={fee => { setViewMonths(null); setDeleteConfirm(fee); }}
        />
      )}

      {multiPayStudent && (
        <MultiMonthPayModal
          student={multiPayStudent}
          ayId={ayId}
          ayStartDate={ayStartDate}
          onClose={() => setMultiPayStudent(null)}
          onSuccess={fetchFees}
        />
      )}

      {viewPayments && (
        <PaymentHistoryModal
          fee={viewPayments}
          onClose={() => setViewPayments(null)}
        />
      )}

      {deleteConfirm && (
        <Modal open={true} onClose={() => setDeleteConfirm(null)} title="Delete Fee Record">
          <div className="mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white">Are you sure you want to delete this fee record?</p>
              <p className="text-slate-400 text-sm mt-1">
                {deleteConfirm.student?.firstName} {deleteConfirm.student?.lastName} —{' '}
                {monthName(deleteConfirm.month)} {deleteConfirm.year}
              </p>
              <p className="text-red-400 text-xs mt-2">This action cannot be undone. The record can be recreated manually.</p>
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
          classrooms={classrooms}
          ayId={ayId}
          ayStartDate={ayStartDate}
          onClose={() => setAutoGenOpen(false)}
          onSuccess={() => { fetchFees(); setAutoGenOpen(false); }}
        />
      )}

      {receiptsOpen && (
        <AllReceiptsModal
          ayId={ayId}
          onClose={() => setReceiptsOpen(false)}
        />
      )}
    </PageContent>
  );
}

function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = event => {
      if (!ref.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    const closeMenu = () => setOpen(false);
    document.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, []);

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    const menuHeight = items.length * 40 + 8;
    const top = bounds.bottom + 8 + menuHeight > window.innerHeight
      ? Math.max(8, bounds.top - menuHeight - 8)
      : bounds.bottom + 8;
    setPosition({ top, left: Math.max(8, bounds.right - 210) });
    setOpen(true);
  };

  return (
    <div className="relative" ref={ref}>
      <Button size="sm" variant="ghost" title="Actions" aria-label="Actions" onClick={toggleMenu}>
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open && position && createPortal(
        <div ref={menuRef}
          style={{ position: 'fixed', top: position.top, left: position.left, width: 210 }}
          className="z-[100] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg">
          {items.map(item => (
            <button key={item.label} type="button"
              onClick={() => { setOpen(false); item.onClick(); }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-slate-800 ${item.danger ? 'text-rose-300' : 'text-slate-200'}`}>
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

function FeeGroupActions({ onView, onPayMultiple, hasOutstanding }) {
  const items = [
    { label: 'View monthly fee records', icon: Calendar, onClick: onView },
    ...(hasOutstanding
      ? [{ label: 'Pay multiple months', icon: CreditCard, onClick: onPayMultiple }]
      : []),
  ];
  return <ActionMenu items={items} />;
}

function AllYearsStudentFeesModal({ student, refreshKey, onClose, onCollect, onHistory }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get(API.STUDENTS.FEES(student._id))
      .then(response => {
        if (!cancelled) {
          setError('');
          setFees(response.data?.fees || []);
        }
      })
      .catch(requestError => {
        if (!cancelled) setError(requestError?.response?.data?.message || requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [student._id, refreshKey]);

  const groups = Object.values(fees.reduce((result, fee) => {
    const yearId = fee.academicYear?._id || fee.academicYear || 'unknown-year';
    const classroomId = fee.classroom?._id || fee.classroom || 'unknown-class';
    const key = `${yearId}-${classroomId}`;
    if (!result[key]) {
      result[key] = { key, year: fee.academicYear, classroom: fee.classroom, fees: [] };
    }
    result[key].fees.push(fee);
    return result;
  }, {})).sort((a, b) => (
    new Date(b.year?.startDate || 0) - new Date(a.year?.startDate || 0)
    || String(a.classroom?.displayName || '').localeCompare(String(b.classroom?.displayName || ''))
  ));

  return (
    <Modal
      open
      onClose={onClose}
      title={`All academic-year fees — ${student.firstName || ''} ${student.lastName || ''}`}
      width="max-w-4xl"
    >
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 rounded-lg bg-slate-800 p-3 text-sm text-slate-300">
        <span>Admission no. <strong className="text-white">{student.admissionNo || '—'}</strong></span>
        <span>Fees are grouped by academic year and class.</span>
      </div>
      {loading ? (
        <div className="py-10 text-center text-slate-400">Loading fee history...</div>
      ) : error ? (
        <div className="py-6 text-center text-red-400">{error}</div>
      ) : groups.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No fee records found for this student.</div>
      ) : (
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {groups.map(group => {
            const total = group.fees.reduce((sum, fee) => sum + Number(fee.finalAmount || 0), 0);
            const paid = group.fees.reduce((sum, fee) => sum + Number(fee.amountPaid || 0), 0);
            const due = group.fees.reduce((sum, fee) => sum + Number(fee.outstandingAmount || 0), 0);
            return (
              <section key={group.key} className="overflow-hidden rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/70 px-4 py-3">
                  <div>
                    <h3 className="font-semibold text-white">
                      {group.year?.name || 'Academic year unavailable'} · {group.classroom?.displayName || 'Class unavailable'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Total ₹{total.toLocaleString('en-IN')} · Paid ₹{paid.toLocaleString('en-IN')} · Balance ₹{due.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-slate-800">
                  {[...group.fees].sort((a, b) => a.year - b.year || a.month - b.month).map(fee => (
                    <div key={fee._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{monthName(fee.month)} {fee.year}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Fee ₹{Number(fee.finalAmount || 0).toLocaleString('en-IN')}
                          {' · '}Paid ₹{Number(fee.amountPaid || 0).toLocaleString('en-IN')}
                          {' · '}Due ₹{Number(fee.outstandingAmount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {feeStatusBadge(fee.status)}
                        {fee.outstandingAmount > 0 && fee.status !== 'Waived' && (
                          <Button size="sm" onClick={() => onCollect(fee)}>
                            <DollarSign className="mr-1 h-4 w-4" /> Collect
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onHistory(fee)}
                          title="Payment history"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

function FeeMonthsModal({ group, onClose, onCollect, onHistory, onEdit, onDelete }) {
  const records = [...group.records].sort((a, b) => (
    a.year - b.year || a.month - b.month
  ));

  return (
    <Modal open onClose={onClose}
      title={`Monthly fees — ${group.student?.firstName || ''} ${group.student?.lastName || ''}`}
      width="max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800 p-3 text-sm">
        <span className="text-slate-300">Admission no. <strong className="text-white">{group.student?.admissionNo || '—'}</strong></span>
        <span className="text-slate-300">Class <strong className="text-white">{group.classroom?.displayName || '—'}</strong></span>
        <span className="text-slate-300">Total outstanding <strong className="text-amber-400">
          ₹{records.reduce((sum, fee) => sum + Number(fee.outstandingAmount || 0), 0).toLocaleString('en-IN')}
        </strong></span>
      </div>

      <div className="space-y-2">
        {records.map(fee => (
          <div key={fee._id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="min-w-0">
              <p className="font-medium text-white">{monthName(fee.month)} {fee.year}</p>
              <p className="mt-1 text-xs text-slate-400">
                Fee ₹{Number(fee.finalAmount || 0).toLocaleString('en-IN')}
                {' · '}Paid ₹{Number(fee.amountPaid || 0).toLocaleString('en-IN')}
                {' · '}Due ₹{Number(fee.outstandingAmount || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {feeStatusBadge(fee.status)}
              <ActionMenu items={[
                ...(fee.outstandingAmount > 0 && fee.status !== 'Waived'
                  ? [{ label: 'Collect payment', icon: DollarSign, onClick: () => onCollect(fee) }]
                  : []),
                { label: 'Payment history / print receipt', icon: Printer, onClick: () => onHistory(fee) },
                { label: 'Edit fee record', icon: Edit2, onClick: () => onEdit(fee) },
                { label: 'Delete fee record', icon: Trash2, onClick: () => onDelete(fee), danger: true },
              ]} />
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No fee records found.</p>}
      </div>
    </Modal>
  );
}

// ─── Generate Fee Modal ──────────────────────────────────────────────────────

function GenerateFeeModal({ open, onClose, classrooms, ayId, ayStartDate, onSuccess }) {
  const [form, setForm] = useState({
    student: '', classroom: '', month: '', year: currentYear,
    tuitionFee: '', transportFee: 0, activityFee: 0,
    otherFee: 0, discount: 0, dueDate: '',
  });
  const [students, setStudents]   = useState([]);
  const [saving, setSaving]       = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [errors, setErrors]       = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const startMonth = ayStartDate ? new Date(ayStartDate).getMonth() + 1 : 4;
  const startYear  = ayStartDate ? new Date(ayStartDate).getFullYear() : currentYear;
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = startYear + (m < startMonth ? 1 : 0);
    return { value: String(m), label: `${MONTH_NAMES[m - 1]} (${y})` };
  });

  const onMonthChange = (mStr) => {
    const m = Number(mStr);
    const y = startYear + (m < startMonth ? 1 : 0);
    setForm(f => ({ ...f, month: mStr, year: y }));
  };

  const handleClassChange = async (classId) => {
    set('classroom', classId);
    set('student', '');
    setStudents([]);
    if (classId) {
      const cls = classrooms.find(c => c._id === classId);
      if (cls) set('tuitionFee', cls.monthlyFees);
      try {
        const res = await api.get(`${API.STUDENTS.BASE}?classId=${classId}&status=Approved&academicYear=${ayId}&limit=100`);
        setStudents(res.data || []);
      } catch {}
    }
  };

  const searchStudents = async (q) => {
    setStudentSearch(q);
    if (!q) { if (form.classroom) handleClassChange(form.classroom); return; }
    try {
      const res = await api.get(`${API.STUDENTS.BASE}?search=${q}&status=Approved&academicYear=${ayId}&limit=50`);
      setStudents(res.data || []);
    } catch {}
  };

  const handleSubmit = async () => {
    const { validateGenerateFee } = await import('@/lib/validation.js');
    const v = validateGenerateFee(form);
    setErrors(v.errors);
    if (!v.valid) return;
    setSaving(true);
    try {
      await api.post(API.FEES.BASE, { ...form, academicYear: ayId });
      onSuccess();
    } catch (err) { alert(err?.response?.data?.message || err.message); } finally { setSaving(false); }
  };

  const blockInvalidKeys = (e) => {
    const invalid = ['e','E','+','-','.'];
    if (invalid.includes(e.key)) e.preventDefault();
  };

  const total = (Number(form.tuitionFee) || 0)
    + (Number(form.transportFee) || 0)
    + (Number(form.activityFee) || 0)
    + (Number(form.otherFee) || 0)
    - (Number(form.discount) || 0);

  return (
    <Modal open={open} onClose={onClose} title="Generate Fee Record">
      <div className="space-y-3">
        <Select label="Class *" value={form.classroom}
          onChange={e => { handleClassChange(e.target.value); if (errors.classroom) setErrors(prev => ({ ...prev, classroom: undefined })); }}
          options={[{ value: '', label: 'Select Class' }, ...classrooms.map(c => ({ value: c._id, label: c.displayName }))]} error={errors.classroom} />

        {/* Student search within modal */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Student *</label>
          <div className="relative mb-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Search student by name..."
              value={studentSearch}
              onChange={e => searchStudents(e.target.value)}
            />
          </div>
          <select
            className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${errors.student ? 'border-rose-500' : 'border-slate-700 focus:border-amber-500'}`}
            value={form.student}
            onChange={e => { set('student', e.target.value); if (errors.student) setErrors(prev => ({ ...prev, student: undefined })); }}
          >
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
            ))}
          </select>
          {errors.student && <p className="text-xs text-rose-400 mt-1">{errors.student}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Month *" value={form.month}
            onChange={e => { onMonthChange(e.target.value); if (errors.month) setErrors(prev => ({ ...prev, month: undefined })); }}
            options={[{ value: '', label: 'Month' }, ...monthOptions]} error={errors.month} />
          <Input label="Year *" type="number" value={form.year} readOnly error={errors.year} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Tuition Fee *"  type="number" min={0} onKeyDown={blockInvalidKeys}
            value={form.tuitionFee}   onChange={e => { set('tuitionFee', e.target.value); if (errors.tuitionFee) setErrors(prev => ({ ...prev, tuitionFee: undefined })); }} error={errors.tuitionFee} />
          <Input label="Transport Fee"  type="number" min={0} onKeyDown={blockInvalidKeys}
            value={form.transportFee} onChange={e => { set('transportFee', e.target.value); if (errors.transportFee) setErrors(prev => ({ ...prev, transportFee: undefined })); }} error={errors.transportFee} />
          <Input label="Activity Fee"   type="number" min={0} onKeyDown={blockInvalidKeys}
            value={form.activityFee}  onChange={e => { set('activityFee', e.target.value); if (errors.activityFee) setErrors(prev => ({ ...prev, activityFee: undefined })); }} error={errors.activityFee} />
          <Input label="Other Fee"      type="number" min={0} onKeyDown={blockInvalidKeys}
            value={form.otherFee}     onChange={e => { set('otherFee', e.target.value); if (errors.otherFee) setErrors(prev => ({ ...prev, otherFee: undefined })); }} error={errors.otherFee} />
          <Input label="Discount"       type="number" min={0} onKeyDown={blockInvalidKeys}
            value={form.discount}     onChange={e => { set('discount', e.target.value); if (errors.discount) setErrors(prev => ({ ...prev, discount: undefined })); }} error={errors.discount} />
          <Input label="Due Date *"     type="date"
            value={form.dueDate}      onChange={e => { set('dueDate', e.target.value); if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: undefined })); }} error={errors.dueDate} />
        </div>
        <div className="bg-slate-800 rounded-lg p-3 text-sm">
          <span className="text-slate-400">Final Amount: </span>
          <span className="text-amber-400 font-bold text-base">₹{total.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Generate'}</Button>
      </div>
    </Modal>
  );
}

// ─── Edit Fee Modal ──────────────────────────────────────────────────────────

function EditFeeModal({ fee, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tuitionFee:   fee.tuitionFee   ?? 0,
    transportFee: fee.transportFee ?? 0,
    activityFee:  fee.activityFee  ?? 0,
    otherFee:     fee.otherFee     ?? 0,
    lateFine:     fee.lateFine     ?? 0,
    discount:     fee.discount     ?? 0,
    dueDate:      fee.dueDate ? fee.dueDate.split('T')[0] : '',
    status:       fee.status,
    notes:        fee.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const total = (Number(form.tuitionFee) || 0)
    + (Number(form.transportFee) || 0)
    + (Number(form.activityFee) || 0)
    + (Number(form.otherFee) || 0)
    + (Number(form.lateFine) || 0)
    - (Number(form.discount) || 0);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.put(`${API.FEES.BASE}/${fee._id}`, {
        ...form,
        totalAmount: (Number(form.tuitionFee) || 0)
          + (Number(form.transportFee) || 0)
          + (Number(form.activityFee) || 0)
          + (Number(form.otherFee) || 0)
          + (Number(form.lateFine) || 0),
        finalAmount: total,
      });
      onSuccess();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const statusOptions = ['Pending','Paid','Overdue','PartiallyPaid','Waived']
    .map(s => ({ value: s, label: s }));

  return (
    <Modal open={true} onClose={onClose} title="Edit Fee Record">
      <div className="mb-3 p-3 bg-slate-800 rounded-lg text-sm">
        <p className="text-white font-medium">{fee.student?.firstName} {fee.student?.lastName}</p>
        <p className="text-slate-400">{fee.classroom?.displayName} · {monthName(fee.month)} {fee.year}</p>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Tuition Fee"   type="number" value={form.tuitionFee}   onChange={e => set('tuitionFee', e.target.value)} />
          <Input label="Transport Fee" type="number" value={form.transportFee} onChange={e => set('transportFee', e.target.value)} />
          <Input label="Activity Fee"  type="number" value={form.activityFee}  onChange={e => set('activityFee', e.target.value)} />
          <Input label="Other Fee"     type="number" value={form.otherFee}     onChange={e => set('otherFee', e.target.value)} />
          <Input label="Late Fine"     type="number" value={form.lateFine}     onChange={e => set('lateFine', e.target.value)} />
          <Input label="Discount"      type="number" value={form.discount}     onChange={e => set('discount', e.target.value)} />
        </div>
        <Input label="Due Date" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)} options={statusOptions} />
        <Input label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
        <div className="bg-slate-800 rounded-lg p-3 text-sm">
          <span className="text-slate-400">New Final Amount: </span>
          <span className="text-amber-400 font-bold text-base">₹{total.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </Modal>
  );
}

// ─── Collect Single Payment Modal ────────────────────────────────────────────

function CollectPaymentModal({ fee, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amountPaid: fee.outstandingAmount ?? fee.finalAmount, paymentMode: 'Cash', transactionId: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await api.post(API.FEES.PAY(fee._id), form);
      alert(`Payment recorded! Receipt: ${res.data?.receiptNo}`);
      onSuccess();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open={true} onClose={onClose} title="Collect Payment">
      <div className="mb-4 p-3 bg-slate-800 rounded-lg text-sm">
        <p className="text-white font-medium">{fee.student?.firstName} {fee.student?.lastName}</p>
        <p className="text-slate-400">
          {fee.academicYear?.name ? `${fee.academicYear.name} · ` : ''}
          {fee.classroom?.displayName ? `${fee.classroom.displayName} · ` : ''}
          {monthName(fee.month)} {fee.year} · Due: <span className="text-amber-400">₹{(fee.outstandingAmount ?? fee.finalAmount)?.toLocaleString('en-IN')}</span>
        </p>
      </div>
      <div className="space-y-3">
        <Input
          label="Amount *"
          type="number"
          min="1"
          max={fee.outstandingAmount ?? fee.finalAmount}
          value={form.amountPaid}
          onChange={e => set('amountPaid', e.target.value)}
        />
        <Select label="Payment Mode *" value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)}
          options={['Cash','Cheque','Online','UPI','BankTransfer'].map(m => ({ value: m, label: m }))} />
        <Input label="Transaction ID" value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="Optional" />
        <Input label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Processing...' : 'Collect Payment'}</Button>
      </div>
    </Modal>
  );
}

// ─── Multi-Month Payment Modal ───────────────────────────────────────────────

function MultiMonthPayModal({ student, ayId, ayStartDate, onClose, onSuccess }) {
  const [unpaidFees, setUnpaidFees]   = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);
  const [receipt, setReceipt]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState({ paymentMode: 'Cash', transactionId: '', notes: '' });
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`${API.FEES.BASE}?studentId=${student._id}&academicYear=${ayId}`);
        const unpaid = (res.data || []).filter(f => f.status !== 'Waived' && f.outstandingAmount > 0);
        // Sort by AY month order
        const startMonth = ayStartDate ? new Date(ayStartDate).getMonth() + 1 : 4;
        unpaid.sort((a, b) => {
          const ai = ((a.month - startMonth + 12) % 12) * 100 + (a.year - 2000);
          const bi = ((b.month - startMonth + 12) % 12) * 100 + (b.year - 2000);
          return ai - bi;
        });
        setUnpaidFees(unpaid);
        setSelectedFees(unpaid.map(f => f._id)); // select all by default
      } catch {} finally { setLoading(false); }
    })();
  }, [ayId, ayStartDate, student._id]);

  const toggleFee = (id) =>
    setSelectedFees(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const totalAmount = unpaidFees
    .filter(f => selectedFees.includes(f._id))
    .reduce((s, f) => s + (f.outstandingAmount || 0), 0);

  const handleSubmit = async () => {
    if (selectedFees.length === 0) return alert('Select at least one month');
    setSaving(true);
    try {
      const res = await api.post(API.FEES.PAY_MULTIPLE, { feeIds: selectedFees, ...form });
      setReceipt(res.data);
      onSuccess();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal open={true} onClose={onClose} title="Pay Multiple Months">
      <div className="mb-3 p-3 bg-slate-800 rounded-lg">
        <p className="text-white font-medium">{student?.firstName} {student?.lastName}</p>
        <p className="text-xs text-slate-400">{student?.admissionNo}</p>
      </div>

      {receipt ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="font-semibold text-emerald-400">Payment recorded successfully</p>
            <p className="mt-1 text-sm text-slate-300">Receipt: {receipt.receiptNo}</p>
            <p className="text-sm text-slate-300">{receipt.monthsPaid} month(s) · ₹{receipt.amountPaid?.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-400">{new Date(receipt.paymentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Done</Button>
            <Button onClick={() => openFeeReceipt(receipt.receiptId).catch(err => alert(err.message))}>
              <Printer className="mr-2 h-4 w-4" /> Print / Download Receipt
            </Button>
          </div>
        </div>
      ) : loading ? (
        <p className="text-slate-500 text-sm py-4">Loading unpaid fees...</p>
      ) : unpaidFees.length === 0 ? (
        <p className="text-emerald-400 text-sm py-4">No unpaid fees! All months are cleared.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-2">Select months to pay:</p>
          <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
            {unpaidFees.map(f => (
              <div
                key={f._id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFees.includes(f._id)
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800'
                }`}
                onClick={() => toggleFee(f._id)}
              >
                <div className="flex items-center gap-3">
                  {selectedFees.includes(f._id)
                    ? <CheckSquare className="w-4 h-4 text-amber-400" />
                    : <Square className="w-4 h-4 text-slate-500" />}
                  <div>
                    <p className="text-white text-sm">{monthName(f.month)} {f.year}</p>
                    <p className="text-xs text-slate-500">{feeStatusBadge(f.status)}</p>
                  </div>
                </div>
                <span className="text-amber-400 font-semibold text-sm">₹{f.outstandingAmount?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-lg p-3 mb-4 flex justify-between items-center">
            <span className="text-slate-400 text-sm">{selectedFees.length} months selected</span>
            <span className="text-amber-400 font-bold text-lg">₹{totalAmount.toLocaleString()}</span>
          </div>

          <div className="space-y-3">
            <Select label="Payment Mode *" value={form.paymentMode}
              onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}
              options={['Cash','Cheque','Online','UPI','BankTransfer'].map(m => ({ value: m, label: m }))} />
            <Input label="Transaction ID" value={form.transactionId}
              onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} placeholder="Optional" />
            <Input label="Notes" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </>
      )}

      {!receipt && (
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {unpaidFees.length > 0 && (
            <Button onClick={handleSubmit} disabled={saving || selectedFees.length === 0}>
              {saving ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Auto-Generate Modal ─────────────────────────────────────────────────────

function AutoGenerateModal({ classrooms, ayId, ayStartDate, onClose, onSuccess }) {
  // startMonth derived below with year-labeled months
  const [form, setForm] = useState({
    month:      currentMonth,
    year:       currentYear,
    dueDate:    '',
    classId:    '',
    onlyUnpaid: true,
  });
  const [saving, setSaving]   = useState(false);
  const [preview, setPreview] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePreview = async () => {
    try {
      const res = await api.post(`${API.FEES.BASE}/generate-auto`, { ...form, academicYear: ayId, preview: true });
      setPreview(res.data);
    } catch (err) { alert(err.message); }
  };

  const handleGenerate = async () => {
    if (!form.dueDate) return alert('Please set a due date');
    setSaving(true);
    try {
      const res = await api.post(`${API.FEES.BASE}/generate-auto`, { ...form, academicYear: ayId });
      alert(`Auto-generated ${res.data?.created ?? 0} fee records. Skipped ${res.data?.skipped ?? 0} (already exist).`);
      onSuccess();
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  };

  const startMonth = ayStartDate ? new Date(ayStartDate).getMonth() + 1 : 4;
  const startYear  = ayStartDate ? new Date(ayStartDate).getFullYear() : currentYear;
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = ((startMonth - 1 + i) % 12) + 1;
    const y = startYear + (m < startMonth ? 1 : 0);
    return { value: String(m), label: `${MONTH_NAMES[m - 1]} (${y})` };
  });
  const onMonthChange = (mStr) => {
    const m = Number(mStr);
    const y = startYear + (m < startMonth ? 1 : 0);
    setForm(f => ({ ...f, month: mStr, year: y }));
  };

  return (
    <Modal open={true} onClose={onClose} title="Auto-Generate Monthly Fees">
      <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 flex gap-2">
        <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Automatically generate fee records for all active approved students. Existing records are skipped.</span>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Month *" value={form.month}
            onChange={e => onMonthChange(e.target.value)}
            options={monthOptions} />
          <Input label="Year *" type="number" value={form.year} readOnly />
        </div>
        <Input label="Due Date *" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        <Select label="Class (optional — all if blank)" value={form.classId}
          onChange={e => set('classId', e.target.value)}
          options={[{ value: '', label: 'All Classes' }, ...classrooms.map(c => ({ value: c._id, label: c.displayName }))]} />
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" className="accent-amber-500" checked={form.onlyUnpaid}
            onChange={e => set('onlyUnpaid', e.target.checked)} />
          Skip if already has a fee record for this month
        </label>
      </div>

      {preview && (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg text-sm">
          <p className="text-slate-400 mb-1">Preview:</p>
          <p className="text-white">Will create: <span className="text-emerald-400 font-bold">{preview.toCreate}</span> records</p>
          <p className="text-white">Will skip: <span className="text-slate-400">{preview.toSkip}</span> (already exist)</p>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="ghost" onClick={handlePreview}>Preview</Button>
        <Button onClick={handleGenerate} disabled={saving}>
          {saving ? 'Generating...' : 'Generate Now'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Payment History Modal ───────────────────────────────────────────────────

function PaymentHistoryModal({ fee, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get(API.FEES.PAYMENTS(fee._id))
      .then(res => setPayments(res.data || []))
      .finally(() => setLoading(false));
  }, [fee._id]);

  const total = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);

  return (
    <Modal open={true} onClose={onClose} title="Payment History">
      <div className="mb-3 p-3 bg-slate-800 rounded-lg text-sm">
        <p className="text-white">{fee.student?.firstName} {fee.student?.lastName} — {monthName(fee.month)} {fee.year}</p>
        <p className="text-slate-400">Fee Amount: ₹{fee.finalAmount?.toLocaleString()} · Status: {fee.status}</p>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-slate-500 text-sm">No payments recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p._id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div>
                <p className="text-white text-sm font-medium">{p.batchReceipt?.receiptNo || p.receiptNo}</p>
                <p className="text-xs text-slate-500">
                  {p.paymentMode} · {new Date(p.paymentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  {p.collectedBy?.name ? ` · ${p.collectedBy.name}` : ''}
                </p>
                {p.transactionId && <p className="text-xs text-slate-600">TXN: {p.transactionId}</p>}
                {p.notes && <p className="text-xs text-slate-500 italic">{p.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold">₹{p.amountPaid?.toLocaleString()}</span>
                <Button size="sm" variant="ghost" title="Print / Download receipt"
                  onClick={() => openFeeReceipt(p.batchReceipt?._id || p._id).catch(err => alert(err.message))}>
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-between px-3 pt-2 border-t border-slate-700">
            <span className="text-slate-400 text-sm">Total Paid</span>
            <span className="text-emerald-400 font-bold">₹{total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

// ─── All Receipts Modal ──────────────────────────────────────────────────────

function AllReceiptsModal({ ayId, onClose }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const LIMIT = 20;

  const fetchReceipts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`${API.FEES.BASE}/receipts/all?academicYear=${ayId}&page=${p}&limit=${LIMIT}`);
      setReceipts(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [ayId]);

  useEffect(() => { fetchReceipts(page); }, [fetchReceipts, page]);

  const totalAmount = receipts.reduce((s, r) => s + (r.amountPaid || 0), 0);

  return (
    <Modal open={true} onClose={onClose} title={`All Receipts (${total})`}>
      {loading ? (
        <p className="text-slate-500 text-sm py-4">Loading...</p>
      ) : (
        <>
          <div className="mb-3 text-sm text-slate-400">
            Page total: <span className="text-emerald-400 font-semibold">₹{totalAmount.toLocaleString()}</span>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {receipts.map(r => (
              <div key={r._id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-white text-sm font-medium">{r.receiptNo}</p>
                  <p className="text-xs text-slate-400">
                    {r.student?.firstName} {r.student?.lastName} ({r.student?.admissionNo})
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.paymentMode} · {new Date(r.paymentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(r.months || []).map(fee => `${monthName(fee.month)} ${fee.year}`).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-semibold">₹{r.amountPaid?.toLocaleString('en-IN')}</span>
                        <Button size="sm" variant="ghost" title="Print / Download receipt"
                    onClick={() => openFeeReceipt(r._id).catch(err => alert(err.message))}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              ← Prev
            </Button>
            <span className="text-slate-500 text-sm">Page {page} of {Math.ceil(total / LIMIT)}</span>
            <Button variant="ghost" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}>
              Next →
            </Button>
          </div>
        </>
      )}
      <div className="flex justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}