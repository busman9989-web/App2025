<template>
  <div class="p-4 space-y-6 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div class="flex items-center gap-2">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Account Settings</h1>
    </div>
    <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">
      Manage your account, notifications, and preferences.
    </p>

    <!-- Account Email Section -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 flex items-center gap-6 transition-colors"
    >
      <div>
        <h2 class="text-xl font-bold text-slate-800 dark:text-white transition-colors mb-1">
          Email Address
        </h2>
        <p class="text-slate-700 dark:text-slate-300 text-base">{{ email }}</p>
        <span
          class="inline-block mt-2 px-2 py-1"
          :class="[
            isVerified
              ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
            'text-xs rounded'
          ]"
        >
          {{ isVerified ? 'Verified' : 'Unverified' }}
        </span>
      </div>

      <!-- Updated Buttons -->
      <div class="flex flex-wrap gap-3 md:ml-auto">
        <!-- Change Email Button -->
        <button
          @click="showChangeEmailModal = true"
          class="group relative inline-flex items-center justify-center gap-2 rounded-xl
                 border border-slate-300/70 dark:border-slate-600/70 bg-transparent
                 px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
                 hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-cyan-400
                 transition"
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
              d="M16 12H8m8-4H8m-2 8h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"
            />
          </svg>
          <span class="font-medium">Change Email</span>
        </button>

        <!-- Change Password Button -->
        <button
          @click="showChangePasswordModal = true"
          class="group relative inline-flex items-center justify-center gap-2 rounded-xl
                 border border-slate-300/70 dark:border-slate-600/70 bg-transparent
                 px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
                 hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-cyan-400
                 transition"
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
          <span class="font-medium">Change Password</span>
        </button>
      </div>
    </div>

    <!-- Notifications Section -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors"
    >
      <h2 class="text-lg font-semibold text-slate-800 dark:text-white transition-colors mb-4">
        Notifications
      </h2>

      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium text-slate-700 dark:text-slate-300">Email Notifications</span>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Get important updates and newsletters via email.
            </p>
          </div>
          <button
            @click="toggleEmailNotifications"
            :aria-pressed="emailNotifications"
            :disabled="isSavingNotifications"
            class="relative inline-flex h-7 w-14 border-2 border-transparent rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50"
            :class="emailNotifications ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="inline-block h-6 w-6 rounded-full bg-white dark:bg-slate-200 shadow transform transition duration-200"
              :class="emailNotifications ? 'translate-x-7' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium text-slate-700 dark:text-slate-300">App Notifications</span>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Get instant notifications inside the app.
            </p>
          </div>
          <button
            @click="toggleAppNotifications"
            :aria-pressed="appNotifications"
            :disabled="isSavingNotifications"
            class="relative inline-flex h-7 w-14 border-2 border-transparent rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50"
            :class="appNotifications ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'"
          >
            <span
              class="inline-block h-6 w-6 rounded-full bg-white dark:bg-slate-200 shadow transform transition duration-200"
              :class="appNotifications ? 'translate-x-7' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <div
          v-if="notificationSuccess"
          class="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg"
        >
          <p class="text-sm text-green-700 dark:text-green-300">✓ Notification settings saved</p>
        </div>
      </div>
    </div>

    <!-- Legal & Info Links -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors"
    >
      <ul class="space-y-2">
        <li><a href="#" class="text-cyan-600 dark:text-cyan-400 hover:underline">About Us</a></li>
        <li><a href="#" class="text-cyan-600 dark:text-cyan-400 hover:underline">Terms and Conditions</a></li>
        <li><a href="#" class="text-cyan-600 dark:text-cyan-400 hover:underline">Privacy Policy</a></li>
      </ul>
    </div>

    <!-- Logout Button -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors"
    >
      <button
        @click="handleLogout"
        class="group relative w-full inline-flex items-center justify-center gap-2 rounded-xl
               border border-slate-300/70 dark:border-slate-600/70 bg-transparent
               px-4 py-3 text-red-600 dark:text-red-400 font-semibold hover:border-red-400
               hover:text-red-700 dark:hover:text-red-300 focus:outline-none
               focus-visible:ring-2 focus-visible:ring-red-400 transition"
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
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
          />
        </svg>
        <span class="font-medium">Logout</span>
      </button>
    </div>

    <!-- MODALS -->
    <ChangeEmailModal v-if="showChangeEmailModal" @close="showChangeEmailModal = false" />
    <ChangePasswordModal v-if="showChangePasswordModal" @close="showChangePasswordModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

// ✅ Import modals
import ChangeEmailModal from '@/components/ChangeEmailModal.vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'

const auth = useAuthStore()
const email = ref(auth.user?.email || 'user@example.com')
const isVerified = ref(!!auth.user?.isVerified)

const emailNotifications = ref(true)
const appNotifications = ref(true)
const isSavingNotifications = ref(false)
const notificationSuccess = ref(false)

const showChangeEmailModal = ref(false)
const showChangePasswordModal = ref(false)

async function fetchNotificationSettings() {
  try {
    const { data } = await api.get('/api/settings/notifications')
    emailNotifications.value = !!data.emailNotifications
    appNotifications.value = !!data.appNotifications
  } catch {
    emailNotifications.value = true
    appNotifications.value = true
  }
}

async function saveNotificationSettings() {
  isSavingNotifications.value = true
  try {
    await api.put('/api/settings/notifications', {
      emailNotifications: emailNotifications.value,
      appNotifications: appNotifications.value,
    })
    notificationSuccess.value = true
    setTimeout(() => (notificationSuccess.value = false), 2000)
  } finally {
    isSavingNotifications.value = false
  }
}

function toggleEmailNotifications() {
  emailNotifications.value = !emailNotifications.value
  saveNotificationSettings()
}

function toggleAppNotifications() {
  appNotifications.value = !appNotifications.value
  saveNotificationSettings()
}

function handleLogout() {
  auth.logout()
}

onMounted(fetchNotificationSettings)
</script>

<style scoped>
button[aria-pressed] {
  min-width: 56px;
}
button[aria-pressed] > span {
  box-shadow: 0 2px 6px 0 rgba(16, 185, 129, 0.15);
}
</style>
