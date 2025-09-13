<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <button @click="router.back()" class="flex items-center text-slate-600 hover:text-teal-600 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Resources
    </button>

    <div v-if="isLoading" class="text-center text-slate-500 py-8">Loading resource...</div>
    <div v-else-if="error" class="text-center text-red-500 py-8">
      <p>Could not load resource details.</p>
      <button @click="fetchResource" class="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md">Retry</button>
    </div>
    <div v-else-if="resource">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-4 mb-6">
        <span
          :class="[
            'px-3 py-1 text-sm font-medium rounded-full',
            categoryClass(resource.category),
            'inline-block mb-3'
          ]"
        >
          {{ resource.category }}
        </span>
        <h1 class="text-3xl font-bold text-slate-800">{{ resource.title }}</h1>
        <p class="text-slate-700 leading-relaxed">{{ resource.content }}</p>

        <a v-if="resource.external_url" :href="resource.external_url" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center text-teal-600 hover:underline font-semibold mt-4"
        >
          Go to Resource
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <div class="mt-5 pt-4 border-t border-slate-100 flex items-center space-x-3 text-slate-600">
          <div v-if="resource.average_rating > 0" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
            <span class="font-semibold">{{ resource.average_rating.toFixed(1) }}</span>
            <span class="ml-1 text-sm">({{ resource.reviews_count }} reviews)</span>
          </div>
          <div v-else class="text-sm">No reviews yet.</div>
        </div>
      </div>

      <ReviewForm :resource-id="resource.id" @review-posted="fetchResource" class="mb-6" />

      <div class="space-y-4">
        <h2 class="text-xl font-bold text-slate-800">Reviews ({{ resource.reviews?.length || 0 }})</h2>
        <div v-if="resource.reviews && resource.reviews.length > 0">
          <ReviewCard
            v-for="review in resource.reviews"
            :key="review.id"
            :review="review"
          />
        </div>
        <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 text-center text-slate-500">
          No reviews for this resource yet. Be the first to review!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import ReviewCard from '@/components/ReviewCard.vue';
import ReviewForm from '@/components/ReviewForm.vue';

const route = useRoute();
const router = useRouter();
const resourceId = route.params.id as string;

interface Review {
  id: string;
  resource_id: string;
  user_id: string;
  rating: number;
  content?: string;
  created_at: string;
  display_name: string;
}

interface ResourceDetail {
  id: string;
  title: string;
  content?: string;
  category: string;
  external_url?: string;
  average_rating: number;
  reviews_count: number;
  created_at: string;
  reviews?: Review[];
}

const resource = ref<ResourceDetail | null>(null);
const isLoading = ref(true);
const error = ref(false);

const fetchResource = async () => {
  isLoading.value = true;
  error.value = false;
  try {
    const response = await api.get(`/api/resources/${resourceId}`);
    resource.value = response.data;
  } catch (err) {
    console.error('Error fetching resource details:', err);
    error.value = true;
  } finally {
    isLoading.value = false;
  }
};

const categoryClass = (category: string) => {
  switch (category) {
    case 'Mental Health': return 'bg-blue-100 text-blue-800';
    case 'Physical Health': return 'bg-green-100 text-green-800';
    case 'Financial Aid': return 'bg-yellow-100 text-yellow-800';
    case 'Legal Advice': return 'bg-purple-100 text-purple-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

onMounted(fetchResource);
</script>

<style scoped>
/* Add specific styles for ResourceDetailView if needed */
</style>