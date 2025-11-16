<template>
  <div class="min-h-screen bg-white text-slate-800 dark:bg-[#0f172a] dark:text-white transition-colors">
    <!-- Header -->
    <div class="p-4 pb-2">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Planner</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ todayDate }}</p>
    </div>

    <!-- Mobile-First Layout -->
    <div class="space-y-6 p-4">
      <!-- Calendar Card - Full Width on Mobile -->
      <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <!-- Month Navigation -->
        <div class="flex justify-between items-center mb-4">
          <button 
            @click="prevMonth" 
            class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h3 class="font-semibold text-slate-900 dark:text-white">{{ monthYear }}</h3>
          <button 
            @click="nextMonth" 
            class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-300 dark:active:bg-slate-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-1 text-center">
          <!-- Week Day Headers -->
          <div 
            v-for="day in weekDays" 
            :key="day" 
            class="font-semibold text-xs text-slate-600 dark:text-slate-400 py-2"
          >
            {{ day }}
          </div>

          <!-- Calendar Days -->
          <button
            v-for="cell in calendarDays"
            :key="cell.date.toISOString()"
            class="relative aspect-square flex items-center justify-center rounded-lg transition-all text-sm min-h-[44px]"
            :class="[
              cell.isCurrentMonth 
                ? 'text-slate-800 dark:text-white font-medium' 
                : 'text-slate-400 dark:text-slate-600',
              isToday(cell.date) 
                ? 'bg-blue-600 text-white font-bold shadow-md' 
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600',
              isSelected(cell.date) && !isToday(cell.date) 
                ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-slate-200 dark:bg-slate-700' 
                : ''
            ]"
            @click="selectAndRefetch(cell.date)"
          >
            <span>{{ cell.date.getDate() }}</span>
            <!-- Appointment Indicator Dot -->
            <span 
              v-if="hasAppointments(cell.date)"
              class="absolute bottom-1 w-1 h-1 rounded-full"
              :class="isToday(cell.date) ? 'bg-white' : 'bg-blue-500 dark:bg-blue-400'"
            ></span>
          </button>
        </div>
      </div>

      <!-- Appointments Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            {{ selectedDateFormatted }}
          </h2>
          <button
            v-if="!isToday(selectedDate)"
            @click="selectAndRefetch(new Date())"
            class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 active:text-blue-800 dark:active:text-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Today
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="appointmentsLoading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="appointmentsError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <p class="text-red-600 dark:text-red-400">⚠️ Failed to load appointments</p>
          <button 
            @click="fetchAppointmentsForSelectedDay"
            class="mt-2 text-sm text-red-600 dark:text-red-400 font-medium hover:underline"
          >
            Try again
          </button>
        </div>

        <!-- Empty State -->
        <div 
          v-else-if="appointments.length === 0" 
          class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center"
        >
          <svg class="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-slate-500 dark:text-slate-400">No appointments scheduled</p>
        </div>

        <!-- Appointments List -->
        <div v-else class="space-y-3">
          <div
            v-for="appt in appointments"
            :key="appt.id"
            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <img
                  :src="avatarSrc(appt)"
                  @error="onImgError"
                  class="h-10 w-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 flex-shrink-0"
                  alt="Profile"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900 dark:text-white truncate">{{ appt.title }}</p>
                  <p v-if="appt.description" class="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {{ appt.description }}
                  </p>
                  <div class="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ formatDateTime(appt.appointment_datetime) }}
                    </span>
                    <span v-if="appt.location" class="flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {{ appt.location }}
                    </span>
                  </div>
                </div>
              </div>
              <button
                @click="deleteAppointment(appt.id)"
                class="flex-shrink-0 p-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Appointment Composer -->
        <AppointmentComposer @appointment-created="handleAppointmentCreated" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/api';
import AppointmentComposer from '@/components/AppointmentComposer.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const appointments = ref<any[]>([]);
const appointmentsLoading = ref(false);
const appointmentsError = ref(false);

const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const allAppointments = ref<any[]>([]);

const defaultAvatar = '/default-avatar.png';
const backendUrl = (import.meta.env.VITE_API_URL as string) || 'https://api.carerscircle.co.uk';

function toAbsoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return defaultAvatar;
  if (/^(data:|blob:|https?:\/\/)/i.test(pathOrUrl)) return pathOrUrl;
  const base = backendUrl.replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function avatarSrc(appt: any): string {
  const candidate =
    appt?.profilePictureUrl ||
    appt?.user?.profilePictureUrl ||
    appt?.owner?.profilePictureUrl ||
    authStore.user?.profilePictureUrl ||
    '';
  return toAbsoluteUrl(candidate);
}

function onImgError(e: Event) {
  const el = e.target as HTMLImageElement;
  if (el && el.src !== location.origin + defaultAvatar) {
    el.src = defaultAvatar;
  }
}

const getYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const selectedDateFormatted = computed(() =>
  selectedDate.value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
);

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  let counter = 1;
  while (days.length % 7 !== 0) {
    const d = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, counter);
    days.push({ date: d, isCurrentMonth: false });
    counter++;
  }

  return days;
});

const isToday = (date: Date) => {
  const now = new Date();
  return date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
};

const isSelected = (date: Date) => {
  return date.getDate() === selectedDate.value.getDate() &&
    date.getMonth() === selectedDate.value.getMonth() &&
    date.getFullYear() === selectedDate.value.getFullYear();
};

const hasAppointments = (date: Date) => {
  const dateStr = getYYYYMMDD(date);
  return allAppointments.value.some(appt => {
    const apptDateStr = getYYYYMMDD(new Date(appt.appointment_datetime));
    return apptDateStr === dateStr;
  });
};

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const formatDateTime = (dateTime: string) =>
  new Date(dateTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

const fetchAllAppointments = async () => {
  try {
    const res = await api.get('/api/appointments');
    allAppointments.value = res.data || [];
  } catch (err) {
    console.error('Failed to fetch all appointments:', err);
  }
};

const fetchAppointmentsForSelectedDay = async () => {
  appointmentsLoading.value = true;
  appointmentsError.value = false;

  if (!allAppointments.value.length) {
    await fetchAllAppointments();
  }

  try {
    const dateStr = getYYYYMMDD(selectedDate.value);
    const filteredAppts = (allAppointments.value || []).filter((appt: any) => {
      const apptDateStr = getYYYYMMDD(new Date(appt.appointment_datetime));
      return apptDateStr === dateStr;
    });

    appointments.value = filteredAppts.sort((a: any, b: any) =>
      new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime()
    );
  } catch (err) {
    appointmentsError.value = true;
  } finally {
    appointmentsLoading.value = false;
  }
};

const deleteAppointment = async (id: string) => {
  if (!confirm('Delete this appointment?')) return;
  try {
    await api.delete(`/api/appointments/${id}`);
    await fetchAllAppointments();
    await fetchAppointmentsForSelectedDay();
  } catch (err) {
    console.error('Failed to delete appointment', err);
  }
};

const handleAppointmentCreated = async () => {
  await fetchAllAppointments();
  await fetchAppointmentsForSelectedDay();
};

const selectAndRefetch = (date: Date) => {
  selectedDate.value = date;
};

watch(selectedDate, () => {
  if (getYYYYMMDD(selectedDate.value).substring(0, 7) !== getYYYYMMDD(currentDate.value).substring(0, 7)) {
    currentDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1);
  }
  fetchAppointmentsForSelectedDay();
});

watch(currentDate, () => {
  fetchAllAppointments();
});

onMounted(async () => {
  await fetchAllAppointments();
  await fetchAppointmentsForSelectedDay();
});
</script>