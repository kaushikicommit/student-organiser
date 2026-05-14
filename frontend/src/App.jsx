import React, { useState, useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { subjectsAPI, tasksAPI, pomodoroAPI } from './services/api';
import AddSubject from './components/AddSubject';
import PomodoroTimer from './components/PomodoroTimer';
import TasksTab from './components/TasksTab';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Gamification from './components/Gamification';
import Auth from './components/Auth';
import UserSettings from './components/UserSettings';
import TodayPlan from './components/TodayPlan';
import DailyGoalPrompt from './components/DailyGoalPrompt';
import FileUploader from './components/FileUploader';
import {
  DailyReminder, AIStudySuggestions, FocusMusicPlayer,
} from './components/SmartFeatures';
import './index.css';

const THEMES = {
  dark: {
    '--bg-grad-a':'#667eea','--bg-grad-b':'#764ba2',
    '--card-bg':'rgba(255,255,255,0.10)','--card-border':'rgba(255,255,255,0.15)',
    '--text':'#ffffff','--text-muted':'rgba(255,255,255,0.6)',
    '--tab-active-bg':'white','--tab-active-color':'#6d28d9',
    '--tab-bg':'rgba(255,255,255,0.12)','--tab-color':'rgba(255,255,255,0.85)',
  },
  light: {
    '--bg-grad-a':'#e0e7ff','--bg-grad-b':'#f3e8ff',
    '--card-bg':'rgba(255,255,255,0.75)','--card-border':'rgba(100,80,200,0.15)',
    '--text':'#1e1b4b','--text-muted':'rgba(60,50,120,0.6)',
    '--tab-active-bg':'#7c3aed','--tab-active-color':'white',
    '--tab-bg':'rgba(124,58,237,0.1)','--tab-color':'#4c1d95',
  },
};

function applyTheme(t) {
  Object.entries(THEMES[t]).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
  document.documentElement.setAttribute('data-theme', t);
}

const NAV_ITEMS = [
  { key: 'today', label: 'Today', icon: '📅' },
  { key: 'tasks', label: 'Tasks', icon: '✅' },
  { key: 'pomodoro', label: 'Pomodoro', icon: '⏱️' },
  { key: 'analytics', label: 'Analytics', icon: '📊' },
  { key: 'smart', label: 'Smart', icon: '🤖' },
  { key: 'gamification', label: 'Games', icon: '🏆' },
  { key: 'subjects', label: 'Subjects', icon: '📚' },
];

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
}
function getStoredToken() {
  return localStorage.getItem('token') || null;
}

export default function App() {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState('today');
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pomodoroStats, setPomodoroStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [goalFired, setGoalFired] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [preselectedSubject, setPreselectedSubject] = useState(null);
  const [preselectedDuration, setPreselectedDuration] = useState(null);
  
  // Daily goal state
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyGoal');
    if (saved) {
      try {
        const { goal, date } = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        if (date === today) return goal;
      } catch {}
    }
    return 240;
  });
  const [showGoalPrompt, setShowGoalPrompt] = useState(false);

  useEffect(() => { applyTheme(theme); localStorage.setItem('theme', theme); }, [theme]);

  useEffect(() => {
    if (document.getElementById('sk')) return;
    const s = document.createElement('style');
    s.id = 'sk';
    s.textContent = '@keyframes skeleton-pulse{0%,100%{opacity:.4}50%{opacity:.9}}';
    document.head.appendChild(s);
  }, []);

  useEffect(() => { if (token) fetchAllData(); }, [token]);

  // Show daily goal prompt if not set for today
  useEffect(() => {
    const saved = localStorage.getItem('dailyGoal');
    const today = new Date().toISOString().split('T')[0];
    if (!saved || JSON.parse(saved).date !== today) {
      setShowGoalPrompt(true);
    }
  }, []);

  // Confetti when goal reached
  useEffect(() => {
    if (!pomodoroStats || goalFired) return;
    if (pomodoroStats.totalFocusMinutes >= dailyGoal) {
      setGoalFired(true);
      toast.success('🎉 Daily goal reached!', { duration: 4000 });
      confetti({ particleCount:180, spread:80, origin:{y:0.55}, colors:['#a78bfa','#60a5fa','#f472b6','#34d399','#fbbf24'] });
      setTimeout(() => confetti({ particleCount:80, angle:60,  spread:55, origin:{x:0,y:0.6} }), 300);
      setTimeout(() => confetti({ particleCount:80, angle:120, spread:55, origin:{x:1,y:0.6} }), 500);
    }
  }, [pomodoroStats, goalFired, dailyGoal]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes, pRes] = await Promise.all([
        subjectsAPI.getAll(), tasksAPI.getAll(), pomodoroAPI.getStats(),
      ]);
      setSubjects(sRes.data);
      setTasks(tRes.data);
      setPomodoroStats(pRes.data);
    } catch (e) {
      if (e?.response?.status !== 401) toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = useCallback((userData, tok) => {
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSubjects([]); setTasks([]); setPomodoroStats(null);
    toast.success('Logged out!');
  }, []);

  const handleUserUpdate = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const handleSubjectAdded = useCallback(s => setSubjects(p => [...p, s]), []);

  const handleNavigateToPomodoro = (subjectName, minutes) => {
    setPreselectedSubject(subjectName);
    setPreselectedDuration(minutes);
    setActiveTab('pomodoro');
    setTimeout(() => {
      setPreselectedSubject(null);
      setPreselectedDuration(null);
    }, 500);
  };

  const handleSaveDailyGoal = (minutes) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dailyGoal', JSON.stringify({ goal: minutes, date: today }));
    setDailyGoal(minutes);
    setShowGoalPrompt(false);
    toast.success(`Daily goal set to ${minutes} minutes!`);
    fetchAllData();
  };

  if (!token || !user) {
    return (
      <div style={{
        minHeight:'100vh',
        background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1.5rem', fontFamily:'Inter,sans-serif',
      }}>
        <Toaster position="top-right" />
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}}
          style={{ width:'100%', maxWidth:420 }}>
          <h1 style={{ color:'white', fontWeight:800, fontSize:'1.8rem', textAlign:'center', marginBottom:'1.75rem' }}>
            🎓 Student Organiser
          </h1>
          <Auth onLogin={handleLogin} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Toaster position="top-right" toastOptions={{
        style:{ background:'#1e1b4b', color:'white', border:'1px solid rgba(255,255,255,0.15)' }
      }} />

      <div className="sidebar">
        <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
          <h2 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '0.25rem' }}>🎓 Organiser</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{user.name || user.email}</p>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <div
              key={item.key}
              className={`sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '1rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0.6rem',
              padding: '0.5rem',
              color: 'var(--text)',
              cursor: 'pointer',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button
            onClick={() => setShowUserSettings(true)}
            style={{
              width: '100%',
              background: 'rgba(251, 243, 243, 0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.6rem',
              padding: '0.5rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '0.6rem',
              padding: '0.5rem',
              marginTop: '0.5rem',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'today' && (
              <TodayPlan
                subjects={subjects}
                tasks={tasks}
                stats={pomodoroStats}
                dailyGoal={dailyGoal}
                onNavigateToPomodoro={handleNavigateToPomodoro}
                onChangeGoal={() => setShowGoalPrompt(true)}
              />
            )}
            {activeTab === 'tasks' && <TasksTab subjects={subjects} onTasksChange={fetchAllData} />}
            {activeTab === 'pomodoro' && (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <PomodoroTimer 
                  initialSubject={preselectedSubject} 
                  initialDuration={preselectedDuration}
                  onSessionComplete={fetchAllData}
                />
              </div>
            )}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'smart' && (
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>Smart tools powered by your study data</p>
                <AIStudySuggestions subjects={subjects} tasks={tasks} />
                <DailyReminder />
                <FocusMusicPlayer />
                <FileUploader />
              </div>
            )}
            {activeTab === 'gamification' && <Gamification />}
            {activeTab === 'subjects' && (
              <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                  <h2 className="card-title">All Subjects</h2>
                  {subjects.length === 0 ? (
                    <p className="empty-text">No subjects yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <AnimatePresence>
                        {subjects.map(s => (
                          <motion.div key={s._id}
                            initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }}
                            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.6rem 0.75rem', borderRadius:'0.6rem', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                              <div style={{ width:12, height:12, borderRadius:'50%', backgroundColor:s.color }} />
                              <span style={{ color:'var(--text)', fontWeight:500 }}>{s.name}</span>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
                                <span style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{Math.floor(s.totalStudied/60)}h studied</span>
                                <span style={{ color:'var(--text-muted)', fontSize:'0.72rem' }}>Target: {s.targetHours}h/wk</span>
                              </div>
                              <motion.button
                                whileHover={{ scale:1.15 }} whileTap={{ scale:0.9 }}
                                onClick={async () => {
                                  if (!window.confirm('Delete "' + s.name + '"?')) return;
                                  try {
                                    await subjectsAPI.delete(s._id);
                                    setSubjects(prev => prev.filter(x => x._id !== s._id));
                                    toast.success(s.name + ' deleted');
                                  } catch { toast.error('Failed to delete subject'); }
                                }}
                                style={{ background:'none', border:'none', cursor:'pointer', padding:'0.3rem', color:'rgba(255,255,255,0.25)', flexShrink:0 }}>
                                🗑️
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                <AddSubject onSubjectAdded={handleSubjectAdded} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showUserSettings && (
        <UserSettings
          user={user}
          onClose={() => setShowUserSettings(false)}
          onUserUpdate={handleUserUpdate}
          onLogout={handleLogout}
        />
      )}

      {showGoalPrompt && (
        <DailyGoalPrompt
          onSave={handleSaveDailyGoal}
          initialValue={dailyGoal}
        />
      )}
    </div>
  );
}