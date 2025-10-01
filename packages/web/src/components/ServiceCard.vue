<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 flex flex-col justify-between transition-all hover:shadow-md hover:border-teal-300 dark:hover:border-indigo-400 transition-colors">
    <div>
      <div class="flex justify-between items-start">
        <span :class="['tag', getTagColor(service.type)]">{{ service.type }}</span>
        <span v-if="service.source" class="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full ml-2 transition-colors">{{ service.source }}</span>
        <span v-else class="text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-700 px-2 py-1 rounded-full transition-colors">{{ service.borough }}</span>
      </div>
      <h3 class="text-lg font-bold text-slate-800 dark:text-white mt-3 pr-2 transition-colors">{{ service.name }}</h3>
      <p class="text-slate-600 dark:text-slate-300 mt-2 text-sm leading-relaxed transition-colors">{{ service.description.substring(0, 150) }}<span v-if="service.description.length > 150">...</span></p>
    </div>
    <button @click="$emit('detailsClick', service)" class="mt-4 text-sm font-semibold text-teal-600 hover:text-teal-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-right self-end transition-colors">
      View Details &rarr;
    </button>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

export interface Service {
  id: number | string; // Allow string IDs for now
  name: string;
  borough?: string; // Optional, as some are national
  type: 'Local' | 'National' | 'Gov' | 'Paid';
  service_type: string;
  description: string;
  contact: { phone?: string; website?: string; email?: string }; // Make contact properties optional
  address?: string; // Optional
  source?: 'NHS' | 'GOV.UK' | 'Hounslow Council' | 'Charity' | 'Private'; // New source field
  keywords?: string[]; // New keywords for search
}

defineProps({
  service: {
    type: Object as PropType<Service>,
    required: true
  }
});

defineEmits(['detailsClick']);

const getTagColor = (type: Service['type']) => {
  const colors = {
    // Light mode classes
    Local: 'bg-blue-100 text-blue-800',
    National: 'bg-purple-100 text-purple-800',
    Gov: 'bg-gray-100 text-gray-800',
    Paid: 'bg-green-100 text-green-800',
  };
  // Dark mode classes - chose slightly different shades for better contrast
  const darkColors = {
    Local: 'dark:bg-blue-700 dark:text-blue-100',
    National: 'dark:bg-purple-700 dark:text-purple-100',
    Gov: 'dark:bg-gray-700 dark:text-gray-100',
    Paid: 'dark:bg-green-700 dark:text-green-100',
  };

  const base = colors[type] || 'bg-gray-100 text-gray-800';
  const dark = darkColors[type] || 'dark:bg-gray-700 dark:text-gray-100'; // Default dark tag color
  return `${base} ${dark}`;
};
</script>

<style scoped>
.tag {
  /* Added transition-colors for smooth tag color changes */
  @apply text-xs font-bold uppercase px-2 py-1 rounded-full transition-colors;
}
</style>