import HomePage from '@/app/(public)/page';
import { renderWithProviders, screen } from '@/test-support/render';

describe('HomePage', () => {
  it('presents the product name and application entry link', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Recovery First' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open application shell' })).toHaveAttribute(
      'href',
      '/app',
    );
  });
});
