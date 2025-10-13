<template>
  <div
    :class="[
      'flex gap-3 p-3 rounded-lg',
      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
    ]"
  >
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div 
        v-if="senderAvatar"
        class="w-10 h-10 rounded-full overflow-hidden border-2"
        :class="isOwnMessage ? 'border-cyan-500' : 'border-slate-600'"
      >
        <img
          :src="senderAvatar"
          class="w-full h-full object-cover"
          :alt="`${senderName}'s avatar`"
        />
      </div>
      <div
        v-else
        class="w-10 h-10 rounded-full flex items-center justify-center border-2"
        :class="isOwnMessage ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-700 border-slate-600'"
      >
        <span class="text-white font-bold text-sm">
          {{ firstLetter }}
        </span>
      </div>
    </div>

    <!-- Message content -->
    <div
      :class="[
        'flex-1 max-w-[70%] flex flex-col',
        isOwnMessage ? 'items-end' : 'items-start'
      ]"
    >
      <div
        :class="[
          'flex items-center gap-2 mb-1',
          isOwnMessage ? 'flex-row-reverse' : 'flex-row'
        ]"
      >
        <span class="font-semibold text-sm text-cyan-300">
          {{ senderName }}
        </span>
        <time class="text-xs text-slate-400" :datetime="message.createdAt">
          {{ formattedTime }}
        </time>
      </div>

      <div
        :class="[
          'px-4 py-2 rounded-2xl break-words whitespace-pre-wrap',
          isOwnMessage
            ? 'bg-cyan-600 text-white rounded-tr-none'
            : 'bg-slate-700 text-slate-100 rounded-tl-none'
        ]"
      >
        {{ message.content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    displayName: string;
    profilePictureUrl?: string | null; // unified prop
  };
}

const props = defineProps<{ message: ChatMessage }>();
const authStore = useAuthStore();

const isOwnMessage = computed(() => props.message.senderId === authStore.user?.id);

const senderName = computed(() => {
  if (isOwnMessage.value) return 'You';
  return props.message.sender?.displayName || 'Unknown User';
});

const senderAvatar = computed(() => props.message.sender?.profilePictureUrl || null);

const firstLetter = computed(() => (senderName.value || '?').charAt(0).toUpperCase());

const formattedTime = computed(() => {
  if (!props.message.createdAt) return '';
  const date = new Date(props.message.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffHours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});
</script>