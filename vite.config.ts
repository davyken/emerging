import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const jellyfinTarget = process.env.VITE_JELLYFIN_URL || 'https://jellyfin.emergingstream.com'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy frontend /jellyfin/* requests to the remote Jellyfin host during dev
      '/jellyfin': {
        target: jellyfinTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/jellyfin/, ''),
      },
    },
  },
})
