<template>
  <div class="p-4 space-y-6 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Community Forum</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">Share your experiences and connect with others.</p>
    </div>

    <NewPostForm @post-created="fetchPosts" /> 

    <div v-if="isLoading" class="text-center text-slate-500 dark:text-slate-400 py-8 transition-colors">Loading posts...</div>
    <div v-else-if="error" class="text-center text-red-500 dark:text-red-400 py-8 transition-colors">Could not load the feed.</div>
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
// No need to import useThemeStore directly here if the dark class is applied to <html> or <body>
// and components self-manage dark: variants.
// If your NewPostForm or PostCard need access to the theme store, they would import it themselves.

const posts = ref<any[]>([]);
const isLoading = ref(true);
const error = ref(false);

const fetchPosts = async () => {
  isLoading.value = true; // Set loading to true for all fetches
  error.value = false;    // Clear error for new fetch attempt
  try {
    const response = await api.get('/api/posts');
    
    // Filter out null/invalid posts to prevent rendering errors
    posts.value = Array.isArray(response.data)
      ? response.data.filter(post => post && post.id)
      : [];

  } catch (err) {
    console.error("Failed to fetch posts:", err);
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchPosts);
</script>

<style scoped>
/* No scoped styles needed here, as Tailwind classes handle the theming */
</style>