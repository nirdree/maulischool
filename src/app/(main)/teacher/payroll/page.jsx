'use client';
import { useEffect, useState } from 'react';
import { Eye, Banknote, CircleDollarSign, Clock3 } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Table, Pagination, Select, Badge, Button, Modal } from '@/components/ui.jsx';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function TeacherPayrollPage() {
  const [records, setRecords] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalPayable: 0, totalPaid: 0 });

  useEffect(() => {
    api.get(`${API.ACADEMIC_YEARS.BASE}?limit=100`)
      .then(result => setAcademicYears(result.data || []))
      .catch(err => setError(err.response?.data?.message || err.message || 'Unable to load academic years.'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const key = `${academicYear}:${page}`;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (academicYear) params.set('academicYear', academicYear);

    api.get(`${API.PAYROLL.BASE}?${params}`)
      .then(result => {
        if (!cancelled) {
          setRecords(Array.isArray(result?.data) ? result.data : []);
          setTotal(result.meta?.total || 0);
          setSummary({
            totalPayable: result.meta?.totalPayable || 0,
            totalPaid: result.meta?.totalPaid || 0,
          });
          setError('');
        }
      })
      .catch(err => {
        if (!cancelled) {
          setRecords([]);
          setError(err.response?.data?.message || err.message || 'Unable to load your payroll records.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(key);
      });

    return () => { cancelled = true; };
  }, [academicYear, page]);

  const loading = loadedKey !== `${academicYear}:${page}`;
  const totalNet = summary.totalPayable;
  const totalPaid = summary.totalPaid;
  const totalPending = totalNet - totalPaid;

  const columns = [
    { key: 'month', label: 'Pay period', render: record => `${MONTHS[record.month - 1]} ${record.year}` },
    { key: 'academicYear', label: 'Academic year', render: record => record.academicYear?.name || '—' },
    { key: 'basicSalary', label: 'Basic salary', render: record => formatCurrency(record.basicSalary) },
    {
      key: 'daysPresent',
      label: 'Attendance',
      render: record => `${record.daysPresent ?? 0} / ${record.workingDays ?? 0} days`,
    },
    { key: 'bonus', label: 'Bonus', render: record => formatCurrency(record.bonus) },
    {
      key: 'deductions',
      label: 'Deductions',
      render: record => formatCurrency(Number(record.deductions || 0) + Number(record.extraDeductions || 0)),
    },
    {
      key: 'netSalary',
      label: 'Net salary',
      render: record => <span className="font-semibold text-white">{formatCurrency(record.netSalary)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: record => <Badge label={record.status} color={record.status === 'Paid' ? 'green' : 'yellow'} />,
    },
    {
      key: 'details',
      label: '',
      render: record => (
        <Button size="sm" variant="ghost" onClick={() => setSelectedRecord(record)}>
          <Eye className="mr-1 h-4 w-4" /> Details
        </Button>
      ),
    },
  ];

  return (
    <PageContent>
      <PageHeader title="My Payroll" subtitle="View your salary, deductions, attendance, and payment history" />

      {error && (
        <Card className="mb-4 border border-rose-500/30">
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={Banknote} label="Net salary" value={formatCurrency(totalNet)} />
        <SummaryCard icon={CircleDollarSign} label="Paid" value={formatCurrency(totalPaid)} />
        <SummaryCard icon={Clock3} label="Pending" value={formatCurrency(totalPending)} />
      </div>

      <Card className="!p-0">
        <div className="flex justify-end border-b border-slate-800 p-4">
          <Select
            aria-label="Academic year"
            value={academicYear}
            onChange={event => { setAcademicYear(event.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All academic years' },
              ...academicYears.map(item => ({ value: item._id, label: item.name })),
            ]}
            className="w-52"
          />
        </div>
        <Table columns={columns} data={records} loading={loading} emptyMessage="No payroll records found" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      {selectedRecord && (
        <PayrollDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </PageContent>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function PayrollDetails({ record, onClose }) {
  const rows = [
    ['Pay period', `${MONTHS[record.month - 1]} ${record.year}`],
    ['Basic salary', formatCurrency(record.basicSalary)],
    ['Total days', record.totalDays],
    ['Holidays', record.holidays],
    ['Working days', record.workingDays],
    ['Per-day salary', formatCurrency(record.perDaySalary)],
    ['Days present', record.daysPresent],
    ['Days absent', record.daysAbsent],
    ['Days late', record.daysLate],
    ['Half-days', record.daysHalfDay],
    ['Days on leave', record.daysOnLeave],
    ['Earned amount', formatCurrency(record.earnedAmount)],
    ['Bonus', formatCurrency(record.bonus)],
    ['Deductions', formatCurrency(record.deductions)],
    ['Extra deductions', formatCurrency(record.extraDeductions)],
    ['Net salary', formatCurrency(record.netSalary)],
    ['Payment mode', record.paymentMode],
    ['Status', record.status],
    ...(record.paymentDate ? [['Payment date', new Date(record.paymentDate).toLocaleDateString('en-IN')]] : []),
    ...(record.notes ? [['Notes', record.notes]] : []),
  ];

  return (
    <Modal open onClose={onClose} title="Payroll details">
      <div className="max-h-96 space-y-1 overflow-y-auto">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 border-b border-slate-800 py-2">
            <span className="w-40 shrink-0 text-sm text-slate-400">{label}</span>
            <span className={`text-sm ${label === 'Net salary' ? 'font-semibold text-emerald-300' : 'text-white'}`}>
              {String(value ?? '—')}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
