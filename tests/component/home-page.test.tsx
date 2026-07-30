import HomePage from '@/app/(public)/page';
import { renderWithProviders, screen } from '@/test-support/render';

describe('HomePage', () => {
  it('presents the product name and application entry link', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /Build habits that actually stick/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: /Start Free - No Account Required/i }),
    ).toHaveAttribute('href', '/app/today');
  });
});
