import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Circle, CalendarIcon as CalIcon, X, ClipboardList, GripVertical } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import toast from 'react-hot-toast';

const itemVariants = {
  hidden:  { opacity: 0, y: -12, scale: 0.97 },
  visible: { opacity: 1, y: 0,   scale: 1,    transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, x: 40,  scale: 0.95, transition: { duration: 0.18, ease: 'easeIn'  } },
};

const formVariants = {
  hidden:  { opacity: 0, height: 0,    marginBottom: 0   },
  visible: { opacity: 1, height: 'auto', marginBottom: '1.75rem', transition: { duration: 0.28, ease: 'easeOut' } },
  exit:    { opacity: 0, height: 0,    marginBottom: 0,  transition: { duration: 0.2,  ease: 'easeIn'  } },
};

const priorityConfig = {
  High:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#fca5a5', dot: '#ef4444' },
  Medium: { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  text: '#fde047', dot: '#eab308' },
  Low:    { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#86efac', dot: '#22c55e' },
};

const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '0.6rem', color: 'white',
  fontSize: '0.9rem', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

const selectStyle = {
  ...inputStyle,
  background: 'rgba(30,20,60,0.85)',
};

export default function TasksTab({ subjects }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '', description: '', subject: '', priority: 'Medium', dueDate: '',
  });

  // Quick add for today's task
  const [quickTask, setQuickTask] = useState({ title: '', subject: '', priority: 'Medium' });
  const [addingQuick, setAddingQuick] = useState(false);

  useEffect(() => { fetchTasks(); }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = filter === 'all' ? {} : { completed: filter === 'done' };
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch { toast.error('Failed to load tasks'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      toast.success('Task added! 🎉');
      setShowForm(false);
      setFormData({ title: '', description: '', subject: '', priority: 'Medium', dueDate: '' });
      fetchTasks();
    } catch { toast.error('Failed to add task'); }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTask.title.trim()) return toast.error('Task title required');
    setAddingQuick(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.post('/tasks', { ...quickTask, dueDate: today });
      toast.success('Today\'s task added!');
      setQuickTask({ title: '', subject: '', priority: 'Medium' });
      fetchTasks();
    } catch { toast.error('Failed to add task'); }
    finally { setAddingQuick(false); }
  };

  const toggleTask = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, { ...task, completed: !task.completed });
      fetchTasks();
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(tasks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setTasks(reordered);
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const isOverdue = (dueDate, completed) => {
    if (completed || !dueDate) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDate);
    due.setHours(0,0,0,0);
    return due < today;
  };

  const todayTasks = tasks.filter(t => !t.completed && (isToday(t.dueDate) || isOverdue(t.dueDate, t.completed)));
  const otherTasks = tasks.filter(t => !t.completed && !isToday(t.dueDate) && !isOverdue(t.dueDate, t.completed));
  const completedTasks = tasks.filter(t => t.completed);

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    done: tasks.filter(t => t.completed).length,
  };

  const TaskItem = ({ task, index, isDraggable = true }) => {
    const pc = priorityConfig[task.priority] || priorityConfig.Medium;
    const overdue = isOverdue(task.dueDate, task.completed);
    const content = (
      <div
        style={{
          background: task.completed ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${task.completed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.13)'}`,
          borderRadius: '0.85rem',
          padding: '1rem 1.1rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          opacity: task.completed ? 0.6 : 1,
          borderLeft: overdue ? '3px solid #ef4444' : 'none',
        }}
      >
        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
          onClick={() => toggleTask(task)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px', flexShrink: 0 }}>
          {task.completed ? <CheckCircle size={22} color="#4ade80" /> : <Circle size={22} color="rgba(255,255,255,0.4)" />}
        </motion.button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: pc.bg, border: `1px solid ${pc.border}`, color: pc.text, borderRadius: '99px', fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.6rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: pc.dot, display: 'inline-block' }} />
              {task.priority}
            </span>
            {task.subject && <span style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.35)', color: '#d8b4fe', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 500, padding: '0.15rem 0.6rem' }}>{task.subject}</span>}
            {task.dueDate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: overdue ? '#fca5a5' : 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>
                <CalendarIcon size={11} />
                {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {overdue && <span style={{ marginLeft: '0.2rem', color: '#ef4444' }}>(Overdue)</span>}
              </span>
            )}
          </div>
          <p style={{ color: task.completed ? 'rgba(255,255,255,0.4)' : 'white', fontWeight: 600, fontSize: '0.95rem', textDecoration: task.completed ? 'line-through' : 'none', marginBottom: task.description ? '0.3rem' : 0 }}>
            {task.title}
          </p>
          {task.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.5 }}>{task.description}</p>}
        </div>
        <motion.button whileHover={{ scale: 1.15, color: '#f87171' }} whileTap={{ scale: 0.9 }}
          onClick={() => deleteTask(task._id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', borderRadius: '0.4rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
          <Trash2 size={16} />
        </motion.button>
      </div>
    );
    if (isDraggable) {
      return (
        <Draggable key={task._id} draggableId={task._id} index={index}>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style }}>
              {content}
            </div>
          )}
        </Draggable>
      );
    }
    return content;
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', borderRadius: '1.25rem', padding: '2rem', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '0.75rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={22} color="white" />
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.2 }}>Tasks & To-Do</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
              {counts.pending} pending · {counts.done} completed
            </p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setShowForm(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: showForm ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Task'}
        </motion.button>
      </div>

      {/* Quick Add for Today's Task */}
      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(124,58,237,0.15)', borderRadius: '1rem', border: '1px solid rgba(124,58,237,0.3)' }}>
        <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>📅 Add Today's Task</h3>
        <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Task title" value={quickTask.title} onChange={e => setQuickTask({ ...quickTask, title: e.target.value })} style={{ flex: 2, ...inputStyle }} required />
          <select value={quickTask.subject} onChange={e => setQuickTask({ ...quickTask, subject: e.target.value })} style={{ flex: 1, ...selectStyle }}>
            <option value="">No subject</option>
            {subjects?.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
          <select value={quickTask.priority} onChange={e => setQuickTask({ ...quickTask, priority: e.target.value })} style={{ flex: 1, ...selectStyle }}>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>
          <button type="submit" disabled={addingQuick} style={{ flexShrink: 0, padding: '0.6rem 1.2rem', background: '#7c3aed', border: 'none', borderRadius: '0.6rem', color: 'white', cursor: 'pointer', fontWeight: 600 }}>+ Add</button>
        </form>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>Due date will be set to today automatically</p>
      </div>

      {/* Today's Tasks Section */}
      {todayTasks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>🔥 Today's Tasks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todayTasks.map((task, idx) => <TaskItem key={task._id} task={task} index={idx} isDraggable={false} />)}
          </div>
        </div>
      )}

      {/* Other Pending Tasks */}
      {otherTasks.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>📋 Upcoming Tasks</h3>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="otherTasks">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {otherTasks.map((task, idx) => <TaskItem key={task._id} task={task} index={idx} isDraggable={true} />)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem' }}>✅ Completed</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {completedTasks.map(task => <TaskItem key={task._id} task={task} index={0} isDraggable={false} />)}
          </div>
        </div>
      )}

      {/* Add Task Form (Advanced) - same as before, kept for completeness */}
      <AnimatePresence>
        {showForm && (
          <motion.div key="form" variants={formVariants} initial="hidden" animate="visible" exit="exit" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '1.25rem', fontSize: '1rem' }}>✏️ New Task (with custom due date)</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input type="text" placeholder="Task Title *" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required autoFocus style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <textarea placeholder="Description (optional)" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div>
                    <select value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} style={selectStyle}>
                      <option value="">No subject</option>
                      {subjects?.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} style={selectStyle}>
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input type="date" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" style={{ flex: 1, padding: '0.7rem', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: '0.6rem', color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>＋ Add Task</motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.7rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.6rem', color: 'white', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}