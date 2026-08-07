import { TodayDashboard } from '@/features/today/today-dashboard';

export const metadata = {
  title: 'Today Dashboard | RecoveryFirst',
  description: 'Track todayâ€™s scheduled habit sessions with Full, Minimum, or Skipped outcomes.',
};

export default function TodayDashboardPage(): React.JSX.Element {
  return <TodayDashboard />;
}
