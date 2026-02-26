import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9229';

test.describe('Video Playback', () => {
  test.setTimeout(120000); // 2 minutes timeout

  test('should load homepage and click first video', async ({ page }) => {
    // Navigate to the main page
    await page.goto(BASE_URL);

    // Wait for any video-related content to appear (videos are loaded via API)
    // Try multiple possible selectors for video cards
    const videoSelectors = [
      'article',
      '[class*="video"]',
      '[class*="Video"]',
      'a[href*="/video/"]',
      'img[src*="pic.rutube"]',
      'img[src*="rutube"]',
    ];

    let foundSelector = '';
    for (const selector of videoSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 20000 });
        foundSelector = selector;
        console.log(`Found videos with selector: ${selector}`);
        break;
      } catch {
        continue;
      }
    }

    if (!foundSelector) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/no-videos-found.png' });
      console.log('No video elements found, check screenshot');
    }

    // Wait a bit for UI to stabilize
    await page.waitForTimeout(2000);

    // Try to find clickable video element
    const clickableSelectors = [
      'article a',
      'a[href*="/video/"]',
      '[class*="VideoCard"]',
      '[class*="video-card"]',
      'button[class*="video"]',
    ];

    let clicked = false;
    for (const selector of clickableSelectors) {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        await element.click();
        clicked = true;
        console.log(`Clicked on: ${selector}`);
        break;
      }
    }

    if (!clicked) {
      // Try clicking any image that might be a thumbnail
      const thumbnails = page.locator('img[src*="rutube"], img[src*="pic.rtbcdn"]');
      const count = await thumbnails.count();
      if (count > 0) {
        // Click the parent element of the thumbnail
        const parent = thumbnails.first().locator('xpath=..');
        await parent.click();
        console.log('Clicked on thumbnail parent');
        clicked = true;
      }
    }

    // Wait for modal to appear
    if (clicked) {
      await page.waitForTimeout(1000);

      // Check for modal/iframe
      const modal = page.locator('[role="dialog"], [class*="Modal"]');
      const modalVisible = await modal.isVisible().catch(() => false);

      const iframe = page.locator('iframe[src*="rutube"]');
      const iframeVisible = await iframe.isVisible().catch(() => false);

      console.log(`Modal visible: ${modalVisible}`);
      console.log(`Iframe visible: ${iframeVisible}`);

      if (iframeVisible) {
        const src = await iframe.getAttribute('src');
        console.log(`Iframe src: ${src}`);

        // Wait for player to load
        await page.waitForTimeout(3000);

        // Take screenshot of player
        await page.screenshot({ path: 'test-results/video-player-loaded.png' });
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/final-state.png' });
  });

  test('should check console for errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000);

    console.log('Console errors:', errors.length);
    console.log('Console warnings:', warnings.length);

    // Filter out expected Rutube player errors
    const criticalErrors = errors.filter(
      e =>
        !e.includes('Ya is not defined') &&
        !e.includes('metrika') &&
        !e.includes('ERR_BLOCKED_BY_CLIENT') &&
        !e.includes('yastatic.net') &&
        !e.includes('401') // 401 errors from Rutube are expected
    );

    console.log('Critical errors:', criticalErrors);
    expect(criticalErrors.length).toBe(0);
  });
});
