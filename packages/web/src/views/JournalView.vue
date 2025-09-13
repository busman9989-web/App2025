<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Private Journal</h1>
      <p class="mt-1 text-slate-600">A secure space for your thoughts and feelings. Only you can see these entries.</p>
    </div>
    <JournalComposer @entry-saved="fetchJournalEntries" />
    <JournalEntryList :entries="journalEntries" :loading="loading" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';
import JournalComposer from '@/components/JournalComposer.vue';
import JournalEntryList from '@/components/JournalEntryList.vue';
export interface JournalEntry { id: string; entry_date: string; mood_rating: number; entry_text: string; }
const journalEntries = ref<JournalEntry[]>([]);
const loading = ref(true);
const fetchJournalEntries = async () => {
  loading.value = true;
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await api.get(`/api/journal?startDate=${startDate}&endDate=${endDate}`);
    journalEntries.value = response.data;
  } catch (error) { console.error("Failed to fetch journal entries:", error); } finally { loading.value = false; }
};
onMounted(fetchJournalEntries);
</script>