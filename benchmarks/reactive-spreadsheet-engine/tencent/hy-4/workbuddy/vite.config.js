import { defineConfig } from 'vite';

const API_PORT = Number(process.env.PORT || 18787);

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': `http://127.0.0.1:${API_PORT}`,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: true,
  },
});
