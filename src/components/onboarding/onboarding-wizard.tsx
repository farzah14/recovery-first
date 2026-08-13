'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Leaf, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccountState } from '@/components/account/account-state';
import { routes } from '@/lib/navigation/route-definitions';
import {
  normalizeHabitInput,
  normalizeProfileInput,
  ONBOARDING_STEPS,
  TIMEZONE_OPTIONS,
  WEEK_START_OPTIONS,
  type OnboardingStep,
} from '@/domain/onboarding/profile-onboarding';
import {
  CATEGORY_OPTIONS,
  ICON_OPTIONS,
  CLOCK_PRESETS,
} from '@/features/habits/create-habit-dialog';
import { buildCreateHabitCommand } from '@/lib/repositories/habit-command-builders';
import {
  createBrowserProductRepository,
  getBrowserProductOwner,
} from '@/lib/repositories/signed-in/browser-product-repository';

function createCommandId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function OnboardingWizard(): React.JSX.Element {
  const router = useRouter();
  const account = useAccountState();
  const [stepIndex, setStepIndex] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const [displayName, setDisplayName] = useState(account.displayName ?? '');
  const [timezone, setTimezone] = useState(account.timezone ?? 'UTC');
  const [weekStart, setWeekStart] = useState('1');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('mindfulness');
  const [normalTarget, setNormalTarget] = useState('');
  const [minimumTarget, setMinimumTarget] = useState('');
  const [habitIcon, setHabitIcon] = useState('meditation');
  const [fromTime, setFromTime] = useState('08:00');
  const [untilTime, setUntilTime] = useState('09:00');
  const [timingContext, setTimingContext] = useState('08:00 AM - 09:00 AM');
  const [startDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const step = ONBOARDING_STEPS[stepIndex] as OnboardingStep;
  const progress = Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100);

  const repository = useMemo(() => createBrowserProductRepository(account), [account]);
  const owner = useMemo(() => getBrowserProductOwner(account), [account]);

  async function saveConsentStep(): Promise<void> {
    if (!consentChecked) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setErrorMessage(null);
    setStepIndex(1);
  }

  async function saveProfileStep(): Promise<void> {
    const accountId = account.accountId;
    if (!accountId) {
      setErrorMessage('Your account is not ready yet. Please try again.');
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    try {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();
      const profile = normalizeProfileInput({
        displayName,
        timezone,
        weekStart: Number.parseInt(weekStart, 10),
        quietHoursStart: quietHoursEnabled ? quietHoursStart : null,
        quietHoursEnd: quietHoursEnabled ? quietHoursEnd : null,
      });
      const { error } = await supabase.from('profiles').update(profile).eq('id', accountId);
      if (error) {
        setErrorMessage('We could not save your preferences. Please try again.');
        return;
      }
      setStepIndex(2);
    } finally {
      setSaving(false);
    }
  }

  async function saveFirstHabitStep(): Promise<void> {
    const accountId = account.accountId;
    if (!habitName.trim()) {
      setErrorMessage('Give your first habit a name to continue.');
      return;
    }
    if (!accountId) {
      setErrorMessage('Your account is not ready yet. Please try again.');
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    try {
      if (repository && owner) {
        const categoryLabel =
          CATEGORY_OPTIONS.find((c) => c.id === habitCategory)?.label || 'Mindfulness';
        const habit = normalizeHabitInput({
          name: habitName,
          category: categoryLabel,
          normalTarget,
          minimumTarget,
          icon: habitIcon,
          startDate,
          fromTime,
          untilTime,
          timingContext,
        });
        await repository.createHabit(
          buildCreateHabitCommand(habit, owner, {
            habitId: createCommandId(),
            habitVersionId: createCommandId(),
            commandId: createCommandId(),
            now: new Date().toISOString(),
          }),
        );
      }

      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', accountId);
      if (error) {
        setErrorMessage('We could not finish setting up your account. Please try again.');
        return;
      }
      router.push(routes.today);
      router.refresh();
    } catch {
      setErrorMessage('We could not create your first habit. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const selectedClock = CLOCK_PRESETS.find(
    (preset) => preset.from === fromTime && preset.until === untilTime,
  );

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--color-page)] p-4 sm:p-8">
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-30">
        <div className="absolute -top-[200px] -right-[200px] h-[800px] w-[800px] rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-[100px] -left-[100px] h-[600px] w-[600px] rounded-full bg-emerald-300/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[520px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)]">
            <ShieldCheck className="size-4" />
            <span>
              Step {stepIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {step === 'consent' ? (
          <section aria-labelledby="consent-heading">
            <h1
              id="consent-heading"
              className="text-2xl font-bold text-[var(--color-text-primary)]"
            >
              Welcome to Recovery First
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Before you begin, please review and accept our terms.
            </p>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <Checkbox
                checked={consentChecked}
                onCheckedChange={(checked) => {
                  setConsentChecked(checked === true);
                  setErrorMessage(null);
                }}
                aria-label="Accept terms and privacy policy"
              />
              <span className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                I agree to the{' '}
                <Link
                  className="font-semibold text-[var(--color-primary)] hover:underline"
                  href={routes.terms}
                  target="_blank"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  className="font-semibold text-[var(--color-primary)] hover:underline"
                  href={routes.privacy}
                  target="_blank"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {errorMessage ? (
              <p role="alert" className="mt-4 text-sm text-[var(--color-danger)]">
                {errorMessage}
              </p>
            ) : null}

            <Button className="mt-6" fullWidth onClick={() => void saveConsentStep()} size="touch">
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </section>
        ) : null}

        {step === 'profile' ? (
          <section aria-labelledby="profile-heading">
            <h1
              id="profile-heading"
              className="text-2xl font-bold text-[var(--color-text-primary)]"
            >
              Set up your profile
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              These preferences keep your progress accurate in your local time.
            </p>

            <div className="mt-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex"
                  value={displayName}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Select onValueChange={setTimezone} value={timezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Week starts on
                </span>
                <RadioGroup
                  aria-label="Week start day"
                  className="flex gap-4"
                  onValueChange={setWeekStart}
                  value={weekStart}
                >
                  {WEEK_START_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem id={`week-${option.value}`} value={String(option.value)} />
                      <Label htmlFor={`week-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Quiet hours
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Pause reminders during your rest window.
                  </p>
                </div>
                <Switch
                  aria-label="Enable quiet hours"
                  checked={quietHoursEnabled}
                  onCheckedChange={setQuietHoursEnabled}
                />
              </div>

              {quietHoursEnabled ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="quiet-start">From</Label>
                    <Input
                      id="quiet-start"
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      type="time"
                      value={quietHoursStart}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="quiet-end">Until</Label>
                    <Input
                      id="quiet-end"
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      type="time"
                      value={quietHoursEnd}
                    />
                  </div>
                </div>
              ) : null}

              {errorMessage ? (
                <p role="alert" className="text-sm text-[var(--color-danger)]">
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => setStepIndex(0)} size="touch" variant="secondary">
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                disabled={saving}
                fullWidth
                onClick={() => void saveProfileStep()}
                size="touch"
              >
                {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        ) : null}

        {step === 'first-habit' ? (
          <section aria-labelledby="habit-heading">
            <h1 id="habit-heading" className="text-2xl font-bold text-[var(--color-text-primary)]">
              Create your first habit
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Start small — every habit has a Normal and a Minimum version.
            </p>

            <div className="mt-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="habit-name">Habit name</Label>
                <Input
                  id="habit-name"
                  onChange={(e) => {
                    setHabitName(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g., Morning meditation"
                  value={habitName}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="habit-category">Category</Label>
                <Select onValueChange={setHabitCategory} value={habitCategory}>
                  <SelectTrigger id="habit-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="normal-target">Normal target</Label>
                  <Input
                    id="normal-target"
                    onChange={(e) => setNormalTarget(e.target.value)}
                    placeholder="e.g., Meditate for 20 mins"
                    value={normalTarget}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="minimum-target">Minimum target</Label>
                  <Input
                    id="minimum-target"
                    onChange={(e) => setMinimumTarget(e.target.value)}
                    placeholder="e.g., Take 3 deep breaths"
                    value={minimumTarget}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">Icon</span>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => {
                    const IconComponent = icon.Icon;
                    const isSelected = habitIcon === icon.id;
                    return (
                      <button
                        aria-label={icon.label}
                        aria-pressed={isSelected}
                        className={`flex size-10 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        }`}
                        key={icon.id}
                        onClick={() => setHabitIcon(icon.id)}
                        type="button"
                      >
                        <IconComponent className="size-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Time window
                </span>
                <div className="flex flex-wrap gap-2">
                  {CLOCK_PRESETS.map((preset) => {
                    const isSelected =
                      selectedClock?.from === preset.from && selectedClock?.until === preset.until;
                    return (
                      <button
                        aria-pressed={isSelected}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]'
                        }`}
                        key={preset.label}
                        onClick={() => {
                          setFromTime(preset.from);
                          setUntilTime(preset.until);
                          setTimingContext(preset.label);
                        }}
                        type="button"
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="habit-from">From</Label>
                  <Input
                    id="habit-from"
                    onChange={(e) => setFromTime(e.target.value)}
                    type="time"
                    value={fromTime}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="habit-until">Until</Label>
                  <Input
                    id="habit-until"
                    onChange={(e) => setUntilTime(e.target.value)}
                    type="time"
                    value={untilTime}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-amber-300/70 bg-[#FFFBEB] p-4">
                <Leaf className="mt-0.5 size-4 shrink-0 text-[#F59E0B]" />
                <p className="text-xs leading-relaxed text-amber-900">
                  Your Minimum target is your recovery-first fallback. Missing a full session is
                  never a failure — your Minimum keeps you moving.
                </p>
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-[var(--color-danger)]">
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => setStepIndex(1)} size="touch" variant="secondary">
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                disabled={saving}
                fullWidth
                onClick={() => void saveFirstHabitStep()}
                size="touch"
              >
                {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                <CheckCircle2 className="size-4" />
                Finish setup
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
