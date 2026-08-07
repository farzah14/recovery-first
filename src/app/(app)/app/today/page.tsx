import { AppShell } from '@/components/layout/app-shell';
import { TodayPageClient } from '@/features/today/components/today-page-client';

export const metadata = {
  title: 'Today Dashboard | RecoveryFirst',
  description: 'Track todayâ€™s scheduled habit sessions with Full, Minimum, or Skipped outcomes.',
};

export default function TodayDashboardPage(): React.JSX.Element {
  return (
    <AppShell>
      <TodayPageClient />
    </AppShell>
  );
}
