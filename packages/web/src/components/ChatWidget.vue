<template>
  <div v-if="!shouldHide">
    <!-- Chat Icon (fixed bottom-right) -->
    <div style="position:fixed;bottom:20px;right:20px;z-index:9999;">
      <ChatIcon :unread="chatStore.unreadCount" @click="open" />
    </div>

    <!-- ChatPopup Panel -->
    <teleport to="body">
      <ChatPopup v-if="showPopup" @close="close" />
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import ChatIcon from './ChatIcon.vue';
import ChatPopup from './ChatPopup.vue';

const props = defineProps<{
  hideOnRoutes?: string[];
}>();

const route = useRoute();
const chatStore = useChatStore();
const showPopup = ref(false);

// Check if we should hide on current route
const shouldHide = computed(() => {
  return props.hideOnRoutes?.includes(route.path) ?? false;
});

console.log('[ChatWidget] Component setup running');

// Open popup and fetch threads
async function open() {
  console.log('[ChatWidget] 🖱️ Opening chat popup');
  showPopup.value = true;
  
  console.log('[ChatWidget] 📡 Fetching threads...');
  try {
    await chatStore.fetchThreads();
    console.log('[ChatWidget] ✅ Threads fetched:', chatStore.threads.length, 'threads');
  } catch (e) {
    console.error('[ChatWidget] ❌ fetchThreads failed:', e);
  }
}

// Close popup
function close() {
  console.log('[ChatWidget] 🚪 Closing popup');
  showPopup.value = false;
}
</script>