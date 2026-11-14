// 1. Responsabilité : Configuration Vitest pour les tests unitaires frontend
// 2. Dépendances clés : vitest/config, path
// 3. Mots-clés métier : vitest_config, unit_testing, jsdom, test_runner

import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
