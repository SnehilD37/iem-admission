import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept to add token and demo role headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iem_auth_token');
  const role = localStorage.getItem('iem_active_role');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (role) {
    config.headers['x-demo-role'] = role;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authApi = {
  getDemoUsers: () => api.get('/auth/demo-users'),
  loginWithDemo: (uid) => api.post('/auth/demo-login', { uid }),
  register: (userData) => api.post('/auth/register', userData),
  getSession: () => api.get('/auth/session')
};

export const applicationApi = {
  getMyApplication: (userId, appId) => api.get('/applications/my-application', { params: { userId, appId } }),
  saveDraft: (data) => api.post('/applications/save-draft', data),
  submitApplication: (data) => api.post('/applications/submit', data),
  resolveQuery: (data) => api.post('/applications/resolve-query', data)
};

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getApplications: (params) => api.get('/admin/applications', { params }),
  getApplicationById: (id) => api.get(`/admin/applications/${id}`),
  updateStatus: (id, data) => api.patch(`/admin/applications/${id}/status`, data),
  updateApplicationData: (id, data) => api.put(`/admin/applications/${id}`, data),
  raiseQuery: (id, data) => api.post(`/admin/applications/${id}/raise-query`, data),
  offerSeat: (id, data) => api.post(`/admin/applications/${id}/offer-seat`, data),
  getRosterExportUrl: () => `${API_BASE_URL}/admin/export-roster`
};

export const paymentApi = {
  getFeeSchedule: () => api.get('/payments/fee-schedule'),
  createOrder: (applicationId) => api.post('/payments/create-order', { applicationId }),
  verifySignature: (paymentData) => api.post('/payments/verify-signature', paymentData)
};

export const meritApi = {
  checkEligibility: (data) => api.post('/merit/check-eligibility', data),
  getRanking: () => api.get('/merit/ranking'),
  batchAllot: () => api.post('/merit/batch-allot')
};

export const systemApi = {
  resetDemoData: () => api.post('/reset-demo-data')
};

export const diagnosticsApi = {
  locateError: (errorPayload) => api.post('/diagnostics/locate-error', errorPayload),
  analyzeError: (errorPayload) => api.post('/diagnostics/analyze', errorPayload),
  getCodebaseHealth: () => api.get('/diagnostics/health'),
  scanCodebase: () => api.get('/diagnostics/scan'),
  testEndpoint: (routeData) => api.post('/diagnostics/test-endpoint', routeData)
};

export default api;
