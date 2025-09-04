<template>
  <div class="card composer-card">
    <h3 class="card-title">Add Your Comment</h3>
    <form @submit.prevent="submitComment">
      <textarea
        v-model="commentText"
        placeholder="Write your reply..."
        rows="4"
        required
        class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
      ></textarea>
      <div class="text-right mt-2">
        <button type="submit" :disabled="isSubmitting" class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
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
  @apply mt-6 bg-white rounded-xl border border-slate-200/80 p-4;
}
.card-title {
    @apply text-lg font-semibold text-slate-700 mb-2;
}
</style>