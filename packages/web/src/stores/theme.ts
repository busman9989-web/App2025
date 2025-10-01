// src/stores/theme.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  // --- REVERTED CHANGE ---
  // Default to 'light' if no theme is found in localStorage
  const theme = ref<'light' | 'dark'>(localStorage.getItem('theme') as 'light' | 'dark' || 'light');

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
    theme.value = newTheme;
  };

  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  };

  // run on init
  watch(theme, (newTheme) => applyTheme(newTheme), { immediate: true });

  return { theme, applyTheme, toggleTheme };
});