<template>
  <div class="min-h-screen bg-white text-slate-800 dark:bg-[#0f172a] dark:text-white p-6 transition-colors">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Planner</h1>
      <p class="text-slate-500 dark:text-slate-400">{{ todayDate }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="col-span-2 space-y-8">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
          Appointments on {{ selectedDateFormatted }}
          <button
            v-if="!isToday(selectedDate)"
            @click="selectAndRefetch(new Date())"
            class="text-sm text-teal-600 dark:text-indigo-400 hover:text-teal-500 dark:hover:text-indigo-300 ml-3 font-normal"
          >
            (Show Today)
          </button>
        </h2>

        <div v-if="appointmentsLoading" class="text-slate-500 dark:text-slate-400">Loading...</div>
        <div v-else-if="appointmentsError" class="text-red-500 dark:text-red-400">
          <p>⚠️ Failed to load appointments. Please try again.</p>
        </div>

        <div v-else-if="appointments.length === 0" class="text-slate-500 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <p>No events scheduled for {{ selectedDateFormatted }}.</p>
        </div>

        <div v-else class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-lg p-2">
          <div
            v-for="appt in appointments"
            :key="appt.id"
            class="flex items-center justify-between py-4 px-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <!-- Always try to render image; fallback happens via @error -->
              <img
                :src="avatarSrc(appt)"
                @error="onImgError"
                class="h-10 w-10 rounded-full object-cover bg-slate-200 dark:bg-slate-700 flex-shrink-0"
                alt="Profile picture"
              />
              <div>
                <p class="font-medium text-slate-800 dark:text-white">{{ appt.title }}</p>

                <p v-if="appt.description" class="text-sm text-slate-600 dark:text-slate-300 italic">
                  {{ appt.description }}
                </p>

                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ formatDateTime(appt.appointment_datetime) }}
                  <span v-if="appt.location"> • {{ appt.location }}</span>
                </p>
              </div>
            </div>
            <button
              @click="deleteAppointment(appt.id)"
              class="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 transition-colors px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>

        <AppointmentComposer @appointment-created="handleAppointmentCreated" />
      </div>

      <div class="lg:col-span-1 flex justify-center lg:justify-end">
        <div class="w-full max-w-sm">
          <div class="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl shadow transition-colors border border-slate-200 dark:border-slate-800">
            <div class="flex justify-between items-center mb-4">
              <button @click="prevMonth" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-indigo-400">&lt;</button>
              <h3 class="font-semibold text-slate-900 dark:text-white">{{ monthYear }}</h3>
              <button @click="nextMonth" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-teal-600 dark:hover:text-indigo-400">&gt;</button>
            </div>

            <div class="grid grid-cols-7 gap-1 text-center text-slate-500 dark:text-slate-400 text-xs">
              <div v-for="day in weekDays" :key="day" class="font-bold py-1">{{ day }}</div>

              <div
                v-for="cell in calendarDays"
                :key="cell.date.toISOString()"
                class="h-10 flex items-center justify-center rounded-lg cursor-pointer transition-colors text-sm relative"
                :class="[
                  cell.isCurrentMonth ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600',
                  isToday(cell.date) ? 'bg-teal-500 text-white font-bold dark:bg-indigo-500' : 'hover:bg-slate-200 dark:hover:bg-slate-700',
                  isSelected(cell.date) && !isToday(cell.date) ? 'ring-2 ring-teal-500 dark:ring-indigo-500 bg-slate-200 dark:bg-slate-700' : ''
                ]"
                @click="selectAndRefetch(cell.date)"
              >
                {{ cell.date.getDate() }}
                <span 
                  v-if="hasAppointments(cell.date)"
                  class="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-red-500 dark:bg-red-400"
                  :class="{'bg-white': isToday(cell.date)}"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/api';
import AppointmentComposer from '@/components/AppointmentComposer.vue';
import { useAuthStore } from '@/stores/auth';

// --- Auth (for fallback to current user's avatar) ---
const authStore = useAuthStore();

// --- State ---
const appointments = ref<any[]>([]);
const appointmentsLoading = ref(false);
const appointmentsError = ref(false);

// Calendar State
const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const allAppointments = ref<any[]>([]);

// --- URL helpers for images ---
const defaultAvatar = '/default-avatar.png';
const backendUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

function toAbsoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return defaultAvatar;
  // Accept data:, blob:, http(s):
  if (/^(data:|blob:|https?:\/\/)/i.test(pathOrUrl)) return pathOrUrl;
  const base = backendUrl.replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

// Determine the best avatar url for an appointment
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

// --- Utility function for reliable YYYY-MM-DD formatting ---
const getYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Computed & Helpers ---

const todayDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const selectedDateFormatted = computed(() =>
  selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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

// Helper to check if a date is today (ignores time)
const isToday = (date: Date) => {
  const now = new Date();
  return date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
};

// Helper to check if a date is the selected date (ignores time)
const isSelected = (date: Date) => {
  return date.getDate() === selectedDate.value.getDate() &&
    date.getMonth() === selectedDate.value.getMonth() &&
    date.getFullYear() === selectedDate.value.getFullYear();
};

// Check if a specific date has appointments (for the visual dot marker)
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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

// --- API Methods ---

const fetchAllAppointments = async () => {
  try {
    const res = await api.get('/api/appointments');
    allAppointments.value = res.data || [];

    // Debug: log shape to verify avatar fields
    if (import.meta.env.DEV) {
      console.log('[Planner] allAppointments sample:', allAppointments.value.slice(0, 3));
    }
  } catch (err) {
    console.error('Failed to fetch all appointments for calendar markers:', err);
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

    // Debug: log src that will be used
    if (import.meta.env.DEV) {
      const preview = appointments.value.map((a: any) => ({
        id: a.id,
        raw: a.profilePictureUrl || a.user?.profilePictureUrl || a.owner?.profilePictureUrl || authStore.user?.profilePictureUrl || null,
        resolved: avatarSrc(a)
      }));
      console.log('[Planner] avatar preview for selected day:', preview);
    }

  } catch (err) {
    appointmentsError.value = true;
  } finally {
    appointmentsLoading.value = false;
  }
};

const deleteAppointment = async (id: string) => {
  if (!confirm('Are you sure you want to delete this appointment?')) return;
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

// --- Calendar Interaction ---
const selectAndRefetch = (date: Date) => {
  selectedDate.value = date;
};

// --- Watchers ---
watch(selectedDate, () => {
  if (getYYYYMMDD(selectedDate.value).substring(0, 7) !== getYYYYMMDD(currentDate.value).substring(0, 7)) {
    currentDate.value = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1);
  }
  fetchAppointmentsForSelectedDay();
});

watch(currentDate, () => {
  fetchAllAppointments();
});

// --- Lifecycle ---
onMounted(async () => {
  await fetchAllAppointments();
  await fetchAppointmentsForSelectedDay();
});
</script>

<style scoped>
/* Scoped styles here */
</style>