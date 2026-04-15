// routes/timetable.js
const express   = require('express');
const router    = express.Router();
const { Timetable } = require('../models/Others');
const r         = require('../utils/response');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── GET /api/timetable ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { classId, academicYear } = req.query;
    const filter = {};
    if (classId)      filter.classroom    = classId;
    if (academicYear) filter.academicYear = academicYear;

    const timetables = await Timetable.find(filter)
      .populate('classroom', 'displayName')
      .populate('schedule.periods.subject', 'name')
      .populate('schedule.periods.teacher', 'name');

    r.ok(res, timetables);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── GET /api/timetable/:classId ──────────────────────────────
router.get('/:classId', async (req, res) => {
  try {
    const { academicYear } = req.query;
    const filter = { classroom: req.params.classId };
    if (academicYear) filter.academicYear = academicYear;

    const timetable = await Timetable.findOne(filter)
      .populate('classroom', 'displayName')
      .populate('schedule.periods.subject', 'name')
      .populate('schedule.periods.teacher', 'name');

    if (!timetable) return r.notFound(res, 'Timetable not found for this class');
    r.ok(res, timetable);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── POST /api/timetable  (create or replace) ────────────────
router.post('/', authorize('admin', 'principal'), async (req, res) => {
  try {
    const { classroom, academicYear, schedule } = req.body;

    const timetable = await Timetable.findOneAndUpdate(
      { classroom, academicYear },
      { classroom, academicYear, schedule },
      { new: true, upsert: true, runValidators: true }
    ).populate('classroom', 'displayName');

    r.ok(res, timetable, 'Timetable saved');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── PUT /api/timetable/:id ───────────────────────────────────
router.put('/:id', authorize('admin', 'principal'), async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!timetable) return r.notFound(res, 'Timetable not found');
    r.ok(res, timetable, 'Timetable updated');
  } catch (err) {
    r.serverError(res, err.message);
  }
});

// ── DELETE /api/timetable/:id ────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    r.noContent(res);
  } catch (err) {
    r.serverError(res, err.message);
  }
});

module.exports = router;