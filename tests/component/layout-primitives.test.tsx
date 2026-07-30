import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

describe('layout primitives', () => {
  it('renders a labelled page header with optional supporting text', () => {
    render(<PageHeader title="Today" description="Your scheduled habits." />);

    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
    expect(screen.getByText('Your scheduled habits.')).toBeVisible();
  });

  it('renders a card with semantic heading content', () => {
    render(
      <ContentContainer>
        <Card>
          <CardHeader>
            <CardTitle>Daily progress</CardTitle>
          </CardHeader>
          <CardContent>Not connected</CardContent>
        </Card>
      </ContentContainer>,
    );

    expect(screen.getByRole('heading', { name: 'Daily progress' })).toBeVisible();
    expect(screen.getByText('Not connected')).toBeVisible();
  });
});
