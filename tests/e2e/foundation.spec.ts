import { expect, test } from '@playwright/test';

test('public route links to the application shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Recovery First/);
  await expect(page.getByRole('heading', { name: 'Recovery First' })).toBeVisible();

  await Promise.all([
    page.waitForURL('**/app'),
    page.getByRole('link', { name: 'Open application shell' }).click(),
  ]);

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { name: 'Application foundation' })).toBeVisible();
});

test('unknown route displays the missing-page surface', async ({ page }) => {
  await page.goto('/route-that-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
});

test('liveness endpoint returns only the public health contract', async ({ request }) => {
  const response = await request.get('/api/health/live');

  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.json()).toEqual({ status: 'ok' });
});
