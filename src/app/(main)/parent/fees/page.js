// pages/parent/Fees.jsx
/**
 * PARENT FEES PAGE
 * APIs Used:
 *   GET /api/academic-years/current
 *   GET /api/students               — parent's children
 *   GET /api/fees                   — fee records for children
 *   GET /api/fees/:id/payments      — payment history
 */
'use client'
import { useCallback, useEffect, useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import { Eye, AlertCircle, CreditCard, Download, LoaderCircle } from 'lucide-react';
import api from '@/api/client';
import { API } from '@/api/constants';
import { PageContent, PageHeader, Card, Table, Pagination, Button, Select, feeStatusBadge, Modal } from '@/components/ui.jsx';

const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ParentFees() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [fees, setFees] = useState([]);
  const [gatewayPayments, setGatewayPayments] = useState([]);
  const [ayId, setAyId] = useState('');
  const [ayName, setAyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewPayments, setViewPayments] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [payingFee, setPayingFee] = useState('');
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ annualTotal: 0, totalPaid: 0, totalDue: 0 });
  const [gatewayPage, setGatewayPage] = useState(1);
  const [gatewayTotal, setGatewayTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const ay = await api.get(API.ACADEMIC_YEARS.CURRENT);
        setAyId(ay.data?._id);
        setAyName(ay.data?.name || '');
        const res = await api.get(`${API.STUDENTS.BASE}?academicYear=${ay.data?._id}`);
        const kids = res.data || [];
        setChildren(kids);
        if (kids.length > 0) setSelectedChild(kids[0]._id);
      } catch {}
    })();
  }, []);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const feeResponse = await api.get(`${API.FEES.BASE}?studentId=${selectedChild}&academicYear=${ayId}&page=${page}&limit=20`);
      setFees(feeResponse.data || []);
      setTotal(feeResponse.meta?.total || 0);
      setSummary({
        annualTotal: feeResponse.meta?.annualTotal || 0,
        totalPaid: feeResponse.meta?.totalPaid || 0,
        totalDue: feeResponse.meta?.totalDue || 0,
      });
    } catch {} finally { setLoading(false); }
  }, [selectedChild, ayId, page]);

  useEffect(() => {
    if (selectedChild && ayId) fetchFees();
  }, [selectedChild, ayId, fetchFees]);

  useEffect(() => {
    if (!selectedChild) return;
    api.get(`/api/payments/cashfree/mine?studentId=${selectedChild}&page=${gatewayPage}&limit=20`)
      .then(response => {
        setGatewayPayments(response.data || []);
        setGatewayTotal(response.meta?.total || 0);
      })
      .catch(() => {
        setGatewayPayments([]);
        setGatewayTotal(0);
      });
  }, [selectedChild, gatewayPage]);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id');
    if (!orderId) return;
    api.get(`/api/payments/cashfree/verify?order_id=${encodeURIComponent(orderId)}`)
      .then(async response => {
        const status = response.data?.status;
        setPaymentNotice({ status, message: status === 'Paid'
          ? `Payment verified. Receipt ${response.data.receiptNo || ''}`
          : `Payment status: ${status || 'Pending'}. Retry once the status is confirmed.` });
      })
      .catch(() => setPaymentNotice({ status: 'Pending', message: 'We could not confirm this payment yet. Please check again shortly.' }))
        .finally(() => window.history.replaceState({}, '', window.location.pathname));
      }, []);

  const startPayment = async () => {
    if (!selectedFee || payingFee) return;
    setPayingFee(selectedFee._id);
    setPaymentNotice(null);
    try {
      const orderResponse = await api.post('/api/payments/cashfree/orders', { feeId: selectedFee._id });
      const checkoutData = orderResponse.data;
      const cashfree = await load({ mode: checkoutData.mode });
      if (!cashfree) throw new Error('Cashfree checkout could not be loaded');
      const result = await cashfree.checkout({
        paymentSessionId: checkoutData.paymentSessionId,
        redirectTarget: '_self',
      });
      if (result?.error) setPaymentNotice({ status: 'Pending', message: 'Checkout did not complete. The fee has not been marked paid.' });
    } catch (error) {
      setPaymentNotice({ status: 'Failed', message: error.message || 'Could not start checkout. Please try again.' });
    } finally {
      setPayingFee('');
      setSelectedFee(null);
    }
  };

  const downloadReceipt = async (payment) => {
    if (!payment.onlinePaymentId) return;
    try {
      const response = await api.get(`/api/payments/cashfree/${payment.onlinePaymentId}/receipt`, { responseType: 'blob' });
      const url = URL.createObjectURL(response);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${payment.receiptNo || 'fee-receipt'}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setPaymentNotice({ status: 'Failed', message: error.message || 'Unable to download receipt.' });
    }
  };

  const childOptions = children.map(c => ({
    value: c._id,
    label: `${c.firstName} ${c.lastName}`,
  }));

  const columns = [
    {
      key: 'period', label: 'Period',
      render: (f) => <span className="font-medium text-white">{MONTHS_FULL[f.month - 1]} {f.year}</span>,
    },
    { key: 'tuitionFee', label: 'Tuition', render: (f) => `₹${f.tuitionFee?.toLocaleString()}` },
    {
      key: 'details', label: 'Extras',
      render: (f) => {
        const extras = [];
        if (f.transportFee > 0) extras.push(`Transport: ₹${f.transportFee}`);
        if (f.activityFee > 0) extras.push(`Activity: ₹${f.activityFee}`);
        if (f.discount > 0) extras.push(`Discount: -₹${f.discount}`);
        if (f.lateFine > 0) extras.push(`Late fine: ₹${f.lateFine}`);
        return extras.length > 0
          ? <span className="text-xs text-slate-400">{extras.join(', ')}</span>
          : <span className="text-slate-600">—</span>;
      },
    },
    {
      key: 'finalAmount', label: 'Total Due',
      render: (f) => <span className="font-semibold text-amber-400">₹{(f.outstandingAmount ?? f.finalAmount)?.toLocaleString()}</span>,
    },
    { key: 'amountPaid', label: 'Paid', render: (f) => `₹${(f.amountPaid || 0).toLocaleString()}` },
    { key: 'dueDate', label: 'Due Date', render: (f) => new Date(f.dueDate).toLocaleDateString('en-IN') },
    { key: 'status', label: 'Status', render: (f) => feeStatusBadge(f.status) },
    {
      key: 'actions', label: '',
      render: (f) => (
        <div className="flex gap-1">
          {f.outstandingAmount > 0 && <Button size="sm" variant="success" onClick={() => setSelectedFee(f)}>
            <CreditCard className="w-3 h-3 mr-1" /> Pay online
          </Button>}
          <Button size="sm" variant="ghost" onClick={() => setViewPayments(f)}>
            <Eye className="w-3 h-3 mr-1" /> History
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContent>
      <PageHeader title="Fees & Payments" subtitle="View installment balances, online payments, and receipts" />

      <div className="flex gap-3 mb-6">
        {children.length > 1 && (
          <Select options={childOptions} value={selectedChild} onChange={e => { setSelectedChild(e.target.value); setPage(1); setGatewayPage(1); }} className="w-52" label="Child" />
        )}
      </div>

      {/* Summary */}
            {selectedChild && <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm">
              <span className="font-semibold text-white">{children.find(child => child._id === selectedChild)?.firstName} {children.find(child => child._id === selectedChild)?.lastName}</span>
              <span className="ml-3 text-slate-400">Admission {children.find(child => child._id === selectedChild)?.admissionNo || '—'}</span>
              <span className="ml-3 text-slate-400">Class {children.find(child => child._id === selectedChild)?.classroom?.displayName || '—'}</span>
              <span className="ml-3 text-slate-400">Academic year {ayName || '—'}</span>
            </div>}

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Annual Fees', value: `₹${summary.annualTotal.toLocaleString()}`, color: 'text-sky-400' },
          { label: 'Total Paid', value: `₹${summary.totalPaid.toLocaleString()}`, color: 'text-emerald-400' },
          { label: 'Outstanding', value: `₹${summary.totalDue.toLocaleString()}`, color: summary.totalDue > 0 ? 'text-rose-400' : 'text-white' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {summary.totalDue > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">
            You have outstanding fees of <strong>₹{summary.totalDue.toLocaleString()}</strong>. Choose an installment below to pay online.
          </p>
        </div>
      )}

      {paymentNotice && <div className="mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700 text-sm" role="status">
        <strong className="mr-2">{paymentNotice.status}</strong>{paymentNotice.message}
      </div>}

      <Card className="!p-0">
        <Table columns={columns} data={fees} loading={loading} emptyMessage="No fee records found" />
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} loading={loading} />
      </Card>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-white">Online payment activity</h2>
        <Card className="!p-0 divide-y divide-slate-800">
          {gatewayPayments.length === 0 ? <p className="p-4 text-sm text-slate-500">No online payment attempts yet.</p> : gatewayPayments.map(payment => (
            <div key={payment._id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div><p className="font-medium text-white">{payment.fee ? `${MONTHS_FULL[payment.fee.month - 1]} ${payment.fee.year}` : 'School fee installment'}</p>
                <p className="text-xs text-slate-500">Order {payment.orderId} · {new Date(payment.createdAt).toLocaleDateString('en-IN')}</p></div>
              <div className="flex items-center gap-3"><span className="font-semibold">₹{Number(payment.expectedAmount).toLocaleString()}</span>
                <span className={`rounded px-2 py-1 text-xs ${payment.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-300' : ['Failed', 'Refunded'].includes(payment.status) ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{payment.status}</span>
                                {payment.refundAmount > 0 && <span className="text-xs text-rose-300">Refunded ₹{Number(payment.refundAmount).toLocaleString()}</span>}
                {payment.status === 'Paid' && <Button size="sm" variant="ghost" onClick={() => downloadReceipt({ onlinePaymentId: payment._id, receiptNo: payment.receiptNo })}><Download className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))}
        </Card>
        <Pagination page={gatewayPage} total={gatewayTotal} limit={20} onPageChange={setGatewayPage} />
      </section>

      {viewPayments && (
        <PaymentHistoryModal fee={viewPayments} onClose={() => setViewPayments(null)} onDownload={downloadReceipt} />
      )}
      {selectedFee && <PaymentSummaryModal fee={selectedFee} student={children.find(child => child._id === selectedChild)}
        paying={payingFee === selectedFee._id} onClose={() => setSelectedFee(null)} onConfirm={startPayment} />}
    </PageContent>
  );
}

function PaymentHistoryModal({ fee, onClose, onDownload }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    api.get(API.FEES.PAYMENTS(fee._id))
      .then(res => setPayments(res.data || []))
      .finally(() => setLoading(false));
  }, [fee._id]);

  return (
    <Modal open={true} onClose={onClose} title={`Receipts — ${months[fee.month - 1]} ${fee.year}`}>
      <div className="mb-4 p-3 bg-slate-800 rounded-lg text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Total Amount</span>
          <span className="text-white font-semibold">₹{fee.finalAmount?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-slate-400">Status</span>
          {feeStatusBadge(fee.status)}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">No payments made yet.</p>
      ) : (
        <div className="space-y-3">
          {payments.map(p => (
            <div key={p._id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-emerald-400">₹{p.amountPaid?.toLocaleString()}</p>
                <p className="text-xs text-slate-500 font-mono">{p.receiptNo}</p>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-400">
                <span>Mode: {p.paymentMode}</span>
                <span>Date: {new Date(p.paymentDate).toLocaleDateString('en-IN')}</span>
                {p.transactionId && <span className="col-span-2">Txn: {p.transactionId}</span>}
                {p.onlinePaymentId && <button className="col-span-2 inline-flex items-center gap-1 text-sky-400 hover:text-sky-300" onClick={() => onDownload(p)}>
                  <Download className="w-3 h-3" /> Download verified PDF receipt
                </button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

function PaymentSummaryModal({ fee, student, paying, onClose, onConfirm }) {
  const outstanding = fee.outstandingAmount ?? fee.finalAmount;
  return (
    <Modal open={true} onClose={onClose} title="Confirm online payment">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-4"><span className="text-slate-400">Student</span><span>{student?.firstName} {student?.lastName}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Admission number</span><span>{student?.admissionNo || '—'}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Installment</span><span>{MONTHS_FULL[fee.month - 1]} {fee.year}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Fee amount</span><span>₹{fee.finalAmount?.toLocaleString()}</span></div>
        <div className="flex justify-between gap-4"><span className="text-slate-400">Already paid</span><span>₹{(fee.amountPaid || 0).toLocaleString()}</span></div>
        <div className="flex justify-between gap-4 border-t border-slate-700 pt-3 font-semibold"><span>Pay now</span><span className="text-emerald-400">₹{Number(outstanding).toLocaleString()}</span></div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={onClose} disabled={paying}>Cancel</Button>
        <Button variant="success" onClick={onConfirm} disabled={paying}>
          {paying ? <><LoaderCircle className="w-4 h-4 mr-1 animate-spin" /> Starting...</> : <><CreditCard className="w-4 h-4 mr-1" /> Pay Fees Online</>}
        </Button>
      </div>
    </Modal>
  );
}