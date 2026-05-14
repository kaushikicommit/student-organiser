const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  subjectName: { type: String, required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  type: { type: String, enum: ['Study', 'Break', 'Exercise', 'Other'], default: 'Study' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

scheduleSchema.index({ userId: 1, day: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);