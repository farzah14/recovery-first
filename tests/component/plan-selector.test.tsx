import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PlanSelector } from '@/features/subscriptions/components/plan-selector';

describe('PlanSelector', () => {
  it('starts with no plan selected and reports a deliberate choice', async () => {
    const user = userEvent.setup();
    let selected: string | null = null;

    render(
      <PlanSelector
        value={null}
        onChange={(value) => {
          selected = value;
        }}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Choose a plan' })).toBeVisible();
    expect(
      screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked),
    ).toBe(true);

    await user.click(screen.getByRole('radio', { name: /Lite monthly/i }));
    expect(selected).toBe('lite_monthly');
  });
});
