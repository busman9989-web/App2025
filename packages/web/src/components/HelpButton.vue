<template>
  <div class="relative">
    <!-- Help Button -->
    <button
      @click="toggleChat"
      :class="[
        'rounded-full shadow-lg transition-all duration-300 flex items-center justify-center',
        'bg-gradient-to-br from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700',
        'text-white hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800',
        isOpen ? 'rotate-45' : '',
        !chatwootReady ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      :disabled="!chatwootReady"
      style="width: 56px; height: 56px;"
      aria-label="Get Help"
    >
      <svg
        v-if="!isOpen"
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <svg
        v-else
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Notification Badge -->
    <div
      v-if="unreadCount > 0"
      class="absolute -top-1 -right-1 bg-red-600 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse"
      style="width: 20px; height: 20px;"
    >
      {{ unreadCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isOpen = ref(false)
const unreadCount = ref(0)
const chatwootReady = ref(false)
const checkInterval = ref<number | null>(null)
const maxRetries = 20 // Try for ~10 seconds
let retryCount = 0

const toggleChat = () => {
  if (!chatwootReady.value || !window.$chatwoot) {
    console.warn('Chatwoot is not ready yet')
    return
  }
  
  try {
    if (isOpen.value) {
      window.$chatwoot.toggle('close')
    } else {
      window.$chatwoot.toggle('open')
    }
    isOpen.value = !isOpen.value
  } catch (error) {
    console.error('Error toggling Chatwoot:', error)
  }
}

// Set user info when Chatwoot becomes available
const setChatwootUser = () => {
  if (authStore.user && window.$chatwoot?.setUser) {
    try {
      window.$chatwoot.setUser(authStore.user.id, {
        email: authStore.user.email,
        name: authStore.user.displayName || 'User',
        avatar_url: authStore.user.profilePictureUrl || undefined
      })
      console.log('✅ Chatwoot user set successfully')
    } catch (error) {
      console.error('Error setting Chatwoot user:', error)
    }
  }
}

// Poll for Chatwoot availability (critical for WebView/Android apps)
const waitForChatwoot = () => {
  checkInterval.value = window.setInterval(() => {
    retryCount++
    
    if (window.$chatwoot) {
      chatwootReady.value = true
      console.log('✅ Chatwoot detected and ready!')
      
      // Set user immediately when Chatwoot is ready
      setChatwootUser()
      
      // Clear interval
      if (checkInterval.value) {
        clearInterval(checkInterval.value)
        checkInterval.value = null
      }
    } else if (retryCount >= maxRetries) {
      console.error('❌ Chatwoot failed to load after maximum retries')
      if (checkInterval.value) {
        clearInterval(checkInterval.value)
        checkInterval.value = null
      }
    } else {
      console.log(`⏳ Waiting for Chatwoot... (${retryCount}/${maxRetries})`)
    }
  }, 500) // Check every 500ms
}

const setupChatwootListeners = () => {
  // Listen for Chatwoot ready event
  window.addEventListener('chatwoot:ready', () => {
    chatwootReady.value = true
    console.log('✅ Chatwoot ready event fired!')
    setChatwootUser()
  })

  // Listen for new messages
  window.addEventListener('chatwoot:on-message', () => {
    if (!isOpen.value) {
      unreadCount.value++
    }
  })

  // Listen for widget open
  window.addEventListener('chatwoot:on-open', () => {
    isOpen.value = true
    unreadCount.value = 0
  })

  // Listen for widget close
  window.addEventListener('chatwoot:on-close', () => {
    isOpen.value = false
  })
}

// Watch for auth changes
watch(
  () => authStore.user,
  (user) => {
    if (user && chatwootReady.value) {
      setChatwootUser()
    }
  }
)

onMounted(() => {
  console.log('🚀 HelpButton mounted')
  
  // Update the Chatwoot global settings
  window.chatwootSettings = {
    darkMode: "auto"
  }

  // Setup event listeners
  setupChatwootListeners()
  
  // Start polling for Chatwoot (critical for WebView/apps)
  waitForChatwoot()

  // Hide default Chatwoot bubble
  const style = document.createElement('style')
  style.innerHTML = `
    .woot-widget-bubble,
    .woot--bubble-holder {
      display: none !important;
    }
  `
  document.head.appendChild(style)
})

onUnmounted(() => {
  // Cleanup interval
  if (checkInterval.value) {
    clearInterval(checkInterval.value)
    checkInterval.value = null
  }
  console.log('🧹 HelpButton unmounted')
})
</script>

<style scoped>
button {
  transition: transform 0.3s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>