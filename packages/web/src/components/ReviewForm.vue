<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
    <h3 class="text-lg font-bold text-slate-800 mb-4">Your Review</h3>
    <div v-if="authStore.token">
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-2">Your Rating:</label>
        <div class="flex items-center space-x-1">
          <svg v-for="n in 5" :key="n"
               @click="setRating(n)"
               :class="['h-7 w-7 cursor-pointer transition-colors', n <= currentRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300']"
               fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>

      <textarea
        v-model="reviewContent"
        placeholder="Share your thoughts about this resource (optional)..."
        rows="4"
        class="w-full p-3 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-colors resize-y"
      ></textarea>
      <div class="mt-4 flex justify-end">
        <button
          @click="submitReview"
          :disabled="currentRating === 0 || isSubmitting"
          class="px-5 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Review' }}
        </button>
      </div>
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
    </div>
    <div v-else class="text-center py-4 bg-slate-50 rounded-lg text-slate-600">
      <p>Please <router-link to="/login" class="text-teal-600 hover:underline">log in</router-link> to leave a review.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  resourceId: string;
}>();

const emit = defineEmits(['review-posted']);

const authStore = useAuthStore();
const currentRating = ref(0);
const reviewContent = ref('');
const isSubmitting = ref(false);
const error = ref('');

const setRating = (rating: number) => {
  currentRating.value = rating;
};

const fetchUserReview = async () => {
    if (!authStore.token) return;
    try {
        const response = await api.get(`/api/resources/${props.resourceId}`);
        const userReview = response.data.reviews?.find((review: any) => review.user_id === authStore.user?.id);
        if (userReview) {
            currentRating.value = userReview.rating;
            reviewContent.value = userReview.content || '';
        }
    } catch (err) {
        console.error("Failed to fetch user's existing review:", err);
    }
};

const submitReview = async () => {
  if (currentRating.value === 0) {
    error.value = 'Please provide a star rating.';
    return;
  }
  error.value = '';
  isSubmitting.value = true;

  try {
    await api.post(`/api/resources/${props.resourceId}/reviews`, {
      rating: currentRating.value,
      content: reviewContent.value,
    });
    // Don't clear content if it was an update, let user see their previous review
    // commentContent.value = ''; // Clear form
    emit('review-posted'); // Notify parent to refresh reviews
    alert('Review submitted successfully!');
  } catch (err: any) {
    console.error('Error submitting review:', err);
    error.value = err.response?.data?.message || 'Failed to submit review.';
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
    if (authStore.token) {
        fetchUserReview();
    }
});
</script>

<style scoped>
/* Add any specific styles for review form here */
</style>