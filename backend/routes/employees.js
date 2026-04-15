// routes/employees.js
const express  = require('express');
const router   = express.Router();
const Employee = require('../models/Employee');
const r        = require('../utils/response');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── GET /api/employees ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { role, status, academicYear, search } = req.query;
    const filter = {};

    if (role)         filter.role         = role;
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;

    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(filter)
      .populate('academicYear', 'name')
      .sort({ name: 1 });

    r.ok(res, employees);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/employees/:id ───────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('academicYear', 'name')
      .populate('user', 'email status');
    if (!employee) return r.notFound(res, 'Employee not found');
    r.ok(res, employee);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/employees ──────────────────────────────────────
router.post('/', authorize('admin', 'principal'), async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    r.created(res, employee, 'Employee created');
  } catch (err) {
    if (err.code === 11000) return r.conflict(res, 'Email or employee ID already exists');
    r.serverError(res, err.message);
  }
});

// ── PUT /api/employees/:id ───────────────────────────────────
router.put('/:id', authorize('admin', 'principal'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!employee) return r.notFound(res, 'Employee not found');
    r.ok(res, employee, 'Employee updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PATCH /api/employees/:id/status ─────────────────────────
router.patch('/:id/status', authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'inactive', 'resigned'];
    if (!allowed.includes(status)) return r.badRequest(res, 'Invalid status');
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!employee) return r.notFound(res, 'Employee not found');
    r.ok(res, employee, 'Status updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── DELETE /api/employees/:id ────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return r.notFound(res, 'Employee not found');
    r.noContent(res);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

module.exports = router;