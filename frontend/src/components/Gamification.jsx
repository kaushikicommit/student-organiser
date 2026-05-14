import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Helpers ───────────────────────────────────────────────────
const fmt = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '1rem', padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
    }}>
    <span style={{ fontSize: '1.6rem' }}>{icon}</span>
    <span style={{ fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</span>
    <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
    {sub && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{sub}</span>}
  </motion.div>
);

// ── Achievement badge ─────────────────────────────────────────
const Badge = ({ ach, unlocked, unlockedAt }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.04 }}
    style={{
      background: unlocked ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${unlocked ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '0.85rem', padding: '0.9rem 1rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      opacity: unlocked ? 1 : 0.45,
      position: 'relative', overflow: 'hidden',
    }}>
    {unlocked && (
      <div style={{ position: 'absolute', top: 6, right: 8, fontSize: '0.6rem', color: '#a78bfa', fontWeight: 700 }}>
        UNLOCKED
      </div>
    )}
    <span style={{ fontSize: '1.6rem', flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(1)' }}>
      {ach.icon}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ color: unlocked ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
        {ach.title}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0.1rem 0 0', lineHeight: 1.4 }}>
        {ach.description}
      </p>
      {unlocked && unlockedAt && (
        <p style={{ color: '#a78bfa', fontSize: '0.68rem', margin: '0.2rem 0 0' }}>
          {new Date(unlockedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
        </p>
      )}
    </div>
    <span style={{
      background: unlocked ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
      color: unlocked ? '#c4b5fd' : 'var(--text-muted)',
      borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
      padding: '0.2rem 0.6rem', flexShrink: 0,
    }}>
      +{ach.points}pts
    </span>
  </motion.div>
);

// ── Daily challenge card ──────────────────────────────────────
const DailyChallenge = ({ challenge }) => {
  if (!challenge) return null;
  const pct = Math.min((challenge.progress / challenge.target) * 100, 100);

  return (
    <div style={{
      background: challenge.completed
        ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.1)',
      border: `1px solid ${challenge.completed ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.3)'}`,
      borderRadius: '1rem', padding: '1.1rem 1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>{challenge.completed ? '✅' : '🎯'}</span>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem', margin: 0 }}>
              Daily Challenge
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', margin: '0.1rem 0 0' }}>
              {challenge.description}
            </p>
          </div>
        </div>
        <span style={{
          background: challenge.completed ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)',
          color: challenge.completed ? '#34d399' : '#fbbf24',
          border: `1px solid ${challenge.completed ? 'rgba(52,211,153,0.4)' : 'rgba(251,191,36,0.4)'}`,
          borderRadius: '99px', padding: '0.25rem 0.75rem',
          fontSize: '0.8rem', fontWeight: 700,
        }}>
          +{challenge.points} pts
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '0.4rem' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: 99,
            background: challenge.completed
              ? 'linear-gradient(90deg,#34d399,#059669)'
              : 'linear-gradient(90deg,#fbbf24,#f59e0b)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          Progress: {challenge.progress} / {challenge.target}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
};

// ── Leaderboard ───────────────────────────────────────────────
const Leaderboard = ({ data, myRank, myPoints }) => {
  const medals = ['🥇','🥈','🥉'];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '1rem', padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
          🏆 Weekly Leaderboard
        </h3>
        {myRank && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Your rank: <strong style={{ color: '#fbbf24' }}>#{myRank}</strong>
          </span>
        )}
      </div>

      {data.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', fontSize: '0.85rem' }}>
          No activity this week yet. Start a Pomodoro to appear here!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.map((entry, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.85rem', borderRadius: '0.75rem',
                background: entry.isMe
                  ? 'rgba(124,58,237,0.2)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${entry.isMe ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <span style={{ fontSize: '1.1rem', width: 28, textAlign: 'center', flexShrink: 0 }}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <span style={{ flex: 1, color: entry.isMe ? '#c4b5fd' : 'white', fontWeight: entry.isMe ? 700 : 500, fontSize: '0.88rem' }}>
                {entry.name} {entry.isMe ? '(you)' : ''}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.88rem' }}>
                  {fmt(entry.weeklyMins)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                  {entry.sessions} sessions
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
export default function Gamification() {
  const [stats,       setStats]       = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank,      setMyRank]      = useState(null);
  const [myPoints,    setMyPoints]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [newBadges,   setNewBadges]   = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, lbRes] = await Promise.all([
        api.get('/gamification/stats'),
        api.get('/gamification/leaderboard'),
      ]);
      setStats(statsRes.data);
      setLeaderboard(lbRes.data.leaderboard);
      setMyRank(lbRes.data.myRank);
      setMyPoints(lbRes.data.myTotalPoints);

      // Toast new achievements
      if (statsRes.data.newAchievements?.length > 0) {
        setNewBadges(statsRes.data.newAchievements);
        statsRes.data.newAchievements.forEach(a => {
          toast.success(`${a.icon} Achievement unlocked: ${a.title}!`, { duration: 5000 });
        });
      }
    } catch (err) {
      toast.error('Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  };

  const TABS = ['overview', 'achievements', 'leaderboard'];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      Loading your stats...
    </div>
  );

  if (!stats) return null;

  const unlockedIds = stats.achievements.map(a => a.id);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <motion.button key={t} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '0.45rem 1.1rem', borderRadius: '99px',
              border: activeTab === t ? 'none' : '1px solid rgba(255,255,255,0.2)',
              background: activeTab === t ? 'white' : 'transparent',
              color: activeTab === t ? '#7c3aed' : 'rgba(255,255,255,0.7)',
              fontWeight: activeTab === t ? 700 : 400,
              fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', textTransform: 'capitalize',
            }}>
            {t === 'overview' ? '📊 Overview' : t === 'achievements' ? '🏅 Achievements' : '🏆 Leaderboard'}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Stat grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem' }}>
                <StatCard icon="🔥" value={stats.currentStreak} label="Day Streak"
                  color="#fb923c" sub={`Best: ${stats.longestStreak} days`} />
                <StatCard icon="⭐" value={stats.totalPoints} label="Total Points"
                  color="#fbbf24" sub="Earn more with challenges" />
                <StatCard icon="⏱️" value={fmt(stats.weeklyFocusMins)} label="This Week"
                  color="#60a5fa" sub="Focus time (7 days)" />
                <StatCard icon="🏅" value={`${stats.achievements.length}/${stats.allAchievements.length}`}
                  label="Achievements" color="#a78bfa" sub="Keep going!" />
              </div>

              {/* Streak visual */}
              <div style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '1rem', padding: '1.25rem',
              }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: '0.85rem' }}>
                  🔥 Study Streak
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {Array.from({ length: Math.max(stats.longestStreak, stats.currentStreak, 7) }, (_, i) => (
                    <div key={i} style={{
                      width: 28, height: 28, borderRadius: '6px',
                      background: i < stats.currentStreak
                        ? 'linear-gradient(135deg,#fb923c,#ef4444)'
                        : 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem',
                    }}>
                      {i < stats.currentStreak ? '🔥' : ''}
                    </div>
                  ))}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                    {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''} in a row
                  </span>
                </div>
              </div>

              {/* Daily challenge */}
              <DailyChallenge challenge={stats.todayChallenge} />

              {/* Recent achievements */}
              {stats.achievements.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '1rem', padding: '1.25rem',
                }}>
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: '0.85rem' }}>
                    🏅 Recent Badges
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {stats.achievements.slice(-3).reverse().map(a => {
                      const def = stats.allAchievements.find(x => x.id === a.id) || a;
                      return <Badge key={a.id} ach={def} unlocked unlockedAt={a.unlockedAt} />;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Achievements ── */}
          {activeTab === 'achievements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                {stats.achievements.length} of {stats.allAchievements.length} unlocked
              </p>
              {/* Unlocked first */}
              {stats.allAchievements
                .slice()
                .sort((a, b) => {
                  const aU = unlockedIds.includes(a.id);
                  const bU = unlockedIds.includes(b.id);
                  return bU - aU;
                })
                .map(ach => {
                  const unlocked = unlockedIds.includes(ach.id);
                  const record   = stats.achievements.find(x => x.id === ach.id);
                  return (
                    <Badge key={ach.id} ach={ach} unlocked={unlocked} unlockedAt={record?.unlockedAt} />
                  );
                })}
            </div>
          )}

          {/* ── Leaderboard ── */}
          {activeTab === 'leaderboard' && (
            <Leaderboard data={leaderboard} myRank={myRank} myPoints={myPoints} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}