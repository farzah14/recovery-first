import React from 'react';
import { BarChart3, Bell, Clock, Sparkles, TrendingUp } from 'lucide-react';

import type { AccountSurfacesRead } from '@/server/account/account-surfaces';

const unavailableMessage = 'Account data is temporarily unavailable. Please try again shortly.';

function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}

function weeklyResiliencePercentage(read: AccountSurfacesRead): number | null {
  if (read.review.resolvedSessions === 0) return null;
  return Math.round((read.review.successfulSessions / read.review.resolvedSessions) * 10000) / 100;
}

export function ReviewPanel({ read }: { read: AccountSurfacesRead }): React.JSX.Element {
  const empty = read.status === 'ready' && read.review.resolvedSessions === 0;

  return (
    <section
      aria-labelledby="weekly-review-panel-title"
      className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2
            id="weekly-review-panel-title"
            className="text-base font-bold text-[var(--color-text-primary)]"
          >
            Weekly resilience from your sessions
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {read.review.startDate} to {read.review.endDate}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-center">
          <span className="text-2xl font-bold text-[var(--color-primary)]">
            {formatPercentage(
              read.status === 'unavailable' ? null : weeklyResiliencePercentage(read),
            )}
          </span>
          <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
            Weekly Resilience
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-center">
          <span className="text-2xl font-bold text-[var(--color-primary)]">
            {read.status === 'unavailable' ? '—' : read.review.successfulSessions}
          </span>
          <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
            Successful Sessions
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4 text-center">
          <span className="text-2xl font-bold text-amber-500">
            {read.status === 'unavailable' ? '—' : read.review.minimumSessions}
          </span>
          <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
            Minimum baseline sessions
          </p>
        </div>
      </div>

      {read.status === 'unavailable' ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          {unavailableMessage}
        </p>
      ) : empty ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          No sessions recorded for this week yet.
        </p>
      ) : read.review.pendingItems > 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {read.review.pendingItems} open review items
        </p>
      ) : null}
    </section>
  );
}

export function InsightsPanel({ read }: { read: AccountSurfacesRead }): React.JSX.Element {
  return (
    <section
      aria-labelledby="insights-panel-title"
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
    >
      <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2
            id="insights-panel-title"
            className="text-sm font-bold text-[var(--color-text-primary)]"
          >
            Consistency Breakdown
          </h2>
          <TrendingUp className="size-5 text-[var(--color-primary)]" />
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Rates calculated from your persisted resolved sessions.
        </p>
        <div className="flex items-center justify-around pt-4 text-center">
          <div>
            <span className="text-3xl font-extrabold text-[var(--color-primary)]">
              {formatPercentage(read.insights.fullTargetRate)}
            </span>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Normal Target Rate</p>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-amber-500">
              {formatPercentage(read.insights.nonZeroRate)}
            </span>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Non-Zero Baseline Rate</p>
          </div>
        </div>
        {read.status === 'ready' &&
        read.insights.fullTargetRate === null &&
        read.insights.nonZeroRate === null ? (
          <p role="status" className="text-sm text-[var(--color-text-muted)]">
            No sessions recorded for this week yet.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
          <BarChart3 className="size-5 text-[var(--color-primary)]" />
          <span>Smart Recommendations</span>
        </div>
        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
          {read.status === 'unavailable'
            ? unavailableMessage
            : (read.insights.recommendation ?? 'No recommendation available yet.')}
        </p>
      </div>
    </section>
  );
}

function reminderChannelLabel(channel: 'web_push' | 'email'): string {
  return channel === 'web_push' ? 'Web Push' : 'Email';
}

function reminderStatusLabel(config: AccountSurfacesRead['reminders']['configs'][number]): string {
  if (!config.enabled) return 'Disabled';
  if (config.registration === 'needs_permission') return 'Needs browser permission';
  return 'Enabled';
}

export function RemindersPanel({ read }: { read: AccountSurfacesRead }): React.JSX.Element {
  return (
    <section
      aria-labelledby="reminders-panel-title"
      className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Bell className="size-5 text-[var(--color-primary)]" />
        <div>
          <h2
            id="reminders-panel-title"
            className="text-sm font-bold text-[var(--color-text-primary)]"
          >
            Configured reminder schedules
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Schedules show account settings; enabled does not guarantee delivery.
          </p>
        </div>
      </div>

      {read.status === 'unavailable' ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          {unavailableMessage}
        </p>
      ) : read.reminders.configs.length === 0 ? (
        <p role="status" className="text-sm text-[var(--color-text-muted)]">
          No reminder schedules configured yet.
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {read.reminders.configs.map((config) => (
            <div
              key={`${config.habitId}-${config.channel}`}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-[var(--color-primary)]" />
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {config.habitTitle}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {config.localTime} · {config.timezone} · {reminderChannelLabel(config.channel)}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[var(--color-emerald-50)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                {reminderStatusLabel(config)}
              </span>
            </div>
          ))}
        </div>
      )}

      {read.status === 'ready' ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          {read.reminders.emailOptIn
            ? 'Email reminders are opted in.'
            : 'Email reminders are not opted in.'}
        </p>
      ) : null}
    </section>
  );
}
