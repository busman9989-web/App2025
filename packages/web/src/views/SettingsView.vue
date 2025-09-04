<template>
  <div class="p-4 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Profile & Settings</h1>
      <p class="mt-1 text-slate-600">Update your personal information.</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
      <div class="flex items-center space-x-4">
        <img :src="userAvatar" alt="User Avatar" class="w-16 h-16 rounded-full" />
        <div>
          <h2 class="text-xl font-bold text-slate-800">{{ auth.user?.displayName }}</h2>
          <p class="text-slate-500">{{ auth.user?.email }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
      <form @submit.prevent="updateStatus">
        <label for="status" class="block text-lg font-semibold text-slate-700">Update Your Status</label>
        <p class="text-sm text-slate-500 mt-1 mb-3">This will be visible to others on your profile.</p>
        <textarea
          id="status"
          v-model="statusText"
          rows="3"
          class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
          placeholder="E.g., Taking a short break this week."
        ></textarea>
        <div class="text-right mt-3">
          <button type="submit" class="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors">
            Save Status
          </button>
        </div>
        <p v-if="successMessage" class="text-green-600 text-sm text-center mt-2">{{ successMessage }}</p>
      </form>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
      <button @click="handleLogout" class="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
        Logout
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/api';

const auth = useAuthStore();
const statusText = ref('');
const successMessage = ref('');

const userAvatar = computed(() => `https://placehold.co/80x80/BFD8D5/3D5A57?text=${auth.user?.displayName?.charAt(0) || '?'}`);

onMounted(async () => {
  try {
    const response = await api.get('/api/users/me');
    statusText.value = response.data.status || '';
  } catch (error) {
    console.error("Could not fetch user profile", error);
  }
});

const updateStatus = async () => {
  successMessage.value = '';
  try {
    await api.put('/api/users/me/status', { status: statusText.value });
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