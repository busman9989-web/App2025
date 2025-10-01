// packages/client/src/stores/auth.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  status: string | null;
  twoFaEnabled: boolean;
}

interface RegistrationDetails {
  displayName: string;
  email: string;
  password: string;
  status?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const isLoggingOut = ref(false); // NEW: Track logout state
  const router = useRouter();
  
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function setUser(loggedInUser: User) {
    console.log('[AUTH STORE] Setting user:', loggedInUser);
    user.value = loggedInUser;
  }

  function clearUser() {
    console.log('[AUTH STORE] Clearing user');
    user.value = null;
  }
  
  async function register(details: RegistrationDetails) {
    isLoading.value = true;
    try {
      const response = await api.post('/api/auth/register', details);
      if (response.data && response.data.user) {
        setUser(response.data.user);
        router.push('/');
        return { success: true };
      } else {
        throw new Error('Registration succeeded but no user data returned');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || 'Registration failed' 
      };
    } finally {
      isLoading.value = false;
    }
  }

  // FIXED: Clean logout without triggering verification
  async function logout() {
    isLoading.value = true;
    isLoggingOut.value = true; // Set logout flag
    
    try {
      console.log('[AUTH STORE] Logging out...');
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed, clearing client-side state anyway.', error);
    } finally {
      clearUser();
      isLoading.value = false;
      
      // Navigate to login after clearing user
      router.push('/login');
      
      // Clear logout flag after navigation
      setTimeout(() => {
        isLoggingOut.value = false;
      }, 100);
    }
  }

  // FIXED: Don't verify if we're in the middle of logging out
  async function verifyAuth(): Promise<boolean> {
    if (isLoggingOut.value) {
      console.log('[AUTH STORE] Skipping verification during logout');
      return false;
    }

    isLoading.value = true;
    try {
      console.log('[AUTH STORE] Verifying auth...');
      const response = await api.get('/api/users/me');
      if (response.data) {
        console.log('[AUTH STORE] Auth verified, user:', response.data);
        setUser(response.data);
        return true;
      } else {
        console.log('[AUTH STORE] No user data in auth response');
        clearUser();
        return false;
      }
    } catch (error: any) {
      // Only log if it's not during logout
      if (!isLoggingOut.value) {
        console.log('[AUTH STORE] Auth verification failed:', error.response?.status || error.message);
      }
      clearUser();
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function initialize(): Promise<boolean> {
    console.log('[AUTH STORE] Initializing...');
    return await verifyAuth();
  }

  return {
    // State
    user,
    isLoading,
    isLoggingOut, // Export logout state
    
    // Getters
    isAuthenticated,
    isAdmin,
    
    // Actions
    setUser,
    clearUser,
    register,
    logout,
    verifyAuth,
    initialize,
  };
});