<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
    <div class="flex items-center space-x-3 mb-2">
      <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-semibold">
        {{ comment.display_name ? comment.display_name.charAt(0).toUpperCase() : '?' }}
      </div>
      <div>
        <p class="font-semibold text-slate-700 text-sm">{{ comment.display_name || 'Anonymous' }}</p>
        <p class="text-xs text-slate-400">{{ formatTimestamp(comment.created_at) }}</p>
      </div>
    </div>
    <p class="text-slate-600 text-sm">{{ comment.content }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  comment: {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    display_name: string; // From backend
  };
}>();

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(); // You can customize this format
};
</script>

<style scoped>
/* Add any specific styles for comment card here */
</style>