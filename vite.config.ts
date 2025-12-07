import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'src',
  publicDir: fileURLToPath(new URL('public', import.meta.url)),
  server: {
    port: 5174,
    open: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@root': fileURLToPath(new URL('src/', import.meta.url)),
    },
  },
});
