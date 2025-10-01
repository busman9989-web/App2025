<template>
  <header class="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-20 p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 transition-colors">
    <h1 class="text-xl font-bold text-slate-800 dark:text-white transition-colors">CarerConnect</h1>
    <div class="flex items-center space-x-4">
      <RouterLink to="/settings" aria-label="Settings">
        <SettingsIcon />
      </RouterLink>
      <img :src="userAvatar" alt="User Avatar" class="w-9 h-9 rounded-full ring-2 ring-teal-100 dark:ring-teal-700 bg-slate-200 dark:bg-slate-700 transition-colors" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, h, VNode } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
// The placehold.co URL might generate an image with fixed colors,
// but the dark: classes on the parent will handle text around it.
const userAvatar = computed(() => `https://placehold.co/40x40/BFD8D5/3D5A57?text=${auth.user?.displayName?.charAt(0) || '?'}`);

// Helper for rendering SVG Icons
// This helper itself does not need dark mode; it's how you use it.
const Icon = (props: { path: VNode | VNode[], class?: string }) =>
  h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    class: props.class || 'h-6 w-6',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    'stroke-width': 2
  }, props.path);

const SettingsIcon = () => h(Icon, {
    path: h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z'
    }),
    // Updated for Dark Mode
    class: "h-6 w-6 text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
});
</script>