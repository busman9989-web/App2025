import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // NEW: proxy static avatar files to API during dev
      '/avatars': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // If you serve other static paths (e.g., /uploads), you can proxy them too:
      // '/uploads': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      // },
    },
  },
})