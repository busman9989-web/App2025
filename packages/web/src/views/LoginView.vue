<template>
  <div class="auth-container">
    <h2 class="text-2xl font-bold text-slate-800 text-center">Login to CarerConnect</h2>
    <form @submit.prevent="handleLogin" class="mt-6">

      <div>
        <label for="email" class="sr-only">Email</label>
        <input type="email" id="email" name="email" v-model="email" placeholder="Email" required class="form-input" />
      </div>

      <div class="mt-4">
        <label for="password" class="sr-only">Password</label>
        <input type="password" id="password" name="password" v-model="password" placeholder="Password" required class="form-input" />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="button-primary mt-6">Login</button>
    </form>

    <div class="auth-link">
      <RouterLink to="/register">Don't have an account? Sign Up</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';

const email = ref(''); 
const password = ref(''); 
const error = ref('');
const router = useRouter(); 
const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    const response = await api.post('/api/auth/login', { email: email.value, password: password.value });
    authStore.setToken(response.data.token);
    router.push('/');
  } catch (err) {
    error.value = 'Invalid credentials.';
  }
};
</script>

<style scoped>
.auth-container { @apply max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-md; }
.form-input { @apply w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500; }
.button-primary { @apply w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors; }
.auth-link { @apply text-center mt-4; }
.auth-link a { @apply text-sm text-teal-600 hover:underline; }
.error { @apply text-red-500 text-sm text-center mt-2; }
</style>