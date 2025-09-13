<template>
  <div id="app" class="flex flex-col min-h-screen bg-slate-50">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center space-x-2 text-teal-600 font-bold text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span>CarerConnect</span>
        </router-link>

        <div class="flex items-center space-x-6">
          <template v-if="authStore.token">
            <router-link to="/community" class="nav-link">Community</router-link>
            <router-link to="/journal" class="nav-link">Journal</router-link>
            <router-link to="/checklists" class="nav-link">Checklists</router-link>
            <router-link to="/resources" class="nav-link">Resources</router-link>
            <router-link to="/settings" class="nav-link">Settings</router-link>
            <button @click="handleLogout" class="nav-link text-red-600 hover:text-red-700">Logout</button>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link">Login</router-link>
            <router-link to="/register" class="nav-button">Register</router-link>
          </template>
        </div>
      </nav>
    </header>

    <main class="flex-grow container mx-auto px-4 py-8">
      <router-view />
    </main>

    <footer class="bg-slate-800 text-white py-6">
      <div class="container mx-auto px-4 text-center text-sm">
        &copy; {{ new Date().getFullYear() }} CarerConnect. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'; // Import onMounted
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = async () => {
  try {
    // Note: The backend logout endpoint simply confirms logout for JWT
    // It doesn't actually invalidate the token, the client discards it.
    await api.post('/api/auth/logout'); 
    authStore.clearAuth();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Logout failed. Please try again.');
  }
};

onMounted(() => { // Call verifyAuth on mount to initialize authentication state
  authStore.verifyAuth();
});
</script>

<style scoped>
.nav-link {
  @apply text-slate-600 hover:text-teal-600 font-medium transition-colors;
}

.nav-button {
  @apply px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors;
}

/* Add any other global styles for layout */
</style>