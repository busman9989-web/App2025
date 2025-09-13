<template>
  <footer class="bg-white/90 backdrop-blur-md sticky bottom-0 z-20 border-t border-slate-200">
    <nav class="flex justify-around items-center h-16">
      <RouterLink to="/" class="nav-item">
        <HomeIcon />
        <span class="nav-label">Home</span>
      </RouterLink>

      <RouterLink to="/resources" class="nav-item">
        <SupportIcon />
        <span class="nav-label">Support</span>
      </RouterLink>

      <button @click="navigate" class="add-button">
        <PlusIcon />
      </button>

      <RouterLink to="/planner" class="nav-item">
        <CalendarIcon />
        <span class="nav-label">Planner</span>
      </RouterLink>

      <RouterLink to="/community" class="nav-item">
        <CommunityIcon />
        <span class="nav-label">Community</span>
      </RouterLink>
    </nav>
  </footer>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { h, VNode } from 'vue';

const router = useRouter();
const navigate = () => { router.push('/journal'); };

const Icon = (props: { path: VNode | VNode[], class?: string }) => h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: props.class || 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2 }, props.path);
const HomeIcon = () => h(Icon, { path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }) });
const SupportIcon = () => h(Icon, { path: [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }), h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z' })] });
const CalendarIcon = () => h(Icon, { path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }) });
const CommunityIcon = () => h(Icon, { path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a3.004 3.004 0 015.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }) });
const PlusIcon = () => h(Icon, { path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 4v16m8-8H4' }), class: "h-8 w-8 text-white" });
</script>

<style scoped>
.nav-item { @apply flex flex-col items-center justify-center space-y-1 w-full transition-colors duration-200 text-slate-500 hover:text-teal-500; }
.router-link-exact-active { @apply text-teal-600; }
.nav-label { @apply text-xs font-medium; }
.add-button { @apply w-16 h-16 -mt-8 bg-teal-500 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform duration-200 ring-4 ring-white; }
</style>