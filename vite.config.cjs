const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { resolve } = require('path');

module.exports = defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true,
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'tensorflow': ['@tensorflow/tfjs']
        },
        format: 'es',
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  base: './',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  preview: {
    port: 3000,
    open: true,
    historyApiFallback: true
  }
}); 