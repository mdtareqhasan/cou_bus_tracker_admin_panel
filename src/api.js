import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if ([401, 403].includes(error.response?.status)) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_name');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/admin/login', { email, password }),
};

export const profileAPI = {
  get: () => api.get('/admin/profile'),
  update: (data) => api.put('/admin/profile', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
};

export const adminAPI = {
  getAll: () => api.get('/admin/manage'),
  create: (data) => api.post('/admin/manage', data),
  update: (id, data) => api.put(`/admin/manage/${id}`, data),
  delete: (id) => api.delete(`/admin/manage/${id}`),
};

export const busAPI = {
  getAll: () => api.get('/admin/buses'),
  getPublic: () => api.get('/buses'),
  getById: (id) => api.get(`/buses/${id}`),
  create: (data) => api.post('/admin/buses', data),
  update: (id, data) => api.put(`/admin/buses/${id}`, data),
  delete: (id) => api.delete(`/admin/buses/${id}`),
  toggle: (id) => api.patch(`/admin/buses/${id}/toggle`),
  updateTrackerLink: (busId, data) => api.put(`/admin/buses/${busId}/tracker-link`, data),
};

export const scheduleAPI = {
  getAll: () => api.get('/admin/schedules'),
  create: (data) => api.post('/admin/schedules', data),
  update: (id, data) => api.put(`/admin/schedules/${id}`, data),
  delete: (id) => api.delete(`/admin/schedules/${id}`),
  toggle: (id) => api.patch(`/admin/schedules/${id}/toggle`),
};

// Bus routes (the reference table schedules point at by FK — a bus runs a
// different route at different times of day).
export const routeAPI = {
  getAll: () => api.get('/admin/routes'),
  getPublic: () => api.get('/routes'),
  create: (data) => api.post('/admin/routes', data),
  update: (id, data) => api.put(`/admin/routes/${id}`, data),
  delete: (id) => api.delete(`/admin/routes/${id}`),
  toggle: (id) => api.patch(`/admin/routes/${id}/toggle`),
  // Opposite-direction pairing: linking is reciprocal (the backend updates
  // both rows) and replaces any existing pair on either side.
  linkOpposite: (id, oppositeId) => api.put(`/admin/routes/${id}/opposite/${oppositeId}`),
  unlinkOpposite: (id) => api.delete(`/admin/routes/${id}/opposite`),
};

export const noticeAPI = {
  getAll: () => api.get('/admin/notices'),
  create: (data) => api.post('/admin/notices', data),
  delete: (id) => api.delete(`/admin/notices/${id}`),
};

export const studentAPI = {
  getAll: () => api.get('/admin/students'),
  getPending: () => api.get('/admin/students/pending'),
  verify: (id) => api.put(`/admin/students/${id}/verify`),
  toggleActive: (id) => api.put(`/admin/students/${id}/toggle-active`),
  delete: (id) => api.delete(`/admin/students/${id}`),
};

export const teacherAPI = {
  getAll: () => api.get('/admin/teachers'),
  getPending: () => api.get('/admin/teachers/pending'),
  verify: (id) => api.put(`/admin/teachers/${id}/verify`),
  toggleActive: (id) => api.put(`/admin/teachers/${id}/toggle-active`),
  delete: (id) => api.delete(`/admin/teachers/${id}`),
};

// Departments, offices and sessions behind the registration pickers.
export const academicAPI = {
  getAllUnits: () => api.get('/admin/academic/units'),
  createUnit: (data) => api.post('/admin/academic/units', data),
  updateUnit: (id, data) => api.put(`/admin/academic/units/${id}`, data),
  toggleUnit: (id) => api.patch(`/admin/academic/units/${id}/toggle`),
  deleteUnit: (id) => api.delete(`/admin/academic/units/${id}`),
  getAllSessions: () => api.get('/admin/academic/sessions'),
  createSession: (data) => api.post('/admin/academic/sessions', data),
  updateSession: (id, data) => api.put(`/admin/academic/sessions/${id}`, data),
  toggleSession: (id) => api.patch(`/admin/academic/sessions/${id}/toggle`),
  deleteSession: (id) => api.delete(`/admin/academic/sessions/${id}`),
};

export default api;
