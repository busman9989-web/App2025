import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import HomeView from '../views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import CommunityView from '@/views/CommunityView.vue';
import PostDetailView from '@/views/PostDetailView.vue';
import SettingsView from '@/views/SettingsView.vue';
import JournalView from '@/views/JournalView.vue';
import ChecklistView from '@/views/ChecklistView.vue';
import ResourcesView from '@/views/ResourcesView.vue';
import ResourceDetailView from '@/views/ResourceDetailView.vue'; // NEW IMPORT

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
    path: '/checklists',
    name: 'Checklists',
    component: ChecklistView,
    meta: { requiresAuth: true }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: ResourcesView,
    meta: { requiresAuth: true }
  },
  { // NEW ROUTE FOR RESOURCE DETAIL
    path: '/resources/:id',
    name: 'ResourceDetail',
    component: ResourceDetailView,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/:catchAll(.*)', // Catch-all route for 404
    name: 'NotFound',
    redirect: '/' // Redirect to home or a dedicated 404 page
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.token) {
    next('/login');
  } else if ((to.name === 'Login' || to.name === 'Register') && authStore.token) {
    next('/');
  } else {
    next();
  }
});

export default router;