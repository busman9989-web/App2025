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
  /* Updated for Dark Mode */
  @apply flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 no-underline transition-colors transform hover:-translate-y-1;
}
.icon-wrapper {
  /* Icon color is typically passed via the 'icon' prop's class */
  @apply flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center mr-4 transition-colors;
  /* If you want the icon wrapper background to change based on the card's base color */
  /* you might need to pass an additional prop for a specific dark mode background here */
}
.nav-card-title {
  /* Updated for Dark Mode */
  @apply font-bold text-slate-800 dark:text-white transition-colors;
}
.nav-card-description {
  /* Updated for Dark Mode */
  @apply text-sm text-slate-600 dark:text-slate-400 transition-colors;
}
</style>