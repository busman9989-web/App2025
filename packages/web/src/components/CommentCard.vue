<template>
  <div 
    :id="'comment-' + comment.id"
    class="pl-4 py-3 border-l-2 transition-colors"
    :style="{ borderColor: `hsl(${((depth ?? 0) * 40) % 360}, ${darkThemeActive ? '20%' : '30%'}, ${darkThemeActive ? '40%' : '80%'})` }"
  >
    <div class="flex items-start space-x-3">
      <!-- Avatar with Profile Picture Support -->
      <div
        class="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden"
        :class="comment.profilePictureUrl && !imageError ? 'bg-slate-200 dark:bg-slate-700' : avatarGradientClass"
      >
        <img 
          v-if="comment.profilePictureUrl && !imageError" 
          :src="comment.profilePictureUrl" 
          alt="avatar" 
          class="w-8 h-8 rounded-full object-cover"
          @error="handleImageError"
        />
        <div 
          v-else
          class="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
        >
          {{ avatarLetter }}
        </div>
      </div>

      <div class="flex-grow">
        <div class="flex items-center space-x-2 mb-1">
          <span class="font-semibold text-slate-900 dark:text-white text-sm transition-colors">
            {{ comment.authorName || 'Anonymous' }}
          </span>
          <span class="text-xs text-slate-500 dark:text-slate-400 transition-colors">
            {{ formatTimestamp(comment.createdAt) }}
          </span>
        </div>

        <p class="text-slate-700 dark:text-slate-200 text-sm mb-2 transition-colors leading-relaxed">
          {{ comment.content }}
        </p>

        <div class="flex items-center space-x-4 text-xs">
          <button
            @click.stop="handleVote('like')"
            :disabled="isVoting"
            :class="[
              'flex items-center space-x-1 transition-colors min-h-[44px] -my-2 py-2',
              localUserVoteString === 'like' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            ]"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span class="font-medium">{{ localVoteCount }}</span>
          </button>

          <button
            @click.stop="handleVote('dislike')"
            :disabled="isVoting"
            :class="[
              'flex items-center space-x-1 transition-colors min-h-[44px] -my-2 py-2',
              localUserVoteString === 'dislike' 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
            ]"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714-.211-1.412-.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          </button>

          <button 
            @click.stop="toggleReplyForm" 
            class="flex items-center space-x-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[44px] -my-2 py-2"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span class="font-medium">Reply</span>
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
            :depth="(depth ?? 0) + 1"
            @comment-posted="handleCommentPosted"
          />
          <button
            v-if="(comment.replies?.length || 0) > replyLimit"
            @click.stop="showMoreReplies"
            class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors min-h-[44px] py-2"
          >
            View more replies ({{ comment.replies.length - replyLimit }} more)
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
import { useThemeStore } from '@/stores/theme';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  userId?: string | null;
  authorId?: string | null;
  profilePictureUrl?: string | null;
  voteCount: number;
  userVote: number;
  replies?: Comment[];
}

const props = defineProps<{
  comment: Comment;
  postId: string;
  depth?: number;
}>();

const emit = defineEmits(['comment-posted']);

const authStore = useAuthStore();
const themeStore = useThemeStore();

const darkThemeActive = computed(() => themeStore.theme === 'dark');

const showReplyForm = ref(false);
const replyLimit = ref(3);
const imageError = ref(false);

const localVoteCount = ref(0);
const localUserVote = ref<number>(0);
const isVoting = ref(false);

const avatarLetter = computed(() => {
  const name = props.comment.authorName || 'Anonymous';
  return name.charAt(0).toUpperCase();
});

const avatarGradientClass = computed(() => {
  const gradients = [
    'bg-gradient-to-br from-cyan-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-pink-600',
    'bg-gradient-to-br from-green-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-red-600',
    'bg-gradient-to-br from-indigo-500 to-purple-600',
  ];
  
  const userId = props.comment.userId || props.comment.authorId || '';
  const index = (userId.charCodeAt(0) || 0) % gradients.length;
  return gradients[index];
});

const localUserVoteString = computed<'like' | 'dislike' | null>(() => {
  if (localUserVote.value === 1) return 'like';
  if (localUserVote.value === -1) return 'dislike';
  return null;
});

onMounted(() => {
  localVoteCount.value = props.comment.voteCount;
  localUserVote.value = props.comment.userVote;
  
  console.log('Comment data:', {
    id: props.comment.id,
    authorName: props.comment.authorName,
    userId: props.comment.userId,
    profilePictureUrl: props.comment.profilePictureUrl,
    hasProfilePic: !!props.comment.profilePictureUrl
  });
});

const displayedReplies = computed(() => (props.comment.replies || []).slice(0, replyLimit.value));

const showMoreReplies = () => {
  replyLimit.value += 3;
};

const handleImageError = () => {
  imageError.value = true;
  console.error('Failed to load comment profile picture:', props.comment.profilePictureUrl);
};

const handleVote = async (voteType: 'like' | 'dislike') => {
  if (!authStore.isAuthenticated) {
    alert('You must be logged in to vote!');
    return;
  }
  if (isVoting.value) return;
  isVoting.value = true;

  const originalVote = localUserVote.value;
  const originalCount = localVoteCount.value;

  const numeric = voteType === 'like' ? 1 : -1;
  const sendType = localUserVote.value === numeric ? 0 : numeric;

  localVoteCount.value += (sendType - localUserVote.value);
  localUserVote.value = sendType;

  try {
    await api.post(`/api/comments/${props.comment.id}/vote`, { voteType: sendType });
  } catch (err) {
    console.error('Failed to vote:', err);
    localUserVote.value = originalVote;
    localVoteCount.value = originalCount;
    alert('Failed to record vote. Please try again.');
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

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return 'Unknown time';
  const d = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime())/1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  const days = Math.floor(diff/86400);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
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