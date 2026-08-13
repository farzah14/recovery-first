import HomePage from '@/app/(public)/page';
import { renderWithProviders, screen } from '@/test-support/render';

describe('HomePage', () => {
  it('presents the product name and application entry link', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /Build habits that actually stick/i }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/app/today');
    expect(screen.getByRole('heading', { name: /Your Data Stays Yours/i })).toBeVisible();
    expect(screen.getByText('IndexedDB Local Storage')).toBeVisible();
    expect(screen.getByText(/Full Export & Erasure/i)).toBeVisible();
  });
});
