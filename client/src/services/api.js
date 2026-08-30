import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
  timeout: 30000,
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
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('rb_token');
        localStorage.removeItem('rb_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
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
  getByUsername: (username) => api.get(`/users/username/${username}`),
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
  react: (id, emoji) => api.post(`/messages/${id}/react`, { emoji }),
  edit: (id, text) => api.patch(`/messages/${id}`, { text }),
  delete: (id) => api.delete(`/messages/${id}`),
  markRead: (id) => api.patch(`/messages/${id}/read`),
};

// ─── AI Assistant (Saba's World AI) ───────────────────────────────────────
export const aiApi = {
  chat: (data) => api.post('/ai/chat', data),
  sendMessage: (data) => api.post('/ai/chat', data),
  getConversations: () => api.get('/ai/conversations'),
  createConversation: (data) => api.post('/ai/conversations', data),
  getMessages: (conversationId) => api.get(`/ai/conversations/${conversationId}/messages`),
  updateConversation: (id, data) => api.patch(`/ai/conversations/${id}`, data),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`),
  getMemory: () => api.get('/ai/memory'),
  clearMemory: () => api.delete('/ai/memory'),
  getKnowledge: (params) => api.get('/ai/knowledge', { params }),
  createKnowledge: (data) => api.post('/ai/knowledge', data),
  updateKnowledge: (id, data) => api.put(`/ai/knowledge/${id}`, data),
  deleteKnowledge: (id) => api.delete(`/ai/knowledge/${id}`),
};

// Backwards-compatible React Boat API
export const reactBoatApi = {
  chat: (message) => api.post('/ai/chat', { message }),
  getHistory: () => api.get('/react-boat/history'),
  clearHistory: () => api.delete('/react-boat/history'),
};

// ─── Social Feed & Posts ──────────────────────────────────────────────────
export const postsApi = {
  getFeed: (params) => api.get('/posts', { params }),
  create: (data) => api.post('/posts', data),
  toggleLike: (id) => api.post(`/posts/${id}/like`),
  getComments: (id) => api.get(`/posts/${id}/comments`),
  addComment: (id, data) => api.post(`/posts/${id}/comments`, data),
  toggleSave: (id) => api.post(`/posts/${id}/save`),
  delete: (id) => api.delete(`/posts/${id}`),
};

// ─── Stories ──────────────────────────────────────────────────────────────
export const storiesApi = {
  getActive: () => api.get('/stories'),
  create: (data) => api.post('/stories', data),
  markViewed: (id) => api.post(`/stories/${id}/view`),
  delete: (id) => api.delete(`/stories/${id}`),
};

// ─── Reels ────────────────────────────────────────────────────────────────
export const reelsApi = {
  getReels: (params) => api.get('/reels', { params }),
  create: (data) => api.post('/reels', data),
  toggleLike: (id) => api.post(`/reels/${id}/like`),
  getComments: (id) => api.get(`/reels/${id}/comments`),
  addComment: (id, data) => api.post(`/reels/${id}/comments`, data),
  recordView: (id) => api.post(`/reels/${id}/view`),
  delete: (id) => api.delete(`/reels/${id}`),
};

// ─── Media Uploads ────────────────────────────────────────────────────────
export const mediaApi = {
  upload: (formData) =>
    api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Notifications ────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  clearAll: () => api.delete('/notifications'),
};

// ─── Global Search ────────────────────────────────────────────────────────
export const searchApi = {
  search: (params) => api.get('/search', { params }),
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

// ─── Todos & Reminders ────────────────────────────────────────────────────
export const todosApi = {
  getAll: (params) => api.get('/todos', { params }),
  create: (data) => api.post('/todos', data),
  update: (id, data) => api.patch(`/todos/${id}`, data),
  delete: (id) => api.delete(`/todos/${id}`),
  clearCompleted: () => api.delete('/todos/completed'),
  getDailySummary: () => api.get('/todos/daily-summary'),
};

export default api;
