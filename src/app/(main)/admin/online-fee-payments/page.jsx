'use client';
import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, Search } from 'lucide-react';
import api from '@/api/client';
import { PageContent, PageHeader, Card, Button, Input, Select } from '@/components/ui.jsx';

const STATUSES = ['', 'Pending', 'Processing', 'Paid', 'Failed', 'Refunded'];
const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function OnlineFeePaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [classId, setClassId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (academicYear) params.set('academicYear', academicYear);
      if (classId) params.set('classId', classId);
      if (paymentMethod) params.set('paymentMethod', paymentMethod);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const result = await api.get(`/api/payments/cashfree/admin?${params}`);
      setPayments(result.data?.payments || []);
      setStats(result.data?.stats || []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load payments');
    } finally {
      setLoading(false);
    }
  }, [search, status, academicYear, classId, paymentMethod, fromDate, toDate]);

  useEffect(() => { loadPayments(); }, [loadPayments]);
  useEffect(() => {
    Promise.all([api.get('/api/academic-years'), api.get('/api/classrooms?isActive=true')])
      .then(([yearsResponse, classroomsResponse]) => {
        setAcademicYears(yearsResponse.data || []);
        setClassrooms(classroomsResponse.data || []);
      })
      .catch(() => {});
  }, []);

  const downloadReceipt = async (payment) => {
    try {
      const response = await api.get(`/api/payments/cashfree/${payment._id}/receipt`, { responseType: 'blob' });
      const url = URL.createObjectURL(response);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${payment.receiptNo || 'fee-receipt'}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError.message || 'Unable to download receipt');
    }
  };

  const statFor = name => stats.find(item => item._id === name);
  const successful = statFor('Paid');
  const pending = statFor('Pending') || statFor('Processing');
    const processing = statFor('Processing');
  const failed = statFor('Failed');

  return (
    <PageContent>
      <PageHeader title="Online Fee Payments" subtitle="Cashfree transactions and verified receipts" actions={
        <Button variant="ghost" onClick={loadPayments} disabled={loading}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Card><p className="text-xs text-slate-400 uppercase">Successful collections</p><p className="mt-1 text-xl font-semibold text-emerald-400">{money(successful?.amount)}</p><p className="text-xs text-slate-500">{successful?.count || 0} payments</p></Card>
        <Card><p className="text-xs text-slate-400 uppercase">Pending</p><p className="mt-1 text-xl font-semibold text-amber-400">{money((pending?.amount || 0) + (processing?.amount || 0))}</p><p className="text-xs text-slate-500">{(pending?.count || 0) + (processing?.count || 0)} payments</p></Card>
        <Card><p className="text-xs text-slate-400 uppercase">Failed</p><p className="mt-1 text-xl font-semibold text-rose-400">{money(failed?.amount)}</p><p className="text-xs text-slate-500">{failed?.count || 0} payments</p></Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => event.key === 'Enter' && loadPayments()} placeholder="Student, admission, receipt, Cashfree order" className="pl-9" />
        </div>
        <Select value={status} onChange={event => setStatus(event.target.value)} options={STATUSES.map(value => ({ value, label: value || 'All statuses' }))} className="sm:w-48" />
        <Select value={academicYear} onChange={event => setAcademicYear(event.target.value)} options={[{ value: '', label: 'All academic years' }, ...academicYears.map(year => ({ value: year._id, label: year.name }))]} />
        <Select value={classId} onChange={event => setClassId(event.target.value)} options={[{ value: '', label: 'All classes' }, ...classrooms.map(classroom => ({ value: classroom._id, label: classroom.displayName }))]} />
        <Select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)} options={[
          { value: '', label: 'All payment methods' }, { value: 'upi', label: 'UPI' },
          { value: 'credit_card', label: 'Credit card' }, { value: 'debit_card', label: 'Debit card' },
          { value: 'net_banking', label: 'Net banking' }, { value: 'wallet', label: 'Wallet' },
        ]} />
        <Input type="date" value={fromDate} onChange={event => setFromDate(event.target.value)} aria-label="From date" />
        <Input type="date" value={toDate} onChange={event => setToDate(event.target.value)} aria-label="To date" />
        <Button onClick={loadPayments}><Search className="w-4 h-4 mr-1" /> Apply filters</Button>
      </div>

      {error && <div className="mb-4 rounded border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert">{error}</div>}
      <Card className="!p-0 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead><tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-500">
            <th className="p-3">Student</th><th className="p-3">Class / Period</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Receipt / Order</th><th className="p-3">Created</th><th className="p-3">Action</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="p-8 text-center text-slate-500">Loading payments...</td></tr>
              : payments.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-slate-500">No online payments found.</td></tr>
                : payments.map(payment => <tr key={payment._id} className="border-b border-slate-800 last:border-0">
                  <td className="p-3"><div className="font-medium">{payment.student?.firstName} {payment.student?.lastName}</div><div className="text-xs text-slate-500">{payment.student?.admissionNo || '—'}</div></td>
                  <td className="p-3">{payment.student?.classroom?.displayName || '—'}<div className="text-xs text-slate-500">{payment.fee ? `${new Date(2000, payment.fee.month - 1).toLocaleString('en', { month: 'short' })} ${payment.fee.year}` : payment.academicYear?.name}</div></td>
                  <td className="p-3 font-semibold">{money(payment.expectedAmount)}</td>
                  <td className="p-3"><span className={`inline-flex rounded px-2 py-1 text-xs ${payment.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-300' : ['Failed', 'Refunded'].includes(payment.status) ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{payment.status}</span></td>
                  <td className="p-3"><div>{payment.receiptNo || '—'}</div><div className="max-w-48 truncate text-xs text-slate-500" title={payment.orderId}>{payment.orderId}</div><div className="text-xs text-slate-500">{payment.transactionReference || payment.cashfreePaymentId}</div>{payment.refundAmount > 0 && <div className="text-xs text-rose-300">Refunded {money(payment.refundAmount)}</div>}{payment.failureReason && <div className="max-w-56 text-xs text-rose-300">{payment.failureReason}</div>}</td>
                  <td className="p-3 text-slate-400">{new Date(payment.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3">{payment.status === 'Paid' && <Button size="sm" variant="ghost" onClick={() => downloadReceipt(payment)}><Download className="w-4 h-4" /></Button>}</td>
                </tr>)}
          </tbody>
        </table>
      </Card>
    </PageContent>
  );
}
