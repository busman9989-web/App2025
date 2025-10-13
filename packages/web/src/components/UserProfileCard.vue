<template>
  <div 
    class="w-72 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 transition-colors 
          flex flex-col justify-between"
    style="min-height: 190px;" 
  >
    <div class="space-y-3">
      <div class="flex items-center gap-3 border-b pb-3 border-slate-200 dark:border-slate-700/50">
        <div class="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
          {{ initials }}
        </div>
        <div>
          <h3 class="font-bold text-lg text-slate-900 dark:text-white truncate">{{ user.displayName }}</h3>
          <p class="text-xs font-medium" :class="statusClass">{{ user.status }}</p>
        </div>
      </div>

      <div class="text-sm space-y-2">
        <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
          <span class="font-medium">Total Posts:</span>
          <span class="font-semibold text-slate-900 dark:text-white">{{ user.postCount }}</span>
        </div>
        <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
          <span class="font-medium">Recent Activity:</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">{{ user.lastActive }}</span>
        </div>
      </div>
    </div>
    
    <router-link 
      v-if="user.id"
      :to="`/profile/${user.id}`" 
      class="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition mt-4"
    >
      View Full Profile
      <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    </router-link>
    <button
        v-else
        disabled
        class="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-semibold text-white bg-gray-500 rounded-md mt-4 cursor-not-allowed"
    >
        Profile Not Available
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Define the shape of the user data for the card
interface ProfileUserData {
  id: string;
  displayName: string;
  status: 'Online' | 'Away' | 'Offline';
  postCount: number;
  lastActive: string; // e.g., "2 hours ago"
}

const props = defineProps<{
  user: ProfileUserData;
}>();

// --- Computed Properties ---

// FIX 2: Added safety checks (props.user?.) to prevent access before the prop is fully available,
// which causes the "undefined (reading 'displayName')" error.
const initials = computed(() => {
  const name = props.user?.displayName;
  if (!name) return '?';

  const parts = name.split(' ');
  if (parts.length > 1 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name[0]?.toUpperCase() ?? '?'; 
});

// FIX 3: Added safety checks for status access
const statusClass = computed(() => {
  const status = props.user?.status;
  switch (status) {
    case 'Online':
      return 'text-green-500 dark:text-green-400';
    case 'Away':
      return 'text-amber-500 dark:text-amber-400';
    case 'Offline':
    default:
      return 'text-red-500 dark:text-red-400';
  }
});

</script>