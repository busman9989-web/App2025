<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
    <h3 class="text-lg font-bold text-slate-800 mb-4">Leave a Comment</h3>
    <div v-if="authStore.token">
      <textarea
        v-model="commentContent"
        placeholder="Write your comment here..."
        rows="4"
        class="w-full p-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-colors resize-y"
      ></textarea>
      <div class="mt-4 flex justify-end">
        <button
          @click="submitComment"
          :disabled="!commentContent.trim() || isSubmitting"
          class="px-5 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Posting...' : 'Post Comment' }}
        </button>
      </div>
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
    </div>
    <div v-else class="text-center py-4 bg-slate-50 rounded-lg text-slate-600">
      <p>Please <router-link to="/login" class="text-teal-600 hover:underline">log in</router-link> to leave a comment.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  postId: string;
}>();

const emit = defineEmits(['comment-posted']);

const authStore = useAuthStore();
const commentContent = ref('');
const isSubmitting = ref(false);
const error = ref('');

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    error.value = 'Comment cannot be empty.';
    return;
  }
  error.value = '';
  isSubmitting.value = true;

  try {
    await api.post(`/api/posts/${props.postId}/comments`, {
      content: commentContent.value,
    });
    commentContent.value = ''; // Clear form
    emit('comment-posted'); // Notify parent to refresh comments
  } catch (err: any) {
    console.error('Error posting comment:', err);
    error.value = err.response?.data?.message || 'Failed to post comment.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* Add any specific styles for comment form here */
</style>