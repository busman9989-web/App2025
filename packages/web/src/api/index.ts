import axios, { AxiosRequestConfig } from 'axios';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

function getApiBase(): string {
  // Use HTTP for Android emulator, HTTP for browser (customize as needed)
  if (Capacitor.isNativePlatform()) {
    return 'https://api.carerscircle.co.uk';
  }
  // VITE_API_URL for web, fallback to http://api.carerscircle.co.uk:
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'https://api.carerscircle.co.uk';
  return raw.replace(/\/+$/, '');
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const base = getApiBase();
  const baseEndsWithApi = /\/api$/i.test(base);

  let p = path.startsWith('/') ? path : `/${path}`;

  // Remove double /api in path if base already ends with /api
  if (baseEndsWithApi && /^\/api(\/|$)/i.test(p)) {
    p = p.replace(/^\/api/i, '');
    if (!p.startsWith('/')) p = `/${p}`;
  }

  return `${base}${p}`;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestInput = {
  url: string;
  method: Method;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  config?: AxiosRequestConfig; // optional
};


async function getToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  } else {
    return localStorage.getItem('auth_token');
  }
}

async function handleUnauthorized() {
  const auth = useAuthStore();

  if (auth.isLoggingOut) {
    console.log('[API] Skipping handleUnauthorized - logout already in progress');
    return;
  }

  if (auth.justLoggedIn) {
    console.log('[API] Skipping handleUnauthorized - within login grace period');
    return;
  }

  const hadToken = !!(await getToken());
  console.log('[API] handleUnauthorized - had token:', hadToken);

  if (hadToken) {
    await auth.logout();
  } else {
    await auth.clearUser();
    await router.push('/login');
  }
}

async function request(input: RequestInput) {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(input.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const finalUrl = buildUrl(input.url);
  const auth = useAuthStore();

  console.log(
    `[API] ${input.method} ${finalUrl}`,
    token ? '✓ with token' : '✗ NO TOKEN',
    auth.justLoggedIn ? '(grace period)' : ''
  );

  if (Capacitor.isNativePlatform()) {
    try {
      console.log('[API DEBUG] About to call CapacitorHttp.request');

      const res = await CapacitorHttp.request({
        url: finalUrl,
        method: input.method,
        headers,
        data: input.data,
        params: input.params,
      });

      console.log(`[API] ← Response ${res.status} for ${input.method} ${finalUrl}`);

      // DEBUG: ALWAYS log raw response for login/register
      if (input.url.includes('/login') || input.url.includes('/register')) {
        console.log('[API DEBUG] ========== RAW CAPACITOR RESPONSE START ==========');
        console.log('[API DEBUG] Full response object:', JSON.stringify(res, null, 2));
        console.log('[API DEBUG] res.data type:', typeof res.data);
        console.log('[API DEBUG] res.data value:', res.data);
        console.log('[API DEBUG] res.data stringified:', JSON.stringify(res.data));
        if (res.data && typeof res.data === 'object') {
          console.log('[API DEBUG] res.data keys:', Object.keys(res.data));
          console.log('[API DEBUG] res.data.token exists?', 'token' in res.data);
          console.log('[API DEBUG] res.data.user exists?', 'user' in res.data);
        }
        console.log('[API DEBUG] ========== RAW CAPACITOR RESPONSE END ==========');
      }

      if (res.status === 401) {
        console.error(`[API] ← 401 Unauthorized for ${input.method} ${finalUrl}`);
        await handleUnauthorized();
        throw new Error('Unauthorized');
      }

      // Return normalized structure matching Axios
      return { data: res.data, status: res.status, headers: res.headers };
    } catch (err: any) {
      console.error(`[API] ← Error for ${input.method} ${finalUrl}:`, err.message || err);
      if (err?.status === 401) {
        await handleUnauthorized();
      }
      throw err;
    }
  } else {
    const axiosInstance = axios.create({
      withCredentials: true,
      headers,
    });

    axiosInstance.interceptors.response.use(
      (resp) => {
        console.log(`[API] ← Response ${resp.status} for ${input.method} ${finalUrl}`);
        return resp;
      },
      async (error) => {
        console.error(`[API] ← Error ${error.response?.status} for ${input.method} ${finalUrl}:`, error.message);
        if (error?.response?.status === 401) {
          await handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );

    const cfg: AxiosRequestConfig = {
      url: finalUrl,
      method: input.method,
      data: input.data,
      params: input.params,
      headers,
      withCredentials: true,
    };

    return axiosInstance.request(cfg);
  }
}

const api = {
  request,

  get(url: string, params?: Record<string, any>, headers?: Record<string, string>) {
    return request({ url, method: 'GET', params, headers });
  },

  post(url: string, data?: any, headers?: Record<string, string>) {
    return request({ url, method: 'POST', data, headers });
  },

  put(url: string, data?: any, headers?: Record<string, string>) {
    return request({ url, method: 'PUT', data, headers });
  },

  patch(url: string, data?: any, headers?: Record<string, string>) {
    return request({ url, method: 'PATCH', data, headers });
  },

  delete(url: string, params?: Record<string, any>, headers?: Record<string, string>) {
    return request({ url, method: 'DELETE', params, headers });
  },
};

/**
 * Upload user profile avatar.
 * @param formData FormData containing an "avatar" field (image file)
 * @returns Axios response
 */
export async function uploadAvatar(formData: FormData) {
  return api.post('/avatar', formData, {
    'Content-Type': 'multipart/form-data',
  });
}

export default api;