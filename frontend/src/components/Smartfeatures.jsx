import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Bell, BellOff, Download, Music, Lightbulb, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
 
// ═══════════════════════════════════════════════════════════════
// 1. 🔔 DAILY REMINDER
// ═══════════════════════════════════════════════════════════════
export function DailyReminder() {
  const [permission, setPermission] = useState(Notification.permission);
  const [reminderTime, setReminderTime] = useState(
    () => localStorage.getItem('reminderTime') || '09:00'
  );
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('reminderEnabled') === 'true'
  );
  const timerRef = useRef(null);
 
  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      new Notification('🎓 Study Reminder Set!', {
        body: `You'll be reminded to study at ${reminderTime} every day.`,
        icon: '/favicon.ico',
      });
    }
  };
 
  const scheduleReminder = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled || permission !== 'granted') return;
 
    const now = new Date();
    const [h, m] = reminderTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
 
    const ms = target - now;
    timerRef.current = setTimeout(() => {
      new Notification('📚 Time to Study!', {
        body: 'Your daily study session is starting. Open your organiser!',
        icon: '/favicon.ico',
      });
      scheduleReminder(); // reschedule for next day
    }, ms);
  };
 
  useEffect(() => {
    scheduleReminder();
    return () => clearTimeout(timerRef.current);
  }, [enabled, reminderTime, permission]);
 
  const toggle = () => {
    if (!enabled && permission !== 'granted') { requestPermission(); return; }
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem('reminderEnabled', String(next));
  };
 
  const saveTime = (t) => {
    setReminderTime(t);
    localStorage.setItem('reminderTime', t);
  };
 
  return (
    <div style={featureCard}>
      <div style={featureHeader}>
        <div style={iconWrap('rgba(251,146,60,0.2)')}>
          {enabled ? <Bell size={18} color="#fb923c" /> : <BellOff size={18} color="#fb923c" />}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={featureTitle}>Daily Study Reminder</h3>
          <p style={featureSub}>Get a browser notification to study every day</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={toggle}
          style={{
            ...toggleBtn,
            background: enabled ? '#7c3aed' : 'rgba(255,255,255,0.1)',
          }}
        >
          {enabled ? 'On' : 'Off'}
        </motion.button>
      </div>
 
      {permission === 'denied' && (
        <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          ⚠️ Notifications blocked. Enable them in your browser settings.
        </p>
      )}
 
      {enabled && permission === 'granted' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Remind me at</label>
          <input
            type="time"
            value={reminderTime}
            onChange={e => saveTime(e.target.value)}
            style={{ ...inputSm, colorScheme: 'dark', width: 'auto' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>every day</span>
        </motion.div>
      )}
    </div>
  );
}
 
// ═══════════════════════════════════════════════════════════════
// 2. 🤖 AI STUDY SUGGESTIONS
// ═══════════════════════════════════════════════════════════════
export function AIStudySuggestions({ subjects, tasks }) {
  const suggestions = useMemo(() => {
    if (!subjects?.length) return [];
    const results = [];
 
    // Find subjects with high pending tasks but low study time
    const pendingBySubject = {};
    tasks?.filter(t => !t.completed).forEach(t => {
      if (t.subject) pendingBySubject[t.subject] = (pendingBySubject[t.subject] || 0) + 1;
    });
 
    // Sort subjects: most neglected first (low study time, high pending tasks)
    const scored = subjects.map(s => {
      const studiedHours = s.totalStudied / 60;
      const pending = pendingBySubject[s.name] || 0;
      const targetGap = Math.max(0, (s.targetHours || 0) - studiedHours);
      const score = (pending * 3) + (targetGap * 2) + (1 / (studiedHours + 1));
      return { ...s, pending, studiedHours, targetGap, score };
    }).sort((a, b) => b.score - a.score);
 
    // Top suggestion
    if (scored[0]) {
      const s = scored[0];
      results.push({
        icon: '🔥',
        color: '#f87171',
        title: `Focus on ${s.name}`,
        reason: s.pending > 0
          ? `You have ${s.pending} pending task${s.pending > 1 ? 's' : ''} and only ${Math.round(s.studiedHours * 10) / 10}h studied.`
          : `You're ${Math.round(s.targetGap * 10) / 10}h behind your weekly target.`,
      });
    }
 
    // Subject with overdue high-priority tasks
    const highPriority = tasks?.find(t => !t.completed && t.priority === 'High');
    if (highPriority) {
      results.push({
        icon: '⚡',
        color: '#fbbf24',
        title: `High priority: "${highPriority.title}"`,
        reason: highPriority.subject
          ? `This ${highPriority.subject} task needs attention now.`
          : 'This urgent task is still pending.',
      });
    }
 
    // Streak encouragement
    if (scored.length > 1) {
      const least = scored[scored.length - 1];
      results.push({
        icon: '📖',
        color: '#60a5fa',
        title: `Don't neglect ${least.name}`,
        reason: `Only ${Math.round(least.studiedHours * 10) / 10}h studied — give it 25 minutes today.`,
      });
    }
 
    // General tip if nothing else
    if (results.length === 0) {
      results.push({
        icon: '✨',
        color: '#a78bfa',
        title: 'Great job staying on track!',
        reason: 'All subjects look balanced. Keep up the momentum!',
      });
    }
 
    return results.slice(0, 3);
  }, [subjects, tasks]);
 
  return (
    <div style={featureCard}>
      <div style={featureHeader}>
        <div style={iconWrap('rgba(167,139,250,0.2)')}>
          <Lightbulb size={18} color="#a78bfa" />
        </div>
        <div>
          <h3 style={featureTitle}>AI Study Suggestions</h3>
          <p style={featureSub}>Personalised recommendations based on your data</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.85rem' }}>
        {suggestions.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem', padding: '0.75rem 0.9rem',
            }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{s.icon}</span>
            <div>
              <p style={{ color: s.color, fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.15rem' }}>{s.title}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.45 }}>{s.reason}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
 
// ═══════════════════════════════════════════════════════════════
// 3. 🎵 FOCUS MUSIC PLAYER
// ═══════════════════════════════════════════════════════════════
const STATIONS = [
  { name: 'Lofi Hip Hop',     url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0',  emoji: '🎵' },
  { name: 'Jazz for Study',   url: 'https://www.youtube.com/embed/vmDDOFXSgAs?autoplay=0',  emoji: '🎷' },
  { name: 'Classical Focus',  url: 'https://www.youtube.com/embed/4vIiKo0y7-k?autoplay=0',  emoji: '🎻' },
  { name: 'Ambient Chillout', url: 'https://www.youtube.com/embed/lTRiuFIWV54?autoplay=0',  emoji: '🌊' },
];
 
export function FocusMusicPlayer() {
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState(0);
 
  return (
    <div style={featureCard}>
      <div style={{ ...featureHeader, cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
        <div style={iconWrap('rgba(52,211,153,0.2)')}>
          <Music size={18} color="#34d399" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={featureTitle}>Focus Music Player</h3>
          <p style={featureSub}>Lofi, jazz, classical &amp; ambient streams</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} color="var(--text-muted)" />
        </motion.div>
      </div>
 
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Station tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.85rem 0 0.75rem' }}>
              {STATIONS.map((st, i) => (
                <motion.button key={i} whileTap={{ scale: 0.95 }}
                  onClick={() => setActive(i)}
                  style={{
                    padding: '0.35rem 0.8rem', borderRadius: '99px', fontSize: '0.78rem',
                    border: active === i ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    background: active === i ? '#7c3aed' : 'rgba(255,255,255,0.07)',
                    color: active === i ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>
                  {st.emoji} {st.name}
                </motion.button>
              ))}
            </div>
 
            {/* YouTube embed */}
            <div style={{ borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
              <iframe
                key={active}
                width="100%" height="100%"
                src={STATIONS[active].url}
                title={STATIONS[active].name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 'none', display: 'block' }}
              />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.4rem', textAlign: 'center' }}>
              ▶ Click play inside the player to start music
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
 
// ═══════════════════════════════════════════════════════════════
// 4. 📥 EXPORT DATA
// ═══════════════════════════════════════════════════════════════
export function ExportData({ tasks, subjects }) {
  const [open, setOpen] = useState(false);
 
  const exportTasksCSV = () => {
    const headers = ['Title', 'Description', 'Subject', 'Priority', 'Due Date', 'Completed'];
    const rows = tasks.map(t => [
      `"${t.title?.replace(/"/g, '""') || ''}"`,
      `"${t.description?.replace(/"/g, '""') || ''}"`,
      `"${t.subject || ''}"`,
      t.priority || '',
      t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '',
      t.completed ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    downloadFile(csv, 'tasks.csv', 'text/csv');
  };
 
  const exportSubjectsCSV = () => {
    const headers = ['Name', 'Color', 'Target Hours', 'Total Studied (min)', 'Total Studied (h)'];
    const rows = subjects.map(s => [
      `"${s.name}"`,
      s.color || '',
      s.targetHours || 0,
      s.totalStudied || 0,
      Math.round((s.totalStudied || 0) / 60 * 10) / 10,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    downloadFile(csv, 'subjects.csv', 'text/csv');
  };
 
  const exportTasksPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(60, 20, 120);
    doc.text('Student Organiser — Tasks', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);
 
    autoTable(doc, {
      startY: 34,
      head: [['Title', 'Subject', 'Priority', 'Due Date', 'Done']],
      body: tasks.map(t => [
        t.title || '',
        t.subject || '—',
        t.priority || '',
        t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB') : '—',
        t.completed ? '✓' : '○',
      ]),
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
    });
 
    doc.save('tasks.pdf');
  };
 
  const exportSubjectsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(60, 20, 120);
    doc.text('Student Organiser — Subjects', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);
 
    autoTable(doc, {
      startY: 34,
      head: [['Subject', 'Target (h/wk)', 'Studied (h)', 'Progress']],
      body: subjects.map(s => {
        const studied = Math.round((s.totalStudied || 0) / 60 * 10) / 10;
        const pct = s.targetHours ? Math.round((studied / s.targetHours) * 100) : 0;
        return [s.name, s.targetHours || 0, studied, `${pct}%`];
      }),
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
    });
 
    doc.save('subjects.pdf');
  };
 
  return (
    <div style={featureCard}>
      <div style={{ ...featureHeader, cursor: 'pointer' }} onClick={() => setOpen(p => !p)}>
        <div style={iconWrap('rgba(96,165,250,0.2)')}>
          <Download size={18} color="#60a5fa" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={featureTitle}>Export Data</h3>
          <p style={featureSub}>Download tasks &amp; subjects as PDF or CSV</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} color="var(--text-muted)" />
        </motion.div>
      </div>
 
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.85rem' }}>
              {[
                { label: '📋 Tasks CSV',     action: exportTasksCSV,     color: '#34d399' },
                { label: '📋 Subjects CSV',  action: exportSubjectsCSV,  color: '#34d399' },
                { label: '📄 Tasks PDF',     action: exportTasksPDF,     color: '#f472b6' },
                { label: '📄 Subjects PDF',  action: exportSubjectsPDF,  color: '#f472b6' },
              ].map((btn, i) => (
                <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={btn.action}
                  style={{
                    padding: '0.6rem 0.5rem', borderRadius: '0.6rem', fontSize: '0.82rem',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    color: btn.color, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600,
                    transition: 'background 0.15s',
                  }}>
                  {btn.label}
                </motion.button>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.6rem', textAlign: 'center' }}>
              {tasks.length} tasks · {subjects.length} subjects ready to export
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
 
// ═══════════════════════════════════════════════════════════════
// 5. 🔍 GLOBAL SEARCH BAR (exported as hook + UI separately)
// ═══════════════════════════════════════════════════════════════
export function GlobalSearch({ tasks, subjects, onNavigate }) {
  const [query,   setQuery]   = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
 
  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
      if (e.key === 'Escape') {
        setQuery('');
        setFocused(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
 
  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const out = [];
 
    tasks?.forEach(t => {
      if (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q)
      ) {
        out.push({ type: 'task', icon: '✅', label: t.title, sub: t.subject || t.priority, id: t._id, tab: 'tasks' });
      }
    });
 
    subjects?.forEach(s => {
      if (s.name?.toLowerCase().includes(q)) {
        out.push({ type: 'subject', icon: '📚', label: s.name, sub: `${Math.floor((s.totalStudied||0)/60)}h studied`, id: s._id, tab: 'subjects' });
      }
    });
 
    return out.slice(0, 8);
  }, [query, tasks, subjects]);
 
  const showDropdown = focused && (results.length > 0 || query.length >= 2);
 
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--card-bg)',
        border: `1px solid ${focused ? 'rgba(124,58,237,0.6)' : 'var(--card-border)'}`,
        borderRadius: '0.75rem', padding: '0.5rem 0.85rem',
        transition: 'border-color 0.2s',
        backdropFilter: 'blur(12px)',
      }}>
        <Search size={16} color="var(--text-muted)" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tasks, subjects… (Ctrl+K)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        {query && (
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)', display: 'flex' }}>
            <X size={14} />
          </motion.button>
        )}
      </div>
 
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
              background: 'rgba(20,10,50,0.97)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '0.85rem',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {results.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>
                No results for "{query}"
              </div>
            ) : (
              results.map((r, i) => (
                <motion.div key={r.id + r.type}
                  whileHover={{ background: 'rgba(124,58,237,0.2)' }}
                  onClick={() => { onNavigate(r.tab); setQuery(''); setFocused(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.9rem', cursor: 'pointer',
                    borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.15s',
                  }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {highlight(r.label, query)}
                    </p>
                    {r.sub && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>{r.sub}</p>}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', flexShrink: 0 }}>
                    {r.tab}
                  </span>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
 
// Highlight matching text
function highlight(text, query) {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(167,139,250,0.4)', color: '#e9d5ff', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
 
// ── Shared micro-styles ───────────────────────────────────────
const featureCard = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '1rem',
  padding: '1.1rem 1.25rem',
  marginBottom: '1rem',
};
 
const featureHeader = {
  display: 'flex', alignItems: 'center', gap: '0.85rem',
};
 
const featureTitle = {
  color: 'var(--text)', fontWeight: 700, fontSize: '0.95rem', margin: 0,
};
 
const featureSub = {
  color: 'var(--text-muted)', fontSize: '0.76rem', margin: '0.1rem 0 0',
};
 
const iconWrap = (bg) => ({
  background: bg, borderRadius: '0.6rem',
  padding: '0.45rem', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
});
 
const toggleBtn = {
  border: 'none', borderRadius: '99px',
  padding: '0.3rem 0.9rem', color: 'white',
  cursor: 'pointer', fontWeight: 600,
  fontSize: '0.8rem', fontFamily: 'Inter, sans-serif',
  transition: 'background 0.2s',
};
 
const inputSm = {
  padding: '0.35rem 0.65rem',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '0.5rem', color: 'white',
  fontSize: '0.85rem', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};
 
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
 