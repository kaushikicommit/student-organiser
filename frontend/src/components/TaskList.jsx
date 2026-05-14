import React from 'react';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';

const TaskList = ({ tasks, onTaskUpdate }) => {
  const isOverdue = (dueDate, completed) => {
    if (completed) return false;
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };
  
  const toggleComplete = async (task) => {
    try {
      const updated = { ...task, completed: !task.completed };
      await tasksAPI.update(task._id, updated);
      toast.success(`Task marked as ${updated.completed ? 'completed' : 'incomplete'}`);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };
  
  if (tasks.length === 0) {
    return <p className="empty-text">No tasks yet. Add one above!</p>;
  }
  
  return (
    <div className="task-list">
      {tasks.map(task => {
        const overdue = isOverdue(task.dueDate, task.completed);
        return (
          <div 
            key={task._id} 
            className="task-item"
            style={{ 
              borderLeft: overdue ? '3px solid #ef4444' : 'none',
              background: task.completed ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)'
            }}
          >
            <div className="task-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span 
                  className="task-title"
                  style={{ 
                    textDecoration: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.6 : 1
                  }}
                >
                  {task.title}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {overdue && !task.completed && (
                  <span style={{ fontSize: '0.7rem', background: '#ef4444', padding: '2px 8px', borderRadius: '20px', color: 'white' }}>
                    OVERDUE
                  </span>
                )}
                <span className={`task-priority ${
                  task.priority === 'High' ? 'priority-high' :
                  task.priority === 'Medium' ? 'priority-medium' : 'priority-low'
                }`}>
                  {task.priority}
                </span>
                {task.dueDate && !task.completed && (
                  <span style={{ fontSize: '0.7rem', color: overdue ? '#fca5a5' : 'rgba(255,255,255,0.5)' }}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {task.description && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', marginLeft: '1.8rem' }}>{task.description}</div>}
            {task.subject && <div className="task-subject" style={{ marginLeft: '1.8rem' }}>{task.subject}</div>}
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;