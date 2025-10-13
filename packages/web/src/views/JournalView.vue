<template>
  <div class="space-y-8 py-8 px-4 bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">Private Journal</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">
        A secure space for your thoughts and feelings. Only you can see these entries.
      </p>
    </div>

    <div class="max-w-3xl mx-auto flex flex-col gap-8 items-center">
      <div class="w-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
        <JournalComposer @entry-saved="onEntrySaved" />
      </div>

      <div class="w-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div class="text-left">
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Your Entries</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ rangeLabel }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              @click="prevWindow"
              aria-label="Previous window"
              title="Previous window"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
<button
  class="group relative inline-flex items-center justify-center gap-2 rounded-xl
         border border-slate-300/70 dark:border-slate-600/70 bg-transparent
         px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
         hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
         focus-visible:ring-2 focus-visible:ring-cyan-400 transition
         disabled:opacity-60 disabled:cursor-not-allowed"
  @click="jumpToCurrent"
  :disabled="windowIndex === 0"
  aria-label="Back to current"
  title="Back to current"
>
  <svg
    class="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
  <span class="font-medium">Today</span>
</button>
            <button
              class="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="windowIndex === 0"
              @click="nextWindow"
              aria-label="Next window"
              title="Next window"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="loading" class="text-center text-slate-600 dark:text-slate-400 py-8">
          <svg class="animate-spin h-5 w-5 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-sm">Loading entries...</p>
        </div>

        <div v-else-if="journalEntries.length === 0" class="text-center text-slate-600 dark:text-slate-400 py-8">
          No journal entries found for this period.
        </div>

        <div v-else>
          <div class="max-h-[500px] overflow-y-auto">
            <div
              v-for="entry in journalEntries"
              :key="entry.id"
              class="rounded-lg p-4 border bg-slate-50 dark:bg-slate-900 mb-3"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-slate-500">{{ formatDate(entry.entry_date) }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <span>{{ moodEmoji(entry.mood_rating) }}</span>
                  <span>Mood: {{ entry.mood_rating ?? '—' }}</span>
                </span>
              </div>
              <p class="whitespace-pre-line break-words text-slate-900 dark:text-white">
                {{ entry.entry_text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import api from '@/api';
import JournalComposer from '@/components/JournalComposer.vue';

export interface JournalEntry {
  id: string;
  entry_date: string;
  mood_rating: number;
  entry_text: string;
}

const journalEntries = ref<JournalEntry[]>([]);
const loading = ref(true);

// Windowed browsing state (slide left/right by 30-day windows)
const windowIndex = ref(0); // 0 = current window, 1 = previous window, etc.
const rangeDays = 30;

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const computeWindow = (index: number) => {
  // Build non-overlapping 30-day windows.
  const today = startOfDay(new Date());
  let end = today;
  let start = addDays(end, -(rangeDays - 1));
  for (let i = 0; i < index; i++) {
    end = addDays(start, -1);
    start = addDays(end, -(rangeDays - 1));
  }
  return { start, end };
};

const rangeLabel = computed(() => {
  const { start, end } = computeWindow(windowIndex.value);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
});

const fetchJournalEntries = async () => {
  loading.value = true;
  try {
    const { start, end } = computeWindow(windowIndex.value);
    const startDate = toYMD(start);
    const endDate = toYMD(end);
    const response = await api.get(`/api/journal?startDate=${startDate}&endDate=${endDate}`);
    journalEntries.value = response.data;
  } catch (error) {
    console.error('Failed to fetch journal entries:', error);
    journalEntries.value = [];
  } finally {
    loading.value = false;
  }
};

const prevWindow = () => {
  windowIndex.value = windowIndex.value + 1; // older
};
const nextWindow = () => {
  windowIndex.value = Math.max(0, windowIndex.value - 1); // newer, stop at current
};
const jumpToCurrent = () => {
  windowIndex.value = 0;
};

const onEntrySaved = async () => {
  // Prefer showing the current window after saving a new entry
  if (windowIndex.value !== 0) windowIndex.value = 0;
  await fetchJournalEntries();
};

watch(windowIndex, fetchJournalEntries);

onMounted(fetchJournalEntries);

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Helper: map mood_rating to emoji
function moodEmoji(rating: number | null | undefined) {
  if (rating == null) return '😶';
  if (rating >= 5) return '🤩';
  if (rating >= 4) return '😁';
  if (rating >= 3) return '😊';
  if (rating >= 2) return '😐';
  if (rating >= 1) return '😔';
  return '😶';
}
</script>