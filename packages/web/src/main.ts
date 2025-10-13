// packages/web/src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';

// Stores and API
import { useThemeStore } from './stores/theme';
import { useAuthStore } from './stores/auth';
import api from '@/api';

// Ensure axios sends cookies (httpOnly JWT) with every request
// This is important for authenticated endpoints like /api/friends/*
api.defaults.withCredentials = true;

async function bootstrap() {
  console.log('[main.ts] Creating app and Pinia instance');
  const app = createApp(App);
  const pinia = createPinia();

  // Register Pinia and Router
  app.use(pinia);
  app.use(router);

  // Initialize theme BEFORE mounting to prevent flash of incorrect theme
  const themeStore = useThemeStore();
  themeStore.initializeTheme();
  console.log('[main.ts] Theme initialized');

  // Initialize auth BEFORE mounting so components (e.g., ProfileView) can rely on auth.user
  // This ensures computed like isOwnProfile render correctly and requests send cookies
  try {
    const auth = useAuthStore();
    console.log('[main.ts] Initializing auth...');
    await auth.initialize();
    console.log('[main.ts] Auth initialized');
  } catch (err) {
    console.warn('[main.ts] Auth initialization failed, continuing without user', err);
  }

  // Mount the app
  console.log('[main.ts] Mounting app');
  app.mount('#app');
  console.log('[main.ts] ✅ App mounted successfully');
}

// Start the app
bootstrap();