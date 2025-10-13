<template>
  <nav 
    class="w-full px-4 py-3 flex items-center gap-2 justify-between 
           bg-gradient-to-r from-cyan-700 to-blue-700 rounded-b-3xl shadow-lg 
           sticky top-0 z-10 transition-colors"
  >
    <!-- Left Section -->
    <div class="flex items-center gap-3 flex-shrink-0 h-12">
      <span class="inline-block bg-white rounded-full p-2 shadow-md">
        <img src="/logo.svg" alt="CarerConnect Logo" class="w-6 h-6 text-cyan-700" />
      </span>
      <span class="font-bold text-2xl text-white ml-2">CarerConnect</span>
    </div>

    <!-- Middle Section -->
    <div class="flex-1 flex justify-center h-12 items-center">
      <ul v-if="props.showNavLinks && isAuthenticated" class="flex gap-2 md:gap-4 items-center h-12">
        <li v-for="item in navLinks" :key="item.to">
          <router-link
            :to="item.to"
            class="group flex flex-col items-center justify-center h-12 px-3 focus:outline-none"
            active-class="font-bold"
            :title="item.label"
          >
            <span v-html="item.icon" class="mb-1 group-hover:text-teal-300 text-white transition-colors"></span>
            <span class="text-xs text-white group-hover:text-teal-200 transition-colors">{{ item.label }}</span>
          </router-link>
        </li>
      </ul>
    </div>

    <!-- Right Section -->
    <div class="flex items-center gap-3 flex-shrink-0 h-12">
      <!-- Theme Toggle -->
      <button
        @click="handleThemeToggle"
        class="p-2 rounded-full text-white bg-cyan-800/60 hover:bg-cyan-700 transition"
        :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Authenticated User -->
      <template v-if="isAuthenticated">
        <router-link
          v-if="user?.id"
          :to="`/profile/${user.id}`"
          class="hidden sm:flex p-1 rounded-full shadow-md items-center justify-center hover:ring-2 hover:ring-cyan-200 transition"
          :class="computedProfileImageSrc ? 'bg-white' : 'bg-gray-900'"
          :title="`View profile for ${displayName}`"
        >
          <img
            v-if="computedProfileImageSrc"
            :src="computedProfileImageSrc"
            alt="Profile Picture"
            class="w-8 h-8 rounded-full object-cover border-2 border-cyan-500"
          />
          <svg v-else class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 14a4 4 0 100-8 4 4 0 000 8zm0 2c-3 0-6 1.5-6 3v1h12v-1c0-1.5-3-3-6-3z" fill="currentColor"/>
          </svg>
        </router-link>
        <span class="hidden sm:inline text-sm text-white">
          Hi, {{ displayName }}
        </span>
        <button
          @click="handleLogout"
          class="text-sm text-red-300 hover:text-red-100 hover:underline transition-colors"
        >
          Logout
        </button>
      </template>

      <!-- Guest -->
      <template v-else>
        <router-link
          v-if="props.showNavLinks"
          to="/login"
          class="text-sm text-white hover:underline transition-colors"
        >
          Login
        </router-link>
        <router-link
          v-if="props.showNavLinks"
          to="/register"
          class="text-sm text-white hover:underline transition-colors"
        >
          Register
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { defineProps, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';

const props = defineProps({
  showNavLinks: { type: Boolean, default: true },
});

const router = useRouter();
const auth = useAuthStore();
const themeStore = useThemeStore();

const user = computed(() => auth.user);
const isAuthenticated = computed(() => auth.isAuthenticated);
const isDark = computed(() => themeStore.theme === 'dark');

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const computedProfileImageSrc = computed(() => {
  const url = user.value?.profilePictureUrl;
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return API_BASE_URL.replace(/\/$/, '') + (url.startsWith('/') ? '' : '/') + url;
});

const displayName = computed(() => user.value?.displayName ?? 'User');

// Call the global, guarded refetch-once function
onMounted(() => {
  if (isAuthenticated.value) {
    auth.ensureProfileRefetchOnce();
  }
});

// If user switches, try once for the new user
watch(
  () => user.value?.id,
  (newId) => {
    if (newId) {
      console.log('[Navbar] ensureProfileRefetchOnce for user', newId);
      auth.ensureProfileRefetchOnce();
    }
  }
);

// --- Handlers ---
async function handleLogout() {
  try {
    await auth.logout();
    router.push('/login');
  } catch (err) {
    console.error('[Navbar] Logout failed', err);
  }
}

function handleThemeToggle() {
  themeStore.toggleTheme();
}

// --- Nav Links ---
const navLinks = [
  { to: '/', label: 'Home', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8a2 2 0 002 2h4a2 2 0 002-2v-8m-6 0h6" /></svg>` },
  { to: '/community', label: 'Community', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4V5a2 2 0 10-4 0v7m4 4a4 4 0 00-8 0M5 10a5 5 0 0010 0" /></svg>` },
  { to: '/journal', label: 'Journal', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 20h9"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m0-16H6a2 2 0 00-2 2v12a2 2 0 002 2h6"/></svg>` },
  { to: '/planner', label: 'Planner', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></rect><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 3v4M8 3v4M3 9h18"/></svg>` },
  { to: '/checklists', label: 'Checklists', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>` },
  { to: '/resources', label: 'Resources', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3" /></svg>` },
  { to: '/settings', label: 'Settings', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v2m0 12v2m8-8h2M2 12H4m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l1.414-1.414M4.222 19.778l1.414-1.414"/><circle cx="12" cy="12" r="4" stroke-width="2" stroke-linejoin="round"></circle></svg>` },
];
</script>