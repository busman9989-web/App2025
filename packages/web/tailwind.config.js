// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ✅ enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // You can keep brand colors if you use them specifically,
        // but for general dark mode, relying on built-in colors
        // and 'dark:' variants is usually more flexible.
        // If 'brand-light' is just teal-500, use teal-500.
        // If 'brand-dark' is just teal-600, use teal-600.
        // You would apply them like: text-teal-500 dark:text-indigo-400
      },
    },
  },
  plugins: [],
}