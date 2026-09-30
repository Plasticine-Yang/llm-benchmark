import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { promptStudioPlugin } from './server/plugin.ts';

export default defineConfig({
  server: { host: '127.0.0.1', port: 5274, strictPort: true },
  preview: { host: '127.0.0.1', port: 5274, strictPort: true },
  build: {
    // Vite 8 默认用 lightningcss 压缩 CSS，而 lightningcss 是 dlopen 进来的 Rust
    // 原生模块。本机 DSH 的 node 开了 hardened runtime 但没带
    // com.apple.security.cs.disable-library-validation，加载不了 ad-hoc 签名的
    // .node 文件。esbuild 是子进程调用，不受这条限制，所以走 esbuild。
    cssMinify: 'esbuild',
  },
  plugins: [react(), promptStudioPlugin()],
});
