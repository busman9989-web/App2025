<template>
  <div v-if="auth.isLoading" class="flex items-center justify-center min-h-screen bg-slate-50">
    <p class="text-slate-500">Loading application...</p>
  </div>
  <div v-else class="bg-slate-50 font-sans max-w-md mx-auto min-h-screen flex flex-col relative shadow-2xl">
    <TheHeader v-if="auth.isAuthenticated" />
    <main class="flex-grow overflow-y-auto" :class="{'pb-16': auth.isAuthenticated}">
      <RouterView />
    </main>
    <BottomNav v-if="auth.isAuthenticated" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth';
import TheHeader from '@/components/TheHeader.vue';
import BottomNav from '@/components/BottomNav.vue';

const auth = useAuthStore();
onMounted(() => {
  auth.verifyAuth();
});
</script>