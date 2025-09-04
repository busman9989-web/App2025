<template>
  <div class="p-4">
    <div v-if="loading" class="text-center text-slate-500 py-8">Loading post...</div>
    <div v-else-if="error" class="text-center text-red-500 py-8">Could not load the post.</div>
    <div v-else-if="post" class="max-w-2xl mx-auto">

      <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
        <div class="flex items-center justify-between text-sm text-slate-500">
          <span>Posted by <span class="font-semibold">{{ post.is_anonymous ? 'Anonymous' : post.display_name }}</span></span>
        </div>
        <p class="mt-4 text-slate-800 text-lg leading-relaxed">{{ post.content }}</p>
      </div>

      <CommentComposer :post-id="post.id" @comment-posted="fetchPost" />
      <CommentList :comments="post.comments || []" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';
import CommentList from '@/components/CommentList.vue';
import CommentComposer from '@/components/CommentComposer.vue';

const route = useRoute();
const post = ref<any>(null);
const loading = ref(true);
const error = ref(false);

const fetchPost = async () => {
  loading.value = true;
  try {
    const postId = route.params.id;
    const response = await api.get(`/api/posts/${postId}`);
    post.value = response.data;
  } catch (err) {
    error.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPost);
</script>