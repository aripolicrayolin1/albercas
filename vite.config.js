import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Expose on all network interfaces so Android devices on the same
    // WiFi can reach the app (required for Web NFC API testing)
    host: true,
    port: 5173,
  },
})
