<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
    <h2 class="text-lg font-semibold text-slate-700 mb-4">Add New Appointment</h2>
    <form @submit.prevent="createAppointment" class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-slate-600">Title</label>
        <input
          type="text"
          id="title"
          v-model="newAppointment.title"
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          required
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium text-slate-600">Description (Optional)</label>
        <textarea
          id="description"
          v-model="newAppointment.description"
          rows="2"
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        ></textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="date" class="block text-sm font-medium text-slate-600">Date</label>
          <input
            type="date"
            id="date"
            v-model="newAppointment.date"
            class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
        <div>
          <label for="time" class="block text-sm font-medium text-slate-600">Time</label>
          <input
            type="time"
            id="time"
            v-model="newAppointment.time"
            class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            required
          />
        </div>
      </div>
      <div>
        <label for="location" class="block text-sm font-medium text-slate-600">Location (Optional)</label>
        <input
          type="text"
          id="location"
          v-model="newAppointment.location"
          class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <div class="flex justify-end items-center gap-3">
        <span v-if="statusMessage" :class="{'text-green-600': isSuccess, 'text-red-600': !isSuccess}" class="text-sm">{{ statusMessage }}</span>
        <button
          type="submit"
          class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors"
        >
          Add Appointment
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import api from '@/api';

// Define the event this component can emit
const emit = defineEmits(['appointment-created']);

const newAppointment = ref({
  title: '',
  description: '',
  date: '', // Will hold 'YYYY-MM-DD'
  time: '', // Will hold 'HH:MM'
  location: '',
});

const statusMessage = ref('');
const isSuccess = ref(false);

const createAppointment = async () => {
  statusMessage.value = ''; // Clear previous messages
  isSuccess.value = false;

  // Combine date and time into an ISO string for the backend
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

    statusMessage.value = 'Appointment added successfully!';
    isSuccess.value = true;
    // Reset form fields
    newAppointment.value = {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
    };
    // Emit event to parent component (PlannerView) to refresh its data
    emit('appointment-created');

    setTimeout(() => statusMessage.value = '', 3000); // Clear message after 3 seconds

  } catch (error) {
    console.error('Failed to create appointment:', error);
    statusMessage.value = 'Failed to add appointment.';
    isSuccess.value = false;
  }
};
</script>