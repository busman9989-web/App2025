<template>
  <div class="mt-6">
    <h3 class="text-lg font-semibold text-slate-700 dark:text-white mb-3 transition-colors">
      {{ comments.length }} {{ comments.length === 1 ? 'Comment' : 'Comments' }}
    </h3>

    <div class="space-y-4">
      <CommentCard 
        v-for="comment in mappedComments" 
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
import { PropType, computed } from 'vue';
import CommentCard from './CommentCard.vue';

// The base Comment type as received (can have null/undefined)
interface Comment {
  id: string;
  content: string;
  authorName?: string | null;
  createdAt?: string | null;
  replies?: Comment[];
  voteCount?: number;
  userVote?: number;
}

// What CommentCard expects (all required, createdAt is string)
type StrictComment = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  replies?: StrictComment[];
  voteCount: number;
  userVote: number;
};

const props = defineProps({
  comments: {
    type: Array as PropType<Comment[]>,
    required: true,
  },
  postId: {
    type: String,
    required: true,
  }
});

// Helper: Map comments to ensure required fields for CommentCard
function mapComment(raw: Comment): StrictComment {
  return {
    id: raw.id,
    content: raw.content,
    authorName: raw.authorName ?? "Anonymous",
    createdAt: raw.createdAt ?? "",
    replies: (raw.replies ?? []).map(r => mapComment(r as Comment)),
    voteCount: raw.voteCount ?? 0,
    userVote: raw.userVote ?? 0,
  };
}

const mappedComments = computed(() => props.comments.map(mapComment));
</script>