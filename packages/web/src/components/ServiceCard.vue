<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between transition-all hover:shadow-md hover:border-teal-300">
    <div>
      <div class="flex justify-between items-start">
        <span :class="['tag', getTagColor(service.type)]">{{ service.type }}</span>
        <span v-if="service.source" class="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full ml-2">{{ service.source }}</span>
        <span v-else class="text-xs font-semibold text-teal-800 bg-teal-100 px-2 py-1 rounded-full">{{ service.borough }}</span>
      </div>
      <h3 class="text-lg font-bold text-slate-800 mt-3 pr-2">{{ service.name }}</h3>
      <p class="text-slate-600 mt-2 text-sm leading-relaxed">{{ service.description.substring(0, 150) }}<span v-if="service.description.length > 150">...</span></p>
    </div>
    <button @click="$emit('detailsClick', service)" class="mt-4 text-sm font-semibold text-teal-600 hover:text-teal-700 text-right self-end">
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
    Local: 'bg-blue-100 text-blue-800',
    National: 'bg-purple-100 text-purple-800',
    Gov: 'bg-gray-100 text-gray-800',
    Paid: 'bg-green-100 text-green-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};
</script>

<style scoped>
.tag {
  @apply text-xs font-bold uppercase px-2 py-1 rounded-full;
}
</style>