const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const UserStats        = require('../models/UserStats');
const PomodoroSession  = require('../models/PomodoroSession');
const Subject          = require('../models/Subject');

// ── All routes require auth ───────────────────────────────────
router.use(auth);

// ── Achievement definitions ───────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_session',  title:'First Step',      description:'Complete your first Pomodoro session', icon:'🌱', points:10  },
  { id:'hours_10',       title:'10 Hour Club',     description:'Study for 10 total hours',             icon:'🥉', points:50  },
  { id:'hours_50',       title:'50 Hour Scholar',  description:'Study for 50 total hours',             icon:'🥈', points:150 },
  { id:'hours_100',      title:'Century Mark',     description:'Study for 100 total hours',            icon:'🥇', points:300 },
  { id:'streak_3',       title:'3-Day Streak',     description:'Study 3 days in a row',                icon:'🔥', points:30  },
  { id:'streak_7',       title:'Week Warrior',     description:'Study 7 days in a row',                icon:'⚡', points:100 },
  { id:'streak_30',      title:'Iron Will',        description:'Study 30 days in a row',               icon:'💎', points:500 },
  { id:'multi_subject',  title:'Well Rounded',     description:'Study 3+ different subjects in one day',icon:'🌈', points:40  },
  { id:'challenge_5',    title:'Challenger',       description:'Complete 5 daily challenges',           icon:'🏆', points:80  },
];

// ── Daily challenge pool ──────────────────────────────────────
const CHALLENGES = [
  { challenge:'study_subjects', description:'Study 3 different subjects today',  target:3,  points:30 },
  { challenge:'focus_time',     description:'Complete 2 hours of focus time',    target:120, points:25 },
  { challenge:'sessions',       description:'Complete 4 Pomodoro sessions',      target:4,  points:20 },
  { challenge:'streak',         description:'Maintain your study streak today',  target:1,  points:15 },
];

// ── Helper: today's date string ───────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

// ── Helper: compute streak ────────────────────────────────────
function computeStreak(stats) {
  const t = today();
  const last = stats.lastActiveDate;
  if (!last) return 0;
  if (last === t) return stats.currentStreak; // already counted today

  const diff = Math.floor(
    (new Date(t) - new Date(last)) / (1000 * 60 * 60 * 24)
  );
  if (diff === 1) return stats.currentStreak; // yesterday — keep streak (will increment on update)
  return 0; // gap — streak broken
}

// ── Helper: check & unlock achievements ──────────────────────
function checkAchievements(stats, totalStudiedMins, sessionsCount) {
  const unlocked = stats.achievements.map(a => a.id);
  const newOnes  = [];
  const totalHours = totalStudiedMins / 60;

  const check = (id) => !unlocked.includes(id);

  if (check('first_session') && sessionsCount >= 1)   newOnes.push('first_session');
  if (check('hours_10')      && totalHours >= 10)     newOnes.push('hours_10');
  if (check('hours_50')      && totalHours >= 50)     newOnes.push('hours_50');
  if (check('hours_100')     && totalHours >= 100)    newOnes.push('hours_100');
  if (check('streak_3')      && stats.currentStreak >= 3)  newOnes.push('streak_3');
  if (check('streak_7')      && stats.currentStreak >= 7)  newOnes.push('streak_7');
  if (check('streak_30')     && stats.currentStreak >= 30) newOnes.push('streak_30');

  const completedChallenges = stats.dailyChallenges.filter(c => c.completed).length;
  if (check('challenge_5') && completedChallenges >= 5) newOnes.push('challenge_5');

  return newOnes.map(id => {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    return { ...def, unlockedAt: new Date() };
  });
}

// ═══════════════════════════════════════════════════════════════
// GET /api/v1/gamification/stats
// ═══════════════════════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get or create UserStats
    let stats = await UserStats.findOne({ userId });
    if (!stats) stats = await UserStats.create({ userId });

    // Pull real data
    const t = today();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

    const [sessions, subjects] = await Promise.all([
      PomodoroSession.find({ userId }),
      Subject.find({ userId }),
    ]);

    const focusSessions = sessions.filter(s => s.type === 'Focus');
    const totalStudiedMins = subjects.reduce((a, s) => a + (s.totalStudied || 0), 0);

    // Weekly focus mins
    const weeklyFocusMins = sessions
      .filter(s => s.type === 'Focus' && new Date(s.completedAt) >= weekAgo)
      .reduce((a, s) => a + s.duration, 0);

    // Today's subjects studied
    const todaySessions = sessions.filter(s =>
      s.type === 'Focus' && s.completedAt?.toISOString().split('T')[0] === t
    );
    const todaySubjects = new Set(todaySessions.map(s => s.subject)).size;
    const todayMins     = todaySessions.reduce((a, s) => a + s.duration, 0);
    const todaySessCount = todaySessions.length;

    // Streak logic
    let currentStreak = computeStreak(stats);
    if (stats.lastActiveDate !== t && todaySessCount > 0) {
      // Active today — update streak
      const diff = stats.lastActiveDate
        ? Math.floor((new Date(t) - new Date(stats.lastActiveDate)) / 86400000)
        : 1;
      currentStreak = diff === 1 ? (stats.currentStreak + 1) : 1;
    }
    const longestStreak = Math.max(stats.longestStreak, currentStreak);

    // Daily challenge — assign one if none for today
    let todayChallenge = stats.dailyChallenges.find(c => c.date === t);
    if (!todayChallenge) {
      const pick = CHALLENGES[new Date().getDay() % CHALLENGES.length];
      todayChallenge = { date: t, ...pick, progress: 0, completed: false };
      stats.dailyChallenges.push(todayChallenge);
    }

    // Update challenge progress
    const ch = stats.dailyChallenges.find(c => c.date === t);
    if (ch && !ch.completed) {
      if (ch.challenge === 'study_subjects') ch.progress = todaySubjects;
      if (ch.challenge === 'focus_time')     ch.progress = todayMins;
      if (ch.challenge === 'sessions')       ch.progress = todaySessCount;
      if (ch.challenge === 'streak')         ch.progress = todaySessCount > 0 ? 1 : 0;

      if (ch.progress >= ch.target && !ch.completed) {
        ch.completed = true;
        stats.totalPoints += ch.points;
      }
    }

    // Check achievements
    const newAchievements = checkAchievements(
      stats, totalStudiedMins, focusSessions.length
    );
    if (newAchievements.length > 0) {
      stats.achievements.push(...newAchievements);
      stats.totalPoints += newAchievements.reduce((a, ach) => {
        const def = ACHIEVEMENTS.find(x => x.id === ach.id);
        return a + (def?.points || 0);
      }, 0);
    }

    // Save updated stats
    if (todaySessCount > 0) stats.lastActiveDate = t;
    stats.currentStreak   = currentStreak;
    stats.longestStreak   = longestStreak;
    stats.weeklyFocusMins = weeklyFocusMins;
    stats.updatedAt       = new Date();
    await stats.save();

    res.json({
      totalPoints:     stats.totalPoints,
      currentStreak,
      longestStreak,
      weeklyFocusMins,
      achievements:    stats.achievements,
      allAchievements: ACHIEVEMENTS,
      todayChallenge:  stats.dailyChallenges.find(c => c.date === t),
      newAchievements,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/v1/gamification/leaderboard
// ═══════════════════════════════════════════════════════════════
router.get('/leaderboard', async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Aggregate weekly focus minutes per user
    const results = await PomodoroSession.aggregate([
      { $match: { type: 'Focus', completedAt: { $gte: weekAgo } } },
      { $group: { _id: '$userId', weeklyMins: { $sum: '$duration' }, sessions: { $sum: 1 } } },
      { $sort: { weeklyMins: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { weeklyMins:1, sessions:1, name:'$user.name', _id:1 } },
    ]);

    // Get current user's stats for rank
    const myStats  = await UserStats.findOne({ userId: req.user._id });
    const myRank   = results.findIndex(r => r._id.toString() === req.user._id.toString()) + 1;

    res.json({
      leaderboard: results.map((r, i) => ({
        rank:       i + 1,
        name:       r.name,
        weeklyMins: r.weeklyMins,
        sessions:   r.sessions,
        isMe:       r._id.toString() === req.user._id.toString(),
      })),
      myRank:        myRank || null,
      myTotalPoints: myStats?.totalPoints || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;