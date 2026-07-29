# Lifecycle, Recovery, and Weekly Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement explicit habit lifecycle transitions, Automatic Skipped resolution, Check-in Review, explainable recommendations, Recovery plans, Needs Review decisions, Weekly Review, and history-preserving redesign workflows for Guest and signed-in-compatible repositories.

**Architecture:** Pure TypeScript policy modules compute lifecycle eligibility, recommendation signals, Recovery progress, and review ordering. PostgreSQL functions enforce the same rules transactionally for account data, while Dexie mirrors the contracts for Guest mode and offline reads. Material decisions are idempotent commands; every transition, recommendation decision, version change, and review result is append-only and reversible through Change History.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Zod, TanStack Query, Dexie, Supabase PostgreSQL, SQL functions, pgTAP, Vitest, React Testing Library, Playwright, pnpm.

---

# 1. Prerequisites and Boundaries

## Prerequisites

Begin only after Plans 01–05 are verified complete. The repository must already provide:

- deterministic clock and UUID services;
- responsive application shell and operational-state components;
- immutable habit versions, sessions, check-ins, recommendations, Recovery plans, review cycles, and review items;
- RLS and generated Supabase types;
- `ProductRepository` with Guest and account-compatible implementations;
- Dexie schema version 4, durable pending operations, and synchronization state;
- Today, Create Habit, Habit Detail, and check-in workflows;
- Automatic online/offline state presentation and reminder configuration contracts.

## Explicit exclusions

This plan does not implement:

- sign-in, sign-up, password recovery, or Guest conversion;
- Premium-only recommendation algorithms or advanced analytics;
- checkout, billing, trial activation, or entitlement enforcement;
- account export, account deletion, or production purge workers;
- production observability dashboards or release certification.

## Product invariants

- Full and Minimum reset the consecutive Manual Skipped counter.
- Manual Skipped increments the counter only for eligible scheduled sessions.
- Automatic Skipped, Excused, Pause, and unscheduled days never increment the Recovery trigger.
- Recovery is triggered once after three qualifying consecutive Manual Skipped sessions.
- The first Recovery prompt may be deferred once; the system never silently applies a plan.
- Initial Recovery changes one primary variable and defaults to three eligible scheduled sessions.
- Two or three successful Full/Minimum outcomes out of three complete Recovery successfully.
- A failed Recovery produces a lighter, materially different plan.
- Two consecutive failed Recovery plans transition the habit to Needs Review.
- Weekly Review recommendations are unselected by default and may all remain unchanged.
- Redesign, Apply, Customize, Restore, Pause, Stop, Complete, Archive, Trash, and Restore preserve history.
- Automatic Skipped resolution is permanent after the three-day resolution window.
- State, decision, and version changes are idempotent and append-only.
- User-facing language remains neutral, specific, and non-diagnostic.

---

# 2. File Map

```text
src/
├── app/
│   └── (application)/
│       ├── habits/[habitId]/
│       │   ├── change-history/page.tsx
│       │   ├── recovery/page.tsx
│       │   └── review/page.tsx
│       └── review/
│           ├── page.tsx
│           └── history/page.tsx
├── domain/
│   ├── lifecycle/
│   │   ├── lifecycle-policy.ts
│   │   ├── lifecycle-transition.ts
│   │   └── lifecycle-metrics.ts
│   ├── recommendations/
│   │   ├── recommendation-engine.ts
│   │   ├── recommendation-evidence.ts
│   │   └── recommendation-priority.ts
│   ├── recovery/
│   │   ├── recovery-policy.ts
│   │   ├── recovery-progress.ts
│   │   └── recovery-target.ts
│   └── reviews/
│       ├── check-in-review-policy.ts
│       ├── weekly-review-policy.ts
│       └── weekly-review-summary.ts
├── features/
│   ├── lifecycle/
│   │   ├── lifecycle-command-service.ts
│   │   ├── lifecycle-repository.ts
│   │   └── components/
│   ├── recommendations/
│   │   ├── recommendation-command-service.ts
│   │   └── components/
│   ├── recovery/
│   │   ├── recovery-command-service.ts
│   │   ├── recovery-repository.ts
│   │   └── components/
│   ├── check-in-review/
│   │   ├── check-in-review-service.ts
│   │   └── components/
│   └── weekly-review/
│       ├── weekly-review-command-service.ts
│       ├── weekly-review-repository.ts
│       └── components/
└── lib/
    └── indexed-db/
        ├── lifecycle-migrations.ts
        └── lifecycle-records.ts
supabase/
├── migrations/
│   ├── 20260729030000_lifecycle_review_history.sql
│   ├── 20260729031000_lifecycle_commands.sql
│   ├── 20260729032000_recovery_commands.sql
│   └── 20260729033000_weekly_review_commands.sql
└── tests/
    ├── 00060_lifecycle.test.sql
    ├── 00070_recovery.test.sql
    └── 00080_weekly_review.test.sql
tests/
├── component/
│   ├── lifecycle-actions.test.tsx
│   ├── recovery-flow.test.tsx
│   └── weekly-review.test.tsx
├── e2e/
│   ├── lifecycle-actions.spec.ts
│   ├── recovery-flow.spec.ts
│   └── weekly-review.spec.ts
├── integration/
│   ├── lifecycle-command-service.test.ts
│   ├── recovery-command-service.test.ts
│   └── weekly-review-command-service.test.ts
└── unit/
    ├── lifecycle-policy.test.ts
    ├── recommendation-engine.test.ts
    ├── recovery-policy.test.ts
    └── weekly-review-policy.test.ts
```

---

# 3. Tasks

## Task 1: Add Plan 06 Verification Commands and Architecture Decision

**Files:**

- Modify: `package.json`
- Create: `docs/architecture/ADR-009-recovery-review-engine.md`

- [ ] **Step 1: Add focused scripts**

Add these scripts without removing existing entries:

```json
{
  "scripts": {
    "test:lifecycle": "vitest run tests/unit/lifecycle-policy.test.ts tests/integration/lifecycle-command-service.test.ts tests/component/lifecycle-actions.test.tsx",
    "test:recommendations": "vitest run tests/unit/recommendation-engine.test.ts",
    "test:recovery": "vitest run tests/unit/recovery-policy.test.ts tests/integration/recovery-command-service.test.ts tests/component/recovery-flow.test.tsx",
    "test:weekly-review": "vitest run tests/unit/weekly-review-policy.test.ts tests/integration/weekly-review-command-service.test.ts tests/component/weekly-review.test.tsx",
    "test:e2e:recovery": "playwright test tests/e2e/recovery-flow.spec.ts",
    "test:e2e:review": "playwright test tests/e2e/weekly-review.spec.ts tests/e2e/lifecycle-actions.spec.ts"
  }
}
```

- [ ] **Step 2: Record the policy architecture**

Create `docs/architecture/ADR-009-recovery-review-engine.md`:

```markdown
# ADR-009: Deterministic Recovery and Review Engine

## Status

Accepted.

## Decision

Lifecycle, recommendation, Recovery, and Weekly Review rules are deterministic policy modules. PostgreSQL functions enforce account mutations transactionally. Guest mode executes equivalent repository commands in one Dexie transaction. Every material decision creates append-only history. Recommendations expose observed evidence and never apply automatically.

## Consequences

- TypeScript and SQL share fixtures and expected outcomes.
- Automatic Skipped is distinct from Manual Skipped.
- Recovery is user-controlled and idempotent.
- Redesign and restoration create new habit versions.
- Weekly Review may complete with no changes.
```

- [ ] **Step 3: Run the focused command before implementation**

Run:

```bash
pnpm test:lifecycle
```

Expected: FAIL because Plan 06 test files do not exist.

- [ ] **Step 4: Commit the plan boundary**

```bash
git add package.json docs/architecture/ADR-009-recovery-review-engine.md
git commit -m "chore: define recovery and review implementation boundary"
```

---

## Task 2: Implement Pure Lifecycle Transition Policy

**Files:**

- Create: `src/domain/lifecycle/lifecycle-transition.ts`
- Create: `src/domain/lifecycle/lifecycle-policy.ts`
- Create: `tests/unit/lifecycle-policy.test.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Create `tests/unit/lifecycle-policy.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  evaluateLifecycleTransition,
  type LifecycleTransitionContext,
} from '@/domain/lifecycle/lifecycle-policy';

const base: LifecycleTransitionContext = {
  currentState: 'active',
  requestedState: 'paused',
  hasActiveRecoveryPlan: false,
  hasCurrentVersion: true,
  activeSlotAvailable: true,
  reasonCode: 'user_pause',
};

describe('evaluateLifecycleTransition', () => {
  it('allows explicit pause with a reason', () => {
    expect(evaluateLifecycleTransition(base)).toEqual({ allowed: true });
  });

  it('rejects an undeclared transition', () => {
    expect(
      evaluateLifecycleTransition({ ...base, requestedState: 'draft' }),
    ).toEqual({ allowed: false, code: 'transition_not_allowed' });
  });

  it('requires a current version before entering a consuming state', () => {
    expect(
      evaluateLifecycleTransition({
        ...base,
        currentState: 'draft',
        requestedState: 'starting',
        hasCurrentVersion: false,
      }),
    ).toEqual({ allowed: false, code: 'current_version_required' });
  });

  it('blocks a second active-slot state when no slot is available', () => {
    expect(
      evaluateLifecycleTransition({
        ...base,
        currentState: 'paused',
        requestedState: 'rebuilding',
        activeSlotAvailable: false,
      }),
    ).toEqual({ allowed: false, code: 'active_habit_limit_reached' });
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

```bash
pnpm exec vitest run tests/unit/lifecycle-policy.test.ts
```

Expected: FAIL because lifecycle policy modules do not exist.

- [ ] **Step 3: Define transition contracts**

Create `src/domain/lifecycle/lifecycle-transition.ts`:

```typescript
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';

export const lifecycleReasonCodes = [
  'habit_created',
  'evidence_building',
  'evidence_active',
  'evidence_stable',
  'evidence_at_risk',
  'recovery_triggered',
  'recovery_succeeded',
  'recovery_failed_twice',
  'user_pause',
  'user_resume',
  'user_stop',
  'user_complete',
  'user_archive',
  'user_trash',
  'user_restore',
  'user_redesign',
  'decision_required',
] as const;

export type LifecycleReasonCode = (typeof lifecycleReasonCodes)[number];

export type LifecycleTransitionResult =
  | { allowed: true }
  | {
      allowed: false;
      code:
        | 'transition_not_allowed'
        | 'reason_required'
        | 'current_version_required'
        | 'active_habit_limit_reached'
        | 'active_recovery_must_be_resolved';
    };
```

- [ ] **Step 4: Implement the policy**

Create `src/domain/lifecycle/lifecycle-policy.ts`:

```typescript
import {
  canTransitionHabit,
  isSlotConsumingHabitState,
  type HabitLifecycleState,
} from '@/domain/habits/habit-lifecycle';
import type {
  LifecycleReasonCode,
  LifecycleTransitionResult,
} from './lifecycle-transition';

export type LifecycleTransitionContext = {
  currentState: HabitLifecycleState;
  requestedState: HabitLifecycleState;
  hasActiveRecoveryPlan: boolean;
  hasCurrentVersion: boolean;
  activeSlotAvailable: boolean;
  reasonCode: LifecycleReasonCode | null;
};

export function evaluateLifecycleTransition(
  context: LifecycleTransitionContext,
): LifecycleTransitionResult {
  if (!canTransitionHabit(context.currentState, context.requestedState)) {
    return { allowed: false, code: 'transition_not_allowed' };
  }
  if (context.reasonCode === null) {
    return { allowed: false, code: 'reason_required' };
  }
  if (isSlotConsumingHabitState(context.requestedState) && !context.hasCurrentVersion) {
    return { allowed: false, code: 'current_version_required' };
  }
  if (
    !isSlotConsumingHabitState(context.currentState) &&
    isSlotConsumingHabitState(context.requestedState) &&
    !context.activeSlotAvailable
  ) {
    return { allowed: false, code: 'active_habit_limit_reached' };
  }
  if (
    context.hasActiveRecoveryPlan &&
    ['stopped', 'completed', 'archived'].includes(context.requestedState)
  ) {
    return { allowed: false, code: 'active_recovery_must_be_resolved' };
  }
  return { allowed: true };
}
```

- [ ] **Step 5: Run the lifecycle tests**

```bash
pnpm exec vitest run tests/unit/lifecycle-policy.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/lifecycle tests/unit/lifecycle-policy.test.ts
git commit -m "feat: add explicit lifecycle transition policy"
```

---

## Task 3: Implement Lifecycle Metrics and Automatic State Suggestions

**Files:**

- Create: `src/domain/lifecycle/lifecycle-metrics.ts`
- Modify: `tests/unit/lifecycle-policy.test.ts`

- [ ] **Step 1: Add failing metric tests**

Append tests covering:

```typescript
import { deriveEvidenceState } from '@/domain/lifecycle/lifecycle-metrics';

it('marks stable only after enough evaluated sessions', () => {
  expect(
    deriveEvidenceState({
      evaluatedSessions: 8,
      successfulSessions: 7,
      consecutiveManualSkips: 0,
      recoveryInLastFiveSessions: false,
      hasActiveRecoveryPlan: false,
    }),
  ).toBe('stable');
});

it('does not mark stable during active recovery', () => {
  expect(
    deriveEvidenceState({
      evaluatedSessions: 12,
      successfulSessions: 11,
      consecutiveManualSkips: 0,
      recoveryInLastFiveSessions: false,
      hasActiveRecoveryPlan: true,
    }),
  ).not.toBe('stable');
});
```

- [ ] **Step 2: Confirm failure**

```bash
pnpm exec vitest run tests/unit/lifecycle-policy.test.ts
```

Expected: FAIL because `lifecycle-metrics.ts` does not exist.

- [ ] **Step 3: Implement deterministic evidence state**

Create `src/domain/lifecycle/lifecycle-metrics.ts`:

```typescript
export type LifecycleEvidence = {
  evaluatedSessions: number;
  successfulSessions: number;
  consecutiveManualSkips: number;
  recoveryInLastFiveSessions: boolean;
  hasActiveRecoveryPlan: boolean;
};

export type EvidenceState = 'starting' | 'building' | 'active' | 'stable' | 'at_risk';

export function deriveEvidenceState(input: LifecycleEvidence): EvidenceState {
  const consistency =
    input.evaluatedSessions === 0
      ? 0
      : input.successfulSessions / input.evaluatedSessions;

  if (input.consecutiveManualSkips >= 2) return 'at_risk';
  if (input.evaluatedSessions < 3) return 'starting';
  if (input.evaluatedSessions < 8) return 'building';
  if (
    consistency >= 0.8 &&
    input.consecutiveManualSkips === 0 &&
    !input.hasActiveRecoveryPlan &&
    !input.recoveryInLastFiveSessions
  ) {
    return 'stable';
  }
  if (consistency >= 0.6) return 'active';
  return 'building';
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm exec vitest run tests/unit/lifecycle-policy.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/lifecycle/lifecycle-metrics.ts tests/unit/lifecycle-policy.test.ts
git commit -m "feat: derive lifecycle state from habit evidence"
```

---

## Task 4: Implement Explainable Recommendation Engine

**Files:**

- Create: `src/domain/recommendations/recommendation-evidence.ts`
- Create: `src/domain/recommendations/recommendation-priority.ts`
- Create: `src/domain/recommendations/recommendation-engine.ts`
- Create: `tests/unit/recommendation-engine.test.ts`

- [ ] **Step 1: Write failing recommendation tests**

Create `tests/unit/recommendation-engine.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { proposeRecommendation } from '@/domain/recommendations/recommendation-engine';

it('selects one dominant friction signal', () => {
  expect(
    proposeRecommendation({
      frictionCounts: { too_difficult: 4, low_energy: 1 },
      minimumShare: 0.2,
      reminderDeclines: 0,
      unstableScheduleCount: 0,
      successfulPriorTarget: null,
    }),
  ).toMatchObject({
    signalCode: 'repeated_too_difficult',
    proposedChange: { variable: 'normal_target', operation: 'reduce' },
    explanationKey: 'recommendation.reduce_target.repeated_too_difficult',
  });
});

it('uses the neutral minimum plan when evidence is insufficient', () => {
  expect(
    proposeRecommendation({
      frictionCounts: {},
      minimumShare: 0,
      reminderDeclines: 0,
      unstableScheduleCount: 0,
      successfulPriorTarget: null,
    }),
  ).toMatchObject({
    signalCode: 'insufficient_evidence',
    proposedChange: { variable: 'temporary_default', operation: 'use_minimum' },
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm exec vitest run tests/unit/recommendation-engine.test.ts
```

Expected: FAIL because recommendation modules do not exist.

- [ ] **Step 3: Define evidence contracts**

Create `src/domain/recommendations/recommendation-evidence.ts`:

```typescript
export type RecommendationEvidence = {
  frictionCounts: Readonly<Record<string, number>>;
  minimumShare: number;
  reminderDeclines: number;
  unstableScheduleCount: number;
  successfulPriorTarget: Record<string, unknown> | null;
};

export type SingleVariableChange =
  | { variable: 'normal_target'; operation: 'reduce' }
  | { variable: 'temporary_default'; operation: 'use_minimum' }
  | { variable: 'schedule'; operation: 'move_time' }
  | { variable: 'reminder'; operation: 'adjust_time' }
  | { variable: 'fallback'; operation: 'add' };
```

- [ ] **Step 4: Define stable priority order**

Create `src/domain/recommendations/recommendation-priority.ts`:

```typescript
export const frictionPriority = [
  'too_difficult',
  'low_energy',
  'not_enough_time',
  'schedule_changed',
  'forgot',
  'environment_access',
] as const;

export function dominantFriction(
  counts: Readonly<Record<string, number>>,
): string | null {
  return [...frictionPriority]
    .map((code) => ({ code, count: counts[code] ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || frictionPriority.indexOf(a.code as never) - frictionPriority.indexOf(b.code as never))[0]
    ?.code ?? null;
}
```

- [ ] **Step 5: Implement one-proposal engine**

Create `src/domain/recommendations/recommendation-engine.ts`:

```typescript
import type {
  RecommendationEvidence,
  SingleVariableChange,
} from './recommendation-evidence';
import { dominantFriction } from './recommendation-priority';

export type RecommendationProposal = {
  signalCode: string;
  evidence: RecommendationEvidence;
  proposedChange: SingleVariableChange;
  explanationKey: string;
  effectiveSessionPolicy: 'next_eligible';
};

const changes: Record<string, SingleVariableChange> = {
  too_difficult: { variable: 'normal_target', operation: 'reduce' },
  low_energy: { variable: 'temporary_default', operation: 'use_minimum' },
  not_enough_time: { variable: 'normal_target', operation: 'reduce' },
  schedule_changed: { variable: 'schedule', operation: 'move_time' },
  forgot: { variable: 'reminder', operation: 'adjust_time' },
  environment_access: { variable: 'fallback', operation: 'add' },
};

export function proposeRecommendation(
  evidence: RecommendationEvidence,
): RecommendationProposal {
  const friction = dominantFriction(evidence.frictionCounts);
  if (friction !== null) {
    return {
      signalCode: `repeated_${friction}`,
      evidence,
      proposedChange: changes[friction],
      explanationKey: `recommendation.${
        friction === 'too_difficult' ? 'reduce_target' : friction
      }.repeated_${friction}`,
      effectiveSessionPolicy: 'next_eligible',
    };
  }
  return {
    signalCode: 'insufficient_evidence',
    evidence,
    proposedChange: { variable: 'temporary_default', operation: 'use_minimum' },
    explanationKey: 'recommendation.use_minimum.insufficient_evidence',
    effectiveSessionPolicy: 'next_eligible',
  };
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm exec vitest run tests/unit/recommendation-engine.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/recommendations tests/unit/recommendation-engine.test.ts
git commit -m "feat: add explainable recommendation engine"
```

---
## Task 5: Add Lifecycle, Change History, and Check-in Review Schema

**Files:**

- Create: `supabase/migrations/20260729030000_lifecycle_review_history.sql`
- Create: `supabase/tests/00060_lifecycle.test.sql`

- [ ] **Step 1: Write failing schema assertions**

Create `supabase/tests/00060_lifecycle.test.sql`:

```sql
begin;
select plan(12);

select has_table('public', 'lifecycle_events', 'lifecycle events exist');
select has_table('public', 'change_history', 'change history exists');
select has_table('public', 'check_in_reviews', 'check-in reviews exist');
select has_column('public', 'profiles', 'review_weekday', 'review weekday exists');
select has_column('public', 'recovery_plans', 'deferred_count', 'Recovery deferral count exists');
select col_is_pk('public', 'lifecycle_events', 'id', 'lifecycle event id is primary key');
select col_is_pk('public', 'change_history', 'id', 'change history id is primary key');
select col_is_pk('public', 'check_in_reviews', 'id', 'check-in review id is primary key');
select col_not_null('public', 'lifecycle_events', 'reason_code', 'transition reason is required');
select col_not_null('public', 'change_history', 'change_type', 'change type is required');
select col_not_null('public', 'check_in_reviews', 'status', 'review status is required');
select col_not_null('public', 'check_in_reviews', 'signal_snapshot', 'signal snapshot is required');

select * from finish();
rollback;
```

- [ ] **Step 2: Confirm schema test failure**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00060_lifecycle.test.sql
```

Expected: FAIL because Plan 06 tables and columns do not exist.

- [ ] **Step 3: Create append-only history and Check-in Review tables**

Create `supabase/migrations/20260729030000_lifecycle_review_history.sql`:

```sql
alter table public.profiles
  add column review_weekday smallint not null default 7
    check (review_weekday between 1 and 7);

alter table public.recovery_plans
  add column deferred_count integer not null default 0
    check (deferred_count between 0 and 1),
  add column successful_sessions integer not null default 0
    check (successful_sessions >= 0),
  add column evaluated_sessions integer not null default 0
    check (evaluated_sessions >= 0),
  add column supersedes_plan_id uuid references public.recovery_plans(id),
  add constraint recovery_progress_within_duration
    check (evaluated_sessions <= duration_sessions),
  add constraint recovery_success_within_evaluated
    check (successful_sessions <= evaluated_sessions);

create table public.lifecycle_events (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_state public.habit_lifecycle_state,
  to_state public.habit_lifecycle_state not null,
  reason_code text not null check (char_length(reason_code) between 1 and 80),
  reason_payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(reason_payload) = 'object'),
  command_id uuid not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  unique (user_id, command_id)
);

create table public.change_history (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  change_type text not null check (
    change_type in (
      'lifecycle_transition',
      'recommendation_applied',
      'recommendation_customized',
      'recommendation_kept_current',
      'recovery_started',
      'recovery_completed',
      'habit_redesigned',
      'version_restored'
    )
  ),
  source_entity_type text not null,
  source_entity_id uuid,
  before_snapshot jsonb check (
    before_snapshot is null or jsonb_typeof(before_snapshot) = 'object'
  ),
  after_snapshot jsonb check (
    after_snapshot is null or jsonb_typeof(after_snapshot) = 'object'
  ),
  created_version_id uuid references public.habit_versions(id),
  command_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, command_id)
);

create table public.check_in_reviews (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'resolved')),
  signal_snapshot jsonb not null
    check (jsonb_typeof(signal_snapshot) = 'object'),
  recommendation_id uuid references public.recommendations(id),
  banner_dismissed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint check_in_review_resolution check (
    (status = 'pending' and resolved_at is null)
    or (status = 'resolved' and resolved_at is not null)
  )
);

alter table public.review_items
  drop constraint review_items_item_type_check;

alter table public.review_items
  add constraint review_items_item_type_check check (
    item_type in (
      'weekly_summary',
      'decision_required',
      'needs_review',
      'recovery',
      'at_risk',
      'check_in_review',
      'building',
      'recommendation',
      'downgrade'
    )
  );

create unique index check_in_reviews_one_pending_per_habit_idx
  on public.check_in_reviews (habit_id)
  where status = 'pending';
create index lifecycle_events_habit_occurred_idx
  on public.lifecycle_events (habit_id, occurred_at desc);
create index change_history_habit_created_idx
  on public.change_history (habit_id, created_at desc);

alter table public.lifecycle_events enable row level security;
alter table public.change_history enable row level security;
alter table public.check_in_reviews enable row level security;

grant select on public.lifecycle_events to authenticated;
grant select on public.change_history to authenticated;
grant select on public.check_in_reviews to authenticated;

create policy lifecycle_events_select_own
on public.lifecycle_events for select to authenticated
using (user_id = auth.uid());

create policy change_history_select_own
on public.change_history for select to authenticated
using (user_id = auth.uid());

create policy check_in_reviews_select_own
on public.check_in_reviews for select to authenticated
using (user_id = auth.uid());
```

- [ ] **Step 4: Reset and run schema tests**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00060_lifecycle.test.sql
```

Expected: 12 tests pass.

- [ ] **Step 5: Regenerate database types and reject drift**

```bash
pnpm db:types
pnpm db:types:check
```

Expected: generated types include `lifecycle_events`, `change_history`, `check_in_reviews`, and new columns.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260729030000_lifecycle_review_history.sql supabase/tests/00060_lifecycle.test.sql src/types/database.generated.ts
git commit -m "feat: add lifecycle and review history schema"
```

---

## Task 6: Add Transactional Lifecycle Commands

**Files:**

- Create: `supabase/migrations/20260729031000_lifecycle_commands.sql`
- Modify: `supabase/tests/00060_lifecycle.test.sql`

- [ ] **Step 1: Add failing SQL behavior tests**

Append pgTAP cases that establish:

```sql
select has_function(
  'public',
  'transition_habit',
  array['uuid','uuid','bigint','public.habit_lifecycle_state','text','jsonb'],
  'transition_habit exists'
);

select has_function(
  'public',
  'resolve_overdue_unrecorded_sessions',
  array['timestamptz','integer'],
  'Automatic Skipped resolver exists'
);
```

Add fixture assertions proving:

- a valid pause records one lifecycle event and increments revision once;
- replaying the same command returns the existing result;
- an invalid transition raises `transition_not_allowed`;
- resolving an overdue Unrecorded session sets `automatic_skipped` without incrementing `consecutive_manual_skips`;
- three Automatic Skipped sessions within fourteen days create one pending Check-in Review.

- [ ] **Step 2: Confirm failure**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00060_lifecycle.test.sql
```

Expected: FAIL because lifecycle command functions do not exist.

- [ ] **Step 3: Add allowed-transition helper**

Start `supabase/migrations/20260729031000_lifecycle_commands.sql` with:

```sql
create or replace function private.lifecycle_transition_allowed(
  p_from public.habit_lifecycle_state,
  p_to public.habit_lifecycle_state
)
returns boolean
language sql
immutable
as $$
  select case p_from
    when 'draft' then p_to in ('starting', 'trash')
    when 'starting' then p_to in ('building', 'paused', 'trash')
    when 'building' then p_to in ('active', 'recovery', 'paused', 'trash')
    when 'active' then p_to in ('stable', 'recovery', 'paused', 'stopped', 'completed', 'trash')
    when 'stable' then p_to in ('at_risk', 'recovery', 'paused', 'stopped', 'completed', 'trash')
    when 'at_risk' then p_to in ('recovery', 'paused', 'stopped', 'trash')
    when 'recovery' then p_to in ('rebuilding', 'needs_review', 'paused', 'trash')
    when 'rebuilding' then p_to in ('building', 'active', 'recovery', 'paused', 'trash')
    when 'needs_review' then p_to in ('rebuilding', 'paused', 'stopped', 'trash')
    when 'paused' then p_to in ('rebuilding', 'stopped', 'trash')
    when 'stopped' then p_to in ('archived', 'rebuilding', 'trash')
    when 'completed' then p_to in ('archived', 'rebuilding', 'trash')
    when 'archived' then p_to in ('rebuilding', 'trash')
    when 'trash' then p_to in ('rebuilding')
    when 'decision_required' then p_to in ('draft', 'paused', 'rebuilding', 'trash')
    else false
  end;
$$;
```

- [ ] **Step 4: Implement idempotent transition command**

Append:

```sql
create or replace function public.transition_habit(
  p_command_id uuid,
  p_habit_id uuid,
  p_expected_revision bigint,
  p_target_state public.habit_lifecycle_state,
  p_reason_code text,
  p_reason_payload jsonb default '{}'::jsonb
)
returns public.habits
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_habit public.habits;
  v_before public.habits;
  v_from_state public.habit_lifecycle_state;
  v_existing public.lifecycle_events;
  v_active_count integer;
  v_active_limit integer;
begin
  select * into v_existing
  from public.lifecycle_events
  where user_id = auth.uid() and command_id = p_command_id;

  if found then
    select * into v_habit from public.habits where id = v_existing.habit_id;
    return v_habit;
  end if;

  select * into v_habit
  from public.habits
  where id = p_habit_id and user_id = auth.uid()
  for update;

  if not found then raise exception 'habit_not_found' using errcode = 'P0002'; end if;
  if v_habit.revision <> p_expected_revision then
    raise exception 'revision_conflict' using errcode = '40001';
  end if;
  if not private.lifecycle_transition_allowed(v_habit.lifecycle_state, p_target_state) then
    raise exception 'transition_not_allowed' using errcode = '22023';
  end if;
  if char_length(btrim(p_reason_code)) = 0 then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  if not private.is_slot_consuming(v_habit.lifecycle_state)
     and private.is_slot_consuming(p_target_state) then
    select count(*) into v_active_count
    from public.habits
    where user_id = auth.uid()
      and id <> p_habit_id
      and private.is_slot_consuming(lifecycle_state);

    v_active_limit := private.active_habit_limit(auth.uid());
    if v_active_count >= v_active_limit then
      raise exception 'active_habit_limit_reached' using errcode = '23514';
    end if;
  end if;

  v_before := v_habit;
  v_from_state := v_habit.lifecycle_state;

  update public.habits
  set lifecycle_state = p_target_state,
      state_changed_at = timezone('utc', now()),
      revision = revision + 1,
      deleted_at = case when p_target_state = 'trash' then timezone('utc', now()) else null end,
      purge_after = case when p_target_state = 'trash' then timezone('utc', now()) + interval '30 days' else null end
  where id = p_habit_id
  returning * into v_habit;

  insert into public.lifecycle_events (
    id, habit_id, user_id, from_state, to_state, reason_code,
    reason_payload, command_id
  ) values (
    gen_random_uuid(), p_habit_id, auth.uid(),
    v_from_state, p_target_state, p_reason_code, p_reason_payload, p_command_id
  );

  insert into public.change_history (
    id, habit_id, user_id, change_type, source_entity_type,
    source_entity_id, before_snapshot, after_snapshot, command_id
  ) values (
    gen_random_uuid(), p_habit_id, auth.uid(), 'lifecycle_transition',
    'habit', p_habit_id, to_jsonb(v_before), to_jsonb(v_habit), p_command_id
  );

  if p_target_state in ('paused', 'stopped', 'completed', 'archived', 'trash') then
    update public.reminder_delivery_intents rdi
    set status = 'cancelled',
        cancelled_reason = 'habit_' || p_target_state::text,
        claim_owner = null,
        claim_expires_at = null
    from public.sessions s
    where rdi.session_id = s.id
      and s.habit_id = p_habit_id
      and rdi.status in ('scheduled', 'claimed');

    delete from public.sessions
    where habit_id = p_habit_id
      and status = 'unrecorded'
      and eligible_at > timezone('utc', now());
  end if;

  return v_habit;
end;
$$;
```

The pgTAP test must assert that the recorded `from_state` equals the locked pre-update state, `to_state` equals the requested state, active-slot limits are enforced on resume/restore, and transitions into non-scheduling states cancel pending reminders and remove only future unresolved generated sessions.

- [ ] **Step 5: Implement Automatic Skipped resolver and Check-in Review trigger**

Append a `security definer` function that:

```sql
create or replace function public.resolve_overdue_unrecorded_sessions(
  p_now timestamptz,
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_count integer := 0;
  v_session record;
begin
  for v_session in
    select s.id, s.habit_id, s.user_id
    from public.sessions s
    where s.status = 'unrecorded'
      and s.resolution_due_at <= p_now
    order by s.resolution_due_at
    for update skip locked
    limit greatest(1, least(p_limit, 5000))
  loop
    update public.sessions
    set status = 'automatic_skipped', revision = revision + 1
    where id = v_session.id and status = 'unrecorded';

    if found then
      v_count := v_count + 1;

      if (
        select count(*) >= 3
        from public.sessions recent
        where recent.habit_id = v_session.habit_id
          and recent.status = 'automatic_skipped'
          and recent.scheduled_local_date >= (p_now at time zone 'UTC')::date - 13
      ) then
        insert into public.check_in_reviews (
          id, habit_id, user_id, signal_snapshot
        ) values (
          gen_random_uuid(), v_session.habit_id, v_session.user_id,
          jsonb_build_object('signalCode', 'three_automatic_skips_in_14_days')
        )
        on conflict (habit_id) where status = 'pending' do nothing;
      end if;
    end if;
  end loop;
  return v_count;
end;
$$;
```

Do not update `habits.consecutive_manual_skips` in this function.

- [ ] **Step 6: Run SQL tests**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00060_lifecycle.test.sql
```

Expected: all lifecycle and Automatic Skipped cases pass.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260729031000_lifecycle_commands.sql supabase/tests/00060_lifecycle.test.sql
git commit -m "feat: add transactional lifecycle commands"
```

---

## Task 7: Implement Recovery Policy and Progress Evaluation

**Files:**

- Create: `src/domain/recovery/recovery-target.ts`
- Create: `src/domain/recovery/recovery-progress.ts`
- Create: `src/domain/recovery/recovery-policy.ts`
- Create: `tests/unit/recovery-policy.test.ts`

- [ ] **Step 1: Write failing Recovery tests**

Create `tests/unit/recovery-policy.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  evaluateRecoveryProgress,
  shouldTriggerRecovery,
} from '@/domain/recovery/recovery-policy';

it('triggers only at three qualifying manual skips', () => {
  expect(shouldTriggerRecovery(2, false)).toBe(false);
  expect(shouldTriggerRecovery(3, false)).toBe(true);
  expect(shouldTriggerRecovery(4, true)).toBe(false);
});

it('succeeds at two successful sessions out of three', () => {
  expect(
    evaluateRecoveryProgress({
      durationSessions: 3,
      successThreshold: 2,
      evaluatedSessions: 3,
      successfulSessions: 2,
    }),
  ).toBe('succeeded');
});

it('fails at one successful session out of three', () => {
  expect(
    evaluateRecoveryProgress({
      durationSessions: 3,
      successThreshold: 2,
      evaluatedSessions: 3,
      successfulSessions: 1,
    }),
  ).toBe('failed');
});
```

- [ ] **Step 2: Confirm failure**

```bash
pnpm exec vitest run tests/unit/recovery-policy.test.ts
```

Expected: FAIL because Recovery policy modules do not exist.

- [ ] **Step 3: Define Recovery target contracts**

Create `src/domain/recovery/recovery-target.ts`:

```typescript
export type RecoveryTarget = {
  variable: 'normal_target' | 'temporary_default' | 'schedule' | 'reminder' | 'fallback';
  value: Record<string, unknown>;
};

export type RecoveryProgressInput = {
  durationSessions: 3 | 5;
  successThreshold: number;
  evaluatedSessions: number;
  successfulSessions: number;
};
```

- [ ] **Step 4: Implement progress classification**

Create `src/domain/recovery/recovery-progress.ts`:

```typescript
import type { RecoveryProgressInput } from './recovery-target';

export type RecoveryProgressState = 'active' | 'succeeded' | 'failed';

export function classifyRecoveryProgress(
  input: RecoveryProgressInput,
): RecoveryProgressState {
  if (input.evaluatedSessions < input.durationSessions) return 'active';
  return input.successfulSessions >= input.successThreshold
    ? 'succeeded'
    : 'failed';
}
```

- [ ] **Step 5: Implement trigger and evaluation policy**

Create `src/domain/recovery/recovery-policy.ts`:

```typescript
import { classifyRecoveryProgress } from './recovery-progress';
import type { RecoveryProgressInput } from './recovery-target';

export function shouldTriggerRecovery(
  consecutiveManualSkips: number,
  hasOpenRecoveryPlan: boolean,
): boolean {
  return consecutiveManualSkips >= 3 && !hasOpenRecoveryPlan;
}

export function evaluateRecoveryProgress(
  input: RecoveryProgressInput,
): 'active' | 'succeeded' | 'failed' {
  return classifyRecoveryProgress(input);
}

export function nextFailedRecoverySequence(
  previousFailureSequence: number,
): 1 | 2 {
  return previousFailureSequence >= 1 ? 2 : 1;
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm exec vitest run tests/unit/recovery-policy.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/recovery tests/unit/recovery-policy.test.ts
git commit -m "feat: add deterministic recovery policy"
```

---

## Task 8: Add Transactional Recovery Commands

**Files:**

- Create: `supabase/migrations/20260729032000_recovery_commands.sql`
- Create: `supabase/tests/00070_recovery.test.sql`

- [ ] **Step 1: Write failing pgTAP Recovery tests**

Create tests that prove:

```sql
select has_function(
  'public',
  'ensure_recovery_proposal',
  array['uuid','uuid'],
  'Recovery proposal function exists'
);
select has_function(
  'public',
  'decide_recovery_proposal',
  array['uuid','uuid','text','jsonb'],
  'Recovery decision function exists'
);
select has_function(
  'public',
  'evaluate_recovery_plan',
  array['uuid','uuid'],
  'Recovery evaluation function exists'
);
```

Fixture assertions must prove:

- three Manual Skipped sessions create exactly one proposed plan and one review item;
- Automatic Skipped cannot create a plan;
- the first `defer` increments `deferred_count` to one;
- a second `defer` is rejected;
- Apply activates the plan without overwriting the habit version;
- 2/3 success transitions to Rebuilding;
- first failure creates a materially different proposed plan with `failure_sequence = 1`;
- second consecutive failure transitions to Needs Review.

- [ ] **Step 2: Confirm failure**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00070_recovery.test.sql
```

Expected: FAIL because Recovery command functions do not exist.

- [ ] **Step 3: Implement proposal creation**

Create `supabase/migrations/20260729032000_recovery_commands.sql` with a function that locks the habit and verifies:

```sql
if v_habit.consecutive_manual_skips < 3 then
  raise exception 'recovery_not_eligible' using errcode = '22023';
end if;

if exists (
  select 1 from public.recovery_plans
  where habit_id = p_habit_id
    and status in ('proposed', 'deferred', 'active')
) then
  select id into v_plan_id
  from public.recovery_plans
  where habit_id = p_habit_id
    and status in ('proposed', 'deferred', 'active')
  order by created_at desc limit 1;
  return v_plan_id;
end if;
```

Generate one deterministic recommendation from stored friction evidence. When evidence is insufficient, store:

```json
{
  "variable": "temporary_default",
  "operation": "use_minimum",
  "durationSessions": 3,
  "successThreshold": 2
}
```

The transaction must:

- insert one `recommendations` row;
- insert one `recovery_plans` row;
- transition the habit to `recovery`;
- add `lifecycle_events`, `change_history`, and `review_items` rows;
- use unique command or open-plan checks to prevent duplicates.

- [ ] **Step 4: Implement proposal decisions**

`public.decide_recovery_proposal` accepts only:

```text
apply
customize
keep_current
defer
```

Behavior:

- `apply`: activate the plan and set `started_at`;
- `customize`: validate one changed variable, update only the proposed plan payload, then activate;
- `keep_current`: mark the recommendation `kept_current`, cancel the proposal, and leave the habit in an eligible non-destructive state;
- `defer`: allow once, set `status = 'deferred'`, increment `deferred_count`, and keep the review item pending.

Every non-defer resolution records `decided_at` and one Change History entry.

- [ ] **Step 5: Implement progress evaluation**

`public.evaluate_recovery_plan` must:

1. lock the active plan and habit;
2. count eligible sessions belonging to the plan's Recovery context;
3. count Full and Minimum as successful;
4. ignore Excused and unresolved sessions;
5. update `evaluated_sessions` and `successful_sessions`;
6. return active until the configured duration is evaluated;
7. on success, mark `succeeded`, transition to `rebuilding`, reset the manual-skip counter, and schedule Normal target for the next eligible session;
8. on first failure, mark `failed` and create a lighter proposal that differs from the failed target;
9. on second failure, mark `failed`, transition to `needs_review`, and create a `needs_review` item;
10. preserve every completed plan and recommendation.

- [ ] **Step 6: Run Recovery SQL tests**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00070_recovery.test.sql
```

Expected: all trigger, decision, progress, and Needs Review cases pass.

- [ ] **Step 7: Regenerate types and commit**

```bash
pnpm db:types
pnpm db:types:check
git add supabase/migrations/20260729032000_recovery_commands.sql supabase/tests/00070_recovery.test.sql src/types/database.generated.ts
git commit -m "feat: add transactional recovery workflow"
```

---

## Task 9: Implement Weekly Review Ordering and Summary Policies

**Files:**

- Create: `src/domain/reviews/weekly-review-policy.ts`
- Create: `src/domain/reviews/weekly-review-summary.ts`
- Create: `src/domain/reviews/check-in-review-policy.ts`
- Create: `tests/unit/weekly-review-policy.test.ts`

- [ ] **Step 1: Write failing review policy tests**

Create `tests/unit/weekly-review-policy.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  orderWeeklyReviewItems,
  type WeeklyReviewItem,
} from '@/domain/reviews/weekly-review-policy';

const item = (
  id: string,
  itemType: WeeklyReviewItem['itemType'],
): WeeklyReviewItem => ({ id, itemType, createdAt: '2026-07-29T00:00:00.000Z' });

it('orders action-required items deterministically', () => {
  expect(
    orderWeeklyReviewItems([
      item('building', 'building'),
      item('check', 'check_in_review'),
      item('recovery', 'recovery'),
      item('needs', 'needs_review'),
      item('decision', 'decision_required'),
      item('risk', 'at_risk'),
    ]).map((entry) => entry.id),
  ).toEqual(['decision', 'needs', 'recovery', 'risk', 'check', 'building']);
});
```

- [ ] **Step 2: Confirm failure**

```bash
pnpm exec vitest run tests/unit/weekly-review-policy.test.ts
```

Expected: FAIL because review policy modules do not exist.

- [ ] **Step 3: Implement deterministic ordering**

Create `src/domain/reviews/weekly-review-policy.ts`:

```typescript
export type WeeklyReviewItemType =
  | 'decision_required'
  | 'needs_review'
  | 'recovery'
  | 'at_risk'
  | 'check_in_review'
  | 'building'
  | 'recommendation'
  | 'weekly_summary';

export type WeeklyReviewItem = {
  id: string;
  itemType: WeeklyReviewItemType;
  createdAt: string;
};

const priority: Record<WeeklyReviewItemType, number> = {
  decision_required: 10,
  needs_review: 20,
  recovery: 30,
  at_risk: 40,
  check_in_review: 50,
  recommendation: 60,
  building: 70,
  weekly_summary: 100,
};

export function orderWeeklyReviewItems(
  items: readonly WeeklyReviewItem[],
): WeeklyReviewItem[] {
  return [...items].sort(
    (a, b) =>
      priority[a.itemType] - priority[b.itemType] ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}
```

- [ ] **Step 4: Implement neutral summary model**

Create `src/domain/reviews/weekly-review-summary.ts`:

```typescript
export type WeeklyReviewSummary = {
  evaluatedSessions: number;
  fullCount: number;
  minimumCount: number;
  manualSkippedCount: number;
  automaticSkippedCount: number;
  excusedCount: number;
  habitsNeedingAttention: number;
};

export function successfulSessionCount(summary: WeeklyReviewSummary): number {
  return summary.fullCount + summary.minimumCount;
}
```

- [ ] **Step 5: Define Check-in Review resolution policy**

Create `src/domain/reviews/check-in-review-policy.ts`:

```typescript
export const checkInReviewDecisions = [
  'apply',
  'customize',
  'keep_current',
] as const;

export type CheckInReviewDecision = (typeof checkInReviewDecisions)[number];

export function isCheckInReviewResolved(
  decision: CheckInReviewDecision | 'later',
): boolean {
  return decision !== 'later';
}
```

- [ ] **Step 6: Run tests and commit**

```bash
pnpm exec vitest run tests/unit/weekly-review-policy.test.ts
git add src/domain/reviews tests/unit/weekly-review-policy.test.ts
git commit -m "feat: add weekly and check-in review policies"
```

---
## Task 10: Add Weekly Review Generation and Batch Decision Commands

**Files:**

- Create: `supabase/migrations/20260729033000_weekly_review_commands.sql`
- Create: `supabase/tests/00080_weekly_review.test.sql`

- [ ] **Step 1: Write failing Weekly Review pgTAP tests**

Create `supabase/tests/00080_weekly_review.test.sql` with assertions for:

```sql
select has_function(
  'public',
  'ensure_weekly_review_cycle',
  array['uuid','date'],
  'weekly review generator exists'
);
select has_function(
  'public',
  'complete_weekly_review',
  array['uuid','uuid','jsonb'],
  'weekly review completion command exists'
);
select has_function(
  'public',
  'resolve_check_in_review',
  array['uuid','uuid','text','jsonb'],
  'Check-in Review resolution command exists'
);
```

Fixture assertions must prove:

- the configured weekday defaults to Sunday;
- manual opening before the configured day creates or returns the same cycle;
- duplicate cycle generation returns the existing cycle;
- item order is Decision Required, Needs Review, Recovery, At Risk, Check-in Review, Building;
- no recommendation is selected by default;
- an empty decision array completes the cycle with no changes;
- a partial batch failure records per-item results and leaves failed items pending;
- `later` dismisses the Today banner but does not resolve a Check-in Review;
- Apply, Customize, and Keep Current resolve a Check-in Review;
- restored recommendations create a new habit version rather than mutating an old version.

- [ ] **Step 2: Confirm failure**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00080_weekly_review.test.sql
```

Expected: FAIL because review command functions do not exist.

- [ ] **Step 3: Implement idempotent cycle generation**

Create `supabase/migrations/20260729033000_weekly_review_commands.sql` with:

```sql
create or replace function public.ensure_weekly_review_cycle(
  p_user_id uuid,
  p_anchor_date date
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_cycle_id uuid;
  v_review_weekday smallint;
  v_window_end date;
  v_window_start date;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select review_weekday into v_review_weekday
  from public.profiles where id = p_user_id;

  v_window_end := p_anchor_date;
  v_window_start := p_anchor_date - 6;

  insert into public.review_cycles (
    id, user_id, window_start, window_end
  ) values (
    gen_random_uuid(), p_user_id, v_window_start, v_window_end
  )
  on conflict (user_id, window_start, window_end)
  do update set window_end = excluded.window_end
  returning id into v_cycle_id;

  delete from public.review_items
  where review_cycle_id = v_cycle_id and status = 'pending';

  insert into public.review_items (
    id, review_cycle_id, user_id, habit_id, item_type, priority, payload
  )
  select
    gen_random_uuid(), v_cycle_id, p_user_id, h.id,
    case h.lifecycle_state
      when 'decision_required' then 'decision_required'
      when 'needs_review' then 'needs_review'
      when 'recovery' then 'recovery'
      when 'at_risk' then 'at_risk'
      when 'building' then 'building'
      else 'recommendation'
    end,
    case h.lifecycle_state
      when 'decision_required' then 10
      when 'needs_review' then 20
      when 'recovery' then 30
      when 'at_risk' then 40
      when 'building' then 70
      else 60
    end,
    jsonb_build_object('lifecycleState', h.lifecycle_state)
  from public.habits h
  where h.user_id = p_user_id
    and h.lifecycle_state in (
      'decision_required', 'needs_review', 'recovery', 'at_risk', 'building'
    );

  insert into public.review_items (
    id, review_cycle_id, user_id, habit_id, item_type, priority, payload
  )
  select gen_random_uuid(), v_cycle_id, p_user_id, cir.habit_id,
         'check_in_review', 50, cir.signal_snapshot
  from public.check_in_reviews cir
  where cir.user_id = p_user_id and cir.status = 'pending';

  return v_cycle_id;
end;
$$;
```

Use `v_review_weekday` in a testable helper that determines whether the cycle is due; manual invocation remains allowed on any date.

- [ ] **Step 4: Implement recommendation decision helper**

Add a private function that accepts one decision object:

```json
{
  "itemId": "uuid",
  "decision": "apply | customize | keep_current",
  "payload": {}
}
```

Rules:

- reject unknown item IDs and decisions;
- Apply or Customize calls `public.create_habit_version` with source `recommendation`;
- Keep Current updates recommendation status without changing the habit;
- every material change records one `change_history` row;
- effective changes begin at the next eligible scheduled session;
- repeated command IDs replay the existing result.

- [ ] **Step 5: Implement batch completion**

`public.complete_weekly_review` must:

```sql
create or replace function public.complete_weekly_review(
  p_command_id uuid,
  p_review_cycle_id uuid,
  p_decisions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_results jsonb := '[]'::jsonb;
  v_decision jsonb;
begin
  if jsonb_typeof(p_decisions) <> 'array' then
    raise exception 'decisions_must_be_array' using errcode = '22023';
  end if;

  for v_decision in select value from jsonb_array_elements(p_decisions)
  loop
    begin
      v_results := v_results || jsonb_build_array(
        private.apply_review_decision(p_review_cycle_id, v_decision, p_command_id)
      );
    exception when others then
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'itemId', v_decision ->> 'itemId',
          'status', 'failed',
          'errorCode', sqlstate
        )
      );
    end;
  end loop;

  update public.review_cycles
  set status = 'completed', completed_at = timezone('utc', now())
  where id = p_review_cycle_id and user_id = auth.uid();

  return jsonb_build_object(
    'reviewCycleId', p_review_cycle_id,
    'results', v_results
  );
end;
$$;
```

Completing with `[]` is valid and must not be framed as failure.

- [ ] **Step 6: Implement Check-in Review resolution**

`public.resolve_check_in_review` behavior:

- `later`: set `banner_dismissed_at` only and keep `status = 'pending'`;
- `apply`: apply the generated recommendation and resolve;
- `customize`: validate and apply one customized variable, then resolve;
- `keep_current`: record the decision and resolve without modification;
- all resolved paths set `resolved_at`, resolve matching review items, and preserve signal evidence.

- [ ] **Step 7: Run review SQL tests**

```bash
pnpm supabase db reset
pnpm supabase test db --file supabase/tests/00080_weekly_review.test.sql
```

Expected: all generation, ordering, batch, and Check-in Review cases pass.

- [ ] **Step 8: Regenerate types and commit**

```bash
pnpm db:types
pnpm db:types:check
git add supabase/migrations/20260729033000_weekly_review_commands.sql supabase/tests/00080_weekly_review.test.sql src/types/database.generated.ts
git commit -m "feat: add weekly review commands"
```

---

## Task 11: Add Repository and Application Command Contracts

**Files:**

- Create: `src/features/lifecycle/lifecycle-repository.ts`
- Create: `src/features/lifecycle/lifecycle-command-service.ts`
- Create: `src/features/recovery/recovery-repository.ts`
- Create: `src/features/recovery/recovery-command-service.ts`
- Create: `src/features/weekly-review/weekly-review-repository.ts`
- Create: `src/features/weekly-review/weekly-review-command-service.ts`
- Create: `src/features/check-in-review/check-in-review-service.ts`
- Create: `tests/integration/lifecycle-command-service.test.ts`
- Create: `tests/integration/recovery-command-service.test.ts`
- Create: `tests/integration/weekly-review-command-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Use in-memory repository doubles to assert:

```typescript
it('passes a stable command id and expected revision', async () => {
  await service.pauseHabit({ habitId: 'habit-1', expectedRevision: 4 });
  expect(repository.transitionHabit).toHaveBeenCalledWith(
    expect.objectContaining({
      habitId: 'habit-1',
      expectedRevision: 4,
      targetState: 'paused',
      reasonCode: 'user_pause',
      commandId: expect.any(String),
    }),
  );
});
```

Add tests for Recovery Apply, Customize, Keep Current, Later, Check-in Review resolution, Weekly Review completion with zero decisions, and partial per-item result mapping.

- [ ] **Step 2: Confirm failures**

```bash
pnpm exec vitest run tests/integration/lifecycle-command-service.test.ts tests/integration/recovery-command-service.test.ts tests/integration/weekly-review-command-service.test.ts
```

Expected: FAIL because service modules do not exist.

- [ ] **Step 3: Define lifecycle repository**

Create `src/features/lifecycle/lifecycle-repository.ts`:

```typescript
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';
import type { LifecycleReasonCode } from '@/domain/lifecycle/lifecycle-transition';

export type TransitionHabitCommand = {
  commandId: string;
  habitId: string;
  expectedRevision: number;
  targetState: HabitLifecycleState;
  reasonCode: LifecycleReasonCode;
  reasonPayload: Record<string, unknown>;
};

export interface LifecycleRepository {
  transitionHabit(command: TransitionHabitCommand): Promise<{
    habitId: string;
    lifecycleState: HabitLifecycleState;
    revision: number;
  }>;
  listChangeHistory(habitId: string): Promise<readonly ChangeHistoryEntry[]>;
}

export type ChangeHistoryEntry = {
  id: string;
  changeType: string;
  createdAt: string;
  createdVersionId: string | null;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
};
```

- [ ] **Step 4: Define Recovery repository**

Create `src/features/recovery/recovery-repository.ts`:

```typescript
export type RecoveryDecision = 'apply' | 'customize' | 'keep_current' | 'defer';

export interface RecoveryRepository {
  ensureProposal(input: { commandId: string; habitId: string }): Promise<string>;
  decideProposal(input: {
    commandId: string;
    recoveryPlanId: string;
    decision: RecoveryDecision;
    payload: Record<string, unknown>;
  }): Promise<{ recoveryPlanId: string; status: string }>;
  getRecoveryDetail(habitId: string): Promise<RecoveryDetail | null>;
}

export type RecoveryDetail = {
  planId: string;
  status: string;
  signalCode: string;
  explanationKey: string;
  targetDefinition: Record<string, unknown>;
  durationSessions: number;
  successThreshold: number;
  evaluatedSessions: number;
  successfulSessions: number;
  deferredCount: number;
};
```

- [ ] **Step 5: Define Weekly Review repository**

Create `src/features/weekly-review/weekly-review-repository.ts`:

```typescript
export type ReviewDecisionInput = {
  itemId: string;
  decision: 'apply' | 'customize' | 'keep_current';
  payload: Record<string, unknown>;
};

export interface WeeklyReviewRepository {
  ensureCycle(anchorDate: string): Promise<string>;
  getCycle(cycleId: string): Promise<WeeklyReviewReadModel>;
  completeCycle(input: {
    commandId: string;
    cycleId: string;
    decisions: readonly ReviewDecisionInput[];
  }): Promise<WeeklyReviewCompletionResult>;
}

export type WeeklyReviewCompletionResult = {
  cycleId: string;
  results: readonly {
    itemId: string;
    status: 'applied' | 'kept_current' | 'failed';
    errorCode?: string;
  }[];
};
```

- [ ] **Step 6: Implement thin command services**

Each service must:

- obtain command IDs from the injected UUID service;
- validate inputs with Zod at the application boundary;
- call one repository command;
- invalidate only affected TanStack Query keys;
- map known conflict and active-limit errors to typed UI errors;
- never duplicate domain policy inside React components.

Example lifecycle service:

```typescript
export class LifecycleCommandService {
  constructor(
    private readonly repository: LifecycleRepository,
    private readonly uuid: { create(): string },
  ) {}

  pauseHabit(input: { habitId: string; expectedRevision: number }) {
    return this.repository.transitionHabit({
      commandId: this.uuid.create(),
      habitId: input.habitId,
      expectedRevision: input.expectedRevision,
      targetState: 'paused',
      reasonCode: 'user_pause',
      reasonPayload: {},
    });
  }
}
```

- [ ] **Step 7: Run integration tests**

```bash
pnpm exec vitest run tests/integration/lifecycle-command-service.test.ts tests/integration/recovery-command-service.test.ts tests/integration/weekly-review-command-service.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/lifecycle src/features/recovery src/features/weekly-review src/features/check-in-review tests/integration
git commit -m "feat: add lifecycle recovery and review services"
```

---

## Task 12: Add Dexie Version 5 for Guest Lifecycle and Review History

**Files:**

- Modify: `src/lib/indexed-db/types.ts`
- Modify: `src/lib/indexed-db/schema.ts`
- Modify: `src/lib/indexed-db/database.ts`
- Create: `src/lib/indexed-db/lifecycle-records.ts`
- Create: `src/lib/indexed-db/lifecycle-migrations.ts`
- Modify: `tests/unit/indexed-db/migrations.test.ts`

- [ ] **Step 1: Add failing migration tests**

Assert that:

- `currentIndexedDbVersion === 5`;
- version 5 contains lifecycle events, change history, Check-in Reviews, and review cycles;
- upgrading from version 4 preserves habits, sessions, check-ins, and pending operations;
- existing Recovery plans receive `deferredCount`, `evaluatedSessions`, and `successfulSessions` defaults;
- no previous store definition is modified in place.

- [ ] **Step 2: Confirm failure**

```bash
pnpm exec vitest run tests/unit/indexed-db/migrations.test.ts
```

Expected: FAIL because version 5 is not registered.

- [ ] **Step 3: Add local record contracts**

Create `src/lib/indexed-db/lifecycle-records.ts`:

```typescript
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';

export type LocalLifecycleEventRecord = {
  id: string;
  ownerType: 'guest' | 'account';
  ownerId: string;
  habitId: string;
  fromState: HabitLifecycleState | null;
  toState: HabitLifecycleState;
  reasonCode: string;
  reasonPayload: Record<string, unknown>;
  commandId: string;
  occurredAt: string;
};

export type LocalChangeHistoryRecord = {
  id: string;
  ownerType: 'guest' | 'account';
  ownerId: string;
  habitId: string;
  changeType: string;
  sourceEntityType: string;
  sourceEntityId: string | null;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  createdVersionId: string | null;
  commandId: string;
  createdAt: string;
};

export type LocalCheckInReviewRecord = {
  id: string;
  ownerType: 'guest' | 'account';
  ownerId: string;
  habitId: string;
  status: 'pending' | 'resolved';
  signalSnapshot: Record<string, unknown>;
  recommendationId: string | null;
  bannerDismissedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type LocalReviewCycleRecord = {
  id: string;
  ownerType: 'guest' | 'account';
  ownerId: string;
  windowStart: string;
  windowEnd: string;
  status: 'open' | 'completed' | 'dismissed';
  completedAt: string | null;
  createdAt: string;
};
```

- [ ] **Step 4: Extend Recovery records**

Add to `LocalRecoveryPlanRecord`:

```typescript
  deferredCount: number;
  successfulSessions: number;
  evaluatedSessions: number;
  failureSequence: number;
  supersedesPlanId: string | null;
```

- [ ] **Step 5: Define schema version 5**

Update `src/lib/indexed-db/schema.ts`:

```typescript
export const recoveryFirstStoresV5 = {
  ...recoveryFirstStoresV4,
  lifecycleEvents:
    'id, [ownerType+ownerId], habitId, toState, commandId, occurredAt',
  changeHistory:
    'id, [ownerType+ownerId], habitId, changeType, commandId, createdAt',
  checkInReviews:
    'id, [ownerType+ownerId], habitId, status, createdAt',
  reviewCycles:
    'id, [ownerType+ownerId], [windowStart+windowEnd], status, createdAt',
} as const;

export const currentIndexedDbVersion = 5;
```

Register:

```typescript
this.version(5)
  .stores(recoveryFirstStoresV5)
  .upgrade(upgradeLifecycleRecordsToV5);
```

- [ ] **Step 6: Implement upgrade defaults**

Create `src/lib/indexed-db/lifecycle-migrations.ts`:

```typescript
import type { Transaction } from 'dexie';

export async function upgradeLifecycleRecordsToV5(
  transaction: Transaction,
): Promise<void> {
  await transaction.table('recoveryPlans').toCollection().modify((plan) => {
    plan.deferredCount ??= 0;
    plan.successfulSessions ??= 0;
    plan.evaluatedSessions ??= 0;
    plan.failureSequence ??= 0;
    plan.supersedesPlanId ??= null;
  });
}
```

- [ ] **Step 7: Run migration tests**

```bash
pnpm exec vitest run tests/unit/indexed-db/database.test.ts tests/unit/indexed-db/migrations.test.ts
```

Expected: PASS with version 4 data preserved and version 5 stores available.

- [ ] **Step 8: Commit**

```bash
git add src/lib/indexed-db tests/unit/indexed-db
git commit -m "feat: add guest lifecycle and review storage"
```

---

## Task 13: Implement Lifecycle Actions, Change History, and Check-in Review UI

**Files:**

- Create: `src/features/lifecycle/components/lifecycle-action-menu.tsx`
- Create: `src/features/lifecycle/components/lifecycle-confirmation-dialog.tsx`
- Create: `src/features/lifecycle/components/change-history-list.tsx`
- Create: `src/features/check-in-review/components/check-in-review-banner.tsx`
- Create: `src/features/check-in-review/components/check-in-review-panel.tsx`
- Create: `src/app/(application)/habits/[habitId]/change-history/page.tsx`
- Create: `src/app/(application)/habits/[habitId]/review/page.tsx`
- Create: `tests/component/lifecycle-actions.test.tsx`

- [ ] **Step 1: Write failing component tests**

Test that:

- action availability follows the lifecycle state;
- Pause, Stop, Complete, Archive, Trash, and Restore show consequences before confirmation;
- destructive actions include heading, icon, descriptive text, Cancel, and explicit Confirm labels;
- Today Check-in Review banner supports Review Now and Later;
- Later dismisses the banner without showing the review as resolved;
- Change History exposes version and decision entries in chronological order;
- keyboard focus returns to the trigger after closing a dialog.

- [ ] **Step 2: Confirm failure**

```bash
pnpm exec vitest run tests/component/lifecycle-actions.test.tsx
```

Expected: FAIL because components do not exist.

- [ ] **Step 3: Implement state-aware action menu**

Use a declarative map:

```typescript
const actionsByState = {
  active: ['pause', 'stop', 'complete', 'trash'],
  stable: ['pause', 'stop', 'complete', 'trash'],
  at_risk: ['pause', 'stop', 'trash'],
  recovery: ['pause', 'trash'],
  needs_review: ['redesign', 'pause', 'stop', 'keep_current'],
  paused: ['resume', 'stop', 'trash'],
  stopped: ['resume', 'archive', 'trash'],
  completed: ['resume', 'archive', 'trash'],
  archived: ['restore', 'trash'],
  trash: ['restore'],
} as const;
```

Do not expose an unavailable action and do not use a disabled control as the only explanation.

- [ ] **Step 4: Implement confirmation dialog copy contracts**

Examples:

```typescript
const confirmationCopy = {
  pause: {
    title: 'Pause this habit?',
    body: 'Scheduled sessions and reminders will stop until you resume. Your history remains available.',
    confirmLabel: 'Pause habit',
  },
  trash: {
    title: 'Move this habit to Trash?',
    body: 'The habit can be restored for 30 days. Past sessions and check-ins remain linked to it.',
    confirmLabel: 'Move to Trash',
  },
};
```

Use semantic icon plus text; do not rely on color alone.

- [ ] **Step 5: Implement Check-in Review presentation**

The panel must show:

- observed reminder and session signals;
- one strongest recommendation;
- expected effect and next eligible timing;
- Apply, Customize, Keep Current;
- Later only when opened from the Today banner;
- offline and pending-sync variants using shared operational-state components.

- [ ] **Step 6: Implement Change History route**

Render:

- lifecycle transitions;
- recommendation decisions;
- Recovery starts and results;
- redesign and restore version links;
- timestamps in the profile timezone;
- empty, loading, error, and offline states without layout shift.

- [ ] **Step 7: Run component tests**

```bash
pnpm exec vitest run tests/component/lifecycle-actions.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/lifecycle src/features/check-in-review src/app/'(application)'/habits tests/component/lifecycle-actions.test.tsx
git commit -m "feat: add lifecycle and check-in review interface"
```

---

## Task 14: Implement Recovery and Needs Review Interface

**Files:**

- Create: `src/features/recovery/components/recovery-banner.tsx`
- Create: `src/features/recovery/components/recovery-recommendation-card.tsx`
- Create: `src/features/recovery/components/recovery-customization-form.tsx`
- Create: `src/features/recovery/components/recovery-progress-card.tsx`
- Create: `src/features/recovery/components/recovery-result-panel.tsx`
- Create: `src/features/recovery/components/needs-review-panel.tsx`
- Create: `src/app/(application)/habits/[habitId]/recovery/page.tsx`
- Create: `tests/component/recovery-flow.test.tsx`

- [ ] **Step 1: Write failing Recovery component tests**

Test that:

- the banner is non-blocking and uses neutral copy;
- the recommendation card displays signal, one proposed variable, duration, threshold, and effective timing;
- Later appears only while `deferredCount === 0`;
- Customize permits one primary variable and duration 3 or 5;
- Recovery progress is expressed in eligible scheduled sessions, not calendar days;
- success returns to Normal on the next eligible session;
- first failure shows a different lighter plan;
- Needs Review presents Redesign, Pause, Stop, and Keep Current without auto-selecting one.

- [ ] **Step 2: Confirm failure**

```bash
pnpm exec vitest run tests/component/recovery-flow.test.tsx
```

Expected: FAIL because Recovery UI does not exist.

- [ ] **Step 3: Implement Recovery banner**

Use the approved copy:

```text
This habit has been difficult recently.
Review a lighter plan for the next three scheduled sessions.
```

Actions:

```text
Review a lighter plan
Later
```

The banner must not block Today check-ins for other habits.

- [ ] **Step 4: Implement recommendation and customization**

Render structured evidence, not diagnosis. Example:

```typescript
const signalCopy = {
  repeated_too_difficult: '“Too difficult” was selected most often recently.',
  repeated_low_energy: '“Low energy” was selected most often recently.',
  insufficient_evidence: 'There is not enough consistent friction data yet.',
} as const;
```

The customization form must validate:

- exactly one primary variable changes;
- duration is 3 or 5 eligible sessions;
- success threshold is at least 1 and not greater than duration;
- Normal and Minimum targets remain distinguishable.

- [ ] **Step 5: Implement progress and result panels**

Examples:

```text
Recovery plan: 2 of 3 scheduled sessions completed
Successful sessions: 2
```

Do not show punitive streak loss or failure language. Use:

```text
This plan did not fit well enough.
A lighter option is ready to review.
```

- [ ] **Step 6: Implement Needs Review panel**

Required message:

