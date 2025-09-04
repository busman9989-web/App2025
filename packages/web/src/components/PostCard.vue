<template>
  <RouterLink :to="`/post/${post.id}`" class="post-card-link">
    <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 flex p-3 gap-3 hover:border-teal-300 transition-colors">
      <div class="flex flex-col items-center flex-shrink-0 bg-slate-50 p-1 rounded-lg">
        <button @click.prevent="vote(1)" class="p-1 rounded-md hover:bg-teal-100">
          <UpArrowIcon :class="currentVote === 1 ? 'text-teal-500' : 'text-slate-400'" />
        </button>
        <span class="font-bold text-slate-700 text-sm my-1 w-6 text-center">{{ score }}</span>
        <button @click.prevent="vote(-1)" class="p-1 rounded-md hover:bg-blue-100">
          <DownArrowIcon :class="currentVote === -1 ? 'text-blue-500' : 'text-slate-400'" />
        </button>
      </div>

      <div class="flex-grow">
        <div class="text-xs text-slate-500">
          Posted by <span class="font-semibold">{{ post.is_anonymous ? 'Anonymous' : post.display_name }}</span>
          <span class="ml-2">{{ timeAgo(post.created_at) }}</span>
        </div>
        <p class="mt-2 text-slate-800 text-base">{{ post.content }}</p>
        <div class="mt-3 text-xs font-semibold text-slate-500 flex items-center gap-1">
          <CommentIcon />
          {{ post.comments_count }} {{ parseInt(post.comments_count) === 1 ? 'Comment' : 'Comments' }}
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { ref, PropType, h, VNode } from 'vue';
import { RouterLink } from 'vue-router';
import api from '@/api';

interface Post {
  id: string;
  content: string;
  display_name: string;
  is_anonymous: boolean;
  created_at: string;
  comments_count: string;
  score: number;
}

const props = defineProps({
  post: {
    type: Object as PropType<Post>,
    required: true
  }
});

const score = ref(props.post.score || 0);
const currentVote = ref(0);

const vote = async (voteType: 1 | -1) => {
    const finalVoteType = currentVote.value === voteType ? 0 : voteType;
    try {
        const response = await api.post(`/api/posts/${props.post.id}/vote`, { vote_type: finalVoteType });
        score.value = response.data.newScore;
        currentVote.value = finalVoteType;
    } catch (error) {
        alert("You must be logged in to vote.");
    }
};

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60; if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const Icon = (props: { path: VNode | VNode[], class?: string }) => h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: props.class || 'h-5 w-5', fill: 'currentColor', viewBox: '0 0 20 20' }, props.path);
const UpArrowIcon = () => h(Icon, { path: h('path', { d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z' }) });
const DownArrowIcon = () => h(Icon, { path: h('path', { d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-6.293l3 3a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414z' }) });
const CommentIcon = () => h(Icon, { class: 'h-4 w-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width':'2', d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }) });
</script>

<style scoped>
.post-card-link {
  @apply block no-underline;
}
</style>