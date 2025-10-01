<template>
  <div v-if="service" @click="$emit('close')" class="fixed inset-0 bg-black bg-opacity-60 z-30 flex items-center justify-center p-4">

    <div @click.stop class="bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fade-in-up max-h-[90vh] overflow-y-auto transition-colors">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
        <CloseIcon />
      </button>

      <h2 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">{{ service.name }}</h2>

      <div class="mt-2 flex flex-wrap gap-2">
        <span :class="['tag', getTagColor(service.type)]">{{ service.type }}</span>
        <span v-if="service.borough" class="text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-700 px-2 py-1 rounded-full transition-colors">{{ service.borough }}</span>
        <span v-if="service.source" class="text-xs font-semibold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-700 px-2 py-1 rounded-full transition-colors">{{ service.source }}</span>
      </div>

      <p class="mt-4 text-slate-600 dark:text-slate-300 transition-colors">{{ service.description }}</p>

      <div class="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3 text-sm transition-colors">
        <p v-if="service.address"><strong class="text-slate-700 dark:text-white transition-colors">Address:</strong> {{ service.address }}</p>
        <p v-if="service.contact?.phone"><strong class="text-slate-700 dark:text-white transition-colors">Phone:</strong> <a :href="`tel:${service.contact.phone}`" class="text-teal-600 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">{{ service.contact.phone }}</a></p>
        <p v-if="service.contact?.email"><strong class="text-slate-700 dark:text-white transition-colors">Email:</strong> <a :href="`mailto:${service.contact.email}`" class="text-teal-600 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">{{ service.contact.email }}</a></p>
        <p v-if="service.contact?.website"><strong class="text-slate-700 dark:text-white transition-colors">Website:</strong> <a :href="addHttp(service.contact.website)" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">{{ service.contact.website }}</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, h, VNode } from 'vue';
import type { Service } from '@/components/ServiceCard.vue'; // Ensure this path is correct

defineProps({
  service: {
    type: Object as PropType<Service | null>,
    default: null
  }
});

defineEmits(['close']);

// Updated getTagColor to include dark mode classes, similar to ServiceCard
const getTagColor = (type: Service['type']) => {
  const colors = {
    // Light mode classes
    Local: 'bg-blue-100 text-blue-800',
    National: 'bg-purple-100 text-purple-800',
    Gov: 'bg-gray-100 text-gray-800',
    Paid: 'bg-green-100 text-green-800',
  };
  // Dark mode classes
  const darkColors = {
    Local: 'dark:bg-blue-700 dark:text-blue-100',
    National: 'dark:bg-purple-700 dark:text-purple-100',
    Gov: 'dark:bg-gray-700 dark:text-gray-100',
    Paid: 'dark:bg-green-700 dark:text-green-100',
  };

  const base = colors[type] || 'bg-gray-100 text-gray-800';
  const dark = darkColors[type] || 'dark:bg-gray-700 dark:text-gray-100';
  return `${base} ${dark}`;
};

const addHttp = (url: string) => {
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
}

// --- SVG Icon Components ---
const Icon = (props: { path: VNode | VNode[], class?: string }) => 
  h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: props.class || 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2 }, props.path);

// Updated CloseIcon to include dark mode classes
const CloseIcon = () => h(Icon, { path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6 18L18 6M6 6l12 12' }), 
  class: "h-6 w-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
});
</script>

<style scoped>
/* This animation makes the modal appear smoothly */
@keyframes fade-in-up {
  0% { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out;
}

/* Add transition-colors to the tag style if not already done in the global stylesheet or another component */
.tag {
  @apply text-xs font-bold uppercase px-2 py-1 rounded-full transition-colors;
}
</style>