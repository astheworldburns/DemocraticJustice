import { test, expect } from '@playwright/test';

const DARK_BODY_BG = 'rgb(15, 23, 42)';
const DARK_TEXT = 'rgb(249, 250, 251)';
const DARK_SURFACE = 'rgb(31, 41, 55)';
const ACCENT_BLUE = 'rgb(59, 130, 246)';

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
    await expect(nav).toHaveCSS('color', ACCENT_BLUE);

    const navLink = nav.locator('.nav-links a').first();
    await expect(navLink).toHaveCSS('color', ACCENT_BLUE);

    const caseCard = page.locator('.case-card').first();
    await expect(caseCard).toBeVisible();
    await expect(caseCard).toHaveCSS('background-color', DARK_SURFACE);
    await expect(caseCard).toHaveCSS('color', DARK_TEXT);

    const caseLink = caseCard.locator('a.case-link');
    await expect(caseLink).toHaveCSS('color', DARK_TEXT);
  });
});
