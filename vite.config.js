import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy requests to /api/n8n/* to the local n8n instance
      // This avoids CORS issues when calling the n8n REST API from the browser
      '/api/n8n': {
        target: 'https://n8n-fepmc5vpguo7qlpexgctb9tk.2.24.204.112.sslip.io',
        changeOrigin: true,
        secure: false, // In case of self-signed certs on the remote
        rewrite: (path) => path.replace(/^\/api\/n8n/, '/api/v1'),
      },
    },
  },
})
