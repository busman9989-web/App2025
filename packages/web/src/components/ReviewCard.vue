<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-semibold">
          {{ review.display_name ? review.display_name.charAt(0).toUpperCase() : '?' }}
        </div>
        <div>
          <p class="font-semibold text-slate-700 text-sm">{{ review.display_name || 'Anonymous' }}</p>
          <p class="text-xs text-slate-400">{{ formatTimestamp(review.created_at) }}</p>
        </div>
      </div>
      <div class="flex items-center">
        <svg v-for="n in 5" :key="n"
             :class="['h-4 w-4', n <= review.rating ? 'text-yellow-400' : 'text-gray-300']"
             fill="currentColor" viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      </div>
    </div>
    <p v-if="review.content" class="text-slate-600 text-sm mt-2">{{ review.content }}</p>
    <p v-else class="text-slate-500 text-sm italic mt-2">No review text provided.</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  review: {
    id: string;
    resource_id: string;
    user_id: string;
    rating: number;
    content?: string; // Optional review text
    created_at: string;
    display_name: string; // From backend
  };
}>();

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};
</script>

<style scoped>
/* Add any specific styles for review card here */
</style>