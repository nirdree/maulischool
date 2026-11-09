import PDFDocument from 'pdfkit';
import { connectDB } from '@/lib/mongodb';
import { protect } from '@/lib/auth';
import { r } from '@/lib/response';
import CashfreePayment from '@/models/CashfreePayment';
import { SchoolSettings } from '@/models/Others';

export const runtime = 'nodejs';

export const GET = protect(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    const payment = await CashfreePayment.findById(id)
      .populate('student', 'firstName lastName admissionNo classroom')
      .populate({ path: 'student', populate: { path: 'classroom', select: 'displayName' } })
      .populate('fee', 'month year finalAmount')
      .populate('feeAllocations.fee', 'month year finalAmount')
      .populate('feeReceipt', 'receiptNo items amountPaid')
      .populate('academicYear', 'name');
    if (!payment) return r.notFound('Payment not found');
    if (request.user.role === 'parent') {
      if (payment.parent.toString() !== request.user._id.toString()) return r.forbidden();
      if (!(request.user.studentIds || []).some(studentId => String(studentId) === String(payment.student._id))) return r.forbidden();
    } else if (!['admin', 'principal'].includes(request.user.role)) {
      return r.forbidden();
    }
    if (payment.status !== 'Paid' || !payment.feePayment) return r.badRequest('Receipt is available only after payment verification');

    const settings = await SchoolSettings.findOne();
    const studentName = [payment.student.firstName, payment.student.lastName].filter(Boolean).join(' ');
    const chunks = [];
    const document = new PDFDocument({ size: 'A4', margin: 52 });
    document.on('data', chunk => chunks.push(chunk));
    const completed = new Promise((resolve, reject) => {
      document.on('end', resolve);
      document.on('error', reject);
    });

    const schoolName = settings?.name && settings.name !== 'School Name' ? settings.name : 'Mauli School';
    document.fontSize(20).fillColor('#174f42').text(schoolName, { align: 'center' });
    if (settings?.address) document.moveDown(0.3).fontSize(9).fillColor('#475569').text(settings.address, { align: 'center' });
    const contact = [settings?.phone, settings?.email, settings?.affiliationNo ? `Affiliation ${settings.affiliationNo}` : ''].filter(Boolean).join('  |  ');
    if (contact) document.moveDown(0.25).fontSize(9).fillColor('#475569').text(contact, { align: 'center' });
    document.moveDown(0.8).fontSize(15).fillColor('#17212b').text('FEE PAYMENT RECEIPT', { align: 'center' });
    document.moveDown(1.2).fontSize(11).fillColor('#17212b');
    const rows = [
      ['Receipt number', payment.feeReceipt?.receiptNo || payment.receiptNo || payment.feePayment.receiptNo],
      ['Payment status', 'Paid - verified by Cashfree'],
      ['Student', studentName],
      ['Admission number', payment.student.admissionNo || 'Not recorded'],
      ['Class', payment.student.classroom?.displayName || 'Not recorded'],
      ['Academic year', payment.academicYear?.name || 'Not recorded'],
      ['Amount paid', `INR ${Number(payment.expectedAmount).toFixed(2)}`],
      ['Payment date & time', payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not recorded'],
      ['Cashfree order ID', payment.orderId],
      ['Transaction reference', payment.transactionReference || payment.cashfreePaymentId || 'Not provided'],
      ['Payment method', payment.paymentMethod || 'Online'],
    ];
    for (const [label, value] of rows) {
      const rowY = document.y;
      document.font('Helvetica-Bold').text(label, 52, rowY, { width: 150 });
      document.font('Helvetica').text(String(value), 202, rowY, { width: 340 });
      document.moveDown(0.6);
    }
    const feeItems = payment.feeReceipt?.items?.length
      ? payment.feeReceipt.items
      : (payment.feeAllocations?.length
          ? payment.feeAllocations.map(item => ({
              fee: item.fee,
              month: item.fee?.month,
              year: item.fee?.year,
              amountPaid: item.amount,
            }))
          : [{ fee: payment.fee, month: payment.fee?.month, year: payment.fee?.year, amountPaid: payment.expectedAmount }]);
    document.moveDown(0.5).font('Helvetica-Bold').fillColor('#174f42').text('Fee periods and amounts');
    document.moveDown(0.4).font('Helvetica').fillColor('#17212b');
    for (const item of feeItems) {
      const month = item.month || item.fee?.month;
      const year = item.year || item.fee?.year;
      const period = month
        ? `${new Date(2000, month - 1).toLocaleString('en', { month: 'long' })} ${year}`
        : 'School fees';
      const rowY = document.y;
      document.text(period, 52, rowY, { width: 260 });
      document.text(`INR ${Number(item.amountPaid ?? item.amount ?? 0).toFixed(2)}`, 340, rowY, { width: 200, align: 'right' });
      document.moveDown(0.6);
    }
    document.moveDown().fontSize(9).fillColor('#64748b').text('This receipt confirms a payment verified with Cashfree Payments.', { align: 'center' });
    document.end();
    await completed;

    return new Response(Buffer.concat(chunks), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${payment.receiptNo || 'fee-receipt'}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Fee receipt generation failed:', error.message);
    return r.serverError('Unable to generate receipt');
  }
});
