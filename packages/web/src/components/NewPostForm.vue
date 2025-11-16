<template>
  <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white transition-colors">New Post</h3>
      <button
        @click="$emit('cancel')"
        class="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 rounded-lg transition-colors"
        aria-label="Close"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    
    <p class="text-slate-600 dark:text-slate-400 text-sm mb-4 transition-colors">What's on your mind.</p>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <textarea
        v-model="content"
        placeholder="Share your thoughts..."
        required
        class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 
               text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 
               focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent 
               resize-none transition-colors"
        rows="6"
        maxlength="500"
      ></textarea>

      <div class="flex flex-col gap-3">
        <select
          v-model="selectedCategory"
          class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 
                 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 
                 focus:border-transparent transition-colors"
        >
          <option value="General">📝 General</option>
          <option value="Advice">💡 Advice</option>
          <option value="Support">🤝 Support</option>
          <option value="Vent">💬 Vent</option>
        </select>

        <div class="flex gap-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="flex-1 px-4 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white 
                   hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400 dark:active:bg-slate-500 
                   transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting || !content.trim()"
            class="flex-1 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium 
                   transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm 
                   disabled:hover:bg-blue-600"
          >
            {{ isSubmitting ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';

const emit = defineEmits(['post-created', 'cancel']);
const content = ref('');
const isSubmitting = ref(false);
const selectedCategory = ref('General');

const handleSubmit = async () => {
  if (!content.value.trim()) return;
  isSubmitting.value = true;
  try {
    await api.post('/api/posts', {
      title: content.value.substring(0, 50),
      content: content.value,
      category: selectedCategory.value,
    });
    content.value = '';
    selectedCategory.value = 'General';
    emit('post-created');
  } catch (error) {
    console.error('Failed to create post:', error);
    alert('Could not create your post. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>