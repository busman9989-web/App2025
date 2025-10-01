<template>
  <div id="app" class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
    <header class="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10 transition-colors">
      <nav class="container mx-auto px-4 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center space-x-2 text-teal-600 dark:text-indigo-400 font-bold text-xl transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <span>CarerConnect</span>
        </router-link>

        <div class="flex items-center space-x-6">
          <div v-if="authStore.isLoading" class="text-slate-500 dark:text-slate-400 text-sm transition-colors">
            Loading...
          </div>
          
          <template v-else-if="authStore.isAuthenticated">
            <router-link to="/community" class="nav-link">Community</router-link>
            <router-link to="/journal" class="nav-link">Journal</router-link>
            <router-link to="/planner" class="nav-link">Planner</router-link>
            <router-link to="/checklists" class="nav-link">Checklists</router-link>
            <router-link to="/resources" class="nav-link">Resources</router-link>
            <router-link to="/settings" class="nav-link">Settings</router-link>
            
            <div class="flex items-center space-x-3">
              <span class="text-sm text-slate-600 dark:text-slate-300 transition-colors">
                Welcome, {{ authStore.user?.displayName || 'User' }}
              </span>
              <button 
                @click="handleLogout" 
                :disabled="authStore.isLoading"
                class="nav-link text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
              >
                Logout
              </button>
            </div>
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

    <footer class="bg-slate-800 dark:bg-slate-900 text-white dark:text-slate-300 py-6 transition-colors">
      <div class="container mx-auto px-4 text-center text-sm">
        &copy; {{ new Date().getFullYear() }} CarerConnect. All rights reserved.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = async () => {
  if (authStore.isLoading) return;
  
  try {
    console.log('[APP] Logging out...');
    await authStore.logout();
  } catch (error) {
    console.error('[APP] Logout failed:', error);
  }
};

const manualRefresh = async () => {
  console.log('[APP] Manual auth refresh triggered');
  await authStore.verifyAuth();
};

onMounted(async () => {
  console.log('[APP] App mounted, initializing auth...');
  
  try {
    const isAuthenticated = await authStore.initialize();
    console.log('[APP] Auth initialized. Result:', isAuthenticated);
    console.log('[APP] Final auth state:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user?.displayName,
      isLoading: authStore.isLoading
    });
  } catch (error) {
    console.error('[APP] Auth initialization failed:', error);
  }
});
</script>

<style scoped>
.nav-link {
  @apply text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-indigo-400 font-medium transition-colors;
}

.nav-button {
  @apply px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors;
}
</style>