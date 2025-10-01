<template>
  <div class="p-4 space-y-6 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Checklists</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">Stay organized with predefined and custom to-do lists.</p>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
      <h2 class="text-lg font-semibold text-slate-700 dark:text-white mb-3 transition-colors">Create a New Checklist</h2>
      <form @submit.prevent="createChecklist" class="flex items-center gap-3">
        <label for="new-checklist-name" class="sr-only">New checklist name</label>
        <input
          type="text"
          id="new-checklist-name"
          v-model="newChecklistName"
          placeholder="E.g., Morning Routine"
          required
          class="flex-grow w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 
                 bg-white dark:bg-slate-700 text-slate-800 dark:text-white transition-colors"
        />
        <button 
          type="submit" 
          :disabled="isCreating || !newChecklistName.trim()"
          class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isCreating ? 'Creating...' : 'Create' }}
        </button>
      </form>
    </div>

    <div v-if="loading" class="text-center text-slate-500 dark:text-slate-400 py-8 transition-colors">Loading checklists...</div>
    <div v-else-if="error" class="text-center text-red-500 dark:text-red-400 py-8 transition-colors">
      <p>Could not load checklists.</p>
      <button @click="fetchChecklists" class="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors">
        Retry
      </button>
    </div>
    <div v-else-if="checklists.length === 0" class="text-center text-slate-500 dark:text-slate-400 py-8 transition-colors">
      <p>You haven't created any checklists yet.</p>
      <p class="text-sm mt-2">Create your first checklist above to get started!</p>
    </div>
    <div v-else class="space-y-4">
      <Checklist
        v-for="checklist in checklists"
        :key="checklist.id"
        :initial-checklist="checklist"
        @updated="handleChecklistUpdate"
        @deleted="handleChecklistDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/api';
import Checklist from '@/components/Checklist.vue'; // Assuming Checklist.vue also handles its own dark mode

export interface ChecklistItem {
  text: string;
  completed: boolean;
}

export interface ChecklistType {
  id: string;
  name: string;
  items: ChecklistItem[];
  isTemplate?: boolean;
  created_at?: string;
  updated_at?: string;
}

const checklists = ref<ChecklistType[]>([]);
const loading = ref(true);
const error = ref(false);
const newChecklistName = ref('');
const isCreating = ref(false);

const fetchChecklists = async () => {
  loading.value = true;
  error.value = false;
  try {
    console.log('Fetching checklists...');
    const response = await api.get('/api/checklists');
    console.log('Checklists response:', response.data);
    checklists.value = response.data;
  } catch (err) {
    console.error("Failed to fetch checklists:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const createChecklist = async () => {
  if (!newChecklistName.value.trim() || isCreating.value) return;
  
  isCreating.value = true;
  try {
    const defaultItems: ChecklistItem[] = [
      { text: "Add your first task", completed: false },
      { text: "Add more tasks as needed", completed: false },
    ];
    
    const response = await api.post('/api/checklists', {
      name: newChecklistName.value.trim(),
      items: defaultItems
    });
    
    console.log('Created checklist:', response.data);
    newChecklistName.value = '';
    await fetchChecklists(); // Refresh the list
  } catch (err) {
    console.error("Failed to create checklist:", err);
    alert('Could not create the checklist. Please try again.');
  } finally {
    isCreating.value = false;
  }
};

const handleChecklistUpdate = (updatedChecklist: ChecklistType) => {
  const index = checklists.value.findIndex(c => c.id === updatedChecklist.id);
  if (index !== -1) {
    checklists.value[index] = updatedChecklist;
  }
};

const handleChecklistDelete = (checklistId: string) => {
  checklists.value = checklists.value.filter(c => c.id !== checklistId);
};

onMounted(fetchChecklists);
</script>

<style scoped>
/* No scoped styles needed here, as Tailwind classes handle the theming */
</style>