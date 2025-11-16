<template>
  <div v-if="!shouldHide">
    <div>
      <ChatIcon :unread="chatStore.unreadCount" @click="open" />
    </div>

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
  // FIX: Explicitly check for the /settings route OR any route passed via props.
  const hiddenPaths = props.hideOnRoutes || [];
  
  if (route.path === '/settings') {
    return true;
  }
  
  return hiddenPaths.includes(route.path) ?? false;
});

// Open popup and fetch threads
async function open() {
  showPopup.value = true;
  try {
    await chatStore.fetchThreads();
  } catch (e) {
    // Handle error if needed
  }
}

// Close popup
function close() {
  showPopup.value = false;
}
</script>