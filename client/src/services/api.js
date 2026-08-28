import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rb_token');
      localStorage.removeItem('rb_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ─── Users ───────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
};

// ─── Conversations ────────────────────────────────────────────────────────
export const conversationsApi = {
  getAll: () => api.get('/conversations'),
  create: (participantId) => api.post('/conversations', { participantId }),
  getById: (id) => api.get(`/conversations/${id}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────
export const messagesApi = {
  getByConversation: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  send: (data) => api.post('/messages', data),
  markRead: (id) => api.patch(`/messages/${id}/read`),
};

// ─── React Boat AI ────────────────────────────────────────────────────────
export const reactBoatApi = {
  chat: (message) => api.post('/react-boat/chat', { message }),
  getHistory: () => api.get('/react-boat/history'),
  clearHistory: () => api.delete('/react-boat/history'),
};

// ─── Admin ────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getSessions: () => api.get('/admin/sessions'),
  getStats: () => api.get('/admin/stats'),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  terminateSession: (id) => api.delete(`/admin/sessions/${id}`),
  logoutAll: () => api.post('/admin/logout-all'),
};

export default api;
