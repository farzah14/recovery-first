import type {
  CreateHabitCommand,
  HabitTarget,
  ProductOwner,
  UpdateHabitVersionCommand,
} from '@/lib/repositories/product-repository';

export type HabitFormInput = {
  name: string;
  category: string;
  normalTarget: string;
  minimumTarget: string;
  icon: string;
  startDate: string;
  fromTime: string;
  untilTime: string;
  timingContext: string;
  description?: string;
};

type CommandIds = {
  habitId: string;
  habitVersionId: string;
  commandId: string;
};

function targetFromText(value: string, fallback: string): HabitTarget {
  const label = value.trim() || fallback;
  return {
    action: label,
    quantity: null,
    unit: null,
    estimatedMinutes: null,
    label,
  };
}

function presentationFromForm(form: HabitFormInput): {
  description: string;
  icon: string;
  fromTime: string;
  untilTime: string;
  timingContext: string;
  startLocalDate: string;
} {
  const normalTarget = form.normalTarget.trim() || 'Normal version';
  const minimumTarget = form.minimumTarget.trim() || 'Minimum version';
  return {
    description: form.description?.trim() || `Target: ${normalTarget} (Min: ${minimumTarget})`,
    icon: form.icon || 'meditation',
    fromTime: form.fromTime || '08:00',
    untilTime: form.untilTime || '09:00',
    timingContext: form.timingContext.trim() || '08:00 AM - 09:00 AM',
    startLocalDate: form.startDate || new Date().toISOString().slice(0, 10),
  };
}

export function buildCreateHabitCommand(
  form: HabitFormInput,
  owner: ProductOwner,
  ids: CommandIds & { now: string },
): CreateHabitCommand {
  const presentation = presentationFromForm(form);
  return {
    commandId: ids.commandId,
    habitId: ids.habitId,
    habitVersionId: ids.habitVersionId,
    owner,
    title: form.name.trim(),
    category: form.category,
    normalTarget: targetFromText(form.normalTarget, 'Normal version'),
    minimumTarget: targetFromText(form.minimumTarget, 'Minimum version'),
    recurrence: { kind: 'daily' },
    cue: { type: 'time', value: presentation.fromTime },
    presentation,
    reminderIntent: { enabled: false, localTime: null },
    startLocalDate: presentation.startLocalDate,
    activate: true,
    clientCreatedAt: ids.now,
  };
}

export function buildHabitVersionCommand(
  form: HabitFormInput,
  owner: ProductOwner,
  ids: CommandIds & { expectedRevision: number },
): UpdateHabitVersionCommand {
  const presentation = presentationFromForm(form);
  return {
    commandId: ids.commandId,
    habitId: ids.habitId,
    habitVersionId: ids.habitVersionId,
    owner,
    title: form.name.trim(),
    category: form.category,
    expectedRevision: ids.expectedRevision,
    normalTarget: targetFromText(form.normalTarget, 'Normal version'),
    minimumTarget: targetFromText(form.minimumTarget, 'Minimum version'),
    recurrence: { kind: 'daily' },
    cue: { type: 'time', value: presentation.fromTime },
    presentation,
    source: 'redesign',
  };
}
