// routes/classrooms.js
const express   = require('express');
const router    = express.Router();
const Classroom = require('../models/Classroom');
const r         = require('../utils/response');
const { protect, authorize } = require('../middleware/auth');


// ── GET /api/classrooms ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { academicYear, isActive } = req.query;
    const filter = {};
    if (academicYear)         filter.academicYear = academicYear;
    if (isActive !== undefined) filter.isActive   = isActive === 'true';

    const classrooms = await Classroom.find(filter)
      .populate('classTeacher', 'name employeeId')
      .populate('academicYear', 'name')
      .sort({ order: 1 });

    r.ok(res, classrooms);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/classrooms/:id ──────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('classTeacher', 'name employeeId email mobileNo')
      .populate('academicYear', 'name');
    if (!classroom) return r.notFound(res, 'Classroom not found');
    r.ok(res, classroom);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/classrooms ─────────────────────────────────────
router.post('/', authorize('admin', 'principal'), protect, async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    r.created(res, classroom, 'Classroom created');
  } catch (err) {
    if (err.code === 11000) return r.conflict(res, 'Classroom with this name/section already exists');
    r.serverError(res, err.message);
  }
});

// ── PUT /api/classrooms/:id ──────────────────────────────────
router.put('/:id', authorize('admin', 'principal'), protect, async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('classTeacher', 'name');
    if (!classroom) return r.notFound(res, 'Classroom not found');
    r.ok(res, classroom, 'Classroom updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PATCH /api/classrooms/:id/toggle ────────────────────────
router.patch('/:id/toggle', authorize('admin'), protect, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return r.notFound(res, 'Classroom not found');
    classroom.isActive = !classroom.isActive;
    await classroom.save();
    r.ok(res, classroom, `Classroom ${classroom.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── DELETE /api/classrooms/:id ───────────────────────────────
router.delete('/:id', authorize('admin'), protect, async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) return r.notFound(res, 'Classroom not found');
    r.noContent(res);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

module.exports = router;