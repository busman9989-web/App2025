<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md space-y-5">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-white">Change Password</h2>

      <div class="space-y-3">
        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300">
          Current Password
        </label>
        <input
          v-model="currentPassword"
          type="password"
          placeholder="Enter your current password"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-600
                 bg-transparent px-3 py-2 text-slate-800 dark:text-white
                 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none"
        />

        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mt-3">
          New Password
        </label>
        <input
          v-model="newPassword"
          type="password"
          placeholder="Enter new password"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-600
                 bg-transparent px-3 py-2 text-slate-800 dark:text-white
                 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none"
        />

        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mt-3">
          Confirm New Password
        </label>
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          class="w-full rounded-lg border border-slate-300 dark:border-slate-600
                 bg-transparent px-3 py-2 text-slate-800 dark:text-white
                 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none"
        />

        <div v-if="error" class="text-red-600 text-sm mt-2">
          {{ error }}
        </div>
        <div v-if="success" class="text-green-600 text-sm mt-2">
          {{ success }}
        </div>
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
              d="M12 11c1.104 0 2-.896 2-2V7a2 2 0 1 0-4 0v2c0 1.104.896 2 2 2zM6 11h12v10H6z"
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

const emit = defineEmits(['close'])

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleSubmit() {
  error.value = ''
  success.value = ''

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    error.value = 'All fields are required.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (newPassword.value.length < 8) {
    error.value = 'New password must be at least 8 characters.'
    return
  }
  if (newPassword.value === currentPassword.value) {
    error.value = 'New password must be different from current password.'
    return
  }

  loading.value = true
  try {
    console.log('Submitting:', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    const { data } = await api.post('/api/settings/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    success.value = data?.message || 'Password updated successfully'
    setTimeout(() => emit('close'), 1200)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error updating password'
  } finally {
    loading.value = false
  }
}
</script>