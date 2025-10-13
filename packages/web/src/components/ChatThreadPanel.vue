<template>
  <section v-if="activeThread" class="flex flex-col h-full bg-slate-900">
    <!-- Thread Header -->
    <div class="flex items-center border-b border-slate-700 p-3 bg-slate-800">
      <router-link
        v-if="activeThread.recipientId"
        :to="`/profile/${activeThread.recipientId}`"
        class="flex items-center gap-3 flex-1"
      >
        <img
          :src="activeThread.recipientAvatar || defaultAvatar"
          class="w-10 h-10 rounded-full object-cover border-2 border-cyan-400"
          :alt="`${activeThread.recipientName}'s avatar`"
          @error="onHeaderImgError"
        />
        <div>
          <div class="font-bold text-white hover:underline">
            {{ activeThread.recipientName }}
          </div>
          <div class="text-xs text-slate-400">
            {{ activeThread.recipientStatus || 'Offline' }}
          </div>
        </div>
      </router-link>
      <div v-else class="flex items-center gap-3 flex-1">
        <img
          :src="defaultAvatar"
          class="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
          alt="avatar"
        />
        <div class="font-bold text-white">
          {{ activeThread.recipientName }}
        </div>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-2" style="background:#0f172a;">
      <div v-if="chatStore.isLoadingMessages" class="text-center text-slate-400 py-8">
        <p>Loading messages...</p>
      </div>

      <div v-else-if="chatStore.activeMessages.length === 0" class="text-center text-slate-400 py-8">
        <p>No messages yet. Start the conversation!</p>
      </div>

      <ChatMessage v-for="msg in chatStore.activeMessages" :key="msg.id" :message="msg" />
    </div>

    <!-- Message Input -->
    <form class="flex items-center gap-2 border-t border-slate-700 p-3 bg-slate-800" @submit.prevent="sendMessage">
      <input
        v-model="messageText"
        placeholder="Type a message..."
        class="flex-1 bg-slate-900 text-white p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500 transition"
        :disabled="isSending"
      />
      <button
        type="submit"
        :disabled="!messageText.trim() || isSending"
        class="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 font-semibold transition"
      >
        {{ isSending ? 'Sending...' : 'Send' }}
      </button>
    </form>
  </section>

  <section v-else class="flex-1 flex items-center justify-center text-slate-400 bg-slate-900">
    <div class="text-center">
      <p class="text-xl mb-2">Select a conversation</p>
      <p class="text-sm text-slate-500">Choose a thread from the list to start chatting</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useChatStore } from '@/stores/chat';
import ChatMessage from './ChatMessage.vue';
import { useChatSocket } from '@/composables/useChatSocket';

const chatStore = useChatStore();
const defaultAvatar = '/default-avatar.svg';

const messageText = ref('');
const isSending = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

const activeThread = computed(() => chatStore.activeThread);

type ChatSocketMessage = {
  id: string;
  threadId: string;
  user: { id: string; displayName?: string; avatarUrl?: string | null; email?: string | null };
  text: string;
  timestamp: string;
};

const { connect, joinThread, leaveThread, onMessage } = useChatSocket();
let offMessage: (() => void) | null = null;

// Auto-scroll when messages change
watch(
  () => chatStore.activeMessages,
  async () => {
    await nextTick();
    scrollToBottom();
  },
  { deep: true }
);

// Join/leave rooms when thread changes
watch(
  () => chatStore.activeThreadId,
  async (newId, oldId) => {
    if (oldId) leaveThread(oldId);
    if (newId) {
      joinThread(newId);
      await nextTick();
      scrollToBottom();
    }
  }
);

onMounted(() => {
  connect();
  if (chatStore.activeThreadId) joinThread(chatStore.activeThreadId);

  // Normalize Socket.IO payload to store ChatMessage shape
  offMessage = onMessage(async (p: ChatSocketMessage) => {
    if (!p?.threadId || p.threadId !== chatStore.activeThreadId) return;

    const mapped = {
      id: p.id,
      threadId: p.threadId,
      senderId: p.user.id,
      content: p.text,
      createdAt: p.timestamp ? new Date(p.timestamp).toISOString() : new Date().toISOString(),
      sender: {
        id: p.user.id,
        displayName: p.user.displayName || p.user.email || 'Unknown User',
        profilePictureUrl: p.user.avatarUrl ?? null,
      },
    };

    // De-dupe: avoid pushing the same message twice (optimistic + socket)
    const exists = chatStore.activeMessages.some((m) => m.id === mapped.id);
    if (!exists) {
      chatStore.activeMessages.push(mapped as any);
      await nextTick();
      scrollToBottom();
    }
  });
});

onBeforeUnmount(() => {
  if (offMessage) offMessage();
  if (chatStore.activeThreadId) leaveThread(chatStore.activeThreadId);
});

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function sendMessage() {
  if (!messageText.value.trim() || isSending.value) return;
  isSending.value = true;
  try {
    await chatStore.sendMessage(messageText.value.trim());
    messageText.value = '';
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('[ChatThreadPanel] Failed to send message:', error);
  } finally {
    isSending.value = false;
  }
}

function onHeaderImgError(e: Event) {
  const el = e.target as HTMLImageElement;
  if (el && el.src !== defaultAvatar) {
    el.src = defaultAvatar;
  }
}
</script>