import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Charting is heavy and only needed on a few views — split it out
          // so the initial bundle stays lean and the chunk caches independently.
          recharts: ['recharts'],
        },
      },
    },
  },
});
