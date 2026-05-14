import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DailyGoalPrompt({ onSave, initialValue = 240 }) {
  const [minutes, setMinutes] = useState(initialValue);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const finalMinutes = useCustom ? parseInt(custom) : minutes;
  const valid = !isNaN(finalMinutes) && finalMinutes >= 30 && finalMinutes <= 480; // 30 min to 8 hours

  const handleSave = () => {
    if (!valid) {
      toast.error('Please enter a time between 30 and 480 minutes.');
      return;
    }
    onSave(finalMinutes);
  };

  const presets = [60, 120, 180, 240, 300, 360];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '1.5rem',
          padding: '2rem',
          width: '90%',
          maxWidth: 420,
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: 'var(--text)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>📅 Daily Study Goal</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          How many minutes do you want to study today?<br />
          <small>(We'll split this time across your subjects)</small>
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {presets.map(p => (
            <button
              key={p}
              onClick={() => { setMinutes(p); setUseCustom(false); }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '2rem',
                background: !useCustom && minutes === p ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: !useCustom && minutes === p ? 600 : 400,
              }}
            >
              {p} min
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setUseCustom(true)}
            style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Custom time
          </button>
          {useCustom && (
            <div style={{ marginTop: '0.75rem' }}>
              <input
                type="number"
                min="30"
                max="480"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="e.g., 150"
                autoFocus
                style={{
                  width: '150px',
                  padding: '0.6rem',
                  borderRadius: '0.6rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '1rem',
                  textAlign: 'center',
                  outline: 'none',
                }}
              />
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.3rem' }}>30–480 minutes</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!valid}
          style={{
            width: '100%',
            padding: '0.8rem',
            background: valid ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(124,58,237,0.3)',
            border: 'none',
            borderRadius: '0.75rem',
            color: 'white',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: valid ? 'pointer' : 'not-allowed',
          }}
        >
          Start with {valid ? finalMinutes : '?'} minutes today
        </button>
      </motion.div>
    </div>
  );
}