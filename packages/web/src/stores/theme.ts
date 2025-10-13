// src/stores/theme.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const getInitialTheme = (): 'light' | 'dark' => {
    // 1. Check for stored preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }
    // 2. Fallback to OS preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    // 3. Default
    return 'light'; 
};

export const useThemeStore = defineStore('theme', () => {
    // Initialize state from local storage or OS preference
    const theme = ref<'light' | 'dark'>(getInitialTheme());

    // Function to physically apply the class to the root element
    const applyThemeClass = (newTheme: 'light' | 'dark') => {
        const root = document.documentElement;
        // Ensure only 'dark' is managed; light mode is the absence of 'dark'
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    // Public action to set and save the theme
    const setTheme = (newTheme: 'light' | 'dark') => {
        theme.value = newTheme;
        localStorage.setItem('theme', newTheme);
        applyThemeClass(newTheme);
    };

    // Public action to toggle the theme
    const toggleTheme = () => {
        const newTheme = theme.value === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };
    
    // **IMPORTANT: Initial theme application**
    // We will call this public action in main.ts to ensure it runs early.
    const initializeTheme = () => {
        applyThemeClass(theme.value);
    }

    return { 
        theme, 
        setTheme, 
        toggleTheme, 
        initializeTheme // Export the function to call on app startup
    };
});