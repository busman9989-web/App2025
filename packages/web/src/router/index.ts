import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import ResourcesView from '../views/ResourcesView.vue';
import JournalView from '../views/JournalView.vue';
import SettingsView from '../views/SettingsView.vue';
import CommunityView from '../views/CommunityView.vue';
import PostDetailView from '../views/PostDetailView.vue';
import PlannerView from '../views/PlannerView.vue';
import ChecklistsView from '../views/ChecklistsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/resources', name: 'resources', component: ResourcesView, meta: { requiresAuth: true } },
    { path: '/journal', name: 'journal', component: JournalView, meta: { requiresAuth: true } },
    { path: '/planner', name: 'planner', component: PlannerView, meta: { requiresAuth: true } },
    { path: '/community', name: 'community', component: CommunityView, meta: { requiresAuth: true } },
    { path: '/post/:id', name: 'postDetail', component: PostDetailView, meta: { requiresAuth: true } },
    { path: '/settings', name: 'settings', component: SettingsView, meta: { requiresAuth: true } },
    { path: '/checklists', name: 'checklists', component: ChecklistsView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView }
  ]
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  // This check is not active until the auth store is loaded, but we'll set it up now.
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' };
  } else {
    return true;
  }
});

export default router;