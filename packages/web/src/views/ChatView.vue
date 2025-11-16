<template>
  <button
    :class="[
      'fixed',
      'right-4',
      'z-50',
      'flex',
      'items-center',
      'justify-center',
      'w-14',
      'h-14',
      'bg-cyan-500',
      'hover:bg-cyan-600',
      'text-white',
      'rounded-full',
      'shadow-lg',
      'transition-all',
    ]"
    :style="{ bottom: 'calc(96px + env(safe-area-inset-bottom))' }"
    @click="$emit('click')"
    :aria-label="ariaLabel"
    role="button"
  >
    <img
      :src="avatarSrc"
      :alt="ariaLabel"
      class="w-10 h-10 object-contain select-none"
      draggable="false"
    />

    <span
      v-if="unread > 0"
      class="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center w-5 h-5"
    >
      {{ unread }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    unread?: number
    ariaLabel?: string
  }>(),
  {
    unread: 0,
    ariaLabel: 'Open Chat',
  }
)

const avatarSrc = '/dist/default-avatar.svg'
const ariaLabel = computed(() => props.ariaLabel)
</script>
