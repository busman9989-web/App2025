<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
    <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-4 transition-colors">
      {{ props.parentId ? 'Reply' : 'Leave a Comment' }}
    </h3>

    <div v-if="authStore.user">
      <textarea
        v-model="commentContent"
        placeholder="Write your comment here..."
        rows="4"
        maxlength="500"
        class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg 
               focus:ring-2 focus:ring-teal-500 focus:border-teal-500
               bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 leading-relaxed resize-none transition-colors"
        style="line-height: 1.6;"
        @input="error = ''"
      ></textarea>

      <div class="mt-4 flex justify-end">
        <button
          @click="submitComment"
          :disabled="!commentContent.trim() || isSubmitting"
          class="px-6 py-2 bg-teal-500 text-white font-semibold rounded-lg
                 hover:bg-teal-600 focus:outline-none focus:ring-2
                 focus:ring-teal-500 focus:ring-offset-2 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Posting...' : props.parentId ? 'Reply' : 'Post Comment' }}
        </button>
      </div>

      <p v-if="error" class="text-red-500 dark:text-red-400 text-sm mt-2 transition-colors">{{ error }}</p>
    </div>

    <div v-else class="text-center py-6 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
      <div class="mb-3">
        <svg xmlns="http://www.w3.org/2000/svg"
             class="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500 transition-colors"
             fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <p class="mb-2">Join the conversation!</p>
      <p>
        Please
        <router-link to="/login"
                     class="text-teal-600 hover:text-teal-700 font-medium hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          log in
        </router-link>
        to {{ props.parentId ? 'reply' : 'leave a comment' }}.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  postId: string;
  parentId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'comment-posted', newComment?: any): void;
}>();

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
    const body: { content: string; parentId?: string } = {
      content: commentContent.value.trim(),
    };
    if (props.parentId) body.parentId = props.parentId;

    const { data } = await api.post(`/api/posts/${props.postId}/comments`, body);

    commentContent.value = '';
    error.value = '';

    emit('comment-posted', data);
  } catch (err: any) {
    console.error('Error posting comment:', err);

    if (err.response?.status === 401) {
      error.value = 'Please log in to post comments.';
    } else if (err.response?.status === 400) {
      error.value = err.response.data?.message || 'Invalid comment data.';
    } else if (err.response?.status >= 500) {
      error.value = 'Server error. Please try again later.';
    } else {
      error.value = err.response?.data?.message || 'Failed to post comment.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* Keep the textarea focus outline override here if desired */
textarea:focus {
  outline: none;
}
</style>