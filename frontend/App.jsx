import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Calendar, CheckSquare, Clock, FileText, BarChart3, Target } from 'lucide-react';
import axios from 'axios';

// API configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Components
import ScheduleTab from './components/ScheduleTab';
import TasksTab from './components/TasksTab';
import TimerTab from './components/TimerTab';
import NotesTab from './components/NotesTab';
import ProgressTab from './components/ProgressTab';

function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({ totalFocusMinutes: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'timer', label: 'Timer', icon: Clock },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, statsRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/pomodoro/stats')
      ]);
      setSubjects(subjectsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to connect to server. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const addSubject = async (name, color) => {
    try {
      const res = await api.post('/subjects', { name, color, targetHours: 10 });
      setSubjects([...subjects, res.data]);
      toast.success(`Subject "${name}" added!`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add subject');
    }
  };

  const updateStats = async () => {
    try {
      const res = await api.get('/pomodoro/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading your organizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-white text-xl font-bold">Student Organiser</h1>
                <p className="text-white/70 text-xs">Stay focused, stay organized</p>
              </div>
            </div>
            <div className="text-white text-right">
              <div className="text-2xl font-bold">{Math.floor(stats.totalFocusMinutes / 60)}h {stats.totalFocusMinutes % 60}m</div>
              <div className="text-xs text-white/70">Focus time today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'schedule' && <ScheduleTab subjects={subjects} />}
        {activeTab === 'tasks' && <TasksTab subjects={subjects} />}
        {activeTab === 'timer' && <TimerTab subjects={subjects} onSessionComplete={updateStats} />}
        {activeTab === 'notes' && <NotesTab subjects={subjects} />}
        {activeTab === 'progress' && <ProgressTab subjects={subjects} stats={stats} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'text-white bg-white/20'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;