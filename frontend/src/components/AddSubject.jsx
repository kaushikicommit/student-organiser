import React, { useState } from 'react';
import { subjectsAPI } from '../services/api';
import toast from 'react-hot-toast';

const AddSubject = ({ onSubjectAdded }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [targetHours, setTargetHours] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a subject name');
      return;
    }

    setLoading(true);
    try {
      const response = await subjectsAPI.create({
        name: name.trim(),
        color,
        targetHours,
      });
      toast.success('Subject added successfully!');
      setName('');
      if (onSubjectAdded) onSubjectAdded(response.data);
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error(error.response?.data?.error || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Add New Subject</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Subject Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="e.g., Mathematics"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Target Hours (per week)</label>
          <input
            type="number"
            value={targetHours}
            onChange={(e) => setTargetHours(Number(e.target.value))}
            className="form-input"
            min="1"
            max="40"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          {loading ? 'Adding...' : 'Add Subject'}
        </button>
      </form>
    </div>
  );
};

export default AddSubject;