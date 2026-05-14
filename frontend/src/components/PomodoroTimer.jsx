import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pomodoroAPI, subjectsAPI } from '../services/api';
import toast from 'react-hot-toast';

const SHORT_BREAK = 5;
const LONG_BREAK  = 10;
const STORAGE_KEY = 'pomodoroFocusMins';
const PRESET_OPTIONS = [15, 25, 30, 45, 50, 60, 90];

const fmt = (secs) => {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
};

const getSaved = () => {
  const v = parseInt(localStorage.getItem(STORAGE_KEY));
  return isNaN(v) || v < 1 ? null : v;
};

const modeDuration = (m, fMins) => {
  if (m === 'Focus') return fMins * 60;
  if (m === 'Short Break') return SHORT_BREAK * 60;
  return LONG_BREAK * 60;
};

function SetupScreen({ onDone, initialValue }) {
  const [selected,  setSelected]  = useState(initialValue || 25);
  const [custom,    setCustom]    = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const finalVal = useCustom ? parseInt(custom) : selected;
  const valid    = !isNaN(finalVal) && finalVal >= 1 && finalVal <= 180;

  const confirm = () => {
    if (!valid) { toast.error('Enter a number between 1 and 180'); return; }
    localStorage.setItem(STORAGE_KEY, finalVal);
    onDone(finalVal);
  };

  return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'1.25rem', padding:'2.5rem 2rem', textAlign:'center', maxWidth:440, margin:'0 auto' }}>
      <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🍅</div>
      <h2 style={{ color:'white', fontWeight:800, fontSize:'1.5rem', marginBottom:'0.5rem' }}>Set Your Focus Time</h2>
      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.85rem', marginBottom:'2rem' }}>
        How long do you want to focus?<br />
        <strong style={{ color:'rgba(255,255,255,0.85)' }}>Short break = 5 min · Long break = 10 min</strong>
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.6rem', justifyContent:'center', marginBottom:'1.25rem' }}>
        {PRESET_OPTIONS.map(opt => (
          <motion.button key={opt} whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}
            onClick={() => { setSelected(opt); setUseCustom(false); }}
            style={{
              padding:'0.55rem 1.1rem', borderRadius:'99px',
              border: !useCustom && selected===opt ? 'none' : '1px solid rgba(255,255,255,0.25)',
              background: !useCustom && selected===opt ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.1)',
              color:'white', fontWeight: !useCustom && selected===opt ? 700 : 400,
              fontSize:'0.9rem', cursor:'pointer', fontFamily:'Inter,sans-serif',
            }}>
            {opt} min
          </motion.button>
        ))}
      </div>
      <div style={{ marginBottom:'1.75rem' }}>
        <button onClick={() => setUseCustom(p => !p)}
          style={{ background:'none', border:'1px dashed rgba(255,255,255,0.3)', borderRadius:'99px', color:'rgba(255,255,255,0.7)', padding:'0.4rem 1rem', cursor:'pointer', fontSize:'0.82rem', fontFamily:'Inter,sans-serif', marginBottom: useCustom ? '0.75rem' : 0 }}>
          ✏️ Custom duration
        </button>
        <AnimatePresence>
          {useCustom && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', justifyContent:'center', marginTop:'0.75rem' }}>
                <input type="number" min="1" max="180" value={custom}
                  onChange={e => setCustom(e.target.value)} placeholder="e.g. 45" autoFocus
                  style={{ width:90, padding:'0.55rem 0.75rem', textAlign:'center', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'0.6rem', color:'white', fontSize:'1.1rem', outline:'none', fontFamily:'Inter,sans-serif' }} />
                <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.9rem' }}>minutes</span>
              </div>
              {custom && !valid && <p style={{ color:'#f87171', fontSize:'0.75rem', marginTop:'0.4rem' }}>Enter a number between 1 and 180</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={confirm}
        disabled={useCustom && !valid}
        style={{ width:'100%', padding:'0.85rem', background:(useCustom && !valid) ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#a855f7)', border:'none', borderRadius:'0.75rem', color:'white', fontWeight:700, fontSize:'1rem', cursor:(useCustom && !valid) ? 'not-allowed' : 'pointer', fontFamily:'Inter,sans-serif' }}>
        Start with {valid ? (useCustom ? custom : selected) : '?'} min focus ✓
      </motion.button>
    </motion.div>
  );
}

function SettingsPanel({ currentMins, onSave, onClose }) {
  const [selected,  setSelected]  = useState(currentMins);
  const [custom,    setCustom]    = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const finalVal = useCustom ? parseInt(custom) : selected;
  const valid    = !isNaN(finalVal) && finalVal >= 1 && finalVal <= 180;

  return (
    <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
      style={{ background:'rgba(10,5,30,0.95)', border:'1px solid rgba(124,58,237,0.4)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem', backdropFilter:'blur(16px)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
        <h3 style={{ color:'white', fontWeight:700, fontSize:'1rem', margin:0 }}>⚙️ Focus Duration</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'1.1rem' }}>✕</button>
      </div>
      <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.75rem', marginBottom:'1rem' }}>Break times are fixed — Short: 5 min · Long: 10 min</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'1rem' }}>
        {PRESET_OPTIONS.map(opt => (
          <motion.button key={opt} whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}
            onClick={() => { setSelected(opt); setUseCustom(false); }}
            style={{ padding:'0.4rem 0.9rem', borderRadius:'99px', border: !useCustom && selected===opt ? 'none' : '1px solid rgba(255,255,255,0.2)', background: !useCustom && selected===opt ? '#7c3aed' : 'rgba(255,255,255,0.07)', color:'white', fontWeight: !useCustom && selected===opt ? 700 : 400, fontSize:'0.82rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            {opt}m
          </motion.button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1rem' }}>
        <input type="number" min="1" max="180" placeholder="Custom (1–180)" value={custom}
          onFocus={() => setUseCustom(true)}
          onChange={e => { setCustom(e.target.value); setUseCustom(true); }}
          style={{ flex:1, padding:'0.5rem 0.75rem', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'0.6rem', color:'white', fontSize:'0.88rem', outline:'none', fontFamily:'Inter,sans-serif' }} />
        <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.82rem', flexShrink:0 }}>min</span>
      </div>
      <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
        onClick={() => { if (valid) { localStorage.setItem(STORAGE_KEY, finalVal); onSave(finalVal); } }}
        disabled={!valid}
        style={{ width:'100%', padding:'0.65rem', background: valid ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(124,58,237,0.3)', border:'none', borderRadius:'0.6rem', color:'white', fontWeight:600, fontSize:'0.9rem', cursor: valid ? 'pointer' : 'not-allowed', fontFamily:'Inter,sans-serif' }}>
        Save — {valid ? finalVal : '?'} min focus
      </motion.button>
    </motion.div>
  );
}

const PomodoroTimer = ({ initialSubject, initialDuration, onSessionComplete }) => {
  const savedMins = getSaved();

  const effectiveSaved = initialDuration ? initialDuration : savedMins;
  const [setupDone, setSetupDone] = useState(!!effectiveSaved);
  const [focusMins, setFocusMins] = useState(effectiveSaved || 25);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState('Focus');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState((effectiveSaved || 25) * 60);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [initialDurationApplied, setInitialDurationApplied] = useState(false);

  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const modeRef = useRef(mode);
  const focusMinsRef = useRef(focusMins);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { focusMinsRef.current = focusMins; }, [focusMins]);

  useEffect(() => { fetchSubjects(); fetchStats(); }, []);

  // Apply initial subject
  useEffect(() => {
    if (initialSubject && subjects.length > 0) {
      const match = subjects.find(s => s.name === initialSubject);
      if (match && selectedSubject !== match.name) setSelectedSubject(match.name);
    }
  }, [initialSubject, subjects, selectedSubject]);

  // Apply initial focus duration
  useEffect(() => {
    if (initialDuration && initialDuration > 0 && !initialDurationApplied && !isActive) {
      if (initialDuration !== focusMins) {
        setFocusMins(initialDuration);
        focusMinsRef.current = initialDuration;
        setTimeLeft(initialDuration * 60);
        localStorage.setItem(STORAGE_KEY, initialDuration);
        toast.success(`⏱️ Focus set to ${initialDuration} minutes for ${initialSubject || 'this subject'}`, { duration: 3000 });
        setInitialDurationApplied(true);
        if (!setupDone) setSetupDone(true);
      } else {
        setInitialDurationApplied(true);
      }
    }
  }, [initialDuration, initialDurationApplied, focusMins, isActive, setupDone, initialSubject]);

  const fetchSubjects = async () => {
    try {
      const res = await subjectsAPI.getAll();
      setSubjects(res.data);
      if (res.data.length > 0 && !selectedSubject) setSelectedSubject(res.data[0].name);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await pomodoroAPI.getStats();
      setStats(res.data);
    } catch {}
  };

  const startTicking = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setTimeLeft(0);
        setIsActive(false);
        handleComplete();
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
  }, []);

  const handleComplete = useCallback(async () => {
    const currentMode = modeRef.current;
    const currentFocusMins = focusMinsRef.current;

    if (Notification.permission === 'granted') {
      new Notification(
        currentMode === 'Focus' ? '🍅 Focus session complete!' : '⚡ Break over!',
        { body: currentMode === 'Focus' ? 'Time for a break.' : 'Back to focus!', icon: '/favicon.ico' }
      );
    }

    try {
      const duration = currentMode === 'Focus' ? currentFocusMins
        : currentMode === 'Short Break' ? SHORT_BREAK : LONG_BREAK;
      await pomodoroAPI.completeSession({
        subject: selectedSubject || 'General',
        duration,
        type: currentMode === 'Focus' ? 'Focus' : 'Break',
      });
      fetchStats();
      // Notify parent to refresh subjects & tasks so daily plan updates
      if (currentMode === 'Focus' && onSessionComplete) {
        onSessionComplete();
      }
    } catch (err) {
      console.error('Session save error', err);
    }

    if (currentMode === 'Focus') {
      setSessionsDone(prev => {
        const done = prev + 1;
        const next = done % 4 === 0 ? 'Long Break' : 'Short Break';
        toast.success('🍅 Focus done! Break time.', { duration:3000 });
        setMode(next);
        modeRef.current = next;
        setTimeLeft(modeDuration(next, currentFocusMins));
        return done;
      });
    } else {
      toast('⚡ Break over — back to focus!', { icon:'🍅', duration:3000 });
      setMode('Focus');
      modeRef.current = 'Focus';
      setTimeLeft(modeDuration('Focus', currentFocusMins));
    }
  }, [selectedSubject, onSessionComplete]);

  const start = () => {
    if (!selectedSubject && mode === 'Focus') {
      toast.error('Please select a subject first');
      return;
    }
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsActive(true);
    startTicking();
  };

  const pause = () => {
    clearInterval(intervalRef.current);
    if (endTimeRef.current) {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      setTimeLeft(Math.max(0, remaining));
    }
    endTimeRef.current = null;
    setIsActive(false);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    endTimeRef.current = null;
    setIsActive(false);
    setTimeLeft(modeDuration(mode, focusMins));
  };

  const switchMode = (m) => {
    clearInterval(intervalRef.current);
    endTimeRef.current = null;
    setIsActive(false);
    setMode(m);
    modeRef.current = m;
    setTimeLeft(modeDuration(m, focusMins));
  };

  const handleSetupDone = (mins) => {
    setFocusMins(mins);
    focusMinsRef.current = mins;
    setSetupDone(true);
    setTimeLeft(mins * 60);
  };

  const handleSettingsSave = (mins) => {
    setFocusMins(mins);
    focusMinsRef.current = mins;
    setShowSettings(false);
    if (mode === 'Focus') {
      clearInterval(intervalRef.current);
      endTimeRef.current = null;
      setIsActive(false);
      setTimeLeft(mins * 60);
      toast.success(`Focus time updated to ${mins} minutes!`);
    }
  };

  const CIRC   = 2 * Math.PI * 90;
  const total  = modeDuration(mode, focusMins);
  const offset = CIRC * (1 - Math.max(0, timeLeft) / total);

  const modeColors = {
    'Focus':       { ring:'#a78bfa', label:'🍅 Focus' },
    'Short Break': { ring:'#34d399', label:'☕ Short Break' },
    'Long Break':  { ring:'#60a5fa', label:'🌙 Long Break' },
  };
  const mc = modeColors[mode];

  if (!setupDone) {
    return <div style={{ padding:'1rem' }}><SetupScreen onDone={handleSetupDone} initialValue={initialDuration || 25} /></div>;
  }

  return (
    <div style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(16px)', borderRadius:'1.25rem', padding:'2rem', border:'1px solid rgba(255,255,255,0.15)', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', maxWidth:440, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h2 style={{ color:'white', fontWeight:700, fontSize:'1.2rem', margin:0 }}>🍅 Pomodoro Timer</h2>
        <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.93 }}
          onClick={() => setShowSettings(p => !p)}
          style={{ background: showSettings ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'0.6rem', padding:'0.4rem 0.85rem', color:'white', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, fontFamily:'Inter,sans-serif' }}>
          ⚙️ {focusMins}min focus
        </motion.button>
      </div>

      {isActive && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:'0.6rem', padding:'0.5rem 0.85rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ fontSize:'0.85rem' }}>✅</span>
          <span style={{ color:'#6ee7b7', fontSize:'0.78rem', fontWeight:500 }}>Timer runs in background — you can safely switch tabs or open a PDF</span>
        </motion.div>
      )}

      <AnimatePresence>
        {showSettings && <SettingsPanel currentMins={focusMins} onSave={handleSettingsSave} onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      <div style={{ display:'flex', gap:'0.4rem', justifyContent:'center', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {['Focus','Short Break','Long Break'].map(m => (
          <motion.button key={m} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            onClick={() => switchMode(m)}
            style={{ padding:'0.4rem 0.9rem', borderRadius:'99px', fontSize:'0.8rem', border: mode===m ? `1px solid ${modeColors[m].ring}` : '1px solid rgba(255,255,255,0.2)', background: mode===m ? `${modeColors[m].ring}22` : 'transparent', color: mode===m ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: mode===m ? 700 : 400, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            {modeColors[m].label}
          </motion.button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.5rem' }}>
        <div style={{ position:'relative', width:210, height:210 }}>
          <svg width="210" height="210" viewBox="0 0 210 210" style={{ position:'absolute', top:0, left:0 }}>
            <circle cx="105" cy="105" r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle cx="105" cy="105" r="90" fill="none"
              stroke={mc.ring} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={offset}
              transform="rotate(-90 105 105)"
              style={{ transition:'stroke-dashoffset 0.6s linear' }} />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'3rem', fontWeight:800, color:'white', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{fmt(timeLeft)}</span>
            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.78rem', marginTop:'0.35rem' }}>
              {mode==='Focus' ? `${focusMins} min session` : mode==='Short Break' ? '5 min break' : '10 min break'}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.85rem' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i < (sessionsDone % 4) ? mc.ring : 'rgba(255,255,255,0.15)', transition:'background 0.3s' }} />
          ))}
        </div>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.72rem', marginTop:'0.35rem' }}>{sessionsDone} session{sessionsDone !== 1 ? 's' : ''} completed today</p>
      </div>

      {mode === 'Focus' && (
        <div style={{ marginBottom:'1.25rem' }}>
          <label style={{ display:'block', color:'rgba(255,255,255,0.6)', fontSize:'0.78rem', marginBottom:'0.4rem' }}>Studying:</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
            style={{ width:'100%', padding:'0.55rem 0.75rem', background:'rgba(30,20,60,0.85)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'0.6rem', color:'white', fontSize:'0.9rem', outline:'none', fontFamily:'Inter,sans-serif' }}>
            <option value="">— Select subject —</option>
            {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={reset}
          style={{ width:44, height:44, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.2)', background:'transparent', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>↺</motion.button>
        <motion.button whileHover={{ scale:1.07 }} whileTap={{ scale:0.93 }}
          onClick={isActive ? pause : start}
          style={{ width:64, height:64, borderRadius:'50%', border:'none', background:`linear-gradient(135deg,${mc.ring},${mc.ring}aa)`, color:'white', cursor:'pointer', fontSize:'1.4rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 20px ${mc.ring}55` }}>
          {isActive ? '⏸' : '▶'}
        </motion.button>
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
          onClick={() => switchMode(mode==='Focus' ? 'Short Break' : 'Focus')}
          style={{ width:44, height:44, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.2)', background:'transparent', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>⏭</motion.button>
      </div>

      {stats && (
        <div style={{ marginTop:'1.5rem', paddingTop:'1.25rem', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-around' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color:'white' }}>{Math.floor(stats.totalFocusMinutes/60)}h {stats.totalFocusMinutes%60}m</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.75rem', marginTop:'0.15rem' }}>Focus Today</div>
          </div>
          <div style={{ width:1, background:'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color:'white' }}>{stats.totalSessions}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.75rem', marginTop:'0.15rem' }}>Sessions</div>
          </div>
          <div style={{ width:1, background:'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color:'white' }}>{focusMins}m</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.75rem', marginTop:'0.15rem' }}>Focus Length</div>
          </div>
        </div>
      )}

      <div style={{ textAlign:'center', marginTop:'1rem' }}>
        <button onClick={() => { localStorage.removeItem(STORAGE_KEY); clearInterval(intervalRef.current); endTimeRef.current=null; setIsActive(false); setSetupDone(false); setInitialDurationApplied(false); }}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:'0.72rem', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
          Reset setup
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;