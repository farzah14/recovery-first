import { expect, test } from '@playwright/test';

import { hasAuthenticatedE2EConfig, signInSeedUser } from './support/authenticated-session';

const mobileViewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
] as const;

const desktopViewports = [
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 1024 },
  { name: 'wide', width: 1728, height: 1117 },
] as const;

test.describe('Responsive Navigation', () => {
  test.beforeEach(() => {
    test.skip(
      !hasAuthenticatedE2EConfig(),
      'Responsive authenticated routes require a running local Supabase environment.',
    );
  });

  for (const viewport of desktopViewports) {
    test(`displays the sidebar at ${viewport.name} width`, async ({ context, page }) => {
      await signInSeedUser(context);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/app/today');

      await expect(page.getByTestId('application-sidebar')).toBeVisible();
      await expect(page.getByTestId('mobile-bottom-navigation')).toBeHidden();
      await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
    });
  }

  for (const viewport of mobileViewports) {
    test(`displays bottom navigation at ${viewport.name} width`, async ({ context, page }) => {
      await signInSeedUser(context);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/app/today');

      await expect(page.getByTestId('application-sidebar')).toBeHidden();
      await expect(page.getByTestId('mobile-bottom-navigation')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1, name: 'RecoveryFirst' })).toBeVisible();
    });
  }
});
