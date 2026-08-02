import {
  Bell,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardCheck,
  House,
  ListChecks,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export const routes = {
  home: '/',
  features: '/features',
  howItWorks: '/how-it-works',
  about: '/about',
  pricing: '/pricing',
  help: '/help',
  status: '/status',
  privacy: '/privacy',
  terms: '/terms',
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  app: '/app',
  today: '/app/today',
  habits: '/app/habits',
  review: '/app/review',
  insights: '/app/insights',
  reminders: '/app/reminders',
  settings: '/app/settings',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export type NavigationItem = Readonly<{
  label: string;
  href: AppRoute;
  icon: LucideIcon;
  mobilePrimary: boolean;
}>;

export const publicNavigation = [
  { label: 'Features', href: routes.features },
  { label: 'How It Works', href: routes.howItWorks },
  { label: 'Pricing', href: routes.pricing },
  { label: 'Help', href: routes.help },
] as const;

export const applicationNavigation: readonly NavigationItem[] = [
  { label: 'Today', href: routes.today, icon: House, mobilePrimary: true },
  { label: 'Habits', href: routes.habits, icon: ListChecks, mobilePrimary: true },
  { label: 'Review', href: routes.review, icon: ClipboardCheck, mobilePrimary: true },
  { label: 'Insights', href: routes.insights, icon: ChartNoAxesCombined, mobilePrimary: true },
  { label: 'Reminders', href: routes.reminders, icon: Bell, mobilePrimary: false },
  { label: 'Settings', href: routes.settings, icon: Settings, mobilePrimary: false },
];

export const moreNavigation = [
  ...applicationNavigation.filter((item) => !item.mobilePrimary),
  { label: 'Help', href: routes.help, icon: CircleHelp, mobilePrimary: false },
] as const;
