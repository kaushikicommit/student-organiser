import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Save, LogOut } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '0.6rem', color: 'white',
  fontSize: '0.9rem', outline: 'none',
  fontFamily: 'Inter, sans-serif',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.55)',
  fontSize: '0.75rem', fontWeight: 600,
  marginBottom: '0.35rem',
  textTransform: 'uppercase', letterSpacing: '0.06em',
};

const sectionStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.85rem',
  padding: '1.1rem 1.25rem',
  marginBottom: '1rem',
};

export default function UserSettings({ user, onClose, onUserUpdate, onLogout }) {
  const [name,        setName]        = useState(user?.name    || '');
  const [email,       setEmail]       = useState(user?.email   || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // ── Update name / email ───────────────────────────────────
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    if (!email.trim()) { toast.error('Email cannot be empty'); return; }
    setLoadingInfo(true);
    try {
      const res = await api.put('/auth/profile', { name: name.trim(), email: email.trim() });
      const updated = res.data.user;
      localStorage.setItem('user', JSON.stringify(updated));
      onUserUpdate(updated);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoadingInfo(false);
    }
  };

  // ── Change password ───────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPass) { toast.error('Enter your current password'); return; }
    if (newPass.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPass !== confirmPass) { toast.error('New passwords do not match'); return; }
    setLoadingPass(true);
    try {
      await api.put('/auth/password', { currentPassword: currentPass, newPassword: newPass });
      toast.success('Password changed! 🔒');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoadingPass(false);
    }
  };

  // Avatar initials
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, x: 320 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 320 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 400,
          zIndex: 999,
          background: 'linear-gradient(160deg,rgba(30,15,60,0.98),rgba(20,10,45,0.99))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRight: 'none',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
          overflowY: 'auto',
          padding: '1.75rem 1.5rem',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>
            ⚙️ Account Settings
          </h2>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <X size={16} />
          </motion.button>
        </div>

        {/* Avatar + info */}
        <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 800, color: 'white', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>{user?.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>{user?.email}</p>
            <p style={{ color: 'rgba(167,139,250,0.8)', fontSize: '0.72rem', margin: '0.2rem 0 0' }}>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'recently'}
            </p>
          </div>
        </div>

        {/* ── Update name & email ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <User size={15} color="#a78bfa" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Profile Info</span>
          </div>
          <form onSubmit={handleUpdateInfo}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
              />
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loadingInfo}
              style={{
                width: '100%', padding: '0.6rem',
                background: loadingInfo ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                border: 'none', borderRadius: '0.6rem',
                color: 'white', fontWeight: 600, fontSize: '0.88rem',
                cursor: loadingInfo ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}>
              <Save size={14} />
              {loadingInfo ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </form>
        </div>

        {/* ── Change password ── */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Lock size={15} color="#60a5fa" />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Change Password</span>
          </div>
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Current Password</label>
              <input type="password" value={currentPass}
                onChange={e => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>New Password</label>
              <input type="password" value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Min 6 characters"
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input type="password" value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Repeat new password"
                style={inputStyle} />
              {newPass && confirmPass && newPass !== confirmPass && (
                <p style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '0.3rem' }}>
                  Passwords do not match
                </p>
              )}
              {newPass && confirmPass && newPass === confirmPass && (
                <p style={{ color: '#34d399', fontSize: '0.72rem', marginTop: '0.3rem' }}>
                  ✓ Passwords match
                </p>
              )}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loadingPass}
              style={{
                width: '100%', padding: '0.6rem',
                background: loadingPass ? 'rgba(96,165,250,0.3)' : 'linear-gradient(135deg,#2563eb,#60a5fa)',
                border: 'none', borderRadius: '0.6rem',
                color: 'white', fontWeight: 600, fontSize: '0.88rem',
                cursor: loadingPass ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}>
              <Lock size={14} />
              {loadingPass ? 'Changing...' : 'Change Password'}
            </motion.button>
          </form>
        </div>

        {/* ── Logout ── */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          style={{
            width: '100%', padding: '0.7rem',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '0.75rem', color: '#fca5a5',
            fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            marginTop: '0.5rem',
          }}>
          <LogOut size={16} />
          Logout
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}