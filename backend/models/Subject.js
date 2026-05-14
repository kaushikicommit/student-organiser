const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#3B82F6' },
  targetHours: { type: Number, default: 10 },
  studiedToday: { type: Number, default: 0 },
  totalStudied: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Index for faster queries
subjectSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Subject', subjectSchema);