const mongoose = require('mongoose');

const pomodoroSessionSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  completedAt: { type: Date, default: Date.now },
  type: { type: String, enum: ['Focus', 'Break'], default: 'Focus' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

pomodoroSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('PomodoroSession', pomodoroSessionSchema);