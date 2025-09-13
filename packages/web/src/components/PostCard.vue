<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4">
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
          <button
            @click="vote(1)"
            :class="['vote-button', { 'text-teal-500': userVote === 1 }]"
            title="Upvote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
            </svg>
          </button>
          <span class="font-semibold text-slate-700">{{ postScore }}</span>
          <button
            @click="vote(-1)"
            :class="['vote-button', { 'text-red-500': userVote === -1 }]"
            title="Downvote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 10-2 0v-3.586l-1.293 1.293a1 1 0 00-1.414-1.414l3-3a1 1 0 001.414 0l3 3a1 1 0 00-1.414 1.414L11 9.414V13z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <button class="flex items-center space-x-1 hover:text-teal-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-4l-4 4z" />
          </svg>
          <span>{{ post.comments_count || 0 }} Comments</span>
        </button>
      </div>

      <button class="flex items-center space-x-1 hover:text-teal-600 transition-colors">
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
import { useAuthStore } from '@/stores/auth'; // Import auth store to check if user is logged in

const props = defineProps<{
  post: {
    id: string;
    content: string;
    category: string;
    is_anonymous: boolean;
    created_at: string;
    display_name: string; // Now expected from backend
    comments_count: number;
    score: number; // For likes/votes
    // Potentially add a property for the user's current vote if backend supports it
  };
}>();

const authStore = useAuthStore();
const postScore = ref(props.post.score || 0);
const userVote = ref(0); // 1 for upvote, -1 for downvote, 0 for no vote

// In a real app, you'd fetch the user's current vote for this post
// on component mount. For simplicity, we'll assume no initial vote
// and update based on user action.

const vote = async (type: 1 | -1) => {
  if (!authStore.token) {
    alert('You must be logged in to vote!');
    return;
  }

  try {
    // If the user is trying to vote the same way again, unvote (toggle)
    if (userVote.value === type) {
      await api.post(`/api/posts/${props.post.id}/vote`, { type: 0 }); // Assuming 0 means remove vote or toggle
      postScore.value -= type; // Adjust score
      userVote.value = 0;
    } else {
      // If changing vote or voting for first time
      await api.post(`/api/posts/${props.post.id}/vote`, { type });
      postScore.value += (type - userVote.value); // Adjust score based on previous vote
      userVote.value = type;
    }
    // Emit an event to the parent to re-fetch/update posts if necessary
    // emit('post-updated', props.post.id); // Uncomment if you add an emit
  } catch (error) {
    console.error('Error voting:', error);
    alert('Failed to record vote. Please try again.');
  }
};


const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(); // You can customize this format
};

const categoryClass = (category: string) => {
  switch (category) {
    case 'Advice': return 'bg-blue-100 text-blue-800';
    case 'Vent': return 'bg-red-100 text-red-800';
    case 'Support': return 'bg-green-100 text-green-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};
</script>

<style scoped>
.vote-button {
  @apply p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors;
}
</style>