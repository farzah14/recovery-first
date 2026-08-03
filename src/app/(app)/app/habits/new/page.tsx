import type { Metadata } from 'next';

import { HabitWizardClient } from '@/features/habits/components/habit-wizard-client';

export const metadata: Metadata = {
  title: 'Create Habit | RecoveryFirst',
  description: 'Create a Normal and Minimum habit plan.',
};

export default function NewHabitPage(): React.JSX.Element {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <HabitWizardClient />
    </main>
  );
}
