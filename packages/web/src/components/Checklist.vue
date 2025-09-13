<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
    <h3 class="text-lg font-bold text-slate-800">{{ checklist.name }}</h3>
    <div class="mt-3 space-y-3">
      <div v-for="(item, index) in checklist.items" :key="index" class="flex items-center">
        <input
          type="checkbox"
          :id="`item-${checklist.id}-${index}`"
          v-model="item.completed"
          @change="saveChanges"
          class="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <label :for="`item-${checklist.id}-${index}`" :class="['ml-3 block text-sm text-slate-700', { 'line-through text-slate-400': item.completed }]">
          {{ item.text }}
        </label>
      </div>
    </div>
    <div class="h-4 mt-2 text-right text-xs text-slate-400 transition-opacity duration-300" :class="isSaving ? 'opacity-100' : 'opacity-0'">
      Saving...
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, PropType } from 'vue';
import api from '@/api';
import type { Checklist as ChecklistType } from '@/views/PlannerView.vue'; // Updated import path

const props = defineProps({
  initialChecklist: {
    type: Object as PropType<ChecklistType>,
    required: true
  }
});

const checklist = reactive({ ...props.initialChecklist });
const isSaving = ref(false);
let saveTimeout: number | null = null;

const saveChanges = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  isSaving.value = true;

  saveTimeout = window.setTimeout(async () => {
    try {
      await api.put(`/api/checklists/${checklist.id}`, {
        name: checklist.name,
        items: checklist.items
      });
    } catch (err) {
      console.error("Failed to save checklist:", err);
      alert('Could not save your changes.');
    } finally {
      isSaving.value = false;
    }
  }, 1000);
};
</script>