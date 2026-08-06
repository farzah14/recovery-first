import { HabitsManagement } from '@/features/habits/habits-management';

export const metadata = {
  title: 'Habits Library | RecoveryFirst',
  description: 'Manage habit definitions, minimum baselines, categories, and active routines.',
};

export default function ApplicationHabitsPage(): React.JSX.Element {
  return <HabitsManagement />;
}
