<template>
  <div class="min-h-screen bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white transition-colors pb-24">
    <!-- Header -->
    <div class="p-4 pb-2">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Checklists</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Stay organized with your to-do lists</p>
    </div>

<!-- Date Selector -->
<div class="px-4 py-3">
  <div class="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-indigo-200 dark:border-slate-700 p-4 transition-colors">
    <!-- Date Navigation Row -->
    <div class="flex items-center gap-2 mb-3">
      <button
        @click="changeDate(-1)"
        class="flex-shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
      >
        <svg class="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <div class="flex-1">
        <input
          type="date"
          v-model="selectedDate"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent
                 bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                 transition-colors text-center font-medium text-sm"
        />
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
          {{ dateDisplayText }}
        </p>
      </div>

      <button
        @click="changeDate(1)"
        class="flex-shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center"
      >
        <svg class="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>

    <!-- Quick Select Buttons Row -->
    <div class="grid grid-cols-3 gap-2">
      <button
        @click="setToday"
        :class="[
          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isToday 
            ? 'bg-blue-600 text-white' 
            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
        ]"
      >
        Today
      </button>
      <button
        @click="setTomorrow"
        class="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
      >
        Tomorrow
      </button>
      <button
        @click="toggleShowAllDates"
        :class="[
          'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          showAllDates 
            ? 'bg-purple-600 text-white' 
            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
        ]"
      >
        All Dates
      </button>
    </div>
  </div>
</div>

    <!-- Stats Overview -->
    <div class="px-4 py-3">
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ filteredChecklists.length }}</div>
          <div class="text-xs text-blue-600 dark:text-blue-400 font-medium">Lists</div>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ completedTasksCount }}</div>
          <div class="text-xs text-green-600 dark:text-green-400 font-medium">Done</div>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
          <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ pendingTasksCount }}</div>
          <div class="text-xs text-orange-600 dark:text-orange-400 font-medium">Pending</div>
        </div>
      </div>
    </div>

    <!-- Create New Checklist -->
    <div class="p-4">
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-slate-700 p-4 transition-colors">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <h2 class="text-base font-semibold text-slate-900 dark:text-white">New Checklist</h2>
        </div>
        
        <form @submit.prevent="createChecklist" class="space-y-3">
          <input
            type="text"
            v-model="newChecklistName"
            placeholder="E.g., Morning Routine, Shopping List..."
            required
            class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent
                   bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400
                   transition-colors"
          />
          <button 
            type="submit" 
            :disabled="isCreating || !newChecklistName.trim()"
            class="w-full px-4 py-3 rounded-lg font-medium transition-all
                   bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                   text-white shadow-sm hover:shadow-md
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          >
            <span v-if="!isCreating" class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Create Checklist
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          </button>
        </form>
      </div>
    </div>

    <!-- Checklists List -->
    <div class="px-4 pb-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p class="text-sm text-slate-500 dark:text-slate-400">Loading checklists...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-red-600 dark:text-red-400 font-medium mb-3">Could not load checklists</p>
        <button
          @click="fetchChecklists"
          class="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 active:bg-red-800 transition-colors"
        >
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredChecklists.length === 0" class="text-center py-12">
        <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <svg class="w-8 h-8 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <p class="text-slate-600 dark:text-slate-400 font-medium">
          {{ showAllDates ? 'No checklists yet' : 'No checklists for this date' }}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-500 mt-1">
          {{ showAllDates ? 'Create your first checklist above!' : 'Select a different date or create a new checklist' }}
        </p>
      </div>

      <!-- Organized Checklists -->
      <div v-else class="space-y-6">
        <!-- Incomplete Tasks -->
        <div v-if="incompleteLists.length > 0">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-orange-600 dark:text-orange-400">To Do</h3>
            <span class="ml-auto text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
              {{ incompleteLists.length }}
            </span>
          </div>
          <div class="space-y-3">
            <Checklist
              v-for="checklist in incompleteLists"
              :key="checklist.id"
              :initial-checklist="checklist"
              @updated="handleChecklistUpdate"
              @deleted="handleChecklistDelete"
            />
          </div>
        </div>

        <!-- Completed Tasks -->
        <div v-if="completedLists.length > 0">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-green-600 dark:text-green-400">Completed</h3>
            <span class="ml-auto text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
              {{ completedLists.length }}
            </span>
          </div>
          <div class="space-y-3 opacity-60">
            <Checklist
              v-for="checklist in completedLists"
              :key="checklist.id"
              :initial-checklist="checklist"
              @updated="handleChecklistUpdate"
              @deleted="handleChecklistDelete"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/api';
import Checklist from '@/components/Checklist.vue';

export interface ChecklistItem {
  text: string;
  completed: boolean;
}

export interface ChecklistType {
  id: string;
  name: string;
  items: ChecklistItem[];
  isTemplate?: boolean;
  dueDate?: string | null;
  created_at?: string;
  updated_at?: string;
}

const checklists = ref<ChecklistType[]>([]);
const loading = ref(true);
const error = ref(false);
const newChecklistName = ref('');
const isCreating = ref(false);
const selectedDate = ref(getTodayString());
const showAllDates = ref(true);

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);
  
  const diffTime = selected.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const dateDisplayText = computed(() => {
  if (showAllDates.value) return 'Viewing all dates';
  return formatDateDisplay(selectedDate.value);
});

const isToday = computed(() => {
  return selectedDate.value === getTodayString() && !showAllDates.value;
});

const filteredChecklists = computed(() => {
  if (showAllDates.value) {
    return checklists.value;
  }

  return checklists.value.filter(checklist => {
    if (!checklist.dueDate) return false;
    
    const checklistDate = new Date(checklist.dueDate).toISOString().split('T')[0];
    return checklistDate === selectedDate.value;
  });
});

const incompleteLists = computed(() => {
  return filteredChecklists.value.filter(checklist => {
    return checklist.items.some(item => !item.completed) || checklist.items.length === 0;
  });
});

const completedLists = computed(() => {
  return filteredChecklists.value.filter(checklist => {
    return checklist.items.length > 0 && checklist.items.every(item => item.completed);
  });
});

const completedTasksCount = computed(() => {
  return filteredChecklists.value.reduce((acc, checklist) => {
    return acc + checklist.items.filter(item => item.completed).length;
  }, 0);
});

const pendingTasksCount = computed(() => {
  return filteredChecklists.value.reduce((acc, checklist) => {
    return acc + checklist.items.filter(item => !item.completed).length;
  }, 0);
});

const changeDate = (days: number) => {
  const date = new Date(selectedDate.value + 'T00:00:00');
  date.setDate(date.getDate() + days);
  selectedDate.value = date.toISOString().split('T')[0];
  showAllDates.value = false;
};

const setToday = () => {
  selectedDate.value = getTodayString();
  showAllDates.value = false;
};

const setTomorrow = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  selectedDate.value = tomorrow.toISOString().split('T')[0];
  showAllDates.value = false;
};

const toggleShowAllDates = () => {
  showAllDates.value = !showAllDates.value;
};

const fetchChecklists = async () => {
  loading.value = true;
  error.value = false;
  try {
    const response = await api.get('/api/checklists');
    checklists.value = response.data;
    console.log('Fetched checklists with due dates:', checklists.value);
  } catch (err) {
    console.error('Failed to fetch checklists:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

const createChecklist = async () => {
  if (!newChecklistName.value.trim() || isCreating.value) return;
  isCreating.value = true;
  try {
    const dueDate = showAllDates.value ? getTodayString() : selectedDate.value;
    
    await api.post('/api/checklists', {
      name: newChecklistName.value.trim(),
      items: [],
      dueDate: dueDate
    });
    newChecklistName.value = '';
    await fetchChecklists();
  } catch (err) {
    console.error('Failed to create checklist:', err);
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