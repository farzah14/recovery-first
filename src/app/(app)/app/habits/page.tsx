import type { Metadata } from 'next';

import { HabitListClient } from '@/features/habits/components/habit-list-client';

export const metadata: Metadata = {
  title: 'Habits Library | RecoveryFirst',
  description: 'Manage habit definitions, minimum baselines, categories, and active routines.',
};

export default function ApplicationHabitsPage(): React.JSX.Element {
  return <HabitListClient />;
}
