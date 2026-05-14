import axios from 'axios';

const API_BASE_URL = '/api/v1';   // ← matches your server.js /api/v1/ routes

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token to every request automatically ──────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto logout on 401 (expired/invalid token) ───────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
};

// ── Subjects ─────────────────────────────────────────────────
export const subjectsAPI = {
  getAll:       ()           => api.get('/subjects'),
  create:       (data)       => api.post('/subjects', data),
  update:       (id, data)   => api.put(`/subjects/${id}`, data),
  delete:       (id)         => api.delete(`/subjects/${id}`),
  addStudyTime: (id, minutes)=> api.post(`/subjects/${id}/study`, { minutes }),
};

// ── Tasks ────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => api.get('/tasks',        { params }),
  create: (data)   => api.post('/tasks',       data),
  update: (id, data)=> api.put(`/tasks/${id}`, data),
  delete: (id)     => api.delete(`/tasks/${id}`),
};

// ── Pomodoro ─────────────────────────────────────────────────
export const pomodoroAPI = {
  getStats:        ()              => api.get('/pomodoro/stats'),
  completeSession: (data)          => api.post('/pomodoro/complete', data),
  getSessions:     (start, end)    => api.get('/pomodoro/sessions', { params: { start, end } }),
};

// ── Gamification ─────────────────────────────────────────────
export const gamificationAPI = {
  getStats:      () => api.get('/gamification/stats'),
  getLeaderboard:() => api.get('/gamification/leaderboard'),
};

export default api;