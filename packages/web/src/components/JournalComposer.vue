<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
    <h2 class="text-lg font-semibold text-slate-700">Today's Entry</h2>
    <form @submit.prevent="saveEntry" class="mt-4 space-y-4">
      <div>
        <label for="entry-date" class="block text-sm font-medium text-slate-600">Date</label>
        <input 
          type="date" 
          id="entry-date" 
          name="entry-date"
          v-model="entry.entry_date" 
          required 
          class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-600">How are you feeling?</label>
        <div class="mt-2 flex justify-around items-center">
          <button
            type="button"
            v-for="mood in 5"
            :key="mood"
            :class="['text-4xl p-2 rounded-full transition-all duration-200', entry.mood_rating === mood ? 'bg-teal-100 scale-125' : 'grayscale hover:grayscale-0 hover:scale-110']"
            @click="entry.mood_rating = mood"
          >
            {{ moodEmojis[mood-1] }}
          </button>
        </div>
      </div>
      <div>
        <label for="entry-text" class="block text-sm font-medium text-slate-600">Your thoughts</label>
        <textarea
          id="entry-text"
          name="entry-text"
          v-model="entry.entry_text"
          rows="5"
          placeholder="Write about your day..."
          required
          class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
        ></textarea>
      </div>
      <div class="text-right">
        <button type="submit" :disabled="isSaving" class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
          {{ isSaving ? 'Saving...' : 'Save Entry' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/api';

const emit = defineEmits(['entry-saved']);

const entry = ref({
  entry_date: new Date().toISOString().split('T')[0], // Default to today
  mood_rating: 3,
  entry_text: '',
});

const moodEmojis = ['😞', '😕', '😐', '🙂', '😄'];
const isSaving = ref(false);

const saveEntry = async () => {
  isSaving.value = true;
  try {
    await api.post('/api/journal', entry.value);
    entry.value.entry_text = ''; // Clear text after saving
    emit('entry-saved'); // Notify parent to refresh the list
  } catch (error) {
    console.error("Failed to save entry:", error);
    alert("Could not save your entry. Please try again.");
  } finally {
    isSaving.value = false;
  }
};
</script>