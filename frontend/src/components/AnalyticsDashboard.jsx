import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { pomodoroAPI, subjectsAPI } from '../services/api';
 
// ── Helpers ──────────────────────────────────────────────────
const getLast7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    };
  });
};
 
const getLast30Days = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
};
 
const COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#fb923c',
  '#f472b6', '#facc15', '#38bdf8', '#4ade80',
];
 
// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(20,10,40,0.92)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '0.6rem',
      padding: '0.6rem 0.9rem',
      fontSize: '0.8rem',
      color: 'white',
    }}>
      <p style={{ marginBottom: '0.3rem', color: 'rgba(255,255,255,0.6)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value} min
        </p>
      ))}
    </div>
  );
};
 
// ── Section Wrapper ───────────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: '1.25rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{title}</h3>
    </div>
    {children}
  </div>
);
 
// ── 1. Weekly Study Hours Chart ───────────────────────────────
const WeeklyChart = ({ sessions, subjects }) => {
  const days = getLast7Days();
 
  const data = days.map(({ date, label }) => {
    const row = { day: label };
    subjects.forEach(s => {
      const mins = sessions
        .filter(sess =>
          sess.type === 'Focus' &&
          sess.subject === s.name &&
          sess.completedAt?.split('T')[0] === date
        )
        .reduce((sum, sess) => sum + sess.duration, 0);
      row[s.name] = mins;
    });
    return row;
  });
 
  return (
    <Section title="Weekly Study Hours by Subject" icon="📈">
      {subjects.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>
          No subjects yet. Add subjects to see study trends.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend
              wrapperStyle={{ paddingTop: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}
            />
            {subjects.map((s, i) => (
              <Bar key={s._id} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={32} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Section>
  );
};
 
// ── 2. Productivity Heatmap ───────────────────────────────────
const Heatmap = ({ sessions }) => {
  const days = getLast30Days();
 
  const minutesByDate = {};
  sessions.forEach(s => {
    if (s.type !== 'Focus') return;
    const date = s.completedAt?.split('T')[0];
    if (date) minutesByDate[date] = (minutesByDate[date] || 0) + s.duration;
  });
 
  const maxMins = Math.max(...Object.values(minutesByDate), 1);
 
  const getColor = (mins) => {
    if (!mins) return 'rgba(255,255,255,0.06)';
    const intensity = mins / maxMins;
    if (intensity < 0.25) return 'rgba(167,139,250,0.3)';
    if (intensity < 0.5)  return 'rgba(167,139,250,0.55)';
    if (intensity < 0.75) return 'rgba(167,139,250,0.8)';
    return '#a78bfa';
  };
 
  // Group into weeks (columns)
  const weeks = [];
  let week = [];
  days.forEach((date, i) => {
    week.push(date);
    if (week.length === 7 || i === days.length - 1) {
      weeks.push(week);
      week = [];
    }
  });
 
  return (
    <Section title="30-Day Focus Heatmap" icon="🔥">
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {days.map(date => {
          const mins = minutesByDate[date] || 0;
          const d = new Date(date);
          const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          return (
            <div
              key={date}
              title={`${label}: ${mins} min`}
              style={{
                width: 28, height: 28,
                borderRadius: '5px',
                background: getColor(mins),
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'default',
                transition: 'transform 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1rem' }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>Less</span>
        {['rgba(255,255,255,0.06)', 'rgba(167,139,250,0.3)', 'rgba(167,139,250,0.55)', 'rgba(167,139,250,0.8)', '#a78bfa'].map((c, i) => (
          <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.08)' }} />
        ))}
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>More</span>
      </div>
    </Section>
  );
};
 
// ── 3. Subject Progress Bars ──────────────────────────────────
const ProgressBars = ({ subjects }) => (
  <Section title="Subject Progress (Target Hours)" icon="🎯">
    {subjects.length === 0 ? (
      <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1.5rem' }}>
        No subjects yet.
      </p>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {subjects.map((s, i) => {
          const studied = Math.round(s.totalStudied / 60 * 10) / 10;
          const target = s.targetHours || 1;
          const pct = Math.min((studied / target) * 100, 100);
          const color = COLORS[i % COLORS.length];
          return (
            <div key={s._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color || color }} />
                  <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>
                    {studied}h / {target}h
                  </span>
                  <span style={{
                    background: pct >= 100 ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.2)',
                    color: pct >= 100 ? '#34d399' : color,
                    border: `1px solid ${pct >= 100 ? 'rgba(52,211,153,0.4)' : 'rgba(167,139,250,0.3)'}`,
                    borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600,
                    padding: '0.1rem 0.5rem',
                  }}>
                    {pct >= 100 ? '✓ Done' : `${Math.round(pct)}%`}
                  </span>
                </div>
              </div>
              {/* Track */}
              <div style={{
                height: 8, borderRadius: 99,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 99,
                  background: pct >= 100
                    ? 'linear-gradient(90deg, #34d399, #059669)'
                    : `linear-gradient(90deg, ${color}, ${color}cc)`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </Section>
);
 
// ── 4. Pomodoro Session History ───────────────────────────────
const SessionHistory = ({ sessions }) => {
  const recent = [...sessions]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 10);
 
  const typeConfig = {
    Focus:       { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)', color: '#c4b5fd', icon: '🎯' },
    'Short Break':{ bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.35)',  color: '#6ee7b7', icon: '☕' },
    'Long Break': { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.35)',  color: '#93c5fd', icon: '🌙' },
  };
 
  return (
    <Section title="Pomodoro Session History" icon="⏱️">
      {recent.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '1.5rem' }}>
          No sessions yet. Start a pomodoro to build history!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 320, overflowY: 'auto' }}>
          {recent.map((s, i) => {
            const cfg = typeConfig[s.type] || typeConfig.Focus;
            const date = new Date(s.completedAt);
            return (
              <div key={s._id || i} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                borderRadius: '0.75rem', padding: '0.65rem 0.9rem',
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{s.type}</span>
                    {s.subject && (
                      <span style={{
                        background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.3)',
                        color: '#d8b4fe', borderRadius: '99px', fontSize: '0.7rem', padding: '0.1rem 0.5rem',
                      }}>
                        {s.subject}
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                    {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{
                  color: cfg.color, fontWeight: 700, fontSize: '0.9rem',
                  background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem',
                  padding: '0.2rem 0.6rem', flexShrink: 0,
                }}>
                  {s.duration} min
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
};
 
// ── Main Component ────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const load = async () => {
      try {
        const start = new Date();
        start.setDate(start.getDate() - 30);
 
        const [subRes, sessRes] = await Promise.all([
          subjectsAPI.getAll(),
          pomodoroAPI.getSessions(start.toISOString(), new Date().toISOString()),
        ]);
        setSubjects(subRes.data);
        setSessions(sessRes.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
 
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
        Loading analytics...
      </div>
    );
  }
 
  return (
    <div>
      {/* Summary strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {[
          {
            label: 'Total Focus',
            value: (() => {
              const mins = sessions.filter(s => s.type === 'Focus').reduce((a, s) => a + s.duration, 0);
              return `${Math.floor(mins / 60)}h ${mins % 60}m`;
            })(),
            icon: '⏱️',
            color: '#a78bfa',
          },
          {
            label: 'Sessions (30d)',
            value: sessions.filter(s => s.type === 'Focus').length,
            icon: '🍅',
            color: '#fb923c',
          },
          {
            label: 'Subjects',
            value: subjects.length,
            icon: '📚',
            color: '#60a5fa',
          },
          {
            label: 'Active Days',
            value: new Set(sessions.filter(s=>s.type==='Focus').map(s=>s.completedAt?.split('T')[0])).size,
            icon: '🔥',
            color: '#34d399',
          },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '1rem',
            padding: '1rem 1.2rem',
            display: 'flex', flexDirection: 'column', gap: '0.35rem',
          }}>
            <span style={{ fontSize: '1.4rem' }}>{stat.icon}</span>
            <span style={{ color: stat.color, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>{stat.label}</span>
          </div>
        ))}
      </div>
 
      <WeeklyChart sessions={sessions} subjects={subjects} />
      <Heatmap sessions={sessions} />
      <ProgressBars subjects={subjects} />
      <SessionHistory sessions={sessions} />
    </div>
  );
}
 