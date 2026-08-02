export const checkInOutcomes = [
  'full',
  'minimum',
  'manual_skipped',
  'automatic_skipped',
  'excused',
  'unrecorded',
] as const;

export type CheckInOutcome = (typeof checkInOutcomes)[number];

export const userRecordableCheckInOutcomes = [
  'full',
  'minimum',
  'manual_skipped',
  'excused',
] as const;

export type UserRecordableCheckInOutcome = (typeof userRecordableCheckInOutcomes)[number];

export const frictionReasons = [
  'forgot',
  'no_time',
  'too_tired',
  'target_too_heavy',
  'schedule_changed',
  'environment',
  'no_motivation',
  'other',
] as const;

export type FrictionReason = (typeof frictionReasons)[number];

export function isSuccessfulOutcome(outcome: CheckInOutcome): boolean {
  return outcome === 'full' || outcome === 'minimum';
}
