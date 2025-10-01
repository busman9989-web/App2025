<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
    <h2 class="text-lg font-semibold text-slate-700 dark:text-white mb-3 transition-colors">Create a New Post</h2>
    <form @submit.prevent="handleSubmit">
      <textarea
        v-model="content"
        placeholder="What's on your mind?"
        required
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
        rows="4"
      ></textarea>
      <div class="text-right mt-2">
        <button type="submit" :disabled="isSubmitting" class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
          {{ isSubmitting ? 'Posting...' : 'Post' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';

const emit = defineEmits(['post-created']);
const content = ref('');
const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!content.value.trim()) return;
  isSubmitting.value = true;
  try {
    // FIXED: Added category selection. Defaults to 'General' if no user input.
    const selectedCategory = 'General'; // You might want to add a select input for this
    await api.post('/api/posts', { content: content.value, category: selectedCategory });
    content.value = '';
    emit('post-created'); // Notify the parent page to refresh the feed
  } catch (error) {
    console.error('Failed to create post:', error);
    alert('Could not create your post. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* No specific scoped styles needed after applying Tailwind classes directly */
</style>