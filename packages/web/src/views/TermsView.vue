<template>
  <div class="page-container prose max-w-none p-6 mx-auto pointer-events-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Terms and Conditions</h1>
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
        These Terms and Conditions govern your use of Carer Connect. By using the service,
        you agree to these terms.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Use of the service</h2>
      <p class="mb-4">
        You must be authorized to use any account you access. Use the service responsibly
        and do not post abusive or illegal content in community areas.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Intellectual property</h2>
      <p class="mb-4">
        All content provided by the service is the property of Carer Connect or its licensors.
        You may not redistribute or reproduce protected content without permission.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Liability</h2>
      <p class="mb-4">
        To the maximum extent permitted by law, Carer Connect is not liable for indirect,
        incidental, or consequential damages arising from your use of the service.
      </p>

      <h2 class="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-slate-100">Governing law</h2>
      <p class="mb-4">
        These terms are governed by the laws applicable where Carer Connect is incorporated.
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
  document.title = 'Terms & Conditions — Carer Connect'
})
</script>

<style scoped>
.page-container {
  max-width: 820px;
}
</style>