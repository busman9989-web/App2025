import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// Component Imports
import HomeView from '../views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import CommunityView from '@/views/CommunityView.vue';
import PostDetailView from '@/views/PostDetailView.vue';
import SettingsView from '@/views/SettingsView.vue';
import JournalView from '@/views/JournalView.vue';
import ResourcesView from '@/views/ResourcesView.vue';
import ResourceDetailView from '@/views/ResourceDetailView.vue';
import PlannerView from '@/views/PlannerView.vue';
import ChecklistView from '@/views/ChecklistView.vue';
import ProfileView from '@/views/ProfileView.vue'; // <-- Add this import

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { guestOnly: true }
  },
  {
    path: '/community',
    name: 'Community',
    component: CommunityView,
    meta: { requiresAuth: true }
  },
  {
    path: '/community/post/:id',
    name: 'PostDetail',
    component: PostDetailView,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/journal',
    name: 'Journal',
    component: JournalView,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: ResourcesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources/:id',
    name: 'ResourceDetail',
    component: ResourceDetailView,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/planner',
    name: 'Planner',
    component: PlannerView,
    meta: { requiresAuth: true }
  },
  {
    path: '/checklists',
    name: 'Checklists',
    component: ChecklistView,
    meta: { requiresAuth: true }
  },
  // --- ADD THIS ROUTE for ProfileView ---
  {
    path: '/profile/:userId',
    name: 'Profile',
    component: ProfileView,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // ✅ New: Skip the auth check if a logout is actively in progress.
  // This prevents the unnecessary 'verifyAuth' call and the 401 console error.
  if (authStore.isLoggingOut) {
    return next();
  }

  // On page load or refresh, verify the user's session from their cookie.
  if (authStore.user === null) {
    await authStore.verifyAuth();
  }

  const isAuthenticated = authStore.isAuthenticated;

  // --- Logic for Guest-Only Routes ---
  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: 'Home' });
  }

  // --- Logic for Protected Routes ---
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  next();
});

export default router;