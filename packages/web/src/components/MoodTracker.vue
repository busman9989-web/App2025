<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-6 transition-colors">
    <h2 class="text-lg font-semibold text-slate-800 dark:text-white text-center mb-4 transition-colors">How are you today?</h2>
    <div v-if="isLoading" class="text-center text-slate-600 dark:text-slate-400 py-4">
      <svg class="animate-spin h-5 w-5 text-teal-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    <div v-else class="flex justify-around items-center">
      <button 
        v-for="(mood, index) in moods" 
        :key="index" 
        @click="selectMood(index)"
        :disabled="isSaving"
        :class="[
          'text-4xl p-2 rounded-full transition-all duration-200',
          selectedMood === index 
            ? 'bg-teal-100 dark:bg-teal-700 scale-125' 
            : 'grayscale dark:grayscale-0 hover:grayscale-0 hover:scale-110',
          isSaving && 'opacity-50 cursor-not-allowed'
        ]">
        {{ mood }}
      </button>
    </div>
    <p v-if="saveMessage" :class="['mt-3 text-center text-sm', isError ? 'text-red-500' : 'text-teal-600 dark:text-teal-400']">
      {{ saveMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';

const moods = ['😔', '😟', '😐', '🙂', '😄']; // 0..4
const TODAY_KEY = 'moodTrackerDate';
const MOOD_KEY = 'moodTrackerValue';

const getTodayDateString = (): string => new Date().toISOString().split('T')[0];

const selectedMood = ref<number | null>(null);
const isLoading = ref(true);
const isSaving = ref(false);
const saveMessage = ref('');
const isError = ref(false);

const loadMood = async () => {
  isLoading.value = true;
  const todayStr = getTodayDateString();
  const cachedDate = localStorage.getItem(TODAY_KEY);
  const cachedMood = localStorage.getItem(MOOD_KEY);

  // Use cache for today's mood if present
  if (cachedDate === todayStr && cachedMood !== null) {
    selectedMood.value = parseInt(cachedMood, 10);
    isLoading.value = false;
    return;
  }

  // New day or no cache; reset and fetch
  localStorage.removeItem(TODAY_KEY);
  localStorage.removeItem(MOOD_KEY);
  selectedMood.value = null;

  try {
    const response = await api.get(`/api/journal/date/${todayStr}`);
    if (response.data && response.data.mood_rating !== undefined) {
      selectedMood.value = response.data.mood_rating;
      localStorage.setItem(TODAY_KEY, todayStr);
      localStorage.setItem(MOOD_KEY, String(response.data.mood_rating));
    }
  } catch (err: any) {
    // Option B: Treat 404 as "no entry yet" (not an error)
    if (err?.response?.status === 404) {
      selectedMood.value = null; // keep UI interactive with no error
      // no console.error for 404
    } else {
      console.error('[MoodTracker] Failed to fetch mood for today:', err);
    }
  } finally {
    isLoading.value = false;
  }
};

const saveMood = async (moodIndex: number) => {
  isSaving.value = true;
  isError.value = false;
  saveMessage.value = '';
  const todayStr = getTodayDateString();

  try {
    await api.post('/api/journal/mood', {
      entry_date: todayStr,
      mood_rating: moodIndex,
    });

    // Cache success
    localStorage.setItem(TODAY_KEY, todayStr);
    localStorage.setItem(MOOD_KEY, String(moodIndex));
    saveMessage.value = 'Mood saved!';
  } catch (e) {
    console.error('[MoodTracker] Failed to save mood:', e);
    isError.value = true;
    saveMessage.value = 'Failed to save mood. Please try again.';
    setTimeout(() => {
      saveMessage.value = '';
    }, 3000);
  } finally {
    isSaving.value = false;
  }
};

const selectMood = (index: number) => {
  selectedMood.value = index;
  saveMood(index);
};

onMounted(() => {
  loadMood();
});
</script>

<style scoped>
/* Tailwind handles styles */
</style>