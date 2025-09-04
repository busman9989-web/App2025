<template>
  <div class="mt-6">
    <h3 class="text-lg font-semibold text-slate-700 mb-3">{{ comments.length }} {{ comments.length === 1 ? 'Comment' : 'Comments' }}</h3>
    <div class="space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="bg-white rounded-xl border border-slate-200/80 p-4">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span class="font-semibold">{{ comment.display_name || 'Anonymous' }}</span>
        </div>
        <p class="mt-2 text-slate-700 text-sm">{{ comment.content }}</p>
      </div>
    </div>
    <div v-if="comments.length === 0" class="text-center text-slate-500 py-6">
      <p>No comments yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

interface Comment {
  id: string;
  content: string;
  display_name: string;
  created_at: string;
}

defineProps({
  comments: {
    type: Array as PropType<Comment[]>,
    required: true,
  }
});
</script>