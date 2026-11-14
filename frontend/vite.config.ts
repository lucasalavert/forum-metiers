// 1. Responsabilité : Configuration de Vite pour le frontend Forum des Métiers (support dev conteneurisé et local)
// 2. Dépendances clés : vite, @vitejs/plugin-react, path
// 3. Mots-clés métier : vite_config, bundler, proxy, react_plugin, aliases, docker_dev

import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5190,
    strictPort: true,
    allowedHosts: true,
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true } : undefined,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://127.0.0.1:8190',
        changeOrigin: true,
      },
    },
  },
});
