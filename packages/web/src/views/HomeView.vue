<template>
  <div class="space-y-8 p-4 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">
        Welcome, {{ auth.user?.displayName || 'Guest' }}
      </h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">How can we support you today?</p>
    </div>

    <div class="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 p-6 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700 transition-colors">
      <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-2 transition-colors">Good to see you here!</h2>
      <p class="text-slate-600 dark:text-slate-400 text-sm transition-colors">
        This is your personal space to plan, journal, and track your mood. 
        Use the cards below to quickly access your tools or check in with yourself.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <HomeNavCard
        to="/planner"
        :icon="PlannerIcon"
        title="Planner"
        description="Appointments & lists."
        class="bg-teal-50 dark:bg-slate-700 dark:text-teal-400"
      />
      <HomeNavCard
        to="/journal"
        :icon="JournalIcon"
        title="Journal"
        description="A secure space."
        class="bg-blue-50 dark:bg-slate-700 dark:text-blue-400"
      />
    </div>

    <MoodTracker />
  </div>
</template>

<script setup lang="ts">
import { h, VNode } from 'vue';
import { useAuthStore } from '@/stores/auth';
import HomeNavCard from '@/components/HomeNavCard.vue'; // Assuming HomeNavCard handles its own dark mode
import MoodTracker from '@/components/MoodTracker.vue'; // Assuming MoodTracker handles its own dark mode

const auth = useAuthStore();

// Generic icon component
const Icon = (props: { path: VNode | VNode[], class?: string }) =>
  h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    class: props.class || 'h-6 w-6',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    'stroke-width': 2
  }, props.path);

// Planner icon - updated to use dark mode text color for stroke
const PlannerIcon = () =>
  h(Icon, {
    class: 'h-7 w-7 text-teal-600 dark:text-teal-400 transition-colors', // Added dark:text-teal-400
    path: h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    })
  });

// Journal icon - updated to use dark mode text color for stroke
const JournalIcon = () =>
  h(Icon, {
    class: 'h-7 w-7 text-blue-600 dark:text-blue-400 transition-colors', // Added dark:text-blue-400
    path: h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M12 6.253v11.494m-5.747-4.995l-1.35 1.35A5.003 5.003 0 0012 21.75a5.003 5.003 0 007.097-7.097l-1.35-1.35-2.296 2.296-2.297-2.296-2.15-2.15z'
    })
  });
</script>