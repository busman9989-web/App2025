<template>
  <div
    id="app"
    class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors overflow-x-hidden no-swipe"
  >
    <div
      v-if="authStore.isLoading"
      class="flex items-center justify-center flex-grow h-screen"
    >
      <div class="text-slate-600 dark:text-slate-300 text-lg animate-pulse">
        Loading your session...
      </div>
    </div>

    <div v-else class="flex flex-col min-h-screen">
      <BaseNavbar
        :show-nav-links="showNavLinks"
        class="min-h-[64px] py-3"
        v-if="!isInGame"
      />

      <main
        class="flex-grow container mx-auto px-4 space-y-6 transition-all"
        :class="
          authStore.isAuthenticated && !hiddenRoutes.includes(route.path)
            ? 'py-4 pb-24'
            : 'py-8'
        "
      >
        <div
          v-if="authStore.isAuthenticated && !hiddenRoutes.includes(route.path)"
          class="fixed right-4 z-50 flex flex-col items-center space-y-4"
          :style="{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }"
        >
          <button
            v-if="!isInGame && route.path !== '/settings'"
            class="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                   text-white rounded-full shadow-lg flex items-center justify-center 
                   transition-all transform hover:scale-110 active:scale-95 
                   focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 
                   w-14 h-14"
            @click="goToGame"
            aria-label="Open Game"
          >
            <img
              src="/gameicon.png"
              alt="Game"
              class="w-10 h-10 object-contain"
            />
          </button>

          <HelpButton v-if="route.path === '/settings'" />
        </div>

        <ChatWidget
          id="chat-widget"
          v-if="!isInGame"
          :hide-on-routes="[...hiddenRoutes, '/settings']"
        />

        <router-view
          :key="route.fullPath"
          @enter-game="setIsInGame(true)"
          @exit-game="setIsInGame(false)"
        />
      </main>

      <nav
        v-if="
          authStore.isAuthenticated &&
          !hiddenRoutes.includes(route.path) &&
          !isInGame
        "
        class="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-40 safe-area-inset-bottom no-swipe-nav"
      >
        <div class="grid grid-cols-6 gap-1 h-20 px-1 max-w-screen-xl mx-auto">
          <router-link
            v-for="(tab, idx) in tabs"
            :key="idx"
            :to="tab.to"
            class="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors min-h-[56px]"
            :class="tab.activeClass"
            @click.prevent="handleTabClick(tab.to)"
          >
            <component :is="tab.icon" class="w-6 h-6 mb-1" />
            <span class="text-xs font-medium">{{ tab.label }}</span>
          </router-link>
        </div>
      </nav>
    </div>

    <Toaster position="top-center" richColors />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import BaseNavbar from '@/components/BaseNavbar.vue';
import { Toaster } from '@/components/ui/sonner';
import ChatWidget from '@/components/ChatWidget.vue';
import HelpButton from '@/components/HelpButton.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const hiddenRoutes = ['/login', '/register'];
const showNavLinks = computed(() => !hiddenRoutes.includes(route.path));
const isNativeApp = Capacitor.isNativePlatform();

const isInGame = ref(false);
function setIsInGame(val: boolean) {
  isInGame.value = val;
}

const tabs = computed(() =>
  [
    { to: '/', label: 'Home', icon: HomeIcon },
    { to: '/planner', label: 'Planner', icon: PlannerIcon },
    { to: '/checklists', label: 'Tasks', icon: TasksIcon },
    { to: '/community', label: 'Community', icon: CommunityIcon },
    { to: '/resources', label: 'Support', icon: SupportIcon },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ].map((t) => {
    
    const isExactMatch = route.path === t.to;
    const isSegmentMatch = 
        route.path.startsWith(t.to) && 
        route.path.length > t.to.length &&
        route.path.charAt(t.to.length) === '/';
    
    const isActive = isExactMatch || (t.to !== '/' && isSegmentMatch);
    
    return {
      ...t,
      activeClass: isActive
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600',
    };
  })
);

function handleTabClick(path: string) {
  if (route.path === '/settings' && path !== '/settings') {
    router.replace(path).then(() => {
      router.go(0);
    }).catch(err => {
      if (err.name !== 'NavigationDuplicated') {
        router.go(0);
      }
    });
  } else if (route.path !== path) {
    router.push(path);
  }
}

function goToGame() {
  setIsInGame(true);
  router.push('/game');
}

onMounted(async () => {
  setHtmlTheme(themeStore.theme);
  watch(
    () => themeStore.theme,
    (theme) => setHtmlTheme(theme),
    { immediate: true }
  );

  try {
    await authStore.initialize();
  } catch (err) {
    console.error('[App.vue] ❌ Auth initialization failed:', err);
  }
});

function setHtmlTheme(theme: string) {
  if (theme === 'dark')
    document.documentElement.classList.add('dark');
  else
    document.documentElement.classList.remove('dark');
}

/* SVG icon components */
const HomeIcon = {
  template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg>`
};
const PlannerIcon = {
  template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
};
const TasksIcon = {
  template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`
};
const CommunityIcon = {
  template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a3.004 3.004 0 015.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`
};
const SupportIcon = {
  template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`
};
const SettingsIcon = {
  template: `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
};
</script>

<style>
/* Disable swipe navigation completely */
html, body {
  touch-action: pan-y !important;
  overscroll-behavior: none !important;
  -webkit-overflow-scrolling: touch;
}

#app {
  touch-action: pan-y !important;
  overscroll-behavior-x: none !important;
}

/* Disable swipe on navigation bar */
.no-swipe-nav {
  touch-action: none !important;
  -webkit-user-drag: none;
  user-select: none;
}

.no-swipe {
  touch-action: pan-y !important;
  overscroll-behavior-x: none !important;
}

/* Allow vertical scrolling in content areas */
main {
  touch-action: pan-y !important;
  -webkit-overflow-scrolling: touch;
}

.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>