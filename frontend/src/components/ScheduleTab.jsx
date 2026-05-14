import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ScheduleTab({ subjects }) {
  const [schedule, setSchedule] = useState([]);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    subjectName: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'Study',
    day: days[0]
  });

  useEffect(() => {
    fetchSchedule();
  }, [selectedDay]);

  const fetchSchedule = async () => {
    try {
      const res = await api.get(`/schedule?day=${selectedDay}`);
      setSchedule(res.data);
    } catch (error) {
      toast.error('Failed to load schedule');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const subject = subjects.find(s => s._id === formData.subjectId);
      const data = { ...formData, subjectName: subject?.name || '' };
      
      if (editing) {
        await api.put(`/schedule/${editing}`, data);
        toast.success('Schedule updated!');
      } else {
        await api.post('/schedule', data);
        toast.success('Schedule added!');
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ subjectId: '', subjectName: '', startTime: '09:00', endTime: '10:00', type: 'Study', day: selectedDay });
      fetchSchedule();
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this schedule entry?')) {
      try {
        await api.delete(`/schedule/${id}`);
        toast.success('Deleted!');
        fetchSchedule();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      Study: 'bg-blue-500/20 text-blue-300',
      Break: 'bg-green-500/20 text-green-300',
      Exercise: 'bg-orange-500/20 text-orange-300',
      Other: 'bg-purple-500/20 text-purple-300'
    };
    return colors[type] || colors.Other;
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-xl font-bold">Weekly Schedule</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Slot
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex overflow-x-auto gap-2 mb-6 scrollbar-hide">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition ${
              selectedDay === day
                ? 'bg-white text-purple-600 font-bold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {schedule.length === 0 ? (
          <div className="text-center text-white/50 py-8">
            No schedule for {selectedDay}. Add some study slots!
          </div>
        ) : (
          schedule.map(item => (
            <div key={item._id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(item.type)}`}>
                    {item.type}
                  </span>
                  <span className="text-white font-semibold">{item.subjectName}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{item.startTime} - {item.endTime}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  setEditing(item._id);
                  setFormData({
                    subjectId: item.subjectId,
                    subjectName: item.subjectName,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    type: item.type,
                    day: item.day
                  });
                  setShowForm(true);
                }} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <Edit2 className="w-4 h-4 text-white/70" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-2 hover:bg-white/10 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white text-xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Schedule Slot</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                required
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700"
                  required
                />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700"
                  required
                />
              </div>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700"
              >
                <option>Study</option>
                <option>Break</option>
                <option>Exercise</option>
                <option>Other</option>
              </select>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700"
              >
                {days.map(day => <option key={day}>{day}</option>)}
              </select>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl transition">
                  Save
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}