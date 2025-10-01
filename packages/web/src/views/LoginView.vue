<template>
  <div class="auth-wrapper" :class="themeStore.theme === 'dark' ? 'dark-mode-bg' : 'light-mode-bg'">
    <div class="auth-container bg-white dark:bg-slate-800 rounded-xl shadow-md transition-colors">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white text-center transition-colors">Login to CarerConnect</h2>
      <form @submit.prevent="handleLogin" class="mt-6">

        <div>
          <label for="email" class="sr-only">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            v-model="email" 
            placeholder="Email" 
            required 
            class="form-input bg-white dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500 transition-colors" 
          />
        </div>

        <div class="mt-4">
          <label for="password" class="sr-only">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            v-model="password" 
            placeholder="Password" 
            required 
            class="form-input bg-white dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500 transition-colors" 
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="button-primary mt-6">Login</button>
      </form>

      <div class="auth-link">
        <RouterLink to="/register" class="text-sm text-teal-600 hover:underline dark:text-teal-400">Don't have an account? Sign Up</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme'; // Import the theme store
import api from '@/api';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore(); // Initialize the theme store

const handleLogin = async () => {
  error.value = ''; // Clear previous errors
  console.log('[FRONTEND DEBUG] Attempting login for email:', email.value);
  try {
    const response = await api.post('/api/auth/login', { email: email.value, password: password.value });
    console.log('[FRONTEND DEBUG] API Login Response:', response.data);

    if (response.data && response.data.user) {
      authStore.setUser(response.data.user);
      
      console.log('[FRONTEND DEBUG] User set in auth store. Redirecting...');
      router.push('/');
    } else {
      console.error('[FRONTEND DEBUG] Login response was successful but missing user data.');
      error.value = 'Failed to get user data after login.';
    }
  } catch (err: any) {
    console.error('[FRONTEND DEBUG] Login API call failed:', err);
    if (err.response && err.response.data && err.response.data.error) {
      error.value = err.response.data.error; // Use 'error' field from your API
    } else {
      error.value = 'Login failed. Please check your credentials.';
    }
  }
};
</script>

<style scoped>
/* A wrapper div to apply the overall page background for dark mode */
.auth-wrapper {
  @apply min-h-screen flex items-center justify-center p-6 transition-colors;
}

.light-mode-bg {
  @apply bg-slate-100; /* Light mode background for the whole page */
}

.dark-mode-bg {
  @apply bg-[#0f172a]; /* Dark mode background for the whole page, matching your Planner */
}


.auth-container { 
  @apply max-w-md mx-auto p-8 shadow-md; 
}
.form-input { 
  /* Removed static bg-white and text-slate-800 to allow dark: classes to apply */
  @apply w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500; 
}
.button-primary { 
  @apply w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors; 
}
.auth-link { @apply text-center mt-4; }
.auth-link a { 
  /* Already had base text-teal-600, added dark:text-teal-400 */
  @apply text-sm hover:underline; 
}
.error { @apply text-red-500 text-sm text-center mt-2; }
</style>