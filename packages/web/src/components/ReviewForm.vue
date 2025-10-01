<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
    <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-4 transition-colors">Leave a Review</h3>
    
    <div v-if="authStore.isAuthenticated">
      <form @submit.prevent="submitReview" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 transition-colors">
            Rating (1-5 stars)
          </label>
          <div class="flex items-center space-x-1">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              @click="rating = star"
              :class="[
                'text-2xl transition-colors',
                star <= rating 
                  ? 'text-yellow-400 dark:text-yellow-300 hover:text-yellow-500 dark:hover:text-yellow-200' 
                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500'
              ]"
            >
              ★
            </button>
          </div>
        </div>

        <div>
          <label for="review-content" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 transition-colors">
            Your Review (Optional)
          </label>
          <textarea
            id="review-content"
            v-model="reviewContent"
            rows="4"
            placeholder="Share your thoughts about this resource..."
            class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                   focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 
                   text-slate-700 dark:text-slate-200 leading-relaxed resize-none bg-white dark:bg-slate-700 transition-colors"
            style="line-height: 1.6;"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="!rating || isSubmitting"
          class="w-full bg-teal-500 text-white font-semibold py-2 px-4 rounded-lg 
                 hover:bg-teal-600 focus:outline-none focus:ring-2 
                 focus:ring-teal-500 focus:ring-offset-2 
                 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-500 
                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Review' }}
        </button>
      </form>

      <p v-if="error" class="text-red-500 dark:text-red-400 text-sm mt-2 transition-colors">{{ error }}</p>
    </div>

    <div v-else class="text-center py-6 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
      <div class="mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </div>
      <p class="mb-2">Share your experience with this resource!</p>
      <p>
        Please 
        <router-link to="/login" class="text-teal-600 hover:text-teal-700 font-medium hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
          log in
        </router-link> 
        to leave a review.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  resourceId: string;
}>();

const emit = defineEmits(['review-posted']);

const authStore = useAuthStore();
const rating = ref(0);
const reviewContent = ref('');
const isSubmitting = ref(false);
const error = ref('');

const submitReview = async () => {
  if (!rating.value || isSubmitting.value) return;
  
  error.value = '';
  isSubmitting.value = true;
  
  try {
    console.log('Submitting review for resource:', props.resourceId);
    const response = await api.post(`/api/resources/${props.resourceId}/reviews`, {
      rating: rating.value,
      content: reviewContent.value.trim() || undefined
    });
    
    console.log('Review submitted successfully:', response.data);
    
    // Reset form
    rating.value = 0;
    reviewContent.value = '';
    
    // Notify parent to refresh
    emit('review-posted');
    
  } catch (err: any) {
    console.error('Error submitting review:', err);
    
    if (err.response?.status === 401) {
      error.value = 'Please log in to submit a review.';
    } else if (err.response?.status === 409) {
      error.value = 'You have already reviewed this resource.';
    } else if (err.response?.status === 400) {
      error.value = err.response.data?.message || 'Invalid review data.';
    } else if (err.response?.status >= 500) {
      error.value = 'Server error. Please try again later.';
    } else {
      error.value = err.response?.data?.message || 'Failed to submit review. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>