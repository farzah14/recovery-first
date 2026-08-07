import type { Metadata } from 'next';

import { HabitDetailClient } from '@/features/habits/components/habit-detail-client';

export const metadata: Metadata = {
  title: 'Habit History | RecoveryFirst',
  description: 'Review immutable habit session history.',
};

export default async function HabitHistoryPage({
  params,
}: {
  params: Promise<{ habitId: string }>;
}): Promise<React.JSX.Element> {
  const { habitId } = await params;
  return <HabitDetailClient habitId={habitId} initialTab="History" />;
}
