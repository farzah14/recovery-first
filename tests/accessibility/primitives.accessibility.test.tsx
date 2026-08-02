import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

describe('Primitives Accessibility', () => {
  it('renders Button with accessible text role', () => {
    const { getByRole } = render(<Button>Click Me</Button>);
    expect(getByRole('button', { name: 'Click Me' })).toBeVisible();
  });

  it('renders Badge with descriptive label', () => {
    const { getByText } = render(<Badge>Active</Badge>);
    expect(getByText('Active')).toBeVisible();
  });

  it('renders Card and Input without missing labels', () => {
    const { getByPlaceholderText } = render(
      <Card>
        <Input placeholder="Enter habit name" aria-label="Habit Name" />
      </Card>,
    );
    expect(getByPlaceholderText('Enter habit name')).toBeVisible();
  });
});
