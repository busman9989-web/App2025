<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-5 transition-colors">
    <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">Add New Appointment</h2>
    <form @submit.prevent="createAppointment" class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Title</label>
        <input
          type="text"
          id="title"
          v-model="newAppointment.title"
          class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
          required
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Description (Optional)</label>
        <textarea
          id="description"
          v-model="newAppointment.description"
          rows="2"
          class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
        ></textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="date" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Date</label>
          <input
            type="date"
            id="date"
            v-model="newAppointment.date"
            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
            required
          />
        </div>
        <div>
          <label for="time" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Time</label>
          <input
            type="time"
            id="time"
            v-model="newAppointment.time"
            class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
            required
          />
        </div>
      </div>
      <div>
        <label for="location" class="block text-sm font-medium text-slate-600 dark:text-slate-300">Location (Optional)</label>
        <input
          type="text"
          id="location"
          v-model="newAppointment.location"
          class="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
        />
      </div>

      <div class="flex justify-end items-center gap-3 pt-2">
        <span v-if="statusMessage" :class="{'text-teal-500 dark:text-teal-400': isSuccess, 'text-red-500 dark:text-red-400': !isSuccess}" class="text-sm transition-colors">{{ statusMessage }}</span>
        <button
          type="submit"
          class="group relative inline-flex items-center justify-center gap-2 rounded-xl
                 border border-slate-300/70 dark:border-slate-600/70 bg-transparent
                 px-4 py-2 text-slate-700 dark:text-slate-100 hover:border-cyan-400
                 hover:text-cyan-700 dark:hover:text-cyan-300 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-cyan-400 transition
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            class="h-5 w-5 transition-transform group-hover:-translate-y-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
          </svg>
          <span class="font-medium">Add Appointment</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import api from '@/api';

const emit = defineEmits(['appointment-created']);

const newAppointment = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
});

const statusMessage = ref('');
const isSuccess = ref(false);

const createAppointment = async () => {
  statusMessage.value = '';
  isSuccess.value = false;

  if (!newAppointment.value.date || !newAppointment.value.time) {
    statusMessage.value = 'Date and time are required.';
    isSuccess.value = false;
    return;
  }
  
  const appointment_datetime = `${newAppointment.value.date}T${newAppointment.value.time}:00.000Z`;

  try {
    await api.post('/api/appointments', {
      title: newAppointment.value.title,
      description: newAppointment.value.description,
      appointment_datetime: appointment_datetime,
      location: newAppointment.value.location,
    });

    statusMessage.value = 'Appointment added successfully! 🎉';
    isSuccess.value = true;
    
    newAppointment.value = {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
    };
    
    emit('appointment-created');
    setTimeout(() => statusMessage.value = '', 3000); 
  } catch (error) {
    console.error('Failed to create appointment:', error);
    statusMessage.value = 'Failed to add appointment. Please check server status.';
    isSuccess.value = false;
    setTimeout(() => statusMessage.value = '', 5000); 
  }
};
</script>

<style scoped>
/* Scoped styles here */
</style>