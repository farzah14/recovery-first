import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CheckboxField } from '@/components/forms/checkbox-field';
import { InputField } from '@/components/forms/input-field';
import { SwitchField } from '@/components/forms/switch-field';

describe('form controls', () => {
  it('associates an input with label, description, and error text', () => {
    render(
      <InputField
        id="habit-name"
        label="Habit name"
        description="Use a specific action."
        error="Habit name is required."
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Habit name' })).toHaveAccessibleDescription(
      'Use a specific action. Habit name is required.',
    );
    expect(screen.getByText('Habit name is required.')).toBeVisible();
  });

  it('supports keyboard-operable checkbox and switch labels', async () => {
    const user = userEvent.setup();
    render(
      <>
        <CheckboxField id="email-reminder" label="Email reminder" />
        <SwitchField id="browser-reminder" label="Browser reminder" />
      </>,
    );

    await user.click(screen.getByText('Email reminder'));
    await user.click(screen.getByText('Browser reminder'));

    expect(screen.getByRole('checkbox', { name: 'Email reminder' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Browser reminder' })).toBeChecked();
  });
});
