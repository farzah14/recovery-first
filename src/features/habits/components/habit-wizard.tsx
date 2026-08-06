'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { habitFormSchema } from '@/features/habits/forms/habit-form-schema';
import { createHabitFormDefaults } from '@/features/habits/forms/habit-form-defaults';
import type { HabitFormValues } from '@/features/habits/forms/habit-form-types';
import { activeLimitOptions } from '@/features/habits/application/activate-habit';
import { activeHabitLimitFor } from '@/domain/habits/active-slot-policy';
import { createHabit } from '@/features/habits/application/create-habit';
import { saveHabitDraft } from '@/features/habits/application/save-habit-draft';
import { ActiveLimitDialog } from '@/features/habits/components/active-limit-dialog';
import { HabitWizardFooter } from '@/features/habits/components/habit-wizard-footer';
import { LeaveDraftDialog } from '@/features/habits/components/leave-draft-dialog';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const steps = [
  'Goal and name',
  'Normal and Minimum',
  'Schedule and cue',
  'Optional reminder',
  'Review and create',
] as const;

const weekdays = [
  [1, 'Monday'],
  [2, 'Tuesday'],
  [3, 'Wednesday'],
  [4, 'Thursday'],
  [5, 'Friday'],
  [6, 'Saturday'],
  [7, 'Sunday'],
] as const;

type HabitWizardProps = {
  repository: ProductRepository;
  owner: ProductOwner;
  initialValues?: HabitFormValues;
  onNavigate?: (path: string) => void;
  activeHabits?: Array<{ id: string; title: string }>;
};

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `habit-${Date.now()}-${Math.random()}`;
}

function ErrorMessage({ id, message }: { id: string; message: unknown }): React.JSX.Element | null {
  return typeof message === 'string' ? (
    <p id={id} className="text-sm text-[var(--color-danger)]">
      {message}
    </p>
  ) : null;
}

export function HabitWizard({
  repository,
  owner,
  initialValues,
  onNavigate,
  activeHabits = [],
}: HabitWizardProps): React.JSX.Element {
  const defaultValues = useMemo(
    () =>
      initialValues ??
      createHabitFormDefaults({
        timezone: owner.timezone,
        startLocalDate: new Date().toISOString().slice(0, 10),
      }),
    [initialValues, owner.timezone],
  );
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues,
    mode: 'onBlur',
    shouldUnregister: false,
  });
  const [step, setStep] = useState(1);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const values = useWatch({ control: form.control });
  const errors = form.formState.errors;
  const isFormDirty =
    form.formState.isDirty || JSON.stringify(form.getValues()) !== JSON.stringify(defaultValues);
  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
      return;
    }
    window.location.assign(path);
  };

  const stepFields: Array<Array<keyof HabitFormValues>> = [
    ['category', 'title'],
    [
      'normalAction',
      'normalQuantity',
      'normalUnit',
      'minimumAction',
      'minimumQuantity',
      'minimumUnit',
    ],
    ['recurrenceKind', 'weekdays', 'timesPerWeek', 'cueType', 'cueValue', 'timezone'],
    ['reminderEnabled', 'reminderLocalTime'],
    [],
  ];

  const goNext = async () => {
    const valid = await form.trigger(stepFields[step - 1]);
    if (valid) setStep((current) => Math.min(5, current + 1));
  };

  const handleCreate = form.handleSubmit(async (submittedValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createHabit({
        repository,
        values: submittedValues,
        identity: owner,
        ids: { commandId: newId(), habitId: newId(), habitVersionId: newId() },
        now: new Date().toISOString(),
      });
      if (result.kind === 'active_limit') {
        setLimitOpen(true);
        return;
      }
      navigate('/app/today');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Habit could not be created.');
    } finally {
      setSubmitting(false);
    }
  });

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      await saveHabitDraft({
        repository,
        owner,
        draftId: 'new-habit',
        draft: { step: step as 1 | 2 | 3 | 4 | 5, values: form.getValues() },
        now: new Date().toISOString(),
      });
      setLeaveOpen(false);
      navigate('/app/habits');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDiscard = async () => {
    await repository.deleteHabitDraft(owner, 'new-habit');
    setLeaveOpen(false);
    navigate('/app/habits');
  };

  const updateWeekday = (day: number, checked: boolean) => {
    const current = form.getValues('weekdays');
    const next = checked ? [...new Set([...current, day])] : current.filter((item) => item !== day);
    form.setValue(
      'weekdays',
      next.sort((left, right) => left - right) as HabitFormValues['weekdays'],
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Create a habit</p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
              A plan with a smaller option
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
              Define a Normal action and a Minimum action so continuity remains possible on
              difficult days.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => (isFormDirty ? setLeaveOpen(true) : navigate('/app/habits'))}
          >
            Leave wizard
          </Button>
        </div>

        <ol aria-label="Habit creation progress" className="mb-8 grid gap-2 sm:grid-cols-5">
          {steps.map((label, index) => {
            const number = index + 1;
            return (
              <li key={label}>
                <button
                  type="button"
                  className="w-full rounded-md border border-[var(--color-border)] px-2 py-2 text-left text-xs focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-focus)_24%,transparent)] focus-visible:outline-none"
                  aria-current={number === step ? 'step' : undefined}
                  onClick={() => number < step && setStep(number)}
                >
                  <span className="block font-semibold text-[var(--color-text-primary)]">
                    {number}. {label}
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {number === step ? 'Current step' : number < step ? 'Complete' : 'Upcoming'}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <form onSubmit={step === 5 ? handleCreate : (event) => event.preventDefault()} noValidate>
          {step === 1 ? (
            <fieldset className="grid gap-5" aria-labelledby="goal-step-title">
              <legend id="goal-step-title" className="text-xl font-semibold">
                Goal and name
              </legend>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Choose a private goal category and give the habit a concise name.
              </p>
              <div className="grid gap-2">
                <label htmlFor="habit-category" className="text-sm font-semibold">
                  Goal category
                </label>
                <select
                  id="habit-category"
                  className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
                  {...form.register('category')}
                >
                  <option value="movement">Movement</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="learning">Learning</option>
                  <option value="sleep">Sleep</option>
                  <option value="planning">Planning</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="habit-name" className="text-sm font-semibold">
                  Habit name
                </label>
                <Input
                  id="habit-name"
                  aria-describedby={errors.title ? 'habit-name-error' : undefined}
                  aria-invalid={Boolean(errors.title)}
                  {...form.register('title')}
                />
                <ErrorMessage id="habit-name-error" message={errors.title?.message} />
              </div>
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset className="grid gap-5" aria-labelledby="targets-step-title">
              <legend id="targets-step-title" className="text-xl font-semibold">
                Normal and Minimum
              </legend>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Minimum is a successful continuity outcome, not a failure state.
              </p>
              <div className="grid gap-4 rounded-lg border border-[var(--color-border)] p-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <label htmlFor="normal-action" className="text-sm font-semibold">
                    Normal action
                  </label>
                  <Input
                    id="normal-action"
                    aria-describedby={errors.normalAction ? 'normal-action-error' : undefined}
                    aria-invalid={Boolean(errors.normalAction)}
                    {...form.register('normalAction')}
                  />
                  <ErrorMessage id="normal-action-error" message={errors.normalAction?.message} />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="normal-quantity" className="text-sm font-semibold">
                    Normal quantity
                  </label>
                  <Input
                    id="normal-quantity"
                    type="number"
                    min="0"
                    step="any"
                    {...form.register('normalQuantity', {
                      setValueAs: (value) => (value === '' ? null : Number(value)),
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="normal-unit" className="text-sm font-semibold">
                    Normal unit
                  </label>
                  <Input
                    id="normal-unit"
                    {...form.register('normalUnit', {
                      setValueAs: (value) => value.trim() || null,
                    })}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <label htmlFor="minimum-action" className="text-sm font-semibold">
                    Minimum action
                  </label>
                  <Input
                    id="minimum-action"
                    aria-describedby={errors.minimumAction ? 'minimum-action-error' : undefined}
                    aria-invalid={Boolean(errors.minimumAction)}
                    {...form.register('minimumAction')}
                  />
                  <ErrorMessage id="minimum-action-error" message={errors.minimumAction?.message} />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="minimum-quantity" className="text-sm font-semibold">
                    Minimum quantity
                  </label>
                  <Input
                    id="minimum-quantity"
                    type="number"
                    min="0"
                    step="any"
                    {...form.register('minimumQuantity', {
                      setValueAs: (value) => (value === '' ? null : Number(value)),
                    })}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="minimum-unit" className="text-sm font-semibold">
                    Minimum unit
                  </label>
                  <Input
                    id="minimum-unit"
                    {...form.register('minimumUnit', {
                      setValueAs: (value) => value.trim() || null,
                    })}
                  />
                </div>
              </div>
            </fieldset>
          ) : null}

          {step === 3 ? (
            <fieldset className="grid gap-5" aria-labelledby="schedule-step-title">
              <legend id="schedule-step-title" className="text-xl font-semibold">
                Schedule and cue
              </legend>
              <div className="grid gap-2">
                <label htmlFor="recurrence-kind" className="text-sm font-semibold">
                  Schedule
                </label>
                <select
                  id="recurrence-kind"
                  className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
                  {...form.register('recurrenceKind')}
                >
                  <option value="daily">Every day</option>
                  <option value="weekdays">Selected weekdays</option>
                  <option value="times_per_week">Times per week</option>
                </select>
              </div>
              {values.recurrenceKind !== 'daily' ? (
                <div className="grid gap-2" aria-label="Weekdays">
                  <span className="text-sm font-semibold">Placement days</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {weekdays.map(([day, label]) => (
                      <label
                        key={day}
                        className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={values.weekdays?.includes(day) ?? false}
                          onChange={(event) => updateWeekday(day, event.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <ErrorMessage id="weekdays-error" message={errors.weekdays?.message} />
                </div>
              ) : null}
              {values.recurrenceKind === 'times_per_week' ? (
                <div className="grid gap-2">
                  <label htmlFor="times-per-week" className="text-sm font-semibold">
                    Times per week
                  </label>
                  <Input
                    id="times-per-week"
                    type="number"
                    min="1"
                    max="7"
                    {...form.register('timesPerWeek', {
                      setValueAs: (value) => (value === '' ? null : Number(value)),
                    })}
                  />
                  <ErrorMessage id="times-per-week-error" message={errors.timesPerWeek?.message} />
                </div>
              ) : null}
              <div className="grid gap-2">
                <label htmlFor="cue-type" className="text-sm font-semibold">
                  Cue type
                </label>
                <select
                  id="cue-type"
                  className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
                  {...form.register('cueType')}
                >
                  <option value="none">No cue</option>
                  <option value="after_activity">After an activity</option>
                  <option value="time">At a time</option>
                  <option value="location">At a location</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="cue-value" className="text-sm font-semibold">
                  Cue details
                </label>
                <Input
                  id="cue-value"
                  {...form.register('cueValue', { setValueAs: (value) => value.trim() || null })}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="habit-timezone" className="text-sm font-semibold">
                  Timezone used for sessions
                </label>
                <Input id="habit-timezone" readOnly {...form.register('timezone')} />
              </div>
            </fieldset>
          ) : null}

          {step === 4 ? (
            <fieldset className="grid gap-5" aria-labelledby="reminder-step-title">
              <legend id="reminder-step-title" className="text-xl font-semibold">
                Optional reminder
              </legend>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Reminders are optional and do not change whether a session can be completed.
              </p>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--color-border)] px-3 text-sm">
                <input type="checkbox" {...form.register('reminderEnabled')} />
                Enable an in-app reminder
              </label>
              {values.reminderEnabled ? (
                <div className="grid gap-2">
                  <label htmlFor="reminder-time" className="text-sm font-semibold">
                    Reminder time
                  </label>
                  <Input
                    id="reminder-time"
                    type="time"
                    aria-describedby={errors.reminderLocalTime ? 'reminder-time-error' : undefined}
                    aria-invalid={Boolean(errors.reminderLocalTime)}
                    {...form.register('reminderLocalTime', {
                      setValueAs: (value) => value || null,
                    })}
                  />
                  <ErrorMessage
                    id="reminder-time-error"
                    message={errors.reminderLocalTime?.message}
                  />
                </div>
              ) : null}
            </fieldset>
          ) : null}

          {step === 5 ? (
            <fieldset className="grid gap-5" aria-labelledby="review-step-title">
              <legend id="review-step-title" className="text-xl font-semibold">
                Review and create
              </legend>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Review the values you entered before creating this habit.
              </p>
              <dl className="grid gap-3 rounded-lg border border-[var(--color-border)] p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold">Habit name</dt>
                  <dd>{values.title}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Category</dt>
                  <dd>{values.category}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Normal</dt>
                  <dd>{values.normalAction}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Minimum</dt>
                  <dd>{values.minimumAction}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Schedule</dt>
                  <dd>{values.recurrenceKind}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Cue</dt>
                  <dd>{values.cueValue ?? 'None'}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Reminder</dt>
                  <dd>{values.reminderEnabled ? values.reminderLocalTime : 'Off'}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Start date</dt>
                  <dd>{values.startLocalDate}</dd>
                </div>
              </dl>
              <Alert tone="info">
                <p className="font-semibold">
                  Uses 1 of {activeHabitLimitFor(owner.planTier)} active habit slots
                </p>
                <p className="mt-1 text-sm">
                  The first eligible session appears from {values.startLocalDate} in{' '}
                  {values.timezone}.
                </p>
              </Alert>
              {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
            </fieldset>
          ) : null}

          <HabitWizardFooter
            step={step}
            isSubmitting={submitting}
            onBack={() => setStep((current) => Math.max(1, current - 1))}
            onNext={() => void goNext()}
          />
        </form>
      </CardContent>
      <LeaveDraftDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onSave={() => void handleSaveDraft()}
        onDiscard={() => void handleDiscard()}
        onContinue={() => setLeaveOpen(false)}
        isSaving={savingDraft}
      />
      <ActiveLimitDialog
        open={limitOpen}
        onOpenChange={setLimitOpen}
        planTier={owner.planTier}
        activeHabits={activeHabits}
        onResolve={(resolution) => {
          setLimitOpen(false);
          if (resolution.action === 'create_account') navigate('/auth/sign-up');
        }}
      />
    </Card>
  );
}

export { activeLimitOptions };
