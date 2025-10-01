<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 p-6 transition-colors">
    <h2 class="text-lg font-semibold text-slate-800 dark:text-white text-center mb-4 transition-colors">How are you today?</h2>
    <div class="flex justify-around items-center">
      <button v-for="(mood, index) in moods" :key="index" @click="selectedMood = index"
              :class="[
                'text-4xl p-2 rounded-full transition-all duration-200',
                selectedMood === index 
                  ? 'bg-teal-100 dark:bg-teal-700 scale-125' // Selected mood in dark mode
                  : 'grayscale dark:grayscale-0 hover:grayscale-0 hover:scale-110' // Unselected mood in dark mode
              ]">
        {{ mood }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const selectedMood = ref(2); // Default to the middle mood
const moods = ['😔', '😟', '😐', '🙂', '😄'];
</script>

<style scoped>
/* No specific scoped styles needed after applying Tailwind classes directly */
</style>