<template>
  <div class="space-y-6 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen p-6 transition-colors">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Learning & Support Resources</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">Explore articles, guides, and tools to assist you.</p>
    </div>

    <div v-if="isLoading" class="text-center text-slate-500 dark:text-slate-400 py-8 transition-colors">Loading resources...</div>
    <div v-else-if="error" class="text-center text-red-500 dark:text-red-400 py-8 transition-colors">
      <p>Could not load resources.</p>
      <button @click="fetchResources" class="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors">
        Retry
      </button>
    </div>
    <div v-else-if="!resources || resources.length === 0" class="text-center text-slate-500 dark:text-slate-400 py-8 transition-colors">
      <p>No resources available at the moment.</p>
      <button @click="fetchResources" class="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors">
        Refresh
      </button>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        v-for="resource in resources"
        :key="resource.id"
        :to="{ name: 'ResourceDetail', params: { id: resource.id } }"
        class="block"
      >
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 space-y-3 
                    hover:border-teal-300 dark:hover:border-indigo-400 hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between">
          <div>
            <span
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                categoryClass(resource.category),
                'mb-2 inline-block'
              ]"
            >
              {{ resource.category || 'General' }}
            </span>
            <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-2 transition-colors">{{ resource.title || 'Untitled Resource' }}</h2>
            <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 transition-colors">{{ resource.content || 'No description available.' }}</p>
          </div>
          <div class="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 transition-colors">
            <div class="flex items-center space-x-1">
              <template v-if="resource.average_rating > 0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
                <span>{{ resource.average_rating.toFixed(1) }} ({{ resource.reviews_count || 0 }} reviews)</span>
              </template>
              <template v-else>
                <span>No reviews yet</span>
              </template>
            </div>
            <a v-if="resource.external_url" 
               :href="resource.external_url" 
               target="_blank" 
               rel="noopener noreferrer"
               class="flex items-center text-teal-600 hover:underline dark:text-indigo-400"
               @click.stop
            >
              Read More
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <span v-else class="text-slate-400 dark:text-slate-500 text-xs">View Details</span>
          </div>
        </div>
      </router-link>
    </div>

    <div v-if="showDebug" class="mt-8 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 transition-colors">
      <h3 class="font-semibold mb-2">Debug Information:</h3>
      <p><strong>Resources loaded:</strong> {{ resources?.length || 0 }}</p>
      <p><strong>Loading state:</strong> {{ isLoading }}</p>
      <p><strong>Error state:</strong> {{ error }}</p>
      <button @click="showDebug = false" class="mt-2 px-3 py-1 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-sm">Hide Debug</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';

interface Resource {
  id: string;
  title: string;
  content?: string;
  category: string;
  external_url?: string;
  average_rating: number;
  reviews_count: number;
}

const resources = ref<Resource[]>([]);
const isLoading = ref(true);
const error = ref(false);
const showDebug = ref(false);

const fetchResources = async () => {
  isLoading.value = true;
  error.value = false;
  try {
    console.log('Fetching resources...');
    const response = await api.get('/api/resources');
    console.log('Resources response:', response.data);
    resources.value = response.data;
    
    // Show debug info if no resources are returned
    if (!response.data || response.data.length === 0) {
      showDebug.value = true;
    }
  } catch (err) {
    console.error('Error fetching resources:', err);
    error.value = true;
    showDebug.value = true;
  } finally {
    isLoading.value = false;
  }
};

const categoryClass = (category: string) => {
  // Original classes used specific colors which are fine for both modes
  // unless you want to specifically adjust them for dark mode.
  // For now, keeping them as is, but if you want to darken them,
  // you'd add dark:bg-X-700 dark:text-X-100 variants.
  switch (category) {
    case 'Mental Health': return 'bg-blue-100 text-blue-800';
    case 'Physical Health': return 'bg-green-100 text-green-800';
    case 'Financial Aid': return 'bg-yellow-100 text-yellow-800';
    case 'Legal Advice': return 'bg-purple-100 text-purple-800';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'; // Added dark mode for default
  }
};

onMounted(fetchResources);
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>