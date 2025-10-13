<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md space-y-5">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-white">Change Email</h2>

      <div class="space-y-3">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300">
          New Email
        </label>
        <input
          v-model="newEmail"
          type="email"
          placeholder="Enter your new email"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-600
                 bg-transparent px-3 py-2 text-slate-800 dark:text-white
                 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none"
        />

        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mt-3">
          Confirm Password
        </label>
        <input
          v-model="password"
          type="password"
          placeholder="Enter your password"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-600
                 bg-transparent px-3 py-2 text-slate-800 dark:text-white
                 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none"
        />
      </div>

      <div class="flex justify-end gap-3 mt-4">
        <button
          @click="$emit('close')"
          class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                 text-slate-600 dark:text-slate-300 hover:bg-slate-100
                 dark:hover:bg-slate-700 transition"
        >
          Cancel
        </button>

        <button
          @click="handleSubmit"
          :disabled="loading"
          class="group relative inline-flex items-center justify-center gap-2 rounded-xl
                 border border-slate-300/70 dark:border-slate-600/70 bg-transparent
                 px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
                 hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-cyan-400
                 disabled:opacity-50 disabled:cursor-not-allowed transition"
          type="button"
        >
          <svg
            class="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M16 12H8m8 0a4 4 0 0 0-8 0m8 0a4 4 0 0 1-8 0"
            />
          </svg>
          <span class="font-medium">{{ loading ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

// ✅ fix: define emits for modal close
const emit = defineEmits(['close'])

const auth = useAuthStore()
const newEmail = ref(auth.user?.email || '')
const password = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!newEmail.value || !password.value) return

  loading.value = true
  try {
    await api.post('/api/settings/change-email', {
      newEmail: newEmail.value,
      password: password.value,
    })
    auth.user.email = newEmail.value
    alert('Email updated successfully')
    emit('close')
  } catch {
    alert('Error updating email')
  } finally {
    loading.value = false
  }
}
</script>
