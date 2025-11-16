<template>
  <nav class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors sticky top-0 z-50 shadow-sm">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <router-link 
          to="/" 
          class="flex items-center gap-2 shrink-0"
        >
          <img 
            src="/logo.svg" 
            alt="CarersCircle" 
            class="h-7 w-7"
          />
          <span class="font-bold text-slate-800 dark:text-slate-100 text-base">
            CarersCircle
          </span>
        </router-link>

        <!-- Right side: Theme toggle & Profile -->
        <div class="flex items-center gap-3">
          <!-- Theme Toggle -->
          <button
            @click="themeStore.toggleTheme"
            class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
            :title="themeStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <svg v-if="themeStore.theme === 'dark'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- Profile Picture Link -->
          <router-link
            v-if="authStore.isAuthenticated"
            :to="`/profile/${authStore.user?.id}`"
            class="block w-8 h-8 rounded-full overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-blue-500 dark:hover:ring-blue-400 active:ring-4 active:ring-blue-300 dark:active:ring-blue-600 transition-all"
            :class="authStore.user?.profilePictureUrl ? 'bg-slate-200 dark:bg-slate-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'"
          >
            <img 
              v-if="authStore.user?.profilePictureUrl" 
              :src="authStore.user.profilePictureUrl" 
              alt="Profile"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
            <div 
              v-else 
              class="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
            >
              {{ userInitials }}
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();

const userInitials = computed(() => {
  const name = authStore.user?.displayName || authStore.user?.email || 'U';
  return name.charAt(0).toUpperCase();
});

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  console.error('Failed to load profile picture:', authStore.user?.profilePictureUrl);
};
</script>

<style scoped>
button, a {
  @apply transition-all duration-200;
}
</style>