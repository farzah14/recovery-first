import type { Json } from '@/lib/supabase/database.types';
import type { HabitCue } from '@/lib/repositories/product-repository';
import type { RecurrenceRule } from '@/domain/habits/recurrence';

export type HabitVersionPayload = {
  description: string;
  icon: string;
  fromTime: string;
  untilTime: string;
  timingContext: string;
  startLocalDate: string;
  recurrence: RecurrenceRule;
  cue: HabitCue;
};

export type DatabaseSessionStatus =
  'unrecorded' | 'full' | 'minimum' | 'manual_skipped' | 'automatic_skipped' | 'excused';

export type TodayOutcome = 'unrecorded' | 'full' | 'minimum' | 'skipped';

export function encodeHabitVersionPayload(payload: HabitVersionPayload): Json {
  return {
    version: 1,
    description: payload.description,
    icon: payload.icon,
    fromTime: payload.fromTime,
    untilTime: payload.untilTime,
    timingContext: payload.timingContext,
    startLocalDate: payload.startLocalDate,
    recurrence: payload.recurrence,
    cue: payload.cue,
  };
}

function isRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecurrenceRule(value: Json | undefined): value is RecurrenceRule {
  if (!isRecord(value) || typeof value.kind !== 'string') return false;
  if (value.kind === 'daily') return true;
  if (value.kind === 'weekdays' || value.kind === 'times_per_week') {
    const days = value.kind === 'weekdays' ? value.weekdays : value.placement;
    return Array.isArray(days) && days.every((day) => typeof day === 'number');
  }
  return (
    value.kind === 'finite_dates' &&
    Array.isArray(value.dates) &&
    value.dates.every((date) => typeof date === 'string')
  );
}

function isHabitCue(value: Json | undefined): value is HabitCue {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  return (
    value.type === 'time' ||
    value.type === 'after_activity' ||
    value.type === 'location' ||
    value.type === 'none'
  );
}

export function decodeHabitVersionPayload(value: Json | null | undefined): HabitVersionPayload {
  const record = isRecord(value) ? value : {};
  return {
    description: typeof record.description === 'string' ? record.description : '',
    icon: typeof record.icon === 'string' ? record.icon : 'meditation',
    fromTime: typeof record.fromTime === 'string' ? record.fromTime : '08:00',
    untilTime: typeof record.untilTime === 'string' ? record.untilTime : '09:00',
    timingContext:
      typeof record.timingContext === 'string' ? record.timingContext : '08:00 AM - 09:00 AM',
    startLocalDate:
      typeof record.startLocalDate === 'string' ? record.startLocalDate : '1970-01-01',
    recurrence: isRecurrenceRule(record.recurrence) ? record.recurrence : { kind: 'daily' },
    cue: isHabitCue(record.cue) ? record.cue : { type: 'none', value: null },
  };
}

export function mapSessionStatusToOutcome(status: DatabaseSessionStatus): TodayOutcome {
  if (status === 'full') return 'full';
  if (status === 'minimum') return 'minimum';
  if (status === 'manual_skipped' || status === 'automatic_skipped' || status === 'excused') {
    return 'skipped';
  }
  return 'unrecorded';
}
