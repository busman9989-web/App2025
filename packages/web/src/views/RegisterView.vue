<template>
  <div class="auth-container">
    <h2 class="text-2xl font-bold text-slate-800 text-center">Create an Account</h2>
    <form @submit.prevent="handleRegister" class="mt-6">

      <div>
        <label for="displayName" class="sr-only">Display Name</label>
        <input type="text" id="displayName" name="displayName" v-model="displayName" placeholder="Display Name" required class="form-input" />
      </div>

      <div class="mt-4">
        <label for="email" class="sr-only">Email</label>
        <input type="email" id="email" name="email" v-model="email" placeholder="Email" required class="form-input" />
      </div>

      <div class="mt-4">
        <label for="password" class="sr-only">Password</label>
        <input type="password" id="password" name="password" v-model="password" placeholder="Password" required class="form-input" />
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>

      <button type="submit" :disabled="isLoading" class="button-primary mt-6">
        {{ isLoading ? 'Creating Account...' : 'Create Account' }}
      </button>
    </form>
    <div class="auth-link">
      <RouterLink to="/login">Already have an account? Login</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '@/api';

const displayName = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const success = ref('');
const isLoading = ref(false);
const router = useRouter();

const handleRegister = async () => {
  error.value = '';
  success.value = '';
  isLoading.value = true;
  try {
    // Making the API call to register, now including the 'status' field
    await api.post('/api/auth/register', {
      displayName: displayName.value,
      email: email.value,
      password: password.value,
      status: 'active' // <--- THIS IS THE ADDED LINE
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
.auth-container { @apply max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-md; }
.form-input { @apply w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500; }
.button-primary { @apply w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors; }
.auth-link { @apply text-center mt-4; }
.auth-link a { @apply text-sm text-teal-600 hover:underline; }
.error { @apply text-red-500 text-sm text-center mt-2; }
.success { @apply text-green-600 text-sm text-center mt-2; }
</style>