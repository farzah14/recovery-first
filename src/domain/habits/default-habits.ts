export interface HabitRecord {
  id: string;
  name: string;
  category: string;
  normalTarget: string;
  minimumTarget: string;
  schedule: string;
  cue?: string;
  status: 'Active' | 'Paused' | 'Archived';
  createdDate: string;
  iconName: string;
  fromTime?: string;
  untilTime?: string;
  timingContext?: string;
  description?: string;
  streak?: number;
  consistency?: number;
  version?: string;
}

/**
 * The browser-local demo records are the initial Library contents.
 * Today and Weekly Overview read this same record set through the storage adapter.
 */
export const DEFAULT_HABITS: readonly HabitRecord[] = [
  {
    id: 'h1',
    name: 'Daily Meditation',
    category: 'Mindfulness',
    normalTarget: '30 mins meditation',
    minimumTarget: '5 mins stretching',
    schedule: 'Daily (08:00 AM - 09:00 AM)',
    cue: 'After morning coffee / 08:00 AM Notification',
    status: 'Active',
    createdDate: 'Oct 12, 2023',
    iconName: '🧘‍♂️',
    timingContext: '08:00 AM - 09:00 AM',
    fromTime: '08:00',
    untilTime: '09:00',
    description: 'A moment of grounding to start the day with clarity and intention.',
    streak: 12,
    consistency: 92,
    version: 'v3',
  },
  {
    id: 'h2',
    name: 'Hydration & Water',
    category: 'Health',
    normalTarget: '2.5 Liters water',
    minimumTarget: '1 Liter water',
    schedule: 'Daily (09:00 AM - 05:00 PM)',
    cue: 'Desk water bottle refilled',
    status: 'Active',
    createdDate: 'Jan 05, 2024',
    iconName: '💧',
    timingContext: '09:00 AM - 05:00 PM',
    fromTime: '09:00',
    untilTime: '17:00',
    description: 'Stay properly hydrated throughout work hours.',
    streak: 8,
    consistency: 85,
    version: 'v1',
  },
  {
    id: 'h3',
    name: 'Read Tech Documentation',
    category: 'Learning',
    normalTarget: '30 mins reading',
    minimumTarget: '5 mins article skim',
    schedule: 'Weekdays (07:00 PM - 08:00 PM)',
    cue: 'After evening meal',
    status: 'Paused',
    createdDate: 'Nov 20, 2023',
    iconName: '📚',
    timingContext: '07:00 PM - 08:00 PM',
    fromTime: '19:00',
    untilTime: '20:00',
    description: 'Continuous professional reading and technical development.',
    streak: 0,
    consistency: 64,
    version: 'v2',
  },
];
