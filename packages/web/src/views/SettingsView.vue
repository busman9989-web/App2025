<template>
  <div class="p-4 space-y-6 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white min-h-screen transition-colors">
    <div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-white transition-colors">Profile & Settings</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400 transition-colors">Update your personal information.</p>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
      <div class="flex items-center space-x-4">
        <img :src="userAvatar" alt="User Avatar" class="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-white transition-colors">{{ auth.user?.displayName }}</h2>
          <p class="text-slate-500 dark:text-slate-400 transition-colors">{{ auth.user?.email }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
      <form @submit.prevent="updateStatus">
        <label for="status" class="block text-lg font-semibold text-slate-700 dark:text-white transition-colors">Update Your Status</label>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3 transition-colors">This will be visible to others on your profile.</p>
        <textarea
          id="status"
          v-model="statusText"
          rows="3"
          class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          placeholder="E.g., Taking a short break this week."
        ></textarea>
        <div class="text-right mt-3">
          <button type="submit" class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
            Save Status
          </button>
        </div>
        <p v-if="successMessage" class="text-green-600 text-sm text-center mt-2 transition-colors">{{ successMessage }}</p>
      </form>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
      <h2 class="text-lg font-semibold text-slate-800 dark:text-white mb-3 transition-colors">Appearance</h2>
      <label class="block text-sm text-slate-600 dark:text-slate-400 mb-2 transition-colors">Theme</label>
      <select
        v-model="themeStore.theme"
        class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-teal-500 focus:border-teal-500 transition-colors"
      >
        <option value="light">🌞 Light</option>
        <option value="dark">🌙 Dark</option>
      </select>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-5 transition-colors">
      <button @click="handleLogout" class="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
        Logout
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'; // Added watch import
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import api from '@/api';

const auth = useAuthStore();
const themeStore = useThemeStore();
const statusText = ref('');
const successMessage = ref('');

const userAvatar = computed(() => `https://placehold.co/80x80/BFD8D5/3D5A57?text=${auth.user?.displayName?.charAt(0) || '?'}`);

// Watch for changes in themeStore.theme and apply it
// This ensures that when the dropdown is changed, the theme.ts logic is called.
watch(() => themeStore.theme, (newTheme) => {
  themeStore.applyTheme(newTheme);
});

onMounted(async () => {
  try {
    const response = await api.get('/api/users/me');
    statusText.value = response.data.status || '';
    auth.user = { ...auth.user, ...response.data };
  } catch (error) {
    console.error("Could not fetch user profile", error);
  }
});

const updateStatus = async () => {
  successMessage.value = '';
  try {
    await api.put('/api/users/me', { status: statusText.value });
    successMessage.value = 'Status updated successfully!';
    setTimeout(() => successMessage.value = '', 3000);
  } catch (error) {
    console.error("Failed to update status", error);
    alert("Could not update status.");
  }
};

const handleLogout = () => {
  auth.logout();
};
</script>

<style scoped>
/* No specific styles are needed here as Tailwind CSS utility classes handle styling */
</style>