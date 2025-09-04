<template>
  <div class="p-4 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Resource Hub</h1>
      <p class="mt-1 text-slate-600">Curated guides, articles, and links to support you on your journey.</p>
    </div>

    <div v-if="loading" class="text-center text-slate-500">
      Loading resources...
    </div>

    <div v-else-if="error" class="text-center text-red-500">
      Sorry, we couldn't load the resources at this time.
    </div>

    <div v-else class="space-y-4">
      <div v-for="resource in resources" :key="resource.id" class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
        <span class="text-xs font-semibold text-teal-800 bg-teal-100 px-2 py-1 rounded-full">{{ resource.category }}</span>
        <h2 class="mt-2 text-lg font-bold text-slate-800">{{ resource.title }}</h2>
        <p class="mt-2 text-slate-600 text-sm leading-relaxed">{{ resource.content }}</p>
        <a v-if="resource.external_url" :href="resource.external_url" target="_blank" rel="noopener noreferrer" class="inline-block mt-3 text-sm font-semibold text-teal-600 hover:text-teal-700">
          Read More →
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';

interface Resource {
  id: string;
  title: string;
  content: string;
  category: string;
  external_url: string;
}

const resources = ref<Resource[]>([]);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  try {
    const response = await api.get('/api/resources');
    resources.value = response.data;
  } catch (err) {
    console.error("Failed to fetch resources:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>