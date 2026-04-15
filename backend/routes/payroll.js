// routes/payroll.js
const express  = require('express');
const router   = express.Router();
const { Payroll } = require('../models/Others');
const Employee = require('../models/Employee');
const r        = require('../utils/response');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'principal'));

// ── GET /api/payroll ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { employeeId, month, year, status, academicYear } = req.query;
    const filter = {};
    if (employeeId)   filter.employee     = employeeId;
    if (month)        filter.month        = Number(month);
    if (year)         filter.year         = Number(year);
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;

    const records = await Payroll.find(filter)
      .populate('employee', 'name employeeId role monthlySalary')
      .sort({ year: -1, month: -1 });

    r.ok(res, records);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/payroll/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id)
      .populate('employee', 'name employeeId role monthlySalary email mobileNo');
    if (!record) return r.notFound(res, 'Payroll record not found');
    r.ok(res, record);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/payroll  (generate) ───────────────────────────
router.post('/', async (req, res) => {
  try {
    const { employee: employeeId, month, year, bonus = 0, paymentMode = 'BankTransfer', academicYear } = req.body;

    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing) return r.conflict(res, 'Payroll already generated for this month');

    const emp = await Employee.findById(employeeId);
    if (!emp) return r.notFound(res, 'Employee not found');

    const workingDays = 26;
    const daysPresent = req.body.daysPresent ?? 24;
    const daysAbsent  = workingDays - daysPresent;
    const perDay      = emp.monthlySalary / workingDays;
    const deductions  = Math.round(daysAbsent * perDay);
    const netSalary   = emp.monthlySalary - deductions + Number(bonus);

    const record = await Payroll.create({
      employee:    employeeId,
      month,
      year,
      basicSalary: emp.monthlySalary,
      daysPresent,
      daysAbsent,
      daysLeave:   req.body.daysLeave || 0,
      deductions,
      bonus:       Number(bonus),
      netSalary,
      paymentMode,
      academicYear,
    });

    await record.populate('employee', 'name employeeId');
    r.created(res, record, 'Payroll generated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PATCH /api/payroll/:id/pay ───────────────────────────────
router.patch('/:id/pay', async (req, res) => {
  try {
    const record = await Payroll.findByIdAndUpdate(
      req.params.id,
      { status: 'Paid', paymentDate: new Date() },
      { new: true }
    ).populate('employee', 'name employeeId');
    if (!record) return r.notFound(res, 'Payroll record not found');
    r.ok(res, record, 'Marked as paid');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PUT /api/payroll/:id ─────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const record = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return r.notFound(res, 'Payroll record not found');
    r.ok(res, record, 'Payroll updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

module.exports = router;