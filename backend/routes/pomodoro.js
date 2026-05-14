const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PomodoroSession = require('../models/PomodoroSession');
const Subject = require('../models/Subject');
const { body, validationResult } = require('express-validator');

router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessions = await PomodoroSession.find({
      userId: req.user._id,
      completedAt: { $gte: today }
    });
    const totalFocusMinutes = sessions
      .filter(s => s.type === 'Focus')
      .reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.filter(s => s.type === 'Focus').length;
    res.json({ totalFocusMinutes, totalSessions, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/complete', auth, [
  body('subject').notEmpty(),
  body('duration').isInt({ min: 1 }),
  body('type').isIn(['Focus', 'Break']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { subject, duration, type } = req.body;
    const session = new PomodoroSession({ subject, duration, type, userId: req.user._id });
    await session.save();
    if (type === 'Focus') {
      const subjectDoc = await Subject.findOne({ name: subject, userId: req.user._id });
      if (subjectDoc) {
        subjectDoc.studiedToday += duration;
        subjectDoc.totalStudied += duration;
        await subjectDoc.save();
      }
    }
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// New endpoint for all sessions (used by gamification)
router.get('/all-sessions', auth, async (req, res) => {
  try {
    const sessions = await PomodoroSession.find({ userId: req.user._id, type: 'Focus' }).sort('completedAt');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;