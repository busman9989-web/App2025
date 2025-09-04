<template>
  <div class="p-4 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Today's Planner</h1>
      <p class="mt-1 text-slate-600">{{ todayDate }}</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
      <h2 class="text-lg font-semibold text-slate-700 mb-3">Appointments</h2>
      <div v-if="plannerData.appointments.length > 0" class="space-y-3">
        <div v-for="app in plannerData.appointments" :key="app.id" class="flex items-start space-x-3">
          <div class="flex-shrink-0 bg-teal-100 text-teal-700 rounded-lg p-2 mt-1">
            <CalendarIcon />
          </div>
          <div>
            <p class="font-semibold text-slate-700">{{ app.title }}</p>
            <p class="text-sm text-slate-500">{{ formatTime(app.appointment_datetime) }} - {{ app.location }}</p>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-slate-500">No appointments scheduled for today.</p>
    </div>

    <Checklist
      v-for="checklist in plannerData.checklists"
      :key="checklist.id"
      :initial-checklist="checklist"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h, VNode } from 'vue';
import api from '@/api';
import Checklist from '@/components/Checklist.vue';

const plannerData = ref({ appointments: [], checklists: [] });
const loading = ref(true);

const todayDate = computed(() => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
const formatTime = (dateTimeString: string) => new Date(dateTimeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

onMounted(async () => {
  try {
    const response = await api.get('/api/planner/today');
    plannerData.value = response.data;
  } catch (err) {
    console.error("Failed to fetch planner data:", err);
  } finally {
    loading.value = false;
  }
});

// Icon helper
const Icon = (props: { path: VNode | VNode[], className?: string }) => h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: props.className || 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': 2 }, props.path);
const CalendarIcon = () => h(Icon, { path: h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }) });
</script>