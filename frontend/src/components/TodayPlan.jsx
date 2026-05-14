import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const loadCachedPlan = () => {
  try {
    const cached = localStorage.getItem('dailyStudyPlan');
    if (!cached) return null;
    const { timestamp, plan } = JSON.parse(cached);
    if (Date.now() - timestamp > 12 * 60 * 60 * 1000) return null;
    return plan;
  } catch { return null; }
};

const savePlan = (plan) => {
  localStorage.setItem('dailyStudyPlan', JSON.stringify({ timestamp: Date.now(), plan }));
};

export default function TodayPlan({ subjects = [], tasks = [], stats, dailyGoal = 240, onNavigateToPomodoro, onChangeGoal }) {
  const [studyPlan, setStudyPlan] = useState([]);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const generatePlan = () => {
    if (!subjects.length) return { items: [], total: 0 };

    // Count high‑priority pending tasks per subject
    const highPriorityTasksBySubject = {};
    tasks.forEach(task => {
      if (!task.completed && task.priority === 'High' && task.subject) {
        highPriorityTasksBySubject[task.subject] = (highPriorityTasksBySubject[task.subject] || 0) + 1;
      }
    });

    // Prepare data for ALL subjects
    const subjectData = subjects.map(subj => {
      const studiedHours = (subj.totalStudied || 0) / 60;
      const remainingHours = Math.max(0, (subj.targetHours || 10) - studiedHours);
      const pendingHigh = highPriorityTasksBySubject[subj.name] || 0;
      return {
        name: subj.name,
        color: subj.color || '#a78bfa',
        remainingHours,
        pendingHigh,
        // Base importance: more urgent tasks = higher bonus
        urgencyBonus: pendingHigh * 15, // extra minutes per urgent task
      };
    });

    // Equal base allocation per subject
    const basePerSubject = Math.floor(dailyGoal / subjectData.length);
    const remainingAfterBase = dailyGoal - (basePerSubject * subjectData.length);

    // Allocate with caps and urgency bonus
    let remainingBonusPool = remainingAfterBase;
    const items = [];
    let totalAllocated = 0;

    // First pass: give each subject base minutes + cap by remaining weekly hours and 45 min max
    for (let subj of subjectData) {
      let suggested = basePerSubject + subj.urgencyBonus;
      // Cap by remaining weekly minutes
      const maxWeekly = subj.remainingHours * 60;
      if (maxWeekly > 0 && suggested > maxWeekly) suggested = maxWeekly;
      // Also cap at 45 minutes per session (reasonable focus)
      if (suggested > 45) suggested = 45;
      if (suggested < 0) suggested = 0;
      items.push({
        name: subj.name,
        color: subj.color,
        minutes: suggested,
        reason: subj.pendingHigh > 0 ? `${subj.pendingHigh} urgent task(s)` : `${subj.remainingHours.toFixed(1)}h left this week`,
      });
      totalAllocated += suggested;
    }

    // Second pass: if totalAllocated is less than dailyGoal, distribute the remaining among subjects
    // (but only to those that still have weekly hours left and are below 45 minutes)
    let remainingToDistribute = dailyGoal - totalAllocated;
    if (remainingToDistribute > 0) {
      let eligible = items.filter((item, idx) => {
        const subj = subjectData[idx];
        const maxWeekly = subj.remainingHours * 60;
        return item.minutes < 45 && (maxWeekly === 0 || item.minutes < maxWeekly);
      });
      while (remainingToDistribute > 0 && eligible.length > 0) {
        for (let i = 0; i < eligible.length && remainingToDistribute > 0; i++) {
          const idx = subjectData.findIndex(s => s.name === eligible[i].name);
          const subj = subjectData[idx];
          const maxWeekly = subj.remainingHours * 60;
          let canAdd = 1;
          if (items[idx].minutes + canAdd > 45) canAdd = 45 - items[idx].minutes;
          if (maxWeekly > 0 && items[idx].minutes + canAdd > maxWeekly) canAdd = maxWeekly - items[idx].minutes;
          if (canAdd <= 0) continue;
          items[idx].minutes += canAdd;
          totalAllocated += canAdd;
          remainingToDistribute -= canAdd;
        }
        // Recompute eligible list in case limits were reached
        eligible = items.filter((item, idx) => {
          const subj = subjectData[idx];
          const maxWeekly = subj.remainingHours * 60;
          return item.minutes < 45 && (maxWeekly === 0 || item.minutes < maxWeekly);
        });
      }
    }

    const total = items.reduce((sum, i) => sum + i.minutes, 0);
    savePlan(items);
    return { items, total };
  };

  useEffect(() => {
    try {
      const cached = loadCachedPlan();
      if (cached) {
        const total = cached.reduce((s, i) => s + i.minutes, 0);
        setStudyPlan(cached);
        setTotalMinutes(total);
      } else {
        const { items, total } = generatePlan();
        setStudyPlan(items);
        setTotalMinutes(total);
      }
    } catch (err) {
      console.error('Plan generation error', err);
      setStudyPlan([]);
      setTotalMinutes(0);
    }
  }, [subjects, tasks, dailyGoal]);

  const refreshPlan = () => {
    const { items, total } = generatePlan();
    setStudyPlan(items);
    setTotalMinutes(total);
  };

  const todayProgress = stats?.totalFocusMinutes || 0;
  const progressPercent = Math.min((todayProgress / dailyGoal) * 100, 100);

  if (!subjects.length && !tasks.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.6)' }}>
        Add subjects and tasks to see your daily study plan.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>📅 Today's Study Plan</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Recommended study time: <strong>{totalMinutes} min</strong> (target: {dailyGoal} min)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={refreshPlan} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.6rem', padding: '0.4rem 1rem', color: 'var(--text)', cursor: 'pointer' }}>
              🔄 Refresh
            </button>
            {onChangeGoal && (
              <button onClick={onChangeGoal} style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '0.6rem', padding: '0.4rem 1rem', color: '#c4b5fd', cursor: 'pointer' }}>
                ✏️ Change Goal
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1rem 1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ color: 'white', fontWeight: 600 }}>🍅 Today's Focus Progress</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{todayProgress} / {dailyGoal} min</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg,#a78bfa,#7c3aed)', borderRadius: 99 }} />
        </div>
        {progressPercent >= 100 && <p style={{ color: '#4ade80', fontSize: '0.75rem', marginTop: '0.5rem' }}>✅ Daily goal achieved! Great job.</p>}
      </div>

      {studyPlan.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>Add subjects to see your daily study plan.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {studyPlan.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '1rem 1.2rem', border: `1px solid ${item.color}40`, cursor: 'pointer' }}
              onClick={() => onNavigateToPomodoro?.(item.name, item.minutes)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ background: 'rgba(124,58,237,0.2)', padding: '0.2rem 0.8rem', borderRadius: '99px', color: '#c4b5fd', fontSize: '0.85rem', fontWeight: 500 }}>{item.minutes} min</span>
                  <span style={{ fontSize: '1.2rem' }}>→</span>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{item.reason}</p>
            </motion.div>
          ))}
          <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
            Plan refreshes every 12 hours • Target: {dailyGoal} min/day
          </div>
        </div>
      )}
    </div>
  );
}