<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <button @click="router.back()" class="flex items-center text-slate-600 hover:text-teal-600 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Community
    </button>

    <div v-if="isLoading" class="text-center text-slate-500 py-8">Loading post...</div>
    <div v-else-if="error" class="text-center text-red-500 py-8">
      <p>Could not load post.</p>
      <button @click="fetchPost" class="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md">Retry</button>
    </div>
    <div v-else-if="post">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold text-lg">
              {{ post.display_name ? post.display_name.charAt(0).toUpperCase() : '?' }}
            </div>
            <div>
              <p class="font-semibold text-slate-800">{{ post.display_name || 'Anonymous' }}</p>
              <p class="text-xs text-slate-500">{{ formatTimestamp(post.created_at) }}</p>
            </div>
          </div>
          <span
            :class="[
              'px-2 py-1 text-xs font-medium rounded-full',
              categoryClass(post.category)
            ]"
          >
            {{ post.category }}
          </span>
        </div>

        <div class="text-slate-700 leading-relaxed">
          {{ post.content }}
        </div>

        <div class="flex items-center justify-between text-sm text-slate-600 border-t border-slate-100 pt-3">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-1">
              <button class="vote-button" title="Upvote" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
                </svg>
              </button>
              <span class="font-semibold text-slate-700">{{ post.score || 0 }}</span>
              <button class="vote-button" title="Downvote" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 10-2 0v-3.586l-1.293 1.293a1 1 0 00-1.414-1.414l3-3a1 1  0 001.414 0l3 3a1 1 0 00-1.414 1.414L11 9.414V13z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <div class="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4l-4 4z" />
              </svg>
              <span>{{ post.comments?.length || 0 }} Comments</span>
            </div>
          </div>

          <button class="flex items-center space-x-1 hover:text-teal-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>

      <CommentForm :post-id="post.id" @comment-posted="fetchPost" class="mb-6" />

      <div class="space-y-4">
        <h2 class="text-xl font-bold text-slate-800">Comments ({{ post.comments?.length || 0 }})</h2>
        <div v-if="post.comments && post.comments.length > 0">
          <CommentCard
            v-for="comment in post.comments"
            :key="comment.id"
            :comment="comment"
          />
        </div>
        <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 text-center text-slate-500">
          No comments yet. Be the first to comment!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import CommentCard from '@/components/CommentCard.vue';
import CommentForm from '@/components/CommentForm.vue';

const route = useRoute();
const router = useRouter();
const postId = route.params.id as string;

const post = ref<any>(null); // Post data will include comments
const isLoading = ref(true);
const error = ref(false);

const fetchPost = async () => {
  isLoading.value = true;
  error.value = false;
  try {
    const response = await api.get(`/api/posts/${postId}`);
    post.value = response.data;
  } catch (err) {
    console.error('Error fetching post details:', err);
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const categoryClass = (category: string) => {
  switch (category) {
    case 'Advice': return 'bg-blue-100 text-blue-800';
    case 'Vent': return 'bg-red-100 text-red-800';
    case 'Support': return 'bg-green-100 text-green-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

onMounted(fetchPost);
</script>

<style scoped>
.vote-button {
  @apply p-1 rounded-full text-slate-400; /* Removed hover effects and color changes as these are disabled in this view */
}
</style>