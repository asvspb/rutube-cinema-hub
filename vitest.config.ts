import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/frontend/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/index.tsx',
        'src/**/*.d.ts',
        'src/components/**', // UI компоненты тестируем E2E
        'src/types/**', // Типы не требуют тестов
        'src/services/indexedDBService.ts', // Требует браузерное окружение
        'src/services/top250Data.ts', // Статические данные
      ],
      thresholds: {
        // Пороги для бизнес-логики (hooks, services, utils)
        // Сфокусированы на критичной бизнес-логике
        lines: 45,
        functions: 50,
        branches: 35,
        statements: 45,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
