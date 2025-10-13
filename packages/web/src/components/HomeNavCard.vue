<template>
  <RouterLink :to="to" class="nav-card">
    <div class="icon-wrapper">
      <component :is="icon" />
    </div>
    <div>
      <h3 class="nav-card-title">{{ title }}</h3>
      <p class="nav-card-description">{{ description }}</p>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { PropType, FunctionalComponent } from 'vue';
import { RouterLink } from 'vue-router';

defineProps({
  to: { type: String, required: true },
  icon: { type: Function as PropType<FunctionalComponent>, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});
</script>

<style scoped>
.nav-card {
  /* Base styles: layout, padding, shadow, border, and transition */
  @apply flex items-center p-4 rounded-xl shadow-lg border no-underline transition-colors;
  
  /* Light Mode Base & Hover */
  @apply bg-white border-slate-200/80 hover:bg-slate-100;

  /* Dark Mode Base & Hover (Matching HomeView) */
  @apply dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700;

  /* Transform/Lift Effect for user feedback */
  @apply transform hover:-translate-y-1;
}

.icon-wrapper {
  /* Icon size and spacing */
  @apply flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center mr-4 transition-colors;
}

.nav-card-title {
  /* Text color for title in both modes */
  @apply font-bold text-slate-800 dark:text-white transition-colors;
}

.nav-card-description {
  /* Text color for description in both modes */
  @apply text-sm text-slate-600 dark:text-slate-400 transition-colors;
}
</style>