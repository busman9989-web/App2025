<template>
  <div 
    :id="'comment-' + comment.id"
    class="pl-4 py-3 border-l-2 transition-colors"
    :style="{ borderColor: `hsl(${(depth * 40) % 360}, ${darkThemeActive ? '20%' : '30%'}, ${darkThemeActive ? '40%' : '80%'})` }"
  >
    <div class="flex items-start space-x-3">
      <div
        class="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center 
               text-slate-600 dark:text-slate-300 font-semibold text-sm flex-shrink-0 transition-colors"
      >
        {{ comment.authorName ? comment.authorName.charAt(0).toUpperCase() : '?' }}
      </div>

      <div class="flex-grow">
        <div class="flex items-center space-x-2 mb-1">
          <span class="font-semibold text-slate-800 dark:text-white text-sm transition-colors">
            {{ comment.authorName || 'Anonymous' }}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400 transition-colors">{{ formatTimestamp(comment.createdAt) }}</span>
        </div>

        <p class="text-slate-700 dark:text-slate-200 text-sm mb-2 transition-colors">{{ comment.content }}</p>

        <div class="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <button
            @click="handleVote('like')"
            :disabled="isVoting"
            :class="[
              'flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors',
              userVote === 'like' ? 'text-blue-600 dark:text-blue-400' : ''
            ]"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905
                    0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{{ localVoteCount }}</span>
          </button>

          <button
            @click="handleVote('dislike')"
            :disabled="isVoting"
            :class="[
              'flex items-center space-x-1 hover:text-red-600 dark:hover:text-red-400 transition-colors',
              userVote === 'dislike' ? 'text-red-600 dark:text-red-400' : ''
            ]"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v-5
                    a2 2 0 00-2-2h-.095c-.5 0-.905-.405-.905.905
                    0-.714.211-1.412.608-2.006L17 9V3m-7 10h2m-2 0H5a2 2 0 00-2 2v6a2 2 0 002 2h2.5" />
            </svg>
          </button>

          <button 
            @click="toggleReplyForm" 
            class="flex items-center space-x-1 hover:text-teal-600 dark:hover:text-indigo-400 transition-colors"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Reply</span>
          </button>
        </div>

        <transition name="fade">
          <div v-if="showReplyForm" class="mt-3">
            <CommentForm
              :postId="postId"
              :parentId="comment.id"
              @comment-posted="handleCommentPosted"
            />
          </div>
        </transition>

        <div v-if="comment.replies && comment.replies.length > 0" class="mt-3 space-y-2">
          <CommentCard
            v-for="reply in displayedReplies"
            :key="reply.id"
            :comment="reply"
            :postId="postId"
            :depth="depth + 1"
            @comment-posted="handleCommentPosted"
          />
          <button
            v-if="(comment.replies?.length || 0) > replyLimit"
            @click="showMoreReplies"
            class="text-xs font-bold text-teal-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            View more replies
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import api from '@/api';
import CommentForm from './CommentForm.vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme'; // Import the theme store

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  voteCount: number;
  userVote: 'like' | 'dislike' | null;
  replies?: Comment[];
}

const props = defineProps<{
  comment: Comment;
  postId: string;
  depth?: number;
}>();

const emit = defineEmits(['comment-posted']);

const authStore = useAuthStore();
const themeStore = useThemeStore(); // Initialize the theme store

// Computed property to check if dark theme is active
const darkThemeActive = computed(() => themeStore.theme === 'dark');

// State
const showReplyForm = ref(false);
const replyLimit = ref(3);

const localVoteCount = ref(0);
const userVote = ref<'like' | 'dislike' | null>(null);
const isVoting = ref(false);

onMounted(() => {
  localVoteCount.value = props.comment.voteCount;
  userVote.value = props.comment.userVote;
});

const displayedReplies = computed(() => {
  return (props.comment.replies || []).slice(0, replyLimit.value);
});

const showMoreReplies = () => {
  replyLimit.value += 3;
};

const handleVote = async (voteType: 'like' | 'dislike') => {
  if (!authStore.isAuthenticated) {
    alert('You must be logged in to vote!');
    return;
  }
  if (isVoting.value) return;
  isVoting.value = true;

  const originalVote = userVote.value;
  const originalCount = localVoteCount.value;

  if (userVote.value === voteType) {
    userVote.value = null;
    localVoteCount.value += (voteType === 'like' ? -1 : 1);
  } else {
    if (userVote.value === 'like') localVoteCount.value--;
    if (userVote.value === 'dislike') localVoteCount.value++;
    userVote.value = voteType;
    localVoteCount.value += (voteType === 'like' ? 1 : -1);
  }

  const numericVote =
    userVote.value === 'like' ? 1 :
    userVote.value === 'dislike' ? -1 : 0;

  try {
    await api.post(`/api/comments/${props.comment.id}/vote`, { voteType: numericVote });
  } catch (error) {
    console.error("Failed to submit vote:", error);
    userVote.value = originalVote;
    localVoteCount.value = originalCount;
  } finally {
    isVoting.value = false;
  }
};

const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value;
};

const handleCommentPosted = (newComment?: Comment) => {
  showReplyForm.value = false;
  if (newComment) {
    if (!props.comment.replies) props.comment.replies = [];
    props.comment.replies.push(newComment);

    nextTick(() => {
      const el = document.getElementById(`comment-${newComment.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  emit('comment-posted');
};

const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB');
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>