import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';

// Плагин для ручного копирования файла _redirects в dist
const copyRedirectsPlugin = () => {
  return {
    name: 'copy-redirects',
    closeBundle() {
      try {
        const redirects = readFileSync('public/_redirects', 'utf-8');
        writeFileSync(resolve(__dirname, 'dist', '_redirects'), redirects);
        console.log('Файл _redirects успешно скопирован в dist');
      } catch (err) {
        console.error('Ошибка при копировании файла _redirects:', err);
      }
    },
  };
};

export default defineConfig({
  plugins: [
    react(),
    copyRedirectsPlugin(),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tensorflow: ['@tensorflow/tfjs'],
          math: ['mathjs']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    include: ['framer-motion', 'better-react-mathjax', 'html-to-image', 'jspdf']
  }
}); 