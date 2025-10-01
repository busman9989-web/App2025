// packages/web/src/api.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const getBaseURL = () => {
  if (window.Capacitor) {
    return 'http://10.0.2.2:3000';
  } else {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  // ✅ Ensures that cookies are sent with every request
  withCredentials: true, 
});

// The old request interceptor for adding the Authorization header has been removed.

// This response interceptor is useful for handling expired sessions.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      // Avoids logout loops by checking if the user is supposed to be logged in.
      if (authStore.isAuthenticated) {
        authStore.logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;