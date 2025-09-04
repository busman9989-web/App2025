import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import router from '@/router';
import api from '@/api';

interface User {
  id: string;
  displayName: string;
  email: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('carerconnect_token'));
  const user = ref<User | null>(null);
  const isLoading = ref(true); // Start in a loading state

  if (token.value) {
    try {
      user.value = jwtDecode<User>(token.value);
    } catch {
      localStorage.removeItem('carerconnect_token');
      token.value = null;
    }
  }

  const isAuthenticated = computed(() => !!user.value);

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('carerconnect_token', newToken);
    user.value = jwtDecode<User>(newToken);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('carerconnect_token');
    router.push('/login');
  }

  async function verifyAuth() {
    isLoading.value = true;
    if (!token.value) {
      isLoading.value = false;
      return;
    }
    try {
      // Re-attach the token for this specific check, as the interceptor might not be ready
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      await api.get('/api/users/me');
    } catch (error) {
      console.log("Token verification failed, logging out.");
      logout();
    } finally {
      isLoading.value = false;
    }
  }

  return { token, user, isAuthenticated, isLoading, setToken, logout, verifyAuth };
});