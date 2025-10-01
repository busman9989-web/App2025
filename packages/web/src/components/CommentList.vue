<template>
  <div class="mt-6">
    <h3 class="text-lg font-semibold text-slate-700 dark:text-white mb-3 transition-colors">
      {{ comments.length }} {{ comments.length === 1 ? 'Comment' : 'Comments' }}
    </h3>

    <div class="space-y-4">
      <CommentCard 
        v-for="comment in comments" 
        :key="comment.id" 
        :comment="comment" 
        :postId="postId" 
        :depth="0" 
        @comment-posted="$emit('comment-posted')"
      />
    </div>

    <div v-if="comments.length === 0" class="text-center text-slate-500 dark:text-slate-400 py-6 transition-colors">
      <p>No comments yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import CommentCard from './CommentCard.vue';

interface Comment {
  id: string;
  content: string;
  authorName?: string | null;
  createdAt?: string | null;
  replies?: Comment[];
  voteCount?: number; // Added for CommentCard props
  userVote?: 'like' | 'dislike' | null; // Added for CommentCard props
}

const props = defineProps({
  comments: {
    type: Array as PropType<Comment[]>,
    required: true,
  },
  postId: { // Added postId prop
    type: String,
    required: true,
  }
});

const emit = defineEmits(['comment-posted']); // Added emit for comment-posted event
</script>