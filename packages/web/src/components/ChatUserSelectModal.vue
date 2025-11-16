<template>
  <teleport to="body">
    <div style="position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);padding:20px;">
      <div
        style="width:100%;max-width:500px;background:#1e293b;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.5);"
        @click.stop
      >
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #334155;">
          <h3 style="font-size:18px;font-weight:bold;color:white;margin:0;">New Conversation</h3>
          <button
            @click="$emit('close')"
            style="padding:8px;background:#334155;border:none;border-radius:50%;cursor:pointer;color:white;"
          >
            ✕
          </button>
        </div>

        <!-- Search Input -->
        <div style="padding:16px;border-bottom:1px solid #334155;">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Search users..."
            autofocus
            style="width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:white;font-size:14px;"
          />
        </div>

        <!-- User List -->
        <div style="max-height:400px;overflow-y:auto;padding:8px;">
          <!-- Loading -->
          <div v-if="isLoading" style="text-align:center;padding:40px;color:#94a3b8;">
            <p>Searching...</p>
          </div>

          <!-- No query yet -->
          <div v-else-if="!searchQuery" style="text-align:center;padding:40px;color:#94a3b8;">
            <p>Type to search for users</p>
          </div>

          <!-- No results -->
          <div v-else-if="users.length === 0" style="text-align:center;padding:40px;color:#94a3b8;">
            <p>No users found</p>
          </div>

          <!-- User Results -->
          <div
            v-for="user in users"
            :key="user.id"
            @click="selectUser(user)"
            style="display:flex;align-items:center;gap:12px;padding:12px;margin:4px;background:#334155;border-radius:8px;cursor:pointer;transition:background 0.2s;"
            @mouseenter="(e: MouseEvent) => { const t = e.currentTarget as HTMLElement | null; if (t) t.style.background = '#475569'; }"
            @mouseleave="(e: MouseEvent) => { const t = e.currentTarget as HTMLElement | null; if (t) t.style.background = '#334155'; }"
          >
            <img
              :src="user.avatarUrl || defaultAvatar"
              style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #0ea5e9;"
              :alt="`${user.displayName}'s avatar`"
            />
            <div style="flex:1;">
              <div style="font-weight:600;color:white;font-size:15px;">{{ user.displayName }}</div>
              <div style="font-size:13px;color:#94a3b8;">{{ user.email || 'No email' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '@/stores/chat';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', userId: string): void;
}>();

const chatStore = useChatStore();
const defaultAvatar = '/default-avatar.svg';

const searchQuery = ref('');
const users = ref<any[]>([]);
const isLoading = ref(false);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

async function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!searchQuery.value || searchQuery.value.length < 2) {
    users.value = [];
    return;
  }

  isLoading.value = true;

  searchTimeout = setTimeout(async () => {
    try {
      users.value = await chatStore.searchUsers(searchQuery.value);
    } catch (error) {
      console.error('[ChatUserSelectModal] Search failed:', error);
      users.value = [];
    } finally {
      isLoading.value = false;
    }
  }, 300); // Debounce 300ms
}

async function selectUser(user: any) {
  console.log('[ChatUserSelectModal] Selected user:', user);
  emit('select', user.id);
}
</script>