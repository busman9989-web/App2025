<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 space-y-4">
    <h2 class="text-lg font-semibold text-slate-700">Today's Entry</h2>

    <div class="space-y-2">
      <label for="entryDate" class="text-sm font-medium text-slate-600">Date</label>
      <div class="relative">
        <input
          type="date"
          id="entryDate"
          v-model="newEntry.entry_date"
          class="block w-full rounded-md border-slate-300 shadow-sm pr-10 focus:border-teal-500 focus:ring-teal-500 text-sm"
          max="2025-12-31" 
        />
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg class="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-sm font-medium text-slate-600">How are you feeling?</p>
      <div class="flex space-x-2">
        <button
          v-for="i in 5"
          :key="i"
          @click="newEntry.mood_rating = i"
          :class="['mood-button', { 'active': newEntry.mood_rating === i }]"
        >
          <span class="text-2xl">{{ getMoodEmoji(i) }}</span>
        </button>
      </div>
    </div>

    <div class="space-y-2">
      <label for="entryText" class="text-sm font-medium text-slate-600">Your thoughts</label>
      <textarea
        id="entryText"
        v-model="newEntry.entry_text"
        rows="4"
        class="block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
        placeholder="Write about your day..."
      ></textarea>
    </div>

    <button
      @click="saveEntry"
      :disabled="!newEntry.entry_text"
      class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Save Entry
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineEmits } from 'vue';
import api from '@/api';

const emit = defineEmits(['entry-saved']);

const newEntry = ref({
  entry_date: new Date().toISOString().split('T')[0], // Default to today
  mood_rating: 3, // Default mood
  entry_text: '',
});

const getMoodEmoji = (rating: number) => {
  const emojis = ['😔', '😐', '😊', '😁', '🤩'];
  return emojis[rating - 1];
};

const saveEntry = async () => {
  try {
    await api.post('/api/journal', newEntry.value);
    emit('entry-saved');
    // Reset form for new entry
    newEntry.value = {
      entry_date: new Date().toISOString().split('T')[0],
      mood_rating: 3,
      entry_text: '',
    };
  } catch (error) {
    console.error("Failed to save journal entry:", error);
    alert("Failed to save entry. Please try again.");
  }
};
</script>

<style scoped>
.mood-button {
  @apply flex-grow text-center py-2 rounded-lg transition-all border border-slate-200 bg-slate-50 hover:bg-slate-100;
}
.mood-button.active {
  @apply bg-orange-100 border-orange-300 ring-2 ring-orange-200 scale-105;
}
</style>