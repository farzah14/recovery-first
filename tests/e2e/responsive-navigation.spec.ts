import { expect, test } from '@playwright/test';

test.describe('Responsive Navigation', () => {
  test('displays sidebar navigation on desktop viewports', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/app/today');

    const sidebar = page.getByTestId('application-sidebar');
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
  });

  test('displays top app bar and mobile navigation on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app/today');

    await expect(page.getByRole('heading', { level: 1, name: 'RecoveryFirst' })).toBeVisible();
  });
});
