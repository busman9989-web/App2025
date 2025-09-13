// packages/web/src/api.ts

import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Determine the API base URL based on the environment
// This allows you to use `localhost` for web development and `10.0.2.2` for Android Emulator
const getBaseURL = () => {
  if (window.Capacitor) {
    // We are running inside a Capacitor app (Android/iOS)
    // 10.0.2.2 is the Android emulator's special IP to access the host machine's localhost
    // For a physical device, you'd need your host machine's actual IP (e_g_ 'http://192.168.1.100:4000')
    // For now, let's assume emulator or that 10.0.2.2 also works for device if configured correctly
    return 'http://10.0.2.2:4000'; 
  } else {
    // We are in a web browser (desktop development)
    // Vite automatically provides environment variables starting with VITE_
    // Fallback to a default if VITE_API_URL is not set (e_g_ for local dev)
    return import.meta.env.VITE_API_URL || 'http://localhost:4000';
  }
};

const api = axios.create({
  baseURL: getBaseURL(), // Use the dynamically determined base URL
  withCredentials: true, // Important for sending cookies/session if used
});

// Request interceptor to attach the JWT token from the Pinia store
api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

// Response interceptor to handle token expiration/logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout(); // Log out if token is invalid or expired
    }
    return Promise.reject(error);
  }
);

export default api;