import { defineConfig, devices } from '@playwright/test';

/**
 * E2E тесты для Kino Club
 *
 * Для запуска E2E тестов необходимо установить Playwright:
 * npm install -D @playwright/test
 * npx playwright install
 *
 * Запуск: npx playwright test
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:9230',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Для полноценного E2E можно добавить другие браузеры:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Запуск сервера перед тестами
  webServer: {
    command: 'npm run build && npm run server',
    url: 'http://localhost:9230',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
