import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';

describe('action primitives', () => {
  it('invokes an enabled primary button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Continue</Button>);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('requires an accessible label for an icon-only button', () => {
    render(<IconButton label="Open menu">M</IconButton>);

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });
});
