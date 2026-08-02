import { expect, test } from '@playwright/test';

test('public route presents landing page hero and start free link', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Recovery First/);
  await expect(
    page.getByRole('heading', { name: /Build habits that actually stick/i }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Start Free' }).first().click();

  await expect(page).toHaveURL('/app/today');
});

test('pricing route presents bento cards and feature comparison', async ({ page }) => {
  await page.goto('/pricing');

  await expect(page.getByText('Simple, transparent pricing.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lite' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Premium' })).toBeVisible();
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
