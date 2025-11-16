<template>
  <div class="page-container prose max-w-none p-6 mx-auto pointer-events-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">About Us</h1>
      <button
        @click="goBack"
        aria-label="Go back to settings"
        class="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
        type="button"
      >
        Back
      </button>
    </div>

    <section class="text-slate-700 dark:text-slate-200">
      <p class="mb-4 leading-relaxed">
        Welcome to Carer Connect. We provide carers with tools, resources and a community
        to help make day-to-day life easier. Below is a short overview — replace this
        content with your full organisational copy when ready.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Our mission</h2>
      <p class="mb-4 leading-relaxed">
        Our mission is to empower carers with practical resources, emotional support and
        a trusted network so they can spend more time caring and less time worrying.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">What we provide</h2>
      <ul class="list-disc ml-5 mb-4 text-slate-700 dark:text-slate-200">
        <li>Personalised planners and checklists</li>
        <li>Community forums and moderated discussions</li>
        <li>Curated support resources and local services</li>
        <li>In-app help and live chat</li>
      </ul>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Contact</h2>
      <p class="mb-2 leading-relaxed">
        If you have questions about Carer Connect or would like to partner with us,
        please reach out via the Settings → Help widget or email
        <a href="mailto:support@example.com" class="text-cyan-600 dark:text-cyan-400 hover:underline">support@example.com</a>.
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
  // Robust navigation: try router push first, fallback to hard navigation to ensure view updates
  router.push('/settings').then(() => {
    if (router.currentRoute.value.path !== '/settings') {
      // Fallback to full load if the single-page navigation didn't render (edge cases)
      window.location.href = '/settings'
    }
  }).catch(() => {
    window.location.href = '/settings'
  })
}

onMounted(() => {
  document.title = 'About Us — Carer Connect'
})
</script>

<style scoped>
.page-container {
  max-width: 820px;
}
</style>