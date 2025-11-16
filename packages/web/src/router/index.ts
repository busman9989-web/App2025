import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { installAuthGuard } from '@/router/guards'; // ✅ Fixed path

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
import ProfileView from '@/views/ProfileView.vue';
import ChatView from '@/views/ChatView.vue';

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
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false }
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
  {
    path: '/profile/:userId',
    name: 'Profile',
    component: ProfileView,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: ChatView,
    meta: { requiresAuth: true }
  },
  {
    path: '/game',
    name: 'Game',
    component: () => import('@/views/Game.vue'),
    meta: { requiresAuth: true }
  },

  {
  path: '/about',
  name: 'About',
  component: () => import('@/views/AboutView.vue'),
  meta: { requiresAuth: false }
},
{
  path: '/privacy',
  name: 'PrivacyPolicy',
  component: () => import('@/views/PrivacyPolicy.vue'),
  meta: { requiresAuth: false }
},
{
  path: '/terms',
  name: 'Terms',
  component: () => import('@/views/TermsView.vue'),
  meta: { requiresAuth: false }
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
  scrollBehavior(to, from, savedPosition) {
    // Disable swipe-based navigation transitions
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: 'auto' };
  }
});

// Install the auth guard from guards.ts - this handles all auth logic
installAuthGuard(router);

// Disable swipe gestures globally
router.afterEach(() => {
  // Prevent touch-based back/forward navigation
  const html = document.documentElement;
  html.style.touchAction = 'pan-y';
  html.style.overscrollBehavior = 'none';
});

export default router;