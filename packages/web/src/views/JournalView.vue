// packages/client/src/views/JournalView.vue
<template>
  <div class="space-y-6 p-4 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Private Journal</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">A secure space for your thoughts and feelings. Only you can see these entries.</p>
    </div>
    <JournalComposer @entry-saved="fetchJournalEntries" />
    <JournalEntryList :entries="journalEntries" :loading="loading" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';
import JournalComposer from '@/components/JournalComposer.vue'; // Assuming JournalComposer handles its own dark mode
import JournalEntryList from '@/components/JournalEntryList.vue'; // Assuming JournalEntryList handles its own dark mode

// THIS IS THE KEY PART FOR FRONTEND EXPECTATIONS
export interface JournalEntry {
  id: string;
  entry_date: string; // <-- Frontend expects this
  mood_rating: number; // <-- Frontend expects this
  entry_text: string;  // <-- Frontend expects this
}

const journalEntries = ref<JournalEntry[]>([]);
const loading = ref(true);

const fetchJournalEntries = async () => {
  loading.value = true;
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await api.get(`/api/journal?startDate=${startDate}&endDate=${endDate}`);
    journalEntries.value = response.data; // This is where the frontend consumes the data
  } catch (error) {
    console.error("Failed to fetch journal entries:", error);
  } finally {
    loading.value = false;
  }
};
onMounted(fetchJournalEntries);
</script>