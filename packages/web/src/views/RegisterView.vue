<template>
  <div class="auth-wrapper" :class="themeStore.theme === 'dark' ? 'dark-mode-bg' : 'light-mode-bg'">
    <div class="auth-container bg-white dark:bg-slate-800 rounded-xl shadow-md transition-colors">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white text-center transition-colors">Create an Account</h2>
      <form @submit.prevent="handleRegister" class="mt-6">

        <div>
          <label for="displayName" class="sr-only">Display Name</label>
          <input 
            type="text" 
            id="displayName" 
            name="displayName" 
            v-model="displayName" 
            placeholder="Display Name" 
            required 
            class="form-input bg-white dark:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500 transition-colors" 
          />
        </div>

        <div class="mt-4">
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
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" :disabled="isLoading" class="button-primary mt-6">
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>
      <div class="auth-link">
        <RouterLink to="/login" class="text-sm text-teal-600 hover:underline dark:text-teal-400">Already have an account? Login</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '@/api';
import { useThemeStore } from '@/stores/theme'; // Import the theme store

const displayName = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const success = ref('');
const isLoading = ref(false);
const router = useRouter();
const themeStore = useThemeStore(); // Initialize the theme store

const handleRegister = async () => {
  error.value = '';
  success.value = '';
  isLoading.value = true;
  try {
    await api.post('/api/auth/register', {
      displayName: displayName.value,
      email: email.value,
      password: password.value,
      status: 'active'
    });
    success.value = 'Account created! Redirecting to login...';
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (err: any) {
    if (err.response && err.response.data && err.response.data.message) {
      error.value = err.response.data.message;
    } else {
      error.value = 'Registration failed. Please try again.';
    }
  } finally {
    isLoading.value = false;
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
  /* Removed static bg-white and text-slate-800 from here, handled by direct classes */
  @apply w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500; 
}
.button-primary { 
  @apply w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors; 
}
.auth-link { @apply text-center mt-4; }
.auth-link a { 
  @apply text-sm hover:underline; /* Already had base text-teal-600, added dark:text-teal-400 */
}
.error { @apply text-red-500 text-sm text-center mt-2; }
.success { @apply text-green-600 text-sm text-center mt-2; }
</style>