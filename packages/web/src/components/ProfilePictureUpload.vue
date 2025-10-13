<template>
  <div class="flex flex-col items-center space-y-3">
    <!-- Avatar Block -->
    <div class="w-24 h-24 rounded-full flex items-center justify-center border border-slate-300 bg-cyan-600/80 overflow-hidden relative">
      <img
        v-if="displaySrc"
        :src="displaySrc"
        alt="Profile"
        class="w-full h-full object-cover rounded-full"
      />
      <svg
        v-else
        class="w-12 h-12 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M12 14a4 4 0 100-8 4 4 0 000 8zm0 2c-3 0-6 1.5-6 3v1h12v-1c0-1.5-3-3-6-3z" fill="currentColor"/>
      </svg>
    </div>
    <!-- Custom file input -->
    <label
      class="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg shadow cursor-pointer transition block relative overflow-hidden"
    >
      Choose Image
      <input
        type="file"
        accept="image/*"
        class="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
        @change="onFileChange"
        tabindex="-1"
      />
    </label>
    <button
      @click="upload"
      :disabled="!file"
      class="bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600 transition disabled:opacity-60"
    >
      Upload
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { uploadAvatar } from '@/api';

const props = defineProps<{ initialUrl?: string | null }>();
const emit = defineEmits<{ (e: "updated", url: string): void }>();

const auth = useAuthStore();
const file = ref<File | null>(null);
const preview = ref<string>('');

// Always provide string | undefined to img :src AND prefix backend if needed
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const displaySrc = computed(() => {
  if (preview.value) return preview.value;
  if (props.initialUrl) {
    if (props.initialUrl.startsWith('http')) return props.initialUrl;
    return backendUrl.replace(/\/$/, '') + props.initialUrl;
  }
  return undefined;
});

watch(() => props.initialUrl, (newUrl) => {
  if (!file.value) preview.value = newUrl || '';
});

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;
  file.value = target.files[0];
  preview.value = URL.createObjectURL(file.value);
}

async function upload() {
  if (!file.value) return;
  const formData = new FormData();
  formData.append('avatar', file.value);
  // Make sure this posts to /avatar (not /api/avatar)
  const { data } = await uploadAvatar(formData);
  if (auth.user) {
    (auth.user as any).profilePictureUrl = data.profilePictureUrl;
  }
  emit('updated', data.profilePictureUrl);
  // Reset file & preview after upload (optional)
  file.value = null;
  preview.value = data.profilePictureUrl;
}
</script>