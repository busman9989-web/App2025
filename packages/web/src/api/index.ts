// packages/web/src/api/index.ts
import axios from 'axios';
// We'll import useAuthStore here, but need to be careful about its usage in interceptors
import { useAuthStore } from '@/stores/auth';
import router from '@/router'; // Import your Vue Router instance

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Ensure default API URL, and usually /api is part of base
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the auth token
api.interceptors.request.use(
  (config) => {
    // Access token directly from localStorage for simplicity and to avoid circular dependency
    // issues with Pinia stores being initialized. The Pinia store should *also* reflect this.
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response, // If response is successful, just return it
  async (error) => { // Make async to await router.push
    // If the error is a 401 Unauthorized response
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized (401) API response detected. Logging out user.');

      // Safely access the auth store for logout action
      // This is a common pattern to avoid direct store creation outside setup() context
      // or to handle scenarios where the store might not be fully "active".
      const authStore = useAuthStore();
      authStore.logout(); // Clear Pinia state and localStorage

      // Redirect to login page
      // Using router.push here for a clean Vue Router navigation.
      // Make sure '@/router' exports your actual router instance.
      await router.push('/login'); // Await ensures navigation completes before next tick

      // Prevent further processing of the error
      return Promise.reject(error);
    }
    // For any other error, just reject the promise
    return Promise.reject(error);
  }
);

export default api;