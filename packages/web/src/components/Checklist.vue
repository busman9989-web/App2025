<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-bold text-slate-800 dark:text-white transition-colors">{{ checklist.name }}</h3>
      <div class="flex items-center space-x-2">
        <button
          @click="addNewItem"
          class="text-teal-600 hover:text-teal-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
          title="Add new item"
        >
          + Add Item
        </button>
        <button
          @click="deleteChecklist"
          class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
          title="Delete checklist"
        >
          Delete
        </button>
      </div>
    </div>
    
    <div class="mt-3 space-y-3">
      <div v-for="(item, index) in checklist.items" :key="`item-${index}`" class="flex items-center group">
        <input
          type="checkbox"
          :id="`item-${checklist.id}-${index}`"
          v-model="item.completed"
          @change="saveChanges"
          class="h-5 w-5 rounded border-gray-300 dark:border-slate-500 text-teal-600 dark:text-indigo-500 focus:ring-teal-500 dark:focus:ring-indigo-500 flex-shrink-0 bg-white dark:bg-slate-600 transition-colors"
        />
        <input
          v-if="editingIndex === index"
          type="text"
          v-model="editingText"
          @blur="finishEditing"
          @keydown.enter="finishEditing"
          @keydown.esc="cancelEditing"
          class="ml-3 flex-1 text-sm text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-600 focus:border-teal-500 dark:focus:border-indigo-400 focus:outline-none bg-transparent transition-colors"
          ref="editInput"
        />
        <label 
          v-else
          :for="`item-${checklist.id}-${index}`" 
          :class="[
            'ml-3 block text-sm cursor-pointer flex-1 transition-colors',
            item.completed 
              ? 'line-through text-slate-400 dark:text-slate-500' 
              : 'text-slate-700 dark:text-slate-200'
          ]"
          @dblclick="startEditing(index, item.text)"
        >
          {{ item.text }}
        </label>
        <button
          v-if="editingIndex !== index"
          @click="removeItem(index)"
          class="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm transition-colors"
          title="Remove item"
        >
          ×
        </button>
      </div>
      
      <div v-if="checklist.items.length === 0" class="text-slate-400 dark:text-slate-500 text-sm italic text-center py-4 transition-colors">
        No items yet. Click "Add Item" to get started!
      </div>
    </div>
    
    <div v-if="checklist.items.length > 0" class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 transition-colors">
      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 transition-colors">
        <span>Progress</span>
        <span>{{ completedCount }}/{{ checklist.items.length }}</span>
      </div>
      <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 transition-colors">
        <div 
          class="bg-teal-500 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>
    
    <div class="h-4 mt-2 text-right text-xs text-slate-400 dark:text-slate-500 transition-opacity duration-300" :class="isSaving ? 'opacity-100' : 'opacity-0'">
      Saving...
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, nextTick, PropType } from 'vue';
import api from '@/api';
import type { ChecklistType } from '@/views/ChecklistView.vue';

const props = defineProps({
  initialChecklist: {
    type: Object as PropType<ChecklistType>,
    required: true
  }
});

const emit = defineEmits<{
  updated: [checklist: ChecklistType];
  deleted: [checklistId: string];
}>();

const checklist = reactive({ ...props.initialChecklist });
const isSaving = ref(false);
const editingIndex = ref(-1);
const editingText = ref('');
const editInput = ref<HTMLInputElement>();

let saveTimeout: number | null = null;

const completedCount = computed(() => 
  checklist.items.filter(item => item.completed).length
);

const progressPercentage = computed(() => 
  checklist.items.length > 0 ? (completedCount.value / checklist.items.length) * 100 : 0
);

const saveChanges = async () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  isSaving.value = true;

  saveTimeout = window.setTimeout(async () => {
    try {
      const response = await api.put(`/api/checklists/${checklist.id}`, {
        name: checklist.name,
        items: checklist.items
      });
      
      Object.assign(checklist, response.data);
      emit('updated', response.data);
    } catch (err) {
      console.error("Failed to save checklist:", err);
      alert('Could not save your changes. Please try again.');
    } finally {
      isSaving.value = false;
    }
  }, 1000);
};

const addNewItem = () => {
  checklist.items.push({
    text: "New task",
    completed: false
  });
  
  const newIndex = checklist.items.length - 1;
  startEditing(newIndex, "New task");
};

const removeItem = (index: number) => {
  if (confirm('Are you sure you want to remove this item?')) {
    checklist.items.splice(index, 1);
    saveChanges();
  }
};

const startEditing = (index: number, text: string) => {
  editingIndex.value = index;
  editingText.value = text;
  nextTick(() => {
    editInput.value?.focus();
    editInput.value?.select();
  });
};

const finishEditing = () => {
  if (editingIndex.value >= 0 && editingText.value.trim()) {
    checklist.items[editingIndex.value].text = editingText.value.trim();
    saveChanges();
  }
  cancelEditing();
};

const cancelEditing = () => {
  editingIndex.value = -1;
  editingText.value = '';
};

const deleteChecklist = async () => {
  if (!confirm(`Are you sure you want to delete "${checklist.name}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    await api.delete(`/api/checklists/${checklist.id}`);
    emit('deleted', checklist.id);
  } catch (err) {
    console.error("Failed to delete checklist:", err);
    alert('Could not delete the checklist. Please try again.');
  }
};
</script>