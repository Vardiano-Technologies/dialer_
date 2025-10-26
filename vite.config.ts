import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/call': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/status': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/end': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/twilio-webhook': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
