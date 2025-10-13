<template>
  <div
    id="app"
    class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors"
  >
    <!-- 🧠 Show loading state while auth initializes -->
    <div
      v-if="authStore.isLoading"
      class="flex items-center justify-center flex-grow h-screen"
    >
      <div class="text-slate-600 dark:text-slate-300 text-lg animate-pulse">
        Loading your session...
      </div>
    </div>

    <!-- ✅ Render main app only after auth completes -->
    <div v-else class="flex flex-col min-h-screen">
      <BaseNavbar :show-nav-links="showNavLinks" />

      <main class="flex-grow container mx-auto px-4 py-8 space-y-6">
        <router-view :key="route.fullPath" />
      </main>

      <BaseFooter />

      <footer
        class="hidden lg:block bg-slate-700 dark:bg-slate-900 text-white dark:text-slate-300 py-6 transition-colors border-t border-slate-600 dark:border-slate-500"
      >
        <div class="container mx-auto px-4 text-center text-sm">
          &copy; {{ new Date().getFullYear() }} CarerConnect. All rights reserved.
        </div>
      </footer>
    </div>

    <!-- 🌐 Global Chat Widget - pass route info to handle visibility internally -->
    <ChatWidget :hide-on-routes="hiddenRoutes" />

    <Toaster position="top-center" richColors />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import BaseNavbar from '@/components/BaseNavbar.vue';
import BaseFooter from '@/components/BaseFooter.vue';
import { Toaster } from '@/components/ui/sonner';
import ChatWidget from '@/components/ChatWidget.vue';

const route = useRoute();
const authStore = useAuthStore();

const hiddenRoutes = ['/login', '/register'];
const showNavLinks = computed(() => !hiddenRoutes.includes(route.path));

onMounted(async () => {
  console.log('[App.vue] Component mounted, initializing auth');
  try {
    await authStore.initialize();
    console.log('[App.vue] ✅ Auth initialized successfully');
  } catch (err) {
    console.error('[App.vue] ❌ Auth initialization failed:', err);
  }
});
</script>