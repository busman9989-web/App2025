// File: carer-connect-monorepo/packages/web/src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/api'; // Import your API instance

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('authToken'));
  const user = ref<{ id: string; email: string; role: string } | null>(
    localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser') as string) : null
  );
  const isLoading = ref(false); // Add isLoading state for UX, initialized to false

  const setAuth = (newToken: string, newUser: { id: string; email: string; role: string }) => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const clearAuth = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  // NEW: Implement the verifyAuth function
  const verifyAuth = async () => {
    isLoading.value = true; // Set loading state when verification starts
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      try {
        // This request will automatically include the token via your API interceptor
        // (Assuming you have an Axios interceptor set up in '@/api.ts' or similar)
        const response = await api.get('/api/auth/me');
        if (response.data) {
          // If successful, update the user data
          // Important: /auth/me returns the user object, so we set both token (from localStorage) and the new user data
          setAuth(storedToken, response.data); 
          console.log('[AUTH STORE] User data refreshed via /auth/me for:', response.data.email);
        } else {
          // If response.data is unexpectedly empty, treat as invalid
          console.warn('[AUTH STORE] /auth/me responded without user data. Clearing auth.');
          clearAuth();
        }
      } catch (error: any) {
        console.error('[AUTH STORE] Error verifying authentication via /auth/me:', error.response?.status, error.message);
        // If the token is invalid or expired (e.g., backend returns 401/403), clear it
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.log('[AUTH STORE] Token invalid or expired. Clearing auth.');
          clearAuth();
        }
      }
    } else {
      console.log('[AUTH STORE] No token found in localStorage. Ensuring auth state is clear.');
      clearAuth(); // Ensure state is clear if no token
    }
    isLoading.value = false; // Reset loading state when verification finishes
  };

  return {
    token,
    user,
    isLoading, // Make isLoading reactive state available
    setAuth,
    clearAuth,
    verifyAuth, // Make verifyAuth function available
  };
});