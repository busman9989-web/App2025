<template>
  <RouterLink :to="to" class="nav-card">
    <div class="icon-wrapper"><component :is="icon" /></div>
    <div>
      <h3 class="nav-card-title">{{ title }}</h3>
      <p class="nav-card-description">{{ description }}</p>
    </div>
  </RouterLink>
</template>
<script setup lang="ts">
import { PropType } from 'vue';
import { RouterLink } from 'vue-router';
defineProps({
  to: { type: String, required: true },
  icon: { type: Object as PropType<any>, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});
</script>
<style scoped>
.nav-card { @apply flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-200/80 no-underline transition-transform transform hover:-translate-y-1; }
.icon-wrapper { @apply flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center mr-4; }
.nav-card-title { @apply font-bold text-slate-800; }
.nav-card-description { @apply text-sm text-slate-600; }
</style>
