<template>
  <div
    class="p-4 rounded-xl shadow-lg transition duration-300 ease-in-out cursor-pointer bg-white dark:bg-slate-900 hover:shadow-xl"
    :class="cardBorderClasses"
  >
    <div class="flex justify-between items-start">
      <div class="flex-grow min-w-0 flex items-center space-x-3">
        <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-lg transition-colors">
          {{ avatarLetter }}
        </div>
        <div class="relative inline-block min-w-0">
          <p 
            v-if="!post.isAnonymous"
            @click.stop="toggleCard"
            class="font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 truncate"
            :aria-expanded="isCardVisible"
            aria-controls="profile-popover"
          >
            {{ displayName }}
          </p>
          <p v-else class="font-semibold text-slate-800 dark:text-white transition-colors truncate">
            {{ displayName }}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 transition-colors">{{ formattedTimestamp }}</p>
          <div 
            v-if="isCardVisible" 
            id="profile-popover"
            class="absolute z-30 mt-2 left-0 sm:right-0 sm:left-auto"
            @click.stop
            @mouseleave="isCardVisible = false"
          >
            <UserProfileCard :user="authorCardData" />
          </div>
        </div>
      </div>
      <span
        :class="[
          'ml-4 px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 transition-colors',
          categoryBadgeClass(post.category)
        ]"
      >
        {{ post.category || 'General' }}
      </span>
    </div>

    <div class="mt-3 text-slate-700 dark:text-slate-200 text-sm leading-relaxed transition-colors line-clamp-2">
      {{ post.content }}
    </div>

    <div class="flex items-center space-x-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
      <div class="flex items-center space-x-1" @click.stop>
        <button
          @click.stop="handleVote(1)"
          :class="['vote-button', { 'text-teal-500 dark:text-indigo-400': userVoteLocal === 1 }]"
          title="Upvote"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
          </svg>
        </button>
        <span class="font-semibold" :class="getVoteColor(postScore)">{{ postScore }}</span>
        <button
          @click.stop="handleVote(-1)"
          :class="['vote-button', { 'text-red-500 dark:text-red-400': userVoteLocal === -1 }]"
          title="Downvote"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 10-2 0v-3.586l-1.293 1.293a1 1 0 00-1.414-1.414l3-3a1 1 0 001.414 0l3 3a1 1 0 00-1.414 1.414L11 9.414V13z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <router-link
        :to="`/community/post/${post.id}`"
        class="flex items-center space-x-1 hover:text-teal-600 dark:hover:text-indigo-400 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4l-4 4z" />
        </svg>
        <span>{{ post.commentCount || 0 }} Comments</span>
      </router-link>

      <button class="flex items-center space-x-1 hover:text-teal-600 dark:hover:text-indigo-400 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <span>Share</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';
import UserProfileCard from './UserProfileCard.vue';

interface ProfileCardData {
  id: string;
  displayName: string;
  status: 'Online' | 'Away' | 'Offline';
  postCount: number;
  lastActive: string;
}

const props = defineProps<{
  post: {
    id: string;
    content: string;
    category: string;
    isAnonymous: boolean;
    createdAt?: string | number | null;
    created_at?: string | number | null;
    authorName?: string | null;
    authorId?: string | null;
    authorStatus?: 'Online' | 'Away' | 'Offline';
    authorPostCount?: number;
    authorLastActive?: string;
    commentCount?: number;
    voteCount?: number;
    userVote?: number;
  };
}>();

const authStore = useAuthStore();
const postScore = ref(props.post.voteCount ?? 0);
const userVoteLocal = ref<number>(props.post.userVote ?? 0);
const isCardVisible = ref(false);

const displayName = computed(() => {
  if (props.post.isAnonymous) return 'Anonymous';
  return props.post.authorName || 'Anonymous';
});
const avatarLetter = computed(() => (displayName.value && displayName.value[0] ? displayName.value[0].toUpperCase() : '?'));

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
  if (diffMs < 0) return 'Just now';
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (s < 60) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString('en-GB');
}

const formattedTimestamp = computed(() => {
  const d = parseDateLike(createdAtRaw.value);
  return d ? formatRelative(d) : 'Just now';
});

// 🌟 REFINED LOGIC: Explicitly set ID to '' if anonymous, or use the provided ID.
const authorCardData = computed<ProfileCardData>(() => ({
  // If the post is anonymous, ID must be explicitly empty string to disable the link.
  // Otherwise, use the authorId, defaulting to empty string if it's missing (data issue).
  id: props.post.isAnonymous ? '' : (props.post.authorId || ''),
  displayName: props.post.authorName || 'User',
  status: props.post.authorStatus || 'Offline',
  postCount: props.post.authorPostCount || 0,
  lastActive: props.post.authorLastActive || formattedTimestamp.value
}));

function toggleCard() {
  // Only allow card to be toggled if not anonymous
  if (!props.post.isAnonymous) {
    isCardVisible.value = !isCardVisible.value;
  }
}

// --- COLOURS FROM MODERN VERSION ---

const cardBorderClasses = computed(() => {
    const baseClasses = 'border-t-4 border-l-2';
    switch (props.post.category) {
        case 'Advice': return `${baseClasses} border-blue-500 dark:border-blue-600`;
        case 'Vent': return `${baseClasses} border-red-500 dark:border-red-600`;
        case 'Support': return `${baseClasses} border-green-500 dark:border-green-600`;
        default: return `${baseClasses} border-cyan-500 dark:border-cyan-600`;
    }
});

const categoryBadgeClass = (category: string) => {
    switch (category) {
        case 'Advice': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
        case 'Vent': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
        case 'Support': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
        default: return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }
};

const getVoteColor = (count: number) => {
    if (count > 0) return 'text-green-500 dark:text-green-400';
    if (count < 0) return 'text-red-500 dark:text-red-400';
    return 'text-slate-500 dark:text-slate-400';
};

// --- /COLOURS ---

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
  } catch (err) {
    console.error('Error voting:', err);
    alert('Failed to record vote. Please try again.');
  }
};
</script>

<style scoped>
.vote-button {
  @apply p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-indigo-400 transition-colors;
}
.z-30 {
  z-index: 30;
}
</style>