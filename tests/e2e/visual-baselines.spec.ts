import { test, expect } from '@playwright/test';

import { hasAuthenticatedE2EConfig, signInSeedUser } from './support/authenticated-session';

test.describe('Visual Baselines', () => {
  // Full-page Habits captures include the complete management surface and can exceed
  // Playwright's 30-second default while the local Next.js server is warming up.
  test.setTimeout(120_000);

  test('renders landing page visual layout cleanly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('matches the public landing desktop visual baseline', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop public baseline only');
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('public-landing.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('matches today dashboard visual baseline', async ({ context, page }, testInfo) => {
    test.skip(
      !hasAuthenticatedE2EConfig(),
      'Authenticated visual baseline requires a running local Supabase environment.',
    );
    await signInSeedUser(context);
    await page.setViewportSize(
      testInfo.project.name === 'chromium-mobile'
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1024 },
    );
    await page.clock.install({ time: new Date('2026-01-15T10:00:00Z') });
    await page.goto('/app/today');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'A steady next step' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveScreenshot('today-dashboard.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('matches habits management visual baseline', async ({ context, page }, testInfo) => {
    test.skip(
      !hasAuthenticatedE2EConfig(),
      'Authenticated visual baseline requires a running local Supabase environment.',
    );
    await signInSeedUser(context);
    await page.setViewportSize(
      testInfo.project.name === 'chromium-mobile'
        ? { width: 390, height: 844 }
        : { width: 1440, height: 1024 },
    );
    await page.clock.install({ time: new Date('2026-01-15T10:00:00Z') });
    await page.goto('/app/habits');
    await expect(page.getByRole('heading', { level: 1, name: 'Habits Library' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page).toHaveScreenshot('habits-management.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });
});
