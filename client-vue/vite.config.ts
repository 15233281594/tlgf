import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [vue()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9999',
        changeOrigin: false,
      },
    },
  },
  preview: {
    host: 'localhost',
    port: 4173,
    allowedHosts: true,
  },
})
