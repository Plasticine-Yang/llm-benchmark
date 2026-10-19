import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
  server: { port: 5188, host: '127.0.0.1' },
  preview: { port: 5189, host: '127.0.0.1' },
});
