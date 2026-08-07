import { buildSessionIdentity } from '@/domain/habits/session-identity';
import type { LocalSessionRecord } from '@/lib/indexed-db/types';
import type { CreateHabitCommand } from '@/lib/repositories/product-repository';
import {
  isoWeekday,
  SESSION_LOOKAHEAD_DAYS,
  SESSION_LOOKBACK_DAYS,
  shiftIsoLocalDate,
  zonedLocalDateTimeToUtc,
} from '@/features/sessions/session-horizon';

export { zonedLocalDateTimeToUtc } from '@/features/sessions/session-horizon';

export function calculateSessionHorizon(todayLocalDate: string) {
  return {
    fromLocalDate: shiftIsoLocalDate(todayLocalDate, -SESSION_LOOKBACK_DAYS),
    throughLocalDate: shiftIsoLocalDate(todayLocalDate, SESSION_LOOKAHEAD_DAYS),
  };
}

function eligible(command: CreateHabitCommand, localDate: string): boolean {
  if (localDate < command.startLocalDate) return false;
  if (command.recurrence.kind === 'daily') return true;
  if (command.recurrence.kind === 'weekdays') {
    return command.recurrence.weekdays.includes(isoWeekday(localDate));
  }
  if (command.recurrence.kind === 'times_per_week') {
    return command.recurrence.placement.includes(isoWeekday(localDate));
  }
  return command.recurrence.dates.includes(localDate);
}

export function generateSessionsForCommand(
  command: CreateHabitCommand,
  throughLocalDate = shiftIsoLocalDate(command.startLocalDate, SESSION_LOOKAHEAD_DAYS),
): LocalSessionRecord[] {
  const defaultHorizon = calculateSessionHorizon(command.startLocalDate);
  const horizon = {
    fromLocalDate: defaultHorizon.fromLocalDate,
    throughLocalDate,
  };
  const sessions: LocalSessionRecord[] = [];

  for (
    let localDate = horizon.fromLocalDate;
    localDate <= horizon.throughLocalDate;
    localDate = shiftIsoLocalDate(localDate, 1)
  ) {
    if (!eligible(command, localDate)) continue;
    const scheduledLocalTime = command.cue.type === 'time' ? command.cue.value : null;
    const id = buildSessionIdentity({
      habitId: command.habitId,
      habitVersionId: command.habitVersionId,
      scheduledLocalDate: localDate,
      scheduledLocalTime,
    });
    const eligibleAt = zonedLocalDateTimeToUtc(
      localDate,
      scheduledLocalTime ? `${scheduledLocalTime}:00` : '00:00:00',
      command.owner.timezone,
    );
    const resolutionDueAt = zonedLocalDateTimeToUtc(
      shiftIsoLocalDate(localDate, 3),
      '23:59:59',
      command.owner.timezone,
    );
    sessions.push({
      id,
      ownerType: command.owner.identityMode,
      ownerId: command.owner.ownerId,
      habitId: command.habitId,
      habitVersionId: command.habitVersionId,
      scheduledLocalDate: localDate,
      scheduledLocalTime,
      timezoneSnapshot: command.owner.timezone,
      eligibleAt,
      resolutionDueAt,
      status: 'unrecorded',
      revision: 1,
      synchronizationState: 'local_only',
    });
  }
  return sessions;
}
