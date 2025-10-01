<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 space-y-4 transition-colors">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-lg transition-colors">
          {{ avatarLetter }}
        </div>
        <div>
          <p class="font-semibold text-slate-800 dark:text-white transition-colors">{{ displayName }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 transition-colors">{{ formatTimestamp(post.createdAt) }}</p>
        </div>
      </div>
      <span
        :class="[
          'px-2 py-1 text-xs font-medium rounded-full transition-colors', // Added transition-colors here
          categoryClass(post.category)
        ]"
      >
        {{ post.category }}
      </span>
    </div>

    <div class="text-slate-700 dark:text-slate-200 leading-relaxed transition-colors">
      {{ post.content }}
    </div>

    <div class="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3 transition-colors">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <button
            @click="handleVote(1)"
            :class="['vote-button', { 'text-teal-500 dark:text-indigo-400': userVoteLocal === 1 }]"
            title="Upvote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
            </svg>
          </button>
          <span class="font-semibold text-slate-700 dark:text-slate-200 transition-colors">{{ postScore }}</span>
          <button
            @click="handleVote(-1)"
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
      </div>

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
import { defineProps, ref, computed } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  post: {
    id: string;
    content: string;
    category: string;
    isAnonymous: boolean;
    createdAt?: string | null;
    authorName?: string | null;
    commentCount?: number;
    voteCount?: number;
    userVote?: number;
  };
}>();

const authStore = useAuthStore();

// Local reactive score and vote state
const postScore = ref(props.post.voteCount ?? 0);
const userVoteLocal = ref<number>(props.post.userVote ?? 0);

// computed for display name & avatar letter
const displayName = computed(() => {
  if (props.post.isAnonymous) return 'Anonymous';
  return props.post.authorName || 'Anonymous';
});
const avatarLetter = computed(() => (displayName.value && displayName.value[0] ? displayName.value[0].toUpperCase() : '?'));

// helper to format timestamps safely
const formatTimestamp = (timestamp?: string | null) => {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
};

// category class mapping - Updated to include dark mode classes
const categoryClass = (category: string) => {
  switch (category) {
    case 'Advice': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
    case 'Vent': return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
    case 'Support': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100';
  }
};

// Voting handler: send voteType and support unvote (0)
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

const postScoreComputed = computed(() => postScore.value);
const postScoreRef = postScoreComputed; // keep name used in template
// alias exposing for template
const postScoreExport = postScore;
</script>

<script lang="ts">
// expose reactive variables to template
export default {};
</script>

<style scoped>
/* Updated vote-button to include dark mode hover and text colors */
.vote-button {
  @apply p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-indigo-400 transition-colors;
}
</style>