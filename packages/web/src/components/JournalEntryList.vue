<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
    <h2 class="text-lg font-semibold text-slate-700 dark:text-white transition-colors">Recent Entries</h2>
    <div v-if="loading" class="text-center text-slate-500 dark:text-slate-400 py-4 transition-colors">Loading...</div>
    <div v-else-if="entries.length === 0" class="text-center text-slate-500 dark:text-slate-400 py-4 transition-colors">
      You have no recent journal entries.
    </div>
    <div v-else class="mt-4 space-y-4">
      <div v-for="entry in entries" :key="entry.id" class="border-b border-slate-100 dark:border-slate-700 pb-3 last:border-b-0 transition-colors">
        <div class="flex justify-between items-center">
          <span class="font-bold text-slate-700 dark:text-slate-200 transition-colors">{{ formatDate(entry.entry_date) }}</span>
          <span class="text-2xl">{{ moodEmojis[entry.mood_rating - 1] }}</span>
        </div>
        <p class="mt-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed transition-colors">{{ entry.entry_text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { JournalEntry } from '@/views/JournalView.vue';

defineProps({
  entries: {
    type: Array as PropType<JournalEntry[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const moodEmojis = ['😔', '😐', '😊', '😁', '🤩']; // Updated emojis to match JournalEntryForm

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  // Adding UTC time to prevent off-by-one day errors
  const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return utcDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>