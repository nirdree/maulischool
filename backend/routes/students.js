// routes/students.js
const express  = require('express');
const router   = express.Router();
const Student  = require('../models/Student');
const r        = require('../utils/response');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ── GET /api/students  (list with filters) ───────────────────
router.get('/', async (req, res) => {
  try {
    const { classId, status, academicYear, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (classId)      filter.classroom    = classId;
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;

    // Parents can only see their own children
    if (req.user.role === 'parent') {
      filter._id = { $in: req.user.studentIds || [] };
    }

    if (search) {
      filter.$or = [
        { firstName:   { $regex: search, $options: 'i' } },
        { lastName:    { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { fatherName:  { $regex: search, $options: 'i' } },
      ];
    }

    const total    = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('classroom', 'displayName className section')
      .populate('academicYear', 'name')
      .sort({ rollNumber: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    r.ok(res, students, 'Students fetched', { total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/students/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('classroom', 'displayName className section monthlyFees')
      .populate('academicYear', 'name')
      .populate('user', 'name email');

    if (!student) return r.notFound(res, 'Student not found');

    // Parents can only view their linked children
    if (req.user.role === 'parent' && !req.user.studentIds?.includes(student._id)) {
      return r.forbidden(res);
    }

    r.ok(res, student);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/students  (create / admission) ─────────────────
router.post('/', authorize('admin', 'principal'), async (req, res) => {
  try {
    const student = await Student.create(req.body);
    await student.populate('classroom', 'displayName');
    r.created(res, student, 'Student admission created');
  } catch (err) {
    if (err.code === 11000) return r.conflict(res, 'Duplicate admission number');
    r.serverError(res, err.message);
  }
});

// ── PUT /api/students/:id ────────────────────────────────────
router.put('/:id', authorize('admin', 'principal'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('classroom', 'displayName');

    if (!student) return r.notFound(res, 'Student not found');
    r.ok(res, student, 'Student updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PATCH /api/students/:id/status  (approve / reject / hold) 
router.patch('/:id/status', authorize('admin', 'principal'), async (req, res) => {
  try {
    const { status, rejectionRemark, holdRemark } = req.body;
    const allowed = ['UnderReview', 'Approved', 'Rejected', 'OnHold', 'Left', 'Alumni'];
    if (!allowed.includes(status)) return r.badRequest(res, 'Invalid status');

    const update = { status };
    if (rejectionRemark) update.rejectionRemark = rejectionRemark;
    if (holdRemark)      update.holdRemark      = holdRemark;

    // Auto-assign roll number when approving
    if (status === 'Approved') {
      const student = await Student.findById(req.params.id);
      const count   = await Student.countDocuments({
        classroom: student.classroom, status: 'Approved', _id: { $ne: student._id },
      });
      update.rollNumber = count + 1;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!student) return r.notFound(res, 'Student not found');
    r.ok(res, student, `Status updated to ${status}`);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── DELETE /api/students/:id ─────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return r.notFound(res, 'Student not found');
    r.noContent(res);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

module.exports = router;