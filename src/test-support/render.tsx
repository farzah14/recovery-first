import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, options);
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
