import type { Metadata } from 'next';

import { routes, type AppRoute } from '@/lib/navigation/route-definitions';

const metadataByRoute: Partial<Record<AppRoute, Metadata>> = {
  [routes.home]: { title: 'Recovery First' },
  [routes.features]: { title: 'Features' },
  [routes.howItWorks]: { title: 'How It Works' },
  [routes.pricing]: { title: 'Pricing' },
  [routes.help]: { title: 'Help' },
  [routes.status]: { title: 'Status' },
  [routes.privacy]: { title: 'Privacy' },
  [routes.terms]: { title: 'Terms' },
  [routes.signIn]: { title: 'Sign In' },
  [routes.today]: { title: 'Today' },
  [routes.habits]: { title: 'Habits' },
  [routes.review]: { title: 'Review' },
  [routes.insights]: { title: 'Insights' },
  [routes.reminders]: { title: 'Reminders' },
  [routes.settings]: { title: 'Settings' },
  [routes.subscriptionSettings]: { title: 'Subscription Settings' },
};

export function metadataFor(route: AppRoute): Metadata {
  return metadataByRoute[route] ?? { title: 'Recovery First' };
}
