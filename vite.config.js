import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:5000',
      '/predict': 'http://localhost:5000',
      '/patients': 'http://localhost:5000',
      '/analytics': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
      '/schema': 'http://localhost:5000',
    }
  }
})
