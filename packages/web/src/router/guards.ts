import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export function installAuthGuard(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore();

    // Skip auth checks if logout is in progress
    if (auth.isLoggingOut) {
      console.log('[GUARD] Logout in progress, allowing navigation');
      return true;
    }

    // Ensure first-time auth check completes before routing
    if (!auth.initialized) {
      console.log('[GUARD] Initializing auth...');
      await auth.initialize();
    }

    // Treat routes as protected by default unless explicitly marked public
    const requiresAuth = to.meta?.requiresAuth !== false;

    // If route needs auth but the user isn't authenticated, send to login
    if (requiresAuth && !auth.isAuthenticated) {
      console.log('[GUARD] Protected route, redirecting to login');
      return {
        path: '/login',
        query: { redirect: to.fullPath },
        replace: true,
      };
    }

    // Prevent navigating to login/register when already authenticated
    const isAuthPage = to.path === '/login' || to.path === '/register';
    if (isAuthPage && auth.isAuthenticated) {
      console.log('[GUARD] Already authenticated, redirecting to home');
      return { path: '/', replace: true };
    }

    return true;
  });
}