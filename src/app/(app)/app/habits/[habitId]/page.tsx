import type { Metadata } from 'next';

import { HabitDetailClient } from '@/features/habits/components/habit-detail-client';

export const metadata: Metadata = {
  title: 'Habit Detail | RecoveryFirst',
  description: 'Review a habit definition, versions, and session history.',
};

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ habitId: string }>;
}): Promise<React.JSX.Element> {
  const { habitId } = await params;
  return <HabitDetailClient habitId={habitId} />;
}