```text
This habit needs a decision
Recent plans have not fit well enough. Your history is safe.
```

No action is preselected. Preview consequence and effective timing before confirmation.

- [ ] **Step 7: Run component tests**

```bash
pnpm exec vitest run tests/component/recovery-flow.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/recovery src/app/'(application)'/habits/'[habitId]'/recovery tests/component/recovery-flow.test.tsx
git commit -m "feat: add recovery and needs review interface"
```

---

## Task 15: Implement Weekly Review Interface and Batch Confirmation

**Files:**

- Create: `src/features/weekly-review/components/weekly-summary.tsx`
- Create: `src/features/weekly-review/components/review-item-card.tsx`
- Create: `src/features/weekly-review/components/review-decision-controls.tsx`
- Create: `src/features/weekly-review/components/batch-confirmation-dialog.tsx`
- Create: `src/features/weekly-review/components/review-completion.tsx`
- Create: `src/app/(application)/review/page.tsx`
- Create: `src/app/(application)/review/history/page.tsx`
- Create: `tests/component/weekly-review.test.tsx`

- [ ] **Step 1: Write failing Weekly Review component tests**

Test that:

- priority ordering matches the domain policy;
- only the top three attention items are expanded initially;
- remaining items are accessible through an explicit disclosure control;
- recommendation controls are unselected by default;
- each card states signal, proposed change, expected effect, and effective timing;
- the review can complete with no changes;
- the batch dialog lists each selected decision before confirmation;
- partial failure shows successful and failed results separately;
- completion shows applied, unchanged, unresolved, next review date, and Change History link.

- [ ] **Step 2: Confirm failure**

```bash
pnpm exec vitest run tests/component/weekly-review.test.tsx
```

Expected: FAIL because Weekly Review components do not exist.

- [ ] **Step 3: Implement summary and ordered cards**

The summary contains:

```typescript
export type WeeklySummaryProps = {
  successfulSessions: number;
  minimumSessions: number;
  manualSkippedSessions: number;
  automaticSkippedSessions: number;
  habitsNeedingAttention: number;
};
```

Use neutral labels and do not collapse Full and Minimum into a punitive streak metric.

- [ ] **Step 4: Implement explicit decision controls**

Each recommendation card starts with:

```typescript
value: null
```

Available values:

```text
Apply
Customize
Keep Current
```

A user may leave cards undecided and still complete the review.

- [ ] **Step 5: Implement batch confirmation**

The confirmation dialog must:

- show only explicitly selected decisions;
- state that changes begin on the next eligible session;
- provide Back and Confirm Changes actions;
- support zero selected decisions with `Complete without changes`;
- keep the original review selections when Back is chosen.

- [ ] **Step 6: Implement result and history routes**

Per-item statuses:

```text
Applied
Kept current
Needs retry
Still unresolved
```

Do not hide successful results when one item fails. The history route links each applied change to the new habit version.

- [ ] **Step 7: Run component tests**

```bash
pnpm exec vitest run tests/component/weekly-review.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/weekly-review src/app/'(application)'/review tests/component/weekly-review.test.tsx
git commit -m "feat: add weekly review interface"
```

---

## Task 16: Add Desktop and Mobile-Web End-to-End Coverage

**Files:**

- Create: `tests/e2e/lifecycle-actions.spec.ts`
- Create: `tests/e2e/recovery-flow.spec.ts`
- Create: `tests/e2e/weekly-review.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Add lifecycle E2E scenario**

Cover:

```text
Create habit
→ activate
→ pause
→ verify sessions and reminders stop
→ resume to Rebuilding
→ verify history remains
→ move to Trash
→ restore within retention window
```

Run on Chromium desktop and 390px mobile viewport.

- [ ] **Step 2: Add Recovery E2E scenario**

Cover:

```text
Three scheduled Manual Skipped outcomes
→ Recovery banner appears exactly once
→ open recommendation
→ defer once
→ prompt returns at next eligible session
→ Apply
→ record two successful sessions and one miss
→ Recovery succeeds
→ next eligible session uses Normal target
→ Change History contains the plan result
```

Add a second fixture proving two failed plans produce Needs Review and no automatic Pause or Stop.

- [ ] **Step 3: Add Weekly Review E2E scenario**

Cover:

```text
Open review manually
→ verify priority order
→ select Apply on one item
→ select Keep Current on another
→ leave one item undecided
→ inspect confirmation
→ confirm once
→ verify per-item results
→ complete review
→ open Change History
```

Add a partial-failure fixture and safe retry assertion.

- [ ] **Step 4: Add accessibility assertions**

For Recovery and Weekly Review routes assert:

- one page-level heading;
- logical focus order;
- visible focus indicator;
- dialog focus trap and return;
- status messages use text and icons, not color only;
- controls remain usable at 200% browser zoom;
- reduced motion disables non-essential transitions.

- [ ] **Step 5: Run E2E suites**

```bash
pnpm test:e2e:recovery
pnpm test:e2e:review
```

Expected: all desktop and mobile-web scenarios pass.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: cover lifecycle recovery and weekly review flows"
```

---

## Task 17: Execute the Plan 06 Quality Gate and Record Handoff

**Files:**

- Create: `docs/implementation/06-lifecycle-recovery-weekly-review-verification.md`
- Modify: `README.md`

- [ ] **Step 1: Run database verification**

```bash
pnpm supabase db reset
pnpm supabase test db
pnpm db:types:check
```

Expected: database reset succeeds, all pgTAP tests pass, and generated types have no drift.

- [ ] **Step 2: Run focused Plan 06 tests**

```bash
pnpm test:lifecycle
pnpm test:recommendations
pnpm test:recovery
pnpm test:weekly-review
pnpm test:e2e:recovery
pnpm test:e2e:review
```

Expected: every focused suite passes.

- [ ] **Step 3: Run repository-wide checks**

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all commands exit with code 0.

- [ ] **Step 4: Verify product invariants manually**

Record evidence for each item:

```text
[ ] Automatic Skipped never increments the Manual Skipped Recovery counter.
[ ] Three qualifying Manual Skipped sessions trigger one Recovery proposal.
[ ] Later is available once and does not resolve the proposal.
[ ] Recovery changes one primary variable.
[ ] 2/3 successful eligible sessions complete a three-session plan.
[ ] First failed plan produces a different lighter plan.
[ ] Two consecutive failed plans transition to Needs Review.
[ ] Needs Review never auto-pauses, stops, trashes, or deletes a habit.
[ ] Check-in Review remains in Weekly Review after Today-banner dismissal.
[ ] Weekly Review items follow the approved priority order.
[ ] No recommendation is preselected.
[ ] Weekly Review may complete with zero changes.
[ ] Redesign and restore create new immutable versions.
[ ] Change History preserves every material decision.
[ ] Recovery and review language is neutral and non-diagnostic.
```

- [ ] **Step 5: Create verification record**

Create `docs/implementation/06-lifecycle-recovery-weekly-review-verification.md`:

```markdown
# Plan 06 Verification

## Scope

Lifecycle, Automatic Skipped resolution, Check-in Review, recommendations, Recovery, Needs Review, Weekly Review, version-based redesign, and Change History.

## Automated Evidence

Record the exact command, execution date, exit code, and passing test count for database, unit, integration, component, E2E, typecheck, lint, and build verification.

## Manual Evidence

Record the result and screenshot or trace location for every product invariant in Task 17 Step 4.

## Deferred Scope

Authentication and Guest conversion begin in Plan 07. Premium algorithms, billing, production observability, export, deletion, and release certification remain deferred to their designated plans.
```

- [ ] **Step 6: Update README implementation status**

Add:

```markdown
- Plan 06: Lifecycle, Recovery, and Weekly Review — verified
- Next plan: Plan 07 Authentication and Guest Conversion
```

Only mark Plan 06 verified after all commands and invariants have evidence.

- [ ] **Step 7: Commit verification evidence**

```bash
git add docs/implementation/06-lifecycle-recovery-weekly-review-verification.md README.md
git commit -m "docs: verify lifecycle recovery and weekly review"
```

---

# 4. Plan 06 Completion Criteria

Plan 06 is complete only when:

- every lifecycle transition is explicit, guarded, idempotent, and historically recorded;
- pause, resume, stop, complete, archive, Trash, restore, redesign, and version restore preserve required history;
- Automatic Skipped resolution is permanent and excluded from the Recovery counter;
- repeated Automatic Skipped sessions create one Check-in Review;
- deterministic recommendations expose observed evidence and one proposed variable;
- Apply, Customize, Keep Current, and permitted deferral follow the approved contracts;
- three qualifying Manual Skipped sessions create one Recovery proposal;
- Recovery progress is based on eligible scheduled sessions;
- success, first failure, second failure, Rebuilding, and Needs Review behavior pass TypeScript and SQL tests;
- Weekly Review generation, ordering, batch confirmation, no-change completion, partial failure, and reversibility pass tests;
- Guest mode and signed-in-compatible repositories expose equivalent behavior;
- desktop and 390px mobile-web E2E tests pass;
- accessibility assertions pass;
- formatting, lint, typecheck, full tests, and production build pass;
- verification evidence is recorded before Plan 07 begins.

# 5. Plan 07 Handoff Contract

Plan 07 may assume the following stable contracts:

- Guest lifecycle, Recovery, and review data are durable in Dexie version 5;
- account repositories have RLS-protected PostgreSQL functions for lifecycle, Recovery, and review commands;
- every command accepts a stable idempotency identifier;
- Change History and immutable habit versions are canonical;
- Guest conversion must preserve lifecycle state, Recovery plans, recommendations, review items, review cycles, and history without duplication;
- cross-device synchronization must treat PostgreSQL as authoritative after acknowledgement;
- authentication UI must not contain or reimplement Recovery policy.
