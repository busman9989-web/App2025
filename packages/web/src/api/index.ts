import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// This "interceptor" automatically attaches your login token to every
// request you send to the backend, which is critical for security.
api.interceptors.request.use(
  (config) => {
    // We must initialize the store inside the interceptor to avoid circular dependency issues
    // that can happen when files import each other.
    const authStore = useAuthStore();
    const token = authStore.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;