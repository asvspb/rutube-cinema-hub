import { test, expect } from '@playwright/test';

test.describe('Auth Debug', () => {
  test('debug registration - capture all requests', async ({ page }) => {
    // Capture all requests
    const requests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push(`${request.method()} ${request.url()}`);
        console.log(`REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // Capture console messages
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`PAGE ERROR: ${error.message}`);
    });

    await page.goto('/');

    // Open auth modal
    await page.click('button[title="Меню пользователя"]');
    await page.click('text=Войти');
    await page.click('text=Sign up');

    // Fill form
    const uniqueUsername = `debug_${Date.now()}`;
    await page.fill('input#username', uniqueUsername);
    await page.fill('input#password', 'password123');

    console.log('Form filled, about to click submit');

    // Click submit
    await page.getByRole('button', { name: 'Create Account' }).click();

    console.log('Submit clicked, waiting...');

    // Wait for any response or timeout
    await page.waitForTimeout(5000);

    console.log('All captured requests:', requests);

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-screenshot.png' });

    // Check if any requests were made
    expect(requests.length).toBeGreaterThan(0);
  });
});
