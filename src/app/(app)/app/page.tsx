import { redirect } from 'next/navigation';
import { routes } from '@/lib/navigation/route-definitions';

export const metadata = {
  title: 'Today Dashboard | RecoveryFirst',
};

export default function ApplicationIndexPage(): void {
  redirect(routes.today);
}
