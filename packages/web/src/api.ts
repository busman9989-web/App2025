// packages/web/src/api.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// This function now correctly points to port 3000
const getBaseURL = () => {
  if (window.Capacitor) {
    // Corrected port for Android Emulator
    return 'http://10.0.2.2:3000'; 
  } else {
    // Corrected fallback port for web browser
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// This interceptor correctly attaches your JWT to every request after login
api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

// This interceptor will automatically log the user out if the token expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
    }
    return Promise.reject(error);
  }
);

export default api;