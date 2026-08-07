import { expect, test } from '@playwright/test';

import { hasAuthenticatedE2EConfig, signInSeedUser } from './support/authenticated-session';

test.describe('Authenticated Plan 04 core loop', () => {
  test.beforeEach(() => {
    test.skip(
      !hasAuthenticatedE2EConfig(),
      'Authenticated E2E requires a running local Supabase environment.',
    );
  });

  test('loads the account-owned Today surface from Supabase', async ({ context, page }) => {
    await signInSeedUser(context);
    await page.goto('/app/today');

    await expect(page).toHaveURL(/\/app\/today$/);
    await expect(page.getByRole('heading', { name: 'A steady next step' })).toBeVisible();
    await expect(page.getByText('Account mode · synced with Supabase')).toBeVisible();
  });

  test('loads account-owned habits and preserves the Free limit from the database contract', async ({
    context,
    page,
  }) => {
    await signInSeedUser(context);
    await page.goto('/app/habits');

    await expect(page).toHaveURL(/\/app\/habits$/);
    await expect(page.getByText('5 active habits maximum')).toBeVisible();
  });
});
