<template>
  <div style="position:fixed;inset:0;z-index:2147483646;display:flex;justify-content:flex-end;pointer-events:none;">
    <!-- Overlay -->
    <div
      style="position:fixed;inset:0;background:rgba(0,0,0,0.7);pointer-events:auto;"
      @click="handleClose"
    />
    
    <!-- Modal Panel -->
    <div
      ref="popupPanel"
      role="dialog"
      aria-modal="true"
      tabindex="0"
      style="position:relative;width:100%;max-width:390px;height:100%;background:#0f172a;color:white;box-shadow:0 0 20px rgba(0,0,0,0.5);pointer-events:auto;display:flex;flex-direction:column;"
      @click.stop
    >
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #334155;">
        <button
          v-if="chatStore.activeThreadId"
          @click="backToList"
          style="padding:8px;background:#334155;border:none;border-radius:50%;cursor:pointer;color:white;margin-right:8px;"
        >
          ←
        </button>
        <span style="font-weight:bold;font-size:18px;flex:1;">
          {{ chatStore.activeThreadId ? 'Conversation' : 'Chats' }}
        </span>
        <button @click="handleClose" style="padding:8px;background:#334155;border:none;border-radius:50%;cursor:pointer;color:white;">
          ✕
        </button>
      </div>

      <!-- Body: Show Thread List or Thread Panel -->
      <div style="flex:1;overflow:hidden;background:#1e293b;">
        <ChatThreadList v-if="!chatStore.activeThreadId" />
        <ChatThreadPanel v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import ChatThreadList from './ChatThreadList.vue';
import ChatThreadPanel from './ChatThreadPanel.vue';

const emit = defineEmits<{ (e: 'close'): void }>();

const chatStore = useChatStore();
const popupPanel = ref<HTMLElement | null>(null);

function handleClose() {
  console.log('[ChatPopup] 🚪 Close button clicked');
  chatStore.activeThreadId = null; // Reset to list view
  emit('close');
}

function backToList() {
  console.log('[ChatPopup] ⬅️ Back to thread list');
  chatStore.activeThreadId = null;
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    console.log('[ChatPopup] ⌨️ Escape key pressed');
    handleClose();
  }
}

console.log('[ChatPopup] 🔧 Setup script running');

onMounted(() => {
  console.log('[ChatPopup] ✅ Component MOUNTED');
  console.log('[ChatPopup] activeThreadId:', chatStore.activeThreadId);
  console.log('[ChatPopup] threads count:', chatStore.threads.length);
  window.addEventListener('keydown', onKeyDown);
  popupPanel.value?.focus();
});

onUnmounted(() => {
  console.log('[ChatPopup] 🗑️ Component UNMOUNTED');
  window.removeEventListener('keydown', onKeyDown);
});
</script>