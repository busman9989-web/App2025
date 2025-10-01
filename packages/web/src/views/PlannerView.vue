<template>
  <div class="min-h-screen bg-white text-slate-800 dark:bg-[#0f172a] dark:text-white p-6 transition-colors">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Planner</h1>
      <p class="text-slate-500 dark:text-slate-400">{{ todayDate }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="col-span-2 space-y-4">
        <h2 class="text-lg font-semibold">Upcoming meetings</h2>

        <div v-if="appointmentsLoading" class="text-slate-500 dark:text-slate-400">Loading...</div>
        <div v-else-if="appointmentsError" class="text-red-500 dark:text-red-400">Failed to load appointments.</div>

        <div v-else-if="appointments.length === 0" class="text-slate-500">
          No events scheduled.
        </div>

        <div v-else class="divide-y divide-slate-200 dark:divide-slate-800">
          <div
            v-for="appt in appointments"
            :key="appt.id"
            class="flex items-center justify-between py-4"
          >
            <div class="flex items-center space-x-4">
              <img
                class="h-10 w-10 rounded-full"
                src="https://i.pravatar.cc/100?img=5"
                alt="avatar"
              />
              <div>
                <p class="font-medium text-slate-800 dark:text-white">{{ appt.title }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ formatDateTime(appt.appointment_datetime) }}
                  <span v-if="appt.location"> • {{ appt.location }}</span>
                </p>
              </div>
            </div>
            <button
              @click="deleteAppointment(appt.id)"
              class="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div>
        <div class="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl shadow transition-colors">
          <div class="flex justify-between items-center mb-4">
            <button @click="prevMonth" class="hover:text-teal-600 dark:hover:text-indigo-400">&lt;</button>
            <h3 class="font-semibold">{{ monthYear }}</h3>
            <button @click="nextMonth" class="hover:text-teal-600 dark:hover:text-indigo-400">&gt;</button>
          </div>

          <div class="grid grid-cols-7 gap-2 text-center text-slate-500 dark:text-slate-400 text-sm">
            <div v-for="day in weekDays" :key="day" class="font-medium">{{ day }}</div>

            <div
              v-for="cell in calendarDays"
              :key="cell.date.toISOString()"
              class="h-10 flex items-center justify-center rounded cursor-pointer transition-colors"
              :class="[
                cell.isCurrentMonth ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600',
                isToday(cell.date) ? 'bg-teal-500 text-white font-bold dark:bg-indigo-500' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              ]"
              @click="selectedDate = cell.date"
            >
              {{ cell.date.getDate() }}
            </div>
          </div>

          <button
            @click="showAddModal = true"
            class="w-full mt-4 bg-teal-600 hover:bg-teal-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 py-2 rounded-lg font-semibold transition-colors"
          >
            Add event
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center"
    >
      <div class="bg-white dark:bg-slate-900 p-6 rounded-xl w-96 transition-colors">
        <h2 class="text-lg font-semibold mb-4">Add Event</h2>

        <form @submit.prevent="createAppointment">
          <input
            v-model="newEvent.title"
            placeholder="Title"
            required
            class="w-full mb-3 px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
          />
          <input
            v-model="newEvent.location"
            placeholder="Location"
            class="w-full mb-3 px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
          />
          <input
            type="datetime-local"
            v-model="newEvent.datetime"
            required
            class="w-full mb-3 px-3 py-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
          />

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="showAddModal = false"
              class="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/api';

// State
// activeTab is no longer strictly needed but kept as a ref for now, though not used for a tab UI
const activeTab = ref<'appointments' | 'checklists'>('appointments'); 
const appointments = ref<any[]>([]);
const appointmentsLoading = ref(false);
const appointmentsError = ref(false);

const todayDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// Calendar logic
const currentDate = ref(new Date());
const selectedDate = ref(new Date());

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const monthYear = computed(() =>
  currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
);

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const calendarDays = computed(() => {
  const start = startOfMonth(currentDate.value);
  const end = endOfMonth(currentDate.value);
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  const startDay = start.getDay();
  for (let i = 0; i < startDay; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - (startDay - i));
    days.push({ date: d, isCurrentMonth: false });
  }

  for (let d = 1; d <= end.getDate(); d++) {
    days.push({ date: new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), d), isCurrentMonth: true });
  }

  while (days.length % 7 !== 0) {
    const d = new Date(end);
    d.setDate(d.getDate() + (days.length % 7));
    days.push({ date: d, isCurrentMonth: false });
  }

  return days;
});

const isToday = (date: Date) => {
  const now = new Date();
  return date.getDate() === now.getDate() &&
         date.getMonth() === now.getMonth() &&
         date.getFullYear() === now.getFullYear();
};

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

// Add Event Modal
const showAddModal = ref(false);
const newEvent = ref({ title: '', location: '', datetime: '' });

// API
const fetchAppointments = async () => {
  appointmentsLoading.value = true;
  appointmentsError.value = false;
  try {
    const res = await api.get('/api/appointments');
    appointments.value = res.data || [];
  } catch (err) {
    appointmentsError.value = true;
  } finally {
    appointmentsLoading.value = false;
  }
};

const createAppointment = async () => {
  try {
    await api.post('/api/appointments', {
      title: newEvent.value.title,
      location: newEvent.value.location,
      appointment_datetime: newEvent.value.datetime
    });
    showAddModal.value = false;
    newEvent.value = { title: '', location: '', datetime: '' };
    await fetchAppointments();
  } catch (err) {
    console.error('Failed to create appointment', err);
  }
};

const deleteAppointment = async (id: string) => {
  try {
    await api.delete(`/api/appointments/${id}`);
    await fetchAppointments();
  } catch (err) {
    console.error('Failed to delete appointment', err);
  }
};

// Helpers
const formatDateTime = (dateTime: string) =>
  new Date(dateTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

onMounted(fetchAppointments);
</script>

<style scoped>
/* Add any specific styles for PlannerView here */
</style>