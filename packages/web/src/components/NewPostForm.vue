<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
    <h2 class="text-lg font-semibold text-slate-700 mb-3">Create a New Post</h2>
    <form @submit.prevent="handleSubmit">
      <textarea
        v-model="content"
        placeholder="What's on your mind?"
        required
        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
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
    await api.post('/api/posts', { content: content.value, category: 'General' });
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