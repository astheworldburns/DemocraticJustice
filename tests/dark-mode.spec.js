import { test, expect } from '@playwright/test';

const DARK_BODY_BG = 'rgb(15, 23, 42)';
const DARK_TEXT = 'rgb(241, 245, 249)';
const DARK_SURFACE = 'rgb(30, 41, 59)';
const DARK_NAV_TEXT = 'rgb(37, 99, 235)';
const DARK_LINK = 'rgb(147, 197, 253)';

test.describe('dark theme styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('theme', 'dark');
      } catch (error) {
        // In some browsers localStorage might be disabled; ignore so the test can rely on prefers-color-scheme.
      }
    });
  });

  test('applies dark colors to core layout elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-theme') === 'dark'
    );

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', DARK_BODY_BG);
    await expect(body).toHaveCSS('color', DARK_TEXT);

    const nav = page.locator('nav.nav');
    await expect(nav).toHaveCSS('background-color', DARK_SURFACE);
    await expect(nav).toHaveCSS('color', DARK_NAV_TEXT);

    const navLink = nav.locator('.nav-links a').first();
    await expect(navLink).toHaveCSS('color', DARK_LINK);

  });
});
