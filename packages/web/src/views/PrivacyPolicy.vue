<template>
  <div class="page-container prose max-w-none p-6 mx-auto pointer-events-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
      <button
        @click="goBack"
        aria-label="Go back to settings"
        class="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
        type="button"
      >
        Back
      </button>
    </div>

    <section class="text-slate-700 dark:text-slate-200 leading-relaxed">
      <p class="mb-4">
        Your privacy is important to us. This policy describes how we collect, use,
        and protect your personal information when you use Carer Connect.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Information we collect</h2>
      <p class="mb-4">
        We may collect information you provide directly (account info, profile, messages)
        and data collected automatically (device information, usage analytics). We only collect
        what's necessary to operate and improve the service.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">How we use information</h2>
      <ul class="list-disc ml-5 mb-4">
        <li class="text-slate-700 dark:text-slate-200">To provide core services (account, preferences, messaging)</li>
        <li class="text-slate-700 dark:text-slate-200">To personalize and improve the app</li>
        <li class="text-slate-700 dark:text-slate-200">To communicate important updates and support</li>
      </ul>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Sharing and security</h2>
      <p class="mb-4">
        We do not sell your personal data. We may share data with third-party service
        providers who support functionality (hosting, analytics, messaging). We take
        reasonable technical and organizational measures to protect your data.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Your choices</h2>
      <p class="mb-4">
        You can update your account information and notification preferences in Settings.
        If you want your account removed, contact support and we will help delete your data
        in accordance with our retention policy.
      </p>

      <p class="text-sm text-slate-500 dark:text-slate-400 mt-6">Last updated: 2025-11-16</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.push('/settings').then(() => {
    if (router.currentRoute.value.path !== '/settings') {
      window.location.href = '/settings'
    }
  }).catch(() => {
    window.location.href = '/settings'
  })
}

onMounted(() => {
  document.title = 'Privacy Policy — Carer Connect'
})
</script>

<style scoped>
.page-container {
  max-width: 820px;
}
</style>