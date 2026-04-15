// routes/fees.js
const express    = require('express');
const router     = express.Router();
const { Fee, FeePayment } = require('../models/Fee');
const r          = require('../utils/response');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── GET /api/fees ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { studentId, classId, month, year, status, academicYear } = req.query;
    const filter = {};
    if (studentId)    filter.student      = studentId;
    if (classId)      filter.classroom    = classId;
    if (month)        filter.month        = Number(month);
    if (year)         filter.year         = Number(year);
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;

    if (req.user.role === 'parent') {
      filter.student = { $in: req.user.studentIds || [] };
    }

    const fees = await Fee.find(filter)
      .populate('student',   'firstName lastName admissionNo')
      .populate('classroom', 'displayName')
      .sort({ year: -1, month: -1 });

    r.ok(res, fees);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/fees/:id ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student',   'firstName lastName admissionNo fatherName fatherPhone')
      .populate('classroom', 'displayName');
    if (!fee) return r.notFound(res, 'Fee record not found');
    r.ok(res, fee);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/fees  (generate fee record) ───────────────────
router.post('/', authorize('admin', 'principal'), async (req, res) => {
  try {
    const { tuitionFee, transportFee = 0, activityFee = 0, otherFee = 0, discount = 0 } = req.body;
    const total   = Number(tuitionFee) + Number(transportFee) + Number(activityFee) + Number(otherFee);
    const finalAmt = total - Number(discount);

    const fee = await Fee.create({
      ...req.body,
      totalAmount: total,
      finalAmount: finalAmt,
    });

    await fee.populate('student', 'firstName lastName');
    r.created(res, fee, 'Fee record created');
  } catch (err) {
    if (err.code === 11000) return r.conflict(res, 'Fee record already exists for this student/month');
    r.serverError(res, err.message);
  }
});

// ── PUT /api/fees/:id ────────────────────────────────────────
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!fee) return r.notFound(res, 'Fee record not found');
    r.ok(res, fee, 'Fee updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/fees/:id/pay  (collect payment & generate receipt) ─
router.post('/:id/pay', authorize('admin', 'principal'), async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return r.notFound(res, 'Fee record not found');
    if (fee.status === 'Paid') return r.badRequest(res, 'Fee is already paid');

    const { amountPaid, paymentMode, transactionId, notes } = req.body;
    if (!amountPaid) return r.badRequest(res, 'amountPaid is required');

    const payment = await FeePayment.create({
      fee:          fee._id,
      student:      fee.student,
      amountPaid:   Number(amountPaid),
      paymentDate:  new Date(),
      paymentMode,
      transactionId,
      notes,
      collectedBy:  req.user._id,
      academicYear: fee.academicYear,
    });

    // Update fee status
    const newStatus = Number(amountPaid) >= fee.finalAmount ? 'Paid' : 'PartiallyPaid';
    fee.status = newStatus;
    await fee.save();

    r.ok(res, { payment, receiptNo: payment.receiptNo }, `Payment recorded. Receipt: ${payment.receiptNo}`);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/fees/:id/payments ───────────────────────────────
router.get('/:id/payments', async (req, res) => {
  try {
    const payments = await FeePayment.find({ fee: req.params.id })
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 });
    r.ok(res, payments);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/fees/receipts/all ───────────────────────────────
router.get('/receipts/all', authorize('admin', 'principal'), async (req, res) => {
  try {
    const { studentId, academicYear, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (studentId)    filter.student      = studentId;
    if (academicYear) filter.academicYear = academicYear;

    const total    = await FeePayment.countDocuments(filter);
    const receipts = await FeePayment.find(filter)
      .populate('student', 'firstName lastName admissionNo')
      .populate('fee',     'month year')
      .populate('collectedBy', 'name')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    r.ok(res, receipts, 'Receipts fetched', { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    r.serverError(res, err.message);
  }
});

module.exports = router;