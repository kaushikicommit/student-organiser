import React, { useState } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Auth = ({ onLogin }) => {
  const [isLogin,  setIsLogin]  = useState(true);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = isLogin ? { email, password } : { name, email, password };
      const res  = isLogin ? await authAPI.login(data) : await authAPI.register(data);
      // Pass BOTH user object and token up to App
      onLogin(res.data.user, res.data.token);
      toast.success(isLogin ? 'Welcome back! 👋' : 'Account created! 🎉');
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.errors?.[0]?.msg
        || 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.9rem',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '0.6rem', color: 'white',
    fontSize: '0.95rem', outline: 'none',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '0.85rem',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(16px)',
      borderRadius: '1.25rem',
      padding: '2rem',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    }}>
      <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        {isLogin ? '👋 Welcome back' : '✨ Create account'}
      </h2>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            style={inputStyle}
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        )}
        <input
          style={inputStyle}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '0.75rem',
            background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            border: 'none', borderRadius: '0.6rem',
            color: 'white', fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '1rem',
          }}>
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
        </motion.button>
      </form>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => setIsLogin(p => !p)}
          style={{ background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
          {isLogin ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
};

export default Auth;