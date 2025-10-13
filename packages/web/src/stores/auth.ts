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
  profilePictureUrl?: string | null;
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
  const isLoggingOut = ref(false);
  const initialized = ref(false); // Track if auth check is complete
  const router = useRouter();

  // Global, per-user, refetch-once guards
  const profileRefetchDoneByUserId = ref<Record<string, boolean>>({});
  const profileRefetchInFlight = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function setUser(loggedInUser: User) {
    console.log('[AUTH STORE] Setting user:', loggedInUser);
    user.value = { ...loggedInUser };
  }

  function clearUser() {
    console.log('[AUTH STORE] Clearing user');
    user.value = null;
  }

  function updateProfilePictureUrl(url: string | null) {
    if (user.value) {
      user.value.profilePictureUrl = url;
    }
  }

  async function register(details: RegistrationDetails) {
    isLoading.value = true;
    try {
      const response = await api.post('/api/auth/register', details, { withCredentials: true });
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
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Registration failed',
      };
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    isLoggingOut.value = true;
    try {
      console.log('[AUTH STORE] Logging out...');
      await api.post('/api/auth/logout', undefined, { withCredentials: true });
    } catch (error) {
      console.error('Logout API call failed, clearing client-side state anyway.', error);
    } finally {
      clearUser();
      isLoading.value = false;
      router.push('/login');
      setTimeout(() => (isLoggingOut.value = false), 100);
    }
  }

  async function verifyAuth(): Promise<boolean> {
    if (isLoggingOut.value) {
      console.log('[AUTH STORE] Skipping verification during logout');
      return false;
    }

    isLoading.value = true;
    try {
      console.log('[AUTH STORE] Verifying auth...');
      const authResponse = await api.get('/api/users/me', { withCredentials: true });

      if (authResponse.data) {
        console.log('[AUTH STORE] Auth verified, user:', authResponse.data);
        setUser(authResponse.data as User);
        return true;
      } else {
        console.log('[AUTH STORE] No user data in auth response');
        clearUser();
        return false;
      }
    } catch (error: any) {
      if (!isLoggingOut.value) {
        console.log('[AUTH STORE] Auth verification failed:', error?.response?.status || error?.message);
      }
      clearUser();
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Global, safe “refetch once per user” guard
  async function ensureProfileRefetchOnce(): Promise<void> {
    const current = user.value;
    if (!current) return;

    const id = current.id;
    if (profileRefetchDoneByUserId.value[id]) return;

    if (current.profilePictureUrl) {
      profileRefetchDoneByUserId.value[id] = true;
      return;
    }

    if (profileRefetchInFlight.value) return;

    profileRefetchInFlight.value = true;
    console.log('[AUTH STORE] ensureProfileRefetchOnce — verifying for user', id);
    try {
      await verifyAuth();
    } finally {
      // Mark done regardless to prevent loops even if picture stays null
      profileRefetchDoneByUserId.value[id] = true;
      profileRefetchInFlight.value = false;
    }
  }

  // NEW: Set initialized after first auth check resolves
  async function initialize(): Promise<boolean> {
    console.log('[AUTH STORE] Initializing...');
    const result = await verifyAuth();
    initialized.value = true;
    return result;
  }

  return {
    user,
    isLoading,
    isLoggingOut,
    initialized, // expose this for navbars etc.
    isAuthenticated,
    isAdmin,
    setUser,
    clearUser,
    register,
    logout,
    verifyAuth,
    initialize,
    updateProfilePictureUrl,
    ensureProfileRefetchOnce,
  };
});