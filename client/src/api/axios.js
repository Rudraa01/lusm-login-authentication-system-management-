import axios from 'axios';

const API_BASE = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const isAdminUrl = config.url.startsWith('/api/admin');
    const token = isAdminUrl
      ? localStorage.getItem('lusm_admin_token')
      : localStorage.getItem('lusm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAdminUrl = error.config?.url?.startsWith('/api/admin');
      if (isAdminUrl) {
        localStorage.removeItem('lusm_admin_token');
        localStorage.removeItem('lusm_admin');
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
      } else {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('lusm_token');
        localStorage.removeItem('lusm_developer');
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

