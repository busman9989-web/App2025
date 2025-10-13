<template>
  <div class="max-w-3xl mx-auto mt-6 p-6 bg-white rounded-xl shadow">
    <div class="flex items-center space-x-4">
      <img :src="profileImageSrc" class="w-20 h-20 rounded-full object-cover" />
      <div>
        <h1 class="text-2xl font-bold">{{ user?.displayName || 'No name' }}</h1>
        <p class="text-slate-500">{{ user?.bio || 'No bio yet.' }}</p>
        <p class="text-sm text-slate-400">{{ user?.location || '' }}</p>
      </div>
    </div>

    <!-- Profile Picture Upload (show only if own profile) -->
    <div class="mt-4" v-if="isOwnProfile && user">
      <ProfilePictureUpload
        :initialUrl="user.profilePictureUrl"
        @updated="handleAvatarUpdated"
      />
    </div>

    <hr class="my-4" />
    <h2 class="text-lg font-semibold mb-2">Recent Posts</h2>
    <PostList :userId="user?.id" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import getUserProfile from '@/api'; // Adjust if it's a named export
import ProfilePictureUpload from '@/components/profilepictureupload.vue';
import PostList from '@/components/PostList.vue'; // adjust if needed

interface User {
  id: string;
  displayName?: string;
  bio?: string;
  location?: string;
  profilePictureUrl?: string;
}

const route = useRoute();
const user = ref<User | null>(null);
const defaultAvatar = '/default-avatar.png';

const auth = useAuthStore();
const isOwnProfile = computed(() => auth.user?.id && user.value?.id && auth.user.id === user.value.id);

// Use your backend api URL (from .env) for relative images
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const profileImageSrc = computed(() => {
  if (!user.value?.profilePictureUrl) return defaultAvatar;
  if (user.value.profilePictureUrl.startsWith('http')) return user.value.profilePictureUrl;
  return backendUrl.replace(/\/$/, '') + user.value.profilePictureUrl;
});

onMounted(async () => {
  const { data } = await getUserProfile(route.params.id as string);
  user.value = data;
});

function handleAvatarUpdated(newUrl: string) {
  if (user.value) {
    user.value.profilePictureUrl = newUrl;
  }
}
</script>