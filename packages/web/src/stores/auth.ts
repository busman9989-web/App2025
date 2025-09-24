// packages/web/src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // Import useRouter
import api from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('authToken'));
  const user = ref<{ id: string; email: string; role: string } | null>(
    localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser') as string) : null
  );
  const isLoading = ref(false);
  const router = useRouter(); // Initialize router

  const setAuth = (newToken: string, newUser: { id: string; email: string; role: string }) => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  // Renamed this function to 'logout'
  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Redirect to login page after logout
    router.push('/login');
  };

  const verifyAuth = async () => {
    isLoading.value = true;
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        // --- THIS LINE HAS BEEN UPDATED ---
        const response = await api.get('/api/users/me'); // Changed from /api/auth/me to /api/users/me
        // --- END OF UPDATE ---
        if (response.data) {
          setAuth(storedToken, response.data);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error verifying auth:', error);
        logout();
      }
    } else {
      logout();
    }
    isLoading.value = false;
  };

  return {
    token,
    user,
    isLoading,
    setAuth,
    // Make sure 'logout' is exported
    logout,
    verifyAuth,
  };
});