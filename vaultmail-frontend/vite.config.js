import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev: Vite serves on 5173, but Worker is on 8787.
// We proxy /api/* and /auth/* to the Worker so the cookie domain matches.
// In production: frontend is hosted on Pages, Worker on workers.dev — use VITE_API_BASE.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/auth': 'http://localhost:8787',
    },
  },
});
