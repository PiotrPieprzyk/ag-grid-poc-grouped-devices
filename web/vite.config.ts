import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'mock-server': fileURLToPath(new URL('../mock-server/src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./grouped-cameras/src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
