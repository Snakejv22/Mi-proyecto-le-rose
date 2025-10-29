import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // ⭐ Configuración para conectarse con PHP
    proxy: {
      '/api': {
        target: 'http://localhost/le-rose-vite',
        changeOrigin: true,
        secure: false
      }
    }
  }
})