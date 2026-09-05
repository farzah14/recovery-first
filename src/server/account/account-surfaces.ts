import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { getLocalDateForTimezone, getLocalWeekRange } from '@/lib/dates/local-week';
import type { Database } from '@/lib/supabase/database.types';
import {
  mapReminderRegistration,
  normalizeRecommendation,
  summarizeSessionOutcomes,
  type AccountSessionOutcome,
} from '@/server/account/account-surface-mappers';

export type AccountSurfacesRead = {
  status: 'ready' | 'unavailable';
  review: {
    startDate: string;
    endDate: string;
    pendingItems: number;
    resolvedSessions: number;
    successfulSessions: number;
    minimumSessions: number;
  };
  insights: {
    fullTargetRate: number | null;
    nonZeroRate: number | null;
    recommendation: string | null;
  };
  reminders: {
    configs: Array<{
      habitId: string;
      habitTitle: string;
      channel: 'web_push' | 'email';
      localTime: string;
      timezone: string;
      enabled: boolean;
      registration: 'registered' | 'needs_permission' | 'not_applicable';
    }>;
    emailOptIn: boolean;
  };
};

type AccountSurfacesInput = {
  client: SupabaseClient<Database>;
  userId: string;
  timezone: string;
  now?: Date;
};

type SessionRow = Pick<
  Database['public']['Tables']['sessions']['Row'],
  'habit_id' | 'scheduled_local_date' | 'status'
>;
type ReviewSummaryRow = Pick<
  Database['public']['Views']['weekly_review_summary_view']['Row'],
  'pending_items'
>;
type RecommendationRow = Pick<
  Database['public']['Tables']['recommendations']['Row'],
  'evidence' | 'explanation_key'
>;
type ReminderConfigRow = Pick<
  Database['public']['Tables']['reminder_configs']['Row'],
  'habit_id' | 'channel' | 'local_time' | 'timezone' | 'enabled'
>;
type HabitTitleRow = Pick<Database['public']['Tables']['habits']['Row'], 'id' | 'title'>;
type EmailPreferenceRow = Pick<
  Database['public']['Tables']['email_preferences']['Row'],
  'reminder_opt_in'
>;
type PushSubscriptionRow = Pick<Database['public']['Tables']['push_subscriptions']['Row'], 'id'>;

function emptyRead(
  startDate: string,
  endDate: string,
  status: AccountSurfacesRead['status'],
): AccountSurfacesRead {
  return {
    status,
    review: {
      startDate,
      endDate,
      pendingItems: 0,
      resolvedSessions: 0,
      successfulSessions: 0,
      minimumSessions: 0,
    },
    insights: {
      fullTargetRate: null,
      nonZeroRate: null,
      recommendation: null,
    },
    reminders: {
      configs: [],
      emailOptIn: false,
    },
  };
}

function isReminderChannel(value: string): value is 'web_push' | 'email' {
  return value === 'web_push' || value === 'email';
}

export async function readAccountSurfaces({
  client,
  userId,
  timezone,
  now = new Date(),
}: AccountSurfacesInput): Promise<AccountSurfacesRead> {
  const localDate = getLocalDateForTimezone(timezone, now);
  const range = getLocalWeekRange(localDate);

  try {
    const [
      sessionsResult,
      reviewResult,
      recommendationResult,
      remindersResult,
      habitsResult,
      emailResult,
      pushResult,
    ] = await Promise.all([
      client
        .from('sessions')
        .select('habit_id,scheduled_local_date,status')
        .eq('user_id', userId)
        .gte('scheduled_local_date', range.startDate)
        .lte('scheduled_local_date', range.endDate),
      client
        .from('weekly_review_summary_view')
        .select('pending_items')
        .eq('user_id', userId)
        .order('window_end', { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from('recommendations')
        .select('explanation_key,evidence')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from('reminder_configs')
        .select('habit_id,channel,local_time,timezone,enabled')
        .eq('user_id', userId)
        .order('local_time', { ascending: true }),
      client.from('habits').select('id,title').eq('user_id', userId).is('deleted_at', null),
      client
        .from('email_preferences')
        .select('reminder_opt_in')
        .eq('user_id', userId)
        .maybeSingle(),
      client
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('capability_status', 'granted')
        .is('revoked_at', null),
    ]);

    const results = [
      sessionsResult,
      reviewResult,
      recommendationResult,
      remindersResult,
      habitsResult,
      emailResult,
      pushResult,
    ];
    if (results.some((result) => result.error)) {
      return emptyRead(range.startDate, range.endDate, 'unavailable');
    }

    const sessions = (sessionsResult.data ?? []) as SessionRow[];
    const metrics = summarizeSessionOutcomes(
      sessions.map(({ status }) => ({ status: status as AccountSessionOutcome })),
    );
    const habits = (habitsResult.data ?? []) as HabitTitleRow[];
    const habitTitles = new Map(habits.map((habit) => [habit.id, habit.title]));
    const hasGrantedPushSubscription =
      ((pushResult.data ?? []) as PushSubscriptionRow[]).length > 0;
    const reminderConfigs = ((remindersResult.data ?? []) as ReminderConfigRow[]).flatMap(
      (config) => {
        if (!isReminderChannel(config.channel)) return [];
        const habitTitle = habitTitles.get(config.habit_id);
        if (!habitTitle) return [];
        return [
          {
            habitId: config.habit_id,
            habitTitle,
            channel: config.channel,
            localTime: config.local_time,
            timezone: config.timezone,
            enabled: config.enabled,
            registration: mapReminderRegistration(config.channel, hasGrantedPushSubscription),
          },
        ];
      },
    );
    const recommendation = recommendationResult.data
      ? normalizeRecommendation(recommendationResult.data as RecommendationRow)
      : null;
    const review = (reviewResult.data ?? null) as ReviewSummaryRow | null;
    const email = (emailResult.data ?? null) as EmailPreferenceRow | null;

    return {
      status: 'ready',
      review: {
        startDate: range.startDate,
        endDate: range.endDate,
        pendingItems: review?.pending_items ?? 0,
        resolvedSessions: metrics.resolvedSessions,
        successfulSessions: metrics.successfulSessions,
        minimumSessions: metrics.minimumSessions,
      },
      insights: {
        fullTargetRate: metrics.fullTargetRate,
        nonZeroRate: metrics.nonZeroRate,
        recommendation,
      },
      reminders: {
        configs: reminderConfigs,
        emailOptIn: email?.reminder_opt_in ?? false,
      },
    };
  } catch {
    return emptyRead(range.startDate, range.endDate, 'unavailable');
  }
}
