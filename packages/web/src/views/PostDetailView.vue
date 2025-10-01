<template>
  <div class="max-w-3xl mx-auto space-y-6 p-4 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <button @click="router.back()" class="flex items-center text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Community
    </button>

    <div v-if="isLoading" class="text-center text-slate-500 dark:text-slate-400 py-8 transition-colors">Loading post...</div>
    <div v-else-if="error" class="text-center text-red-500 dark:text-red-400 py-8 transition-colors">
      <p>Could not load post.</p>
      <button @click="fetchPost" class="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors">Retry</button>
    </div>
    
    <div v-else-if="post && post.id">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 space-y-4 mb-6 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-lg transition-colors">
              {{ getInitial(post) }}
            </div>
            <div>
              <p class="font-semibold text-slate-800 dark:text-white transition-colors">{{ getDisplayName(post) }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 transition-colors">{{ formatTimestamp(post.createdAt || post.created_at) }}</p>
            </div>
          </div>
          <span :class="['px-2 py-1 text-xs font-medium rounded-full', categoryClass(post.category)]">
            {{ post.category }}
          </span>
        </div>

        <div class="text-slate-700 dark:text-slate-300 leading-relaxed transition-colors">
          {{ post.content }}
        </div>
        
        <div class="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3 transition-colors">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4l-4 4z" />
              </svg>
              <span>{{ post.comments?.length || 0 }} Comments</span>
            </div>
          </div>
        </div>
      </div>

      <CommentForm 
        :post-id="post.id" 
        @comment-posted="fetchPost" 
        class="mb-6" 
      />

      <div class="space-y-4">
        <h2 class="text-xl font-bold text-slate-800 dark:text-white transition-colors">
          Comments ({{ countAllComments(post.comments) }})
        </h2>
        <div v-if="post.comments && post.comments.length > 0">
          <CommentCard
            v-for="comment in post.comments"
            :key="comment.id"
            :comment="comment"
            :post-id="post.id"
            @comment-posted="fetchPost"
          />
        </div>
        <div v-else class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-4 text-center text-slate-500 dark:text-slate-400 transition-colors">
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
import CommentCard from '@/components/CommentCard.vue'; // Assuming CommentCard also handles its own dark mode
import CommentForm from '@/components/CommentForm.vue'; // Assuming CommentForm also handles its own dark mode

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  authorName: string;
  voteCount?: number;
  userVote?: number;
  replies?: Comment[];
}

interface Post {
  id: string;
  content: string;
  createdAt?: string;
  created_at?: string;
  authorName?: string;
  display_name?: string;
  category: string;
  comments: Comment[];
  score?: number;
  voteCount?: number;
}

const route = useRoute();
const router = useRouter();
const postId = route.params.id as string;

const post = ref<Post | null>(null);
const isLoading = ref(true);
const error = ref(false);

const fetchPost = async () => {
  isLoading.value = true;
  error.value = false;
  try {
    console.log('[PostDetail] Fetching post:', postId);
    const response = await api.get(`/api/posts/${postId}`);
    console.log('[PostDetail] Response:', response.data);
    
    post.value = response.data;
    
    if (!post.value?.id) {
      console.error('[PostDetail] No post ID in response');
      error.value = true;
    }
  } catch (err) {
    console.error('[PostDetail] Error fetching post:', err);
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

const countAllComments = (comments: Comment[] | undefined): number => {
  if (!comments) return 0;
  let count = comments.length;
  for (const comment of comments) {
    if (comment.replies) {
      count += countAllComments(comment.replies);
    }
  }
  return count;
};

const getDisplayName = (postData: Post) => {
  return postData.display_name || postData.authorName || 'Anonymous';
};

const getInitial = (postData: Post) => {
  const name = getDisplayName(postData);
  return name.charAt(0).toUpperCase();
};

const formatTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) return 'Unknown time';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString();
  } catch (e) {
    return 'Invalid date';
  }
};

const categoryClass = (category: string) => {
  // Category classes are generally designed to stand out.
  // Adding dark: variants for the default background/text for consistency.
  switch (category) {
    case 'Health & Wellness': return 'bg-blue-100 text-blue-800';
    case 'Mental Health': return 'bg-purple-100 text-purple-800';
    case 'Nutrition': return 'bg-green-100 text-green-800';
    case 'Support': return 'bg-orange-100 text-orange-800';
    case 'Advice': return 'bg-blue-100 text-blue-800';
    case 'Vent': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
};

onMounted(fetchPost);
</script>

<style scoped>
.vote-button {
  /* This will also need dark mode adjustments if it's not handled in CommentCard */
  @apply p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-teal-500 dark:hover:text-indigo-400;
}
</style>