const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/Subject');
const { body, validationResult } = require('express-validator');

// GET all subjects (user-specific)
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.user._id }).sort('name');
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create subject (with userId from token)
router.post('/', auth, [
  body('name').notEmpty().withMessage('Subject name is required'),
  body('color').optional().isString(),
  body('targetHours').optional().isInt({ min: 1, max: 168 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const subject = new Subject({
      name: req.body.name,
      color: req.body.color || '#3B82F6',
      targetHours: req.body.targetHours || 10,
      userId: req.user._id,  // ← attach the logged-in user's ID
    });
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'A subject with this name already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT update subject
router.put('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE subject
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST study time
router.post('/:id/study', auth, async (req, res) => {
  try {
    const { minutes } = req.body;
    const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    subject.studiedToday += minutes;
    subject.totalStudied += minutes;
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;