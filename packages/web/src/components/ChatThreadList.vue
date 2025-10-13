<template>
  <div style="display:flex;flex-direction:column;height:100%;">
    <!-- Search Bar -->
    <div style="padding:12px;border-bottom:1px solid #334155;">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search conversations..."
        style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:white;font-size:14px;"
      />
    </div>

    <!-- Thread List -->
    <div style="flex:1;overflow-y:auto;padding:8px;">
      <!-- Loading state -->
      <div v-if="chatStore.isLoading" style="text-align:center;padding:40px 20px;color:#94a3b8;">
        <p>Loading conversations...</p>
      </div>

      <!-- No threads message -->
      <div v-else-if="filteredThreads.length === 0" style="text-align:center;padding:40px 20px;color:#94a3b8;">
        <p style="font-size:16px;margin-bottom:8px;">No conversations yet</p>
        <p style="font-size:14px;color:#64748b;">Start a new chat to get connected!</p>
      </div>

      <!-- Thread items -->
      <div
        v-for="thread in filteredThreads"
        :key="thread.id"
        @click="selectThread(thread.id)"
        :style="{
          padding: '12px',
          marginBottom: '8px',
          background: isActive(thread.id) ? '#475569' : '#334155',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }"
        @mouseenter="e => !isActive(thread.id) && (e.currentTarget.style.background = '#475569')"
        @mouseleave="e => !isActive(thread.id) && (e.currentTarget.style.background = '#334155')"
      >
        <div style="display:flex;align-items:center;gap:12px;">
          <!-- Avatar -->
          <router-link
            v-if="thread.recipientId"
            :to="`/profile/${thread.recipientId}`"
            style="flex-shrink:0;"
          >
            <img
              :src="thread.recipientAvatar || defaultAvatar"
              style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #0ea5e9;"
              :alt="`${thread.recipientName}'s avatar`"
            />
          </router-link>
          <img
            v-else
            :src="defaultAvatar"
            style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #64748b;"
            alt="avatar"
          />

          <!-- Thread info -->
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <router-link
                v-if="thread.recipientId"
                :to="`/profile/${thread.recipientId}`"
                style="font-weight:600;font-size:15px;color:white;text-decoration:none;"
                @mouseenter="e => e.currentTarget.style.textDecoration = 'underline'"
                @mouseleave="e => e.currentTarget.style.textDecoration = 'none'"
              >
                {{ thread.recipientName }}
              </router-link>
              <span v-else style="font-weight:600;font-size:15px;color:white;">
                {{ thread.recipientName }}
              </span>

              <span style="font-size:12px;color:#94a3b8;">{{ formatDate(thread.lastMessageAt) }}</span>
            </div>
            <p style="font-size:13px;color:#cbd5e1;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              {{ thread.lastMessagePreview || 'No messages yet' }}
            </p>
          </div>

          <!-- Unread badge -->
          <div
            v-if="thread.unreadCount > 0"
            style="width:22px;height:22px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:white;flex-shrink:0;"
          >
            {{ thread.unreadCount > 9 ? '9+' : thread.unreadCount }}
          </div>
        </div>
      </div>
    </div>

    <!-- New Chat Button -->
    <div style="padding:12px;border-top:1px solid #334155;">
      <button
        @click="showUserSelectModal = true"
        style="width:100%;padding:12px;background:#0ea5e9;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;transition:background 0.2s;"
        @mouseenter="e => e.currentTarget.style.background = '#0284c7'"
        @mouseleave="e => e.currentTarget.style.background = '#0ea5e9'"
      >
        + New Conversation
      </button>
    </div>

    <!-- User Selection Modal -->
    <ChatUserSelectModal
      v-if="showUserSelectModal"
      @close="showUserSelectModal = false"
      @select="handleUserSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import ChatUserSelectModal from './ChatUserSelectModal.vue';

const chatStore = useChatStore();
const searchQuery = ref('');
const defaultAvatar = '/default-avatar.svg';
const showUserSelectModal = ref(false);

const filteredThreads = computed(() => {
  if (!searchQuery.value) return chatStore.threads;
  
  const query = searchQuery.value.toLowerCase();
  return chatStore.threads.filter(thread =>
    thread.recipientName.toLowerCase().includes(query) ||
    thread.lastMessagePreview?.toLowerCase().includes(query)
  );
});

function isActive(threadId: string): boolean {
  return chatStore.activeThreadId === threadId;
}

function selectThread(threadId: string) {
  console.log('[ChatThreadList] 📌 Selected thread:', threadId);
  chatStore.setActiveThread(threadId);
}

async function handleUserSelect(userId: string) {
  console.log('[ChatThreadList] Creating thread with user:', userId);
  showUserSelectModal.value = false;

  try {
    const threadId = await chatStore.createThread(userId);
    chatStore.setActiveThread(threadId);
  } catch (error) {
    console.error('[ChatThreadList] Failed to create thread:', error);
    alert('Failed to create conversation. Please try again.');
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
</script>