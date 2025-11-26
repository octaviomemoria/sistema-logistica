import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // proxy API requests to backend during development
      '/api': 'http://127.0.0.1:3001'
    }
  }
})
