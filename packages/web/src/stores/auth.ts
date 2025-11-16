import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import api from '@/api';

interface User {
  id: string;
  email: string;
  displayName: string | null;
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

// ✅ Helper functions for token storage
async function setToken(token: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: 'auth_token', value: token });
    // ✅ Add extra delay to ensure write completes
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('[AUTH STORE] Token saved to Capacitor Preferences');
  } else {
    localStorage.setItem('auth_token', token);
    console.log('[AUTH STORE] Token saved to localStorage');
  }
}

async function getToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  } else {
    return localStorage.getItem('auth_token');
  }
}

async function removeToken(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: 'auth_token' });
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('[AUTH STORE] Removed token from Capacitor Preferences');
  } else {
    localStorage.removeItem('auth_token');
    console.log('[AUTH STORE] Removed token from localStorage');
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const isLoggingOut = ref(false);
  const initialized = ref(false);
  const justLoggedIn = ref(false);
  const router = useRouter();

  const profileRefetchDoneByUserId = ref<Record<string, boolean>>({});
  const profileRefetchInFlight = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function setUser(loggedInUser: User) {
    console.log('[AUTH STORE] Setting user:', loggedInUser);
    user.value = { ...loggedInUser };
  }

  async function clearUser() {
    console.log('[AUTH STORE] Clearing user');
    user.value = null;
    await removeToken();
    justLoggedIn.value = false;
  }

  function updateProfilePictureUrl(url: string | null) {
    if (user.value) user.value.profilePictureUrl = url;
  }

  async function register(details: RegistrationDetails) {
    isLoading.value = true;
    try {
      const response = await api.post('/api/auth/register', details);
      if (response.data?.user) {
        if (response.data?.token) {
          await setToken(response.data.token);
          // ✅ Verify token was saved
          const verified = await getToken();
          console.log('[AUTH STORE] Token verified after registration:', verified ? '✓ exists' : '✗ missing');
        }
        setUser(response.data.user);
        justLoggedIn.value = true;
        setTimeout(() => justLoggedIn.value = false, 5000);
        await router.push('/');
        return { success: true };
      }
      throw new Error('Registration succeeded but no user data returned');
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

  async function login(email: string, password: string) {
    isLoading.value = true;
    try {
      console.log('[AUTH STORE] Calling login API...');
      const response = await api.post('/api/auth/login', { email, password });

      // ✅ DEBUG: Log the entire response
      console.log('[AUTH STORE] Login response data:', JSON.stringify(response.data));
      console.log('[AUTH STORE] Response has token?', response.data?.token ? 'YES' : 'NO');
      console.log('[AUTH STORE] Response has user?', response.data?.user ? 'YES' : 'NO');
      
      if (response.data?.token) {
        console.log('[AUTH STORE] Token preview:', response.data.token.substring(0, 20) + '...');
      }

      // ✅ Save token FIRST and WAIT for it to complete
      if (response.data?.token) {
        console.log('[AUTH STORE] Saving token...');
        await setToken(response.data.token);
        
        // ✅ Verify token was saved with retries
        let verified = await getToken();
        let retries = 0;
        while (!verified && retries < 3) {
          console.log(`[AUTH STORE] Token not found, retry ${retries + 1}/3...`);
          await new Promise(resolve => setTimeout(resolve, 100));
          verified = await getToken();
          retries++;
        }
        
        if (verified) {
          console.log('[AUTH STORE] ✓ Token verified after save:', verified.substring(0, 20) + '...');
        } else {
          console.error('[AUTH STORE] ✗ Token STILL missing after retries!');
          throw new Error('Failed to save authentication token');
        }
      } else {
        console.error('[AUTH STORE] ❌ NO TOKEN in login response!');
        console.error('[AUTH STORE] Response keys:', Object.keys(response.data || {}));
        throw new Error('Login response did not include authentication token');
      }

      if (response.data?.user) {
        setUser(response.data.user);
        justLoggedIn.value = true;
        
        // ✅ Extended grace period - 10 seconds for native
        const gracePeriod = Capacitor.isNativePlatform() ? 10000 : 3000;
        console.log(`[AUTH STORE] Login grace period started: ${gracePeriod}ms`);
        
        setTimeout(() => {
          justLoggedIn.value = false;
          console.log('[AUTH STORE] Login grace period ended');
        }, gracePeriod);
        
        await router.push('/');
        return { success: true };
      }

      console.error('[AUTH STORE] ❌ NO USER in login response!');
      return { success: false, message: 'No user returned from login.' };
    } catch (error: any) {
      console.error('[AUTH STORE] Login failed:', error);
      console.error('[AUTH STORE] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return {
        success: false,
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          'Login failed',
      };
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    // ✅ Prevent multiple simultaneous logouts
    if (isLoggingOut.value) {
      console.log('[AUTH STORE] Logout already in progress, skipping...');
      return;
    }
    
    isLoading.value = true;
    isLoggingOut.value = true;
    
    try {
      console.log('[AUTH STORE] Logging out...');
      const token = await getToken();

      const shouldCallApi = !!token || !Capacitor.isNativePlatform();

      if (shouldCallApi) {
        await api.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout API call failed, clearing client-side state anyway.', error);
    } finally {
      await clearUser();
      isLoading.value = false;
      await router.push('/login');
      setTimeout(() => (isLoggingOut.value = false), 100);
    }
  }

  async function verifyAuth(): Promise<boolean> {
    if (isLoggingOut.value) {
      console.log('[AUTH STORE] Skipping verification during logout');
      isLoading.value = false; // FIX: ensure loading is reset!
      return false;
    }

    const token = await getToken();
    if (Capacitor.isNativePlatform() && !token) {
      console.log('[AUTH STORE] No token yet on native; skipping verifyAuth call.');
      user.value = null;
      isLoading.value = false; // FIX: ensure loading is reset!
      return false;
    }

    isLoading.value = true;
    try {
      console.log('[AUTH STORE] Verifying auth with token:', token ? 'present' : 'missing');
      const authResponse = await api.get('/api/users/me');

      if (authResponse.data) {
        console.log('[AUTH STORE] Auth verified, user:', authResponse.data);
        setUser(authResponse.data as User);
        return true;
      } else {
        console.log('[AUTH STORE] No user data in auth response');
        await clearUser();
        return false;
      }
    } catch (error: any) {
      if (!isLoggingOut.value && !justLoggedIn.value) {
        console.error('[AUTH STORE] Auth verification failed:', error?.response?.status || error?.message);
        await clearUser();
      } else {
        console.log('[AUTH STORE] Auth verification failed but within grace period, ignoring');
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function ensureProfileRefetchOnce(): Promise<void> {
    const current = user.value;
    if (!current) return;

    const id = current.id;
    if (profileRefetchDoneByUserId.value[id]) return;

    const token = await getToken();
    if (Capacitor.isNativePlatform() && !token) {
      console.log('[AUTH STORE] Skipping ensureProfileRefetchOnce — no token on native yet.');
      profileRefetchDoneByUserId.value[id] = true;
      return;
    }

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
      profileRefetchDoneByUserId.value[id] = true;
      profileRefetchInFlight.value = false;
    }
  }

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
    justLoggedIn,
    initialized,
    isAuthenticated,
    isAdmin,
    setUser,
    clearUser,
    register,
    login,
    logout,
    verifyAuth,
    initialize,
    updateProfilePictureUrl,
    ensureProfileRefetchOnce,
    getToken,
  };
});