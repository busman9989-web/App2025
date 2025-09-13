<template>
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
    <h2 class="text-lg font-semibold text-slate-800 text-center mb-4">How are you today?</h2>
    <div class="flex justify-around items-center">
      <button v-for="(mood, index) in moods" :key="index" @click="selectedMood = index"
              :class="['text-4xl p-2 rounded-full transition-all duration-200', selectedMood === index ? 'bg-teal-100 scale-125' : 'grayscale hover:grayscale-0 hover:scale-110']">
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