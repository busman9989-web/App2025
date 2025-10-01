<template>
  <div class="card composer-card">
    <h3 class="card-title">Add Your Comment</h3>
    <form @submit.prevent="submitComment">
      <textarea
        v-model="commentText"
        placeholder="Write your reply..."
        rows="4"
        required
        class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
               focus:ring-teal-500 focus:border-teal-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400
               bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
      ></textarea>
      <div class="text-right mt-2">
        <button 
          type="submit" 
          :disabled="isSubmitting" 
          class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg 
                 hover:bg-teal-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Posting...' : 'Post Comment' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';

const props = defineProps({
  postId: {
    type: String,
    required: true,
  }
});

const emit = defineEmits(['comment-posted']);

const commentText = ref('');
const isSubmitting = ref(false);

const submitComment = async () => {
  if (!commentText.value.trim()) return;
  isSubmitting.value = true;
  try {
    await api.post(`/api/posts/${props.postId}/comments`, {
      content: commentText.value
    });
    commentText.value = '';
    emit('comment-posted'); // Notify parent to refresh comments
  } catch (err) {
    console.error("Failed to post comment:", err);
    alert('Could not post your comment. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.composer-card {
  @apply mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 transition-colors;
}
.card-title {
    @apply text-lg font-semibold text-slate-700 dark:text-white mb-2 transition-colors;
}
</style>