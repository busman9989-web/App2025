import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { useAuthStore } from '@/stores/auth';

// ✅ Use HTTP for Android emulator to avoid Mixed Content errors
const baseURL = Capacitor.isNativePlatform()
  ? 'https://api.carerscircle.co.uk'
  : (import.meta.env.VITE_API_URL || 'https://api.carerscircle.co.uk');

const api = axios.create({
  baseURL,
  withCredentials: true, // if your backend uses cookies/sessions
});

// Request interceptor to attach Authorization header with JWT
api.interceptors.request.use(
  async (config) => {
    let token: string | null = null;

    if (Capacitor.isNativePlatform()) {
      const result = await Preferences.get({ key: 'auth_token' });
      token = result.value;
    } else {
      token = localStorage.getItem('auth_token');
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth/session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        authStore.logout();
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Upload user profile avatar.
 * @param formData FormData containing an "avatar" field (image file)
 * @returns Axios response
 */
export async function uploadAvatar(formData: FormData) {
  return api.post('/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export default api;