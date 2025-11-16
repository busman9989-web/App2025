<template>
  <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-750 active:bg-slate-100 dark:active:bg-slate-700 transition-colors">
    <!-- Post Header -->
    <div class="flex items-start gap-3 mb-3">
      <!-- Avatar with Profile Picture Support -->
      <button
        @click="handleAvatarClick"
        class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 active:opacity-80 transition-opacity"
        :class="!post.profilePictureUrl && avatarGradientClass"
      >
        <!-- Show profile picture if available -->
        <img 
          v-if="post.profilePictureUrl && !imageError" 
          :src="post.profilePictureUrl" 
          alt="Profile"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
        <!-- Fallback to initials -->
        <div 
          v-else
          class="w-full h-full flex items-center justify-center text-white font-semibold"
        >
          {{ avatarLetter }}
        </div>
      </button>

      <!-- Author Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <button
            v-if="!post.isAnonymous"
            @click="handleAuthorClick"
            class="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 active:text-blue-700 dark:active:text-blue-300 transition-colors truncate"
          >
            {{ displayName }}
          </button>
          <span v-else class="font-semibold text-slate-500 dark:text-slate-400 truncate">{{ displayName }}</span>
          <span class="text-slate-500 dark:text-slate-500 text-xs flex-shrink-0">{{ formattedTimestamp }}</span>
        </div>
        <p class="text-slate-600 dark:text-slate-400 text-sm truncate">@{{ post.authorName || 'anonymous' }}</p>
      </div>

      <!-- Category Badge -->
      <span :class="['px-2 py-1 text-xs font-semibold rounded-full border flex-shrink-0', categoryBadgeClass(post.category)]">
        {{ post.category || 'General' }}
      </span>
    </div>

    <!-- Post Content -->
    <div @click="navigateToPost" class="mb-3 active:opacity-80 transition-opacity cursor-pointer">
      <p class="text-slate-700 dark:text-slate-200 leading-relaxed">{{ post.content }}</p>
    </div>

    <!-- Interaction Bar -->
    <div class="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-4">
        <!-- Boost (Upvote) -->
        <button
          @click.stop="handleVote(1)"
          :class="[
            'flex items-center gap-1.5 text-sm transition-colors active:scale-95 min-h-[44px] -my-2 py-2',
            userVoteLocal === 1 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400'
          ]"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/>
          </svg>
          <span class="font-medium text-xs">Boost</span>
          <span :class="getVoteColor(postScore)" class="font-semibold text-xs">{{ postScore }}</span>
        </button>

        <!-- Comments -->
        <button
          @click.stop="navigateToPost"
          class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all min-h-[44px] -my-2 py-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span class="text-xs font-medium">{{ post.commentCount || 0 }}</span>
        </button>

        <!-- Share -->
        <button 
          @click.stop="handleShare"
          class="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all min-h-[44px] -my-2 py-2"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
          </svg>
          <span class="text-xs font-medium">Share</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

interface Post {
  id: string;
  content: string;
  category: string;
  isAnonymous: boolean;
  createdAt?: string | number | null;
  created_at?: string | number | null;
  authorName?: string | null;
  authorId?: string | null;
  profilePictureUrl?: string | null;
  authorStatus?: 'Online' | 'Away' | 'Offline';
  authorPostCount?: number;
  authorLastActive?: string;
  commentCount?: number;
  voteCount?: number;
  userVote?: number;
}

const props = defineProps<{
  post: Post;
}>();

const emit = defineEmits(['post-updated']);

const router = useRouter();
const authStore = useAuthStore();
const postScore = ref(props.post.voteCount ?? 0);
const userVoteLocal = ref<number>(props.post.userVote ?? 0);
const imageError = ref(false);

const displayName = computed(() => {
  if (props.post.isAnonymous) return 'Anonymous';
  return props.post.authorName || 'Anonymous';
});

const avatarLetter = computed(() => 
  (displayName.value && displayName.value[0] ? displayName.value[0].toUpperCase() : '?')
);

const avatarGradientClass = computed(() => {
  if (props.post.isAnonymous) {
    return 'bg-gradient-to-br from-slate-400 to-slate-500';
  }
  
  const gradients = [
    'bg-gradient-to-br from-cyan-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-pink-600',
    'bg-gradient-to-br from-green-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-red-600',
    'bg-gradient-to-br from-indigo-500 to-purple-600',
  ];
  
  const index = (props.post.authorId?.charCodeAt(0) || 0) % gradients.length;
  return gradients[index];
});

const createdAtRaw = computed(() => props.post.createdAt ?? props.post.created_at ?? null);

function parseDateLike(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    const ms = input < 1e12 ? input * 1000 : input;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) {
      const num = Number(s);
      const ms = num < 1e12 ? num * 1000 : num;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    if (s.includes(' ') && !s.includes('T')) {
      d = new Date(s.replace(' ', 'T'));
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'now';
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60) return 'now';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7) return `${d}d`;
  return date.toLocaleDateString('en-GB');
}

const formattedTimestamp = computed(() => {
  const d = parseDateLike(createdAtRaw.value);
  return d ? formatRelative(d) : 'now';
});

const categoryBadgeClass = (category: string) => {
  switch (category) {
    case 'Advice': 
      return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    case 'Vent': 
      return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/30';
    case 'Support': 
      return 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-500/30';
    default: 
      return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600/30';
  }
};

const getVoteColor = (count: number) => {
  if (count > 0) return 'text-green-600 dark:text-green-400';
  if (count < 0) return 'text-red-600 dark:text-red-400';
  return 'text-slate-600 dark:text-slate-400';
};

const handleImageError = () => {
  imageError.value = true;
  console.error('Failed to load profile picture:', props.post.profilePictureUrl);
};

const handleAvatarClick = () => {
  if (!props.post.isAnonymous && props.post.authorId) {
    router.push(`/profile/${props.post.authorId}`);
  }
};

const handleAuthorClick = () => {
  if (!props.post.isAnonymous && props.post.authorId) {
    router.push(`/profile/${props.post.authorId}`);
  }
};

const navigateToPost = () => {
  router.push(`/community/post/${props.post.id}`);
};

const handleVote = async (type: 1 | -1) => {
  if (!authStore.isAuthenticated) {
    alert('You must be logged in to vote!');
    return;
  }

  try {
    const sendType = userVoteLocal.value === type ? 0 : type;
    await api.post(`/api/posts/${props.post.id}/vote`, { voteType: sendType });

    if (sendType === 0) {
      postScore.value -= userVoteLocal.value;
      userVoteLocal.value = 0;
    } else {
      postScore.value += (sendType - userVoteLocal.value);
      userVoteLocal.value = sendType;
    }
    
    emit('post-updated');
  } catch (err) {
    console.error('Error voting:', err);
    alert('Failed to record vote. Please try again.');
  }
};

const handleShare = async () => {
  const url = `${window.location.origin}/community/post/${props.post.id}`;
  
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Check out this post',
        text: props.post.content.substring(0, 100),
        url: url
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  } catch (err) {
    console.log('Share cancelled or failed:', err);
  }
};
</script>