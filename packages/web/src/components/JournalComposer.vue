<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 space-y-4 transition-colors">
    <h2 class="text-lg font-semibold text-slate-700 dark:text-white transition-colors">Today's Entry</h2>

    <div class="space-y-2">
      <label for="entryDate" class="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">Date</label>
      <div class="relative">
        <input
          type="date"
          id="entryDate"
          v-model="newEntry.entry_date"
          class="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm pr-10 
                 focus:border-teal-500 focus:ring-teal-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 
                 text-sm px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          max="2025-12-31" 
        />
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg class="h-5 w-5 text-slate-400 dark:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">How are you feeling?</p>
      <div class="flex space-x-2">
        <button
          v-for="i in 5"
          :key="i"
          @click="newEntry.mood_rating = i"
          :class="['mood-button', { 'active': newEntry.mood_rating === i }]"
          type="button"
        >
          <span class="text-2xl">{{ getMoodEmoji(i) }}</span>
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <label for="entryText" class="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">Your thoughts</label>
      <textarea
        id="entryText"
        v-model="newEntry.entry_text"
        rows="5"
        class="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm 
               focus:border-teal-500 focus:ring-teal-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400 
               text-sm px-4 py-3 leading-relaxed resize-none bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        placeholder="Write about your day, your feelings, or anything that's on your mind..."
        style="line-height: 1.6;"
      ></textarea>
    </div>

    <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm transition-colors">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 text-sm transition-colors">
      {{ successMessage }}
    </div>

    <button
      @click="saveEntry"
      :disabled="!newEntry.entry_text || isSubmitting"
      class="group relative inline-flex items-center justify-center gap-2 rounded-xl
             border border-slate-300/70 dark:border-slate-600/70 bg-transparent
             px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
             hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
             focus-visible:ring-2 focus-visible:ring-cyan-400 transition
             disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      <svg
        class="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
      </svg>
      <span class="font-medium">{{ isSubmitting ? 'Saving...' : 'Save Entry' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from 'vue';
import api from '@/api';

const emit = defineEmits(['entry-saved']);

const newEntry = ref({
  entry_date: new Date().toISOString().split('T')[0],
  mood_rating: 3,
  entry_text: '',
});

const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Emojis for mood ratings
const getMoodEmoji = (rating: number) => {
  const emojis = ['😔', '😐', '😊', '😁', '🤩'];
  return emojis[rating - 1];
};

const saveEntry = async () => {
  if (!newEntry.value.entry_text || isSubmitting.value) return;

  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;

  try {
    await api.post('/api/journal', newEntry.value);
    
    successMessage.value = 'Journal entry saved successfully!';
    
    // Reset form
    newEntry.value = {
      entry_date: new Date().toISOString().split('T')[0],
      mood_rating: 3,
      entry_text: '',
    };
    
    emit('entry-saved');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
    
  } catch (error: any) {
    console.error('Failed to save journal entry:', error);
    
    if (error.response?.status === 409) {
      errorMessage.value = 'You already have an entry for this date. Please choose a different date or edit your existing entry.';
    } else if (error.response?.status === 400) {
      errorMessage.value = error.response.data?.message || 'Invalid entry data. Please check your input.';
    } else if (error.response?.status === 401) {
      errorMessage.value = 'Please log in to save journal entries.';
    } else if (error.response?.status >= 500) {
      errorMessage.value = 'Server error. Please try again later.';
    } else {
      errorMessage.value = error.response?.data?.message || 'Failed to save entry. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.mood-button {
  @apply flex-grow text-center py-2 rounded-lg transition-all border 
         border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 
         hover:bg-slate-100 dark:hover:bg-slate-600;
}
.mood-button.active {
  /* Adjusted active state for dark mode */
  @apply bg-orange-100 dark:bg-orange-800 border-orange-300 dark:border-orange-600 ring-2 
         ring-orange-200 dark:ring-orange-500 scale-105;
}
</style>