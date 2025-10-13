<template>
  <div
    class="bg-slate-50 dark:bg-slate-900 rounded-lg border border-l-4 border-indigo-500 p-5 shadow-sm transition-all hover:shadow-md"
  >
    <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-3 transition-colors">
      Create a New Post
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <input
        v-model="title"
        placeholder="Post title"
        required
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
               bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
               placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
        maxlength="120"
      />

      <textarea
        v-model="content"
        placeholder="What's on your mind?"
        required
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
               bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
               placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
        rows="4"
      ></textarea>

      <div class="flex justify-between items-center">
        <select
          v-model="selectedCategory"
          class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          <option value="General">General</option>
          <option value="Advice">Advice</option>
          <option value="Support">Support</option>
          <option value="Vent">Vent</option>
        </select>

        <button
          type="submit"
          :disabled="isSubmitting || !title.trim()"
          class="group relative inline-flex items-center justify-center gap-2 rounded-xl
                 border border-slate-300/70 dark:border-slate-600/70 bg-transparent
                 px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
                 hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-cyan-400 transition
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            class="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
          </svg>
          <span class="font-medium">{{ isSubmitting ? 'Posting...' : 'Post' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';

const emit = defineEmits(['post-created']);
const title = ref('');
const content = ref('');
const isSubmitting = ref(false);
const selectedCategory = ref('General');

const handleSubmit = async () => {
  if (!title.value.trim() || !content.value.trim()) return;
  isSubmitting.value = true;
  try {
    await api.post('/api/posts', {
      title: title.value,
      content: content.value,
      category: selectedCategory.value,
    });
    title.value = '';
    content.value = '';
    emit('post-created'); // Notify parent to refresh the feed
  } catch (error) {
    console.error('Failed to create post:', error);
    alert('Could not create your post. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* no extra styles needed; handled by Tailwind */
</style>