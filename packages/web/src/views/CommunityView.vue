<template>
  <div class="p-4 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Community Forum</h1>
      <p class="mt-1 text-slate-600">Share your experiences and connect with others.</p>
    </div>

    <NewPostForm @post-created="fetchPosts" />

    <div v-if="isLoading" class="text-center text-slate-500 py-8">Loading posts...</div>
    <div v-else-if="error" class="text-center text-red-500 py-8">Could not load the feed.</div>
    <div v-else class="space-y-4">
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';
import PostCard from '@/components/PostCard.vue';
import NewPostForm from '@/components/NewPostForm.vue';

const posts = ref<any[]>([]);
const isLoading = ref(true);
const error = ref(false);

const fetchPosts = async () => {
  // No need to set loading true here as it's for subsequent fetches
  try {
    const response = await api.get('/api/posts');
    posts.value = response.data;
  } catch (err) {
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchPosts);
</script>