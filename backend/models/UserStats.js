const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  id:          { type: String },
  title:       { type: String },
  description: { type: String },
  icon:        { type: String },
  unlockedAt:  { type: Date },
});

const dailyChallengeSchema = new mongoose.Schema({
  date:      { type: String }, // YYYY-MM-DD
  challenge: { type: String },
  target:    { type: Number },
  progress:  { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  points:    { type: Number, default: 0 },
});

const userStatsSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalPoints:      { type: Number, default: 0 },
  currentStreak:    { type: Number, default: 0 },
  longestStreak:    { type: Number, default: 0 },
  lastActiveDate:   { type: String, default: null }, // YYYY-MM-DD
  achievements:     [achievementSchema],
  dailyChallenges:  [dailyChallengeSchema],
  weeklyFocusMins:  { type: Number, default: 0 },
  updatedAt:        { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserStats', userStatsSchema);