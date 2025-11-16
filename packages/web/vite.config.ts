import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'
import path from 'node:path'

// Certificate directory inside the container (matches ./packages/web/certs mounted as /app/certs)
const certDir = '/app/certs'
let httpsOption: boolean | { key: Buffer; cert: Buffer } = false

const keyPath = path.join(certDir, 'key.pem')
const certPath = path.join(certDir, 'cert.pem')

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  httpsOption = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
} else {
  httpsOption = false
}

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
    watch: { usePolling: true },
    hmr: { host: 'carerscircle.co.uk', port: 5173 },
    https: httpsOption,
    proxy: {
      '/api': { target: 'http://api:3000', changeOrigin: true, secure: false },
      '/avatars': { target: 'http://api:3000', changeOrigin: true, secure: false },
    },
  },
})