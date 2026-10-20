import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      clientPort: 443
    },
    cors: true,
    headers: { 'X-Frame-Options': 'ALLOWALL' },
    // @ts-ignore
    allowedHosts: true as any,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    cors: true
  }
})
