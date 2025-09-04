<template>
  <div class="p-4 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Checklists</h1>
      <p class="mt-1 text-slate-600">Stay organized with predefined and custom to-do lists.</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
      <h2 class="text-lg font-semibold text-slate-700 mb-3">Create a New Checklist</h2>
      <form @submit.prevent="createChecklist" class="flex items-center gap-3">
        <label for="new-checklist-name" class="sr-only">New checklist name</label>
        <input
          type="text"
          id="new-checklist-name"
          v-model="newChecklistName"
          placeholder="E.g., Morning Routine"
          required
          class="flex-grow w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
        />
        <button type="submit" class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors flex-shrink-0">Create</button>
      </form>
    </div>

    <div v-if="loading" class="text-center text-slate-500">Loading checklists...</div>
    <div v-else-if="error" class="text-center text-red-500">Could not load checklists.</div>
    <div v-else class="space-y-4">
      <Checklist
        v-for="checklist in checklists"
        :key="checklist.id"
        :initial-checklist="checklist"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';
import Checklist from '@/components/Checklist.vue';

export interface ChecklistItem {
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

const checklists = ref<Checklist[]>([]);
const loading = ref(true);
const error = ref(false);
const newChecklistName = ref('');

const fetchChecklists = async () => {
  loading.value = true;
  try {
    const response = await api.get('/api/checklists');
    checklists.value = response.data;
  } catch (err) {
    console.error("Failed to fetch checklists:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const createChecklist = async () => {
  if (!newChecklistName.value.trim()) return;
  try {
    // For a new checklist, let's add a few default items as an example
    const defaultItems = [
      { text: "Task 1", completed: false },
      { text: "Task 2", completed: false },
      { text: "Task 3", completed: false },
    ];
    await api.post('/api/checklists', {
      name: newChecklistName.value,
      items: defaultItems
    });
    newChecklistName.value = '';
    fetchChecklists(); // Refresh the list
  } catch (err) {
    console.error("Failed to create checklist:", err);
    alert('Could not create the checklist.');
  }
};

onMounted(fetchChecklists);
</script>