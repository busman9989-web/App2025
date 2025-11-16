<template>
  <div class="p-4 space-y-6 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Community Forum</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">Share your experiences and connect with others.</p>
    </div>

    <!-- Category Filter Chips - Optimized for mobile -->
    <div class="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
      <button
        v-for="community in communities"
        :key="community.id"
        @click="selectedCommunity = community.id"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 text-xs font-medium',
          selectedCommunity === community.id
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
        ]"
      >
        <div :class="['w-1.5 h-1.5 rounded-full', selectedCommunity === community.id ? 'bg-white' : community.color]"></div>
        <span>{{ community.name }}</span>
      </button>
    </div>

    <NewPostForm @post-created="fetchPosts" /> 

    <div v-if="isLoading" class="text-center text-slate-500 dark:text-slate-400 py-8 transition-colors">Loading posts...</div>
    <div v-else-if="error" class="text-center text-red-500 dark:text-red-400 py-8 transition-colors">Could not load the feed.</div>
    <div v-else class="space-y-4">
      <PostCard v-for="post in filteredPosts" :key="post.id" :post="post" @post-updated="fetchPosts" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/api';
import PostCard from '@/components/PostCard.vue';
import NewPostForm from '@/components/NewPostForm.vue';

const posts = ref<any[]>([]);
const isLoading = ref(true);
const error = ref(false);
const selectedCommunity = ref('all');

const communities = ref([
  { id: 'all', name: 'All Posts', color: 'bg-blue-500' },
  { id: 'advice', name: 'Advice', color: 'bg-blue-400' },
  { id: 'support', name: 'Support', color: 'bg-green-500' },
  { id: 'vent', name: 'Vent', color: 'bg-red-500' },
  { id: 'general', name: 'General', color: 'bg-slate-500' },
]);

const filteredPosts = computed(() => {
  let filtered = posts.value;
  
  if (selectedCommunity.value !== 'all') {
    filtered = filtered.filter(post => 
      post.category?.toLowerCase() === selectedCommunity.value.toLowerCase()
    );
  }
  
  return filtered;
});

const fetchPosts = async () => {
  isLoading.value = true;
  error.value = false;
  try {
    const response = await api.get('/api/posts');
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
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>