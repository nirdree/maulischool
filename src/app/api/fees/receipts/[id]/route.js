import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/auth';
import { FeePayment } from '@/models/Fee';
import FeeReceipt from '@/models/FeeReceipt';
import { SchoolSettings } from '@/models/Others';
import { r } from '@/lib/response';

export const runtime = 'nodejs';

export const GET = authorize('admin', 'principal')(async (request, { params }) => {
  try {
    await connectDB();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return r.notFound('Fee receipt not found');
    const [receipt, singlePayment, settings] = await Promise.all([
      FeeReceipt.findById(id)
        .populate('student', 'firstName lastName admissionNo classroom')
        .populate({ path: 'student', populate: { path: 'classroom', select: 'displayName' } })
        .populate('academicYear', 'name')
        .populate('collectedBy', 'name')
        .populate('items.fee', 'month year')
        .lean(),
      FeePayment.findById(id)
        .populate('student', 'firstName lastName admissionNo classroom')
        .populate({ path: 'student', populate: { path: 'classroom', select: 'displayName' } })
        .populate('academicYear', 'name')
        .populate('collectedBy', 'name')
        .populate('fee', 'month year')
        .lean(),
      SchoolSettings.findOne().lean(),
    ]);
    const paymentReceipt = receipt || singlePayment;
    if (!paymentReceipt) return r.notFound('Fee receipt not found');

    const student = paymentReceipt.student;
    const studentName = [student?.firstName, student?.lastName].filter(Boolean).join(' ');
    const items = receipt
      ? receipt.items.map(item => ({
          month: item.month,
          year: item.year,
          amountPaid: item.amountPaid,
        }))
      : [{
          month: singlePayment.fee?.month,
          year: singlePayment.fee?.year,
          amountPaid: singlePayment.amountPaid,
        }];
    const chunks = [];
    const document = new PDFDocument({ size: 'A4', margin: 52 });
    document.on('data', chunk => chunks.push(chunk));
    const completed = new Promise((resolve, reject) => {
      document.on('end', resolve);
      document.on('error', reject);
    });

    const schoolName = settings?.name && settings.name !== 'School Name' ? settings.name : 'Mauli School';
    const contact = [settings?.phone, settings?.email, settings?.address].filter(Boolean).join('  |  ');
    document.fontSize(20).fillColor('#174f42').text(schoolName, { align: 'center' });
    if (contact) document.moveDown(0.3).fontSize(9).fillColor('#475569').text(contact, { align: 'center' });
    document.moveDown(0.8).fontSize(15).fillColor('#17212b').text('FEE PAYMENT RECEIPT', { align: 'center' });
    document.moveDown(1).fontSize(10).fillColor('#17212b');

    const details = [
      ['Receipt number', paymentReceipt.receiptNo],
      ['Student', studentName || 'Not recorded'],
      ['Admission number', student?.admissionNo || 'Not recorded'],
      ['Class', student?.classroom?.displayName || 'Not recorded'],
      ['Academic year', paymentReceipt.academicYear?.name || 'Not recorded'],
      ['Payment date & time', new Date(paymentReceipt.paymentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
      ['Payment mode', paymentReceipt.paymentMode],
      ['Transaction/reference', paymentReceipt.transactionId || 'Not provided'],
      ['Received by', paymentReceipt.collectedBy?.name || 'School'],
    ];

    for (const [label, value] of details) {
      const rowY = document.y;
      document.font('Helvetica-Bold').text(label, 52, rowY, { width: 150 });
      document.font('Helvetica').text(String(value || 'Not recorded'), 202, rowY, { width: 340 });
      document.moveDown(0.6);
    }

    document.moveDown(0.6);
    const tableTop = document.y;
    document.font('Helvetica-Bold').fillColor('#174f42');
    document.text('Fee period', 52, tableTop, { width: 260 });
    document.text('Amount (INR)', 360, tableTop, { width: 180, align: 'right' });
    document.moveDown(0.5);
    document.moveTo(52, document.y).lineTo(543, document.y).strokeColor('#94a3b8').stroke();
    document.moveDown(0.5).font('Helvetica').fillColor('#17212b');

    for (const item of items) {
      const period = item.month
        ? `${new Date(2000, item.month - 1).toLocaleString('en-IN', { month: 'long' })} ${item.year}`
        : 'School fees';
      const rowY = document.y;
      document.text(period, 52, rowY, { width: 260 });
      document.text(Number(item.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 360, rowY, { width: 180, align: 'right' });
      document.moveDown(0.6);
    }

    document.moveDown(0.4);
    document.font('Helvetica-Bold').text(
      `Total paid: INR ${Number(paymentReceipt.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      52,
      document.y,
      { align: 'right' },
    );
    if (paymentReceipt.notes) {
      document.moveDown().font('Helvetica').fontSize(9).text(`Notes: ${paymentReceipt.notes}`);
    }
    document.moveDown(1.5).font('Helvetica').fontSize(9).fillColor('#64748b')
      .text('Thank you. This receipt confirms the fee payment received by the school.', { align: 'center' });
    document.end();
    await completed;

    return new Response(Buffer.concat(chunks), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${paymentReceipt.receiptNo || 'fee-receipt'}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Fee receipt generation failed:', error.message);
    return r.serverError('Unable to generate receipt');
  }
});
