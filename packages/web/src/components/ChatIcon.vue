<template>
  <button
    class="w-14 h-14 flex items-center justify-center
      text-white rounded-full shadow-lg transition-all
      fixed right-4 z-50
      bg-gradient-to-br from-purple-600 to-pink-600
      hover:from-purple-700 hover:to-pink-700
      focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
    :style="{ bottom: 'calc(172px + env(safe-area-inset-bottom))' }"
    @click="$emit('click')"
    aria-label="Open Chat"
  >
    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4-4.03 7-9 7a9.77 9.77 0 01-3.09-.47l-4.8 1.27a1 1 0 01-1.22-1.22l1.27-4.8A7.94 7.94 0 013 12c0-4 4.03-7 9-7s9 3 9 7z"
      />
    </svg>
    <span v-if="unread > 0" class="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{{ unread }}</span>
  </button>
</template>
<script setup lang="ts">
defineProps<{ unread: number }>();
</script>