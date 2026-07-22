import axios from 'axios';

// ── Axios instance ───────────────────────────────────────────
const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT token ────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') return config;

    const token = window.localStorage.getItem('sms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginRequest = error?.config?.url?.includes('/api/auth/login');

    if (error.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      window.localStorage.removeItem('sms_token');
      window.localStorage.removeItem('sms_user');
      window.location.href = '/login';
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;