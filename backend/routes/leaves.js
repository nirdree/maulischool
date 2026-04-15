// routes/leaves.js
const express = require('express');
const router  = express.Router();
const { Leave } = require('../models/Others');
const r       = require('../utils/response');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── GET /api/leaves ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { employeeId, status, academicYear } = req.query;
    const filter = {};
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;

    // Teachers can only see their own leaves
    if (req.user.role === 'teacher') {
      filter.employee = req.user.employeeId;
    } else if (employeeId) {
      filter.employee = employeeId;
    }

    const leaves = await Leave.find(filter)
      .populate('employee',   'name employeeId role')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    r.ok(res, leaves);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/leaves  (apply for leave) ─────────────────────
router.post('/', async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;
    const days = Math.ceil(
      (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)
    ) + 1;

    const leave = await Leave.create({ ...req.body, totalDays: days });
    await leave.populate('employee', 'name employeeId');
    r.created(res, leave, 'Leave application submitted');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PATCH /api/leaves/:id/action  (approve / reject) ────────
router.patch('/:id/action', authorize('admin', 'principal'), async (req, res) => {
  try {
    const { status, approvalRemark } = req.body;
    if (!['Approved', 'Rejected'].includes(status))
      return r.badRequest(res, "status must be 'Approved' or 'Rejected'");

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, approvalRemark, approvedBy: req.user._id },
      { new: true }
    ).populate('employee', 'name');

    if (!leave) return r.notFound(res, 'Leave record not found');
    r.ok(res, leave, `Leave ${status.toLowerCase()}`);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PUT /api/leaves/:id ──────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return r.notFound(res, 'Leave not found');
    if (leave.status !== 'Pending') return r.badRequest(res, 'Cannot edit a processed leave');

    Object.assign(leave, req.body);
    await leave.save();
    r.ok(res, leave, 'Leave updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── DELETE /api/leaves/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return r.notFound(res, 'Leave not found');
    if (leave.status !== 'Pending') return r.badRequest(res, 'Cannot delete a processed leave');
    await leave.deleteOne();
    r.noContent(res);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

module.exports = router;