import axios from 'axios';
import AuthService from './auth.service';

// Use Vite env for API base; default to localhost for dev.
// In production (.env.production) set:
// VITE_API_URL=https://smart-inventory-management-backend.onrender.com
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/** Central API client: attaches token to requests and handles 401 (session end) globally. */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Increase timeout so long-running ML/analytics endpoints can complete.
  timeout: 60000, // 60s timeout for API calls
});

api.interceptors.request.use(
  (config) => {
    const auth = AuthService.getAuthHeader();
    if (auth.Authorization) {
      config.headers.Authorization = auth.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AuthService.clearSession();
      const path = typeof window !== 'undefined' ? window.location.pathname : '';
      const returnUrl = path && path !== '/' && path !== '/login' && path !== '/signup'
        ? encodeURIComponent(path)
        : '';
      window.location.href = returnUrl ? `/login?returnUrl=${returnUrl}` : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
