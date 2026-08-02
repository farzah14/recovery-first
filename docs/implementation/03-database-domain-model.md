# Database and Domain Model Implementation Plan

> **Execution mode:** Single-agent sequential execution. Use the `executing-plans` workflow. Do not create, delegate to, or dispatch subagents. Complete one task, run its fresh verification commands, commit it, and only then continue. Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** Establish deterministic Recovery-First domain rules, the complete PostgreSQL/RLS foundation, generated Supabase types, and versioned browser-local schemas before user-facing product workflows are implemented.

**Architecture:** Product rules live in framework-independent TypeScript modules under `src/domain/`. PostgreSQL is authoritative for signed-in account data and enforces ownership, active-plan limits, revisions, and idempotent commands transactionally. Dexie stores Guest canonical data plus signed-in cache/draft/outbox records in a versioned IndexedDB database; Plan 03 defines schema and migrations only, while live synchronization remains deferred to Plan 05.

**Tech Stack:** TypeScript, Vitest, Supabase CLI, PostgreSQL, pgTAP, `@supabase/supabase-js`, Dexie, `fake-indexeddb`, Node.js 24, pnpm.

**Save as:** `docs/implementation/03-database-domain-model.md`

**Source of truth:**

1. `AGENTS.md`
2. `docs/specs/PRD.md`
3. `docs/specs/UX-FLOWS.md`
4. `docs/specs/UI-SPEC.md`
5. `docs/specs/TECHNICAL-DESIGN.md`
6. `docs/implementation/IMPLEMENTATION-PLAN.md`
7. This plan

**Prerequisites:**

- Plan 01 Final Acceptance Checklist passes.
- Plan 02 Final Acceptance Checklist passes.
- The repository is on a dedicated implementation branch or worktree.
- `pnpm verify`, `pnpm db:reset`, `pnpm db:test`, and `pnpm build` pass before Task 1.

**Explicitly excluded:** User-facing habit forms, check-in buttons, Today data loading, authentication UI, Guest conversion, queue processing, reminder delivery, Recovery UI, billing-provider integration, and analytics dashboards.

---

# 1. Locked Product Contracts

Plan 03 must encode these rules exactly:

- Guest active-habit limit: `3`.
- Free account active-habit limit: `5`.
- Premium active-habit limit: `20`.
- Slot-consuming states: `starting`, `building`, `active`, `stable`, `at_risk`, `recovery`, `rebuilding`, `needs_review`.
- Check-in outcomes: `full`, `minimum`, `manual_skipped`, `automatic_skipped`, `excused`, `unrecorded`.
- `full` and `minimum` are successful outcomes.
- `manual_skipped` increments the consecutive Recovery counter.
- `full` or `minimum` resets the Recovery counter.
- `automatic_skipped`, `excused`, and `unrecorded` do not increment it.
- Three consecutive `manual_skipped` outcomes trigger Recovery eligibility.
- Automatic Skipped affects consistency but cannot independently trigger Recovery.
- Habit versions are immutable after publication.
- Signed-in writes use UUID command IDs, optimistic revisions, and idempotency records.
- Every account-owned table is protected by RLS.
- Guest canonical records remain browser-local.
- Database and IndexedDB migrations are append-only.

---

# 2. File Map

```text
package.json
pnpm-lock.yaml

src/domain/
├── shared/
│   ├── identity-mode.ts
│   ├── plan-tier.ts
│   └── sync-state.ts
├── habits/
│   ├── habit-lifecycle.ts
│   ├── active-slot-policy.ts
│   ├── recurrence.ts
│   └── session-identity.ts
├── check-ins/
│   ├── check-in.ts
│   └── metrics.ts
├── recovery/
│   ├── recommendation.ts
│   └── recovery.ts
└── subscriptions/
    └── entitlement.ts

src/lib/supabase/
└── database.types.ts

src/lib/indexed-db/
├── database.ts
├── migrations.ts
├── schema.ts
└── types.ts

tool/
└── verify-generated-types.mjs

supabase/migrations/
├── 20260729010000_domain_enums_and_profiles.sql
├── 20260729011000_habits_sessions_checkins.sql
├── 20260729012000_recovery_reviews_reminders.sql
├── 20260729013000_entitlements_commands_audit.sql
├── 20260729014000_domain_functions.sql
└── 20260729015000_row_level_security.sql

supabase/tests/
├── 00010_schema_contract.test.sql
├── 00020_constraints.test.sql
├── 00030_domain_functions.test.sql
└── 00040_row_level_security.test.sql

supabase/seed.sql

tests/unit/domain/
├── active-slot-policy.test.ts
├── check-in-metrics.test.ts
├── entitlement.test.ts
├── habit-lifecycle.test.ts
├── recurrence.test.ts
├── recovery.test.ts
└── session-identity.test.ts

tests/unit/indexed-db/
├── database.test.ts
└── migrations.test.ts
```

---

# 3. Tasks

## Task 1: Add Domain, Supabase Type, and IndexedDB Tooling

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `tool/verify-generated-types.mjs`

- [x] **Step 1: Verify the Plan 02 baseline**

Run:

```bash
pnpm verify
pnpm test:accessibility
pnpm test:e2e
pnpm build
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
git status --short
```

Expected: every command exits with status `0` and the working tree is clean.

> **Environment note:** On Windows Docker Desktop, `pnpm db:start` intermittently reports auxiliary
> service health checks (`unhealthy`) during warm-up on the first attempt. Retrying the start brings
> the full stack to healthy and exits `0`. This is a startup-timing environment flake, not a code
> defect; the database always reaches `healthy` and `db:reset`, `db:test` (4/4), and `db:stop`
> pass with a clean working tree.

- [x] **Step 2: Install exact project dependencies**

Run:

```bash
pnpm add @supabase/supabase-js@latest dexie@latest
pnpm add -D fake-indexeddb@latest
```

Expected: the packages appear with exact versions in `package.json` and `pnpm-lock.yaml` changes.

- [x] **Step 3: Add database/domain scripts without replacing existing scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'test:domain': 'vitest run tests/unit/domain',
  'test:indexed-db': 'vitest run tests/unit/indexed-db',
  'db:types': 'supabase gen types typescript --local --schema public',
  'db:types:write': 'pnpm db:types > src/lib/supabase/database.types.ts',
  'db:types:check': 'node tool/verify-generated-types.mjs',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

Verify:

```bash
node -e "const p=require('./package.json'); for (const s of ['test:domain','test:indexed-db','db:types','db:types:write','db:types:check']) if (!p.scripts[s]) process.exit(1)"
```

Expected: command exits with status `0`.

- [x] **Step 4: Create the generated-type drift verifier**

Create `tool/verify-generated-types.mjs`:

```javascript
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const trackedPath = 'src/lib/supabase/database.types.ts';
const temporaryPath = join(tmpdir(), `recovery-first-database-types-${process.pid}.ts`);

try {
  const generated = execFileSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['db:types'],
    { encoding: 'utf8' },
  );

  writeFileSync(temporaryPath, generated, 'utf8');
  const tracked = readFileSync(trackedPath, 'utf8');

  if (tracked !== generated) {
    console.error('Generated Supabase types are stale. Run: pnpm db:types:write');
    process.exitCode = 1;
  } else {
    console.log('Generated Supabase types match the local schema.');
  }
} finally {
  rmSync(temporaryPath, { force: true });
}
```

- [x] **Step 5: Verify tooling compiles before schema work**

Run:

```bash
pnpm format
pnpm lint
pnpm typecheck
```

Expected: all commands pass.

- [x] **Step 6: Commit tooling**

Run:

```bash
git add package.json pnpm-lock.yaml tool/verify-generated-types.mjs
git commit -m "build: add domain and database tooling"
```

---

## Task 2: Define Identity, Plan, Lifecycle, and Active-Slot Rules

**Files:**

- Create: `src/domain/shared/identity-mode.ts`
- Create: `src/domain/shared/plan-tier.ts`
- Create: `src/domain/shared/sync-state.ts`
- Create: `src/domain/habits/habit-lifecycle.ts`
- Create: `src/domain/habits/active-slot-policy.ts`
- Create: `tests/unit/domain/habit-lifecycle.test.ts`
- Create: `tests/unit/domain/active-slot-policy.test.ts`

- [x] **Step 1: Write the failing lifecycle test**

Create `tests/unit/domain/habit-lifecycle.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  canTransitionHabit,
  isSlotConsumingHabitState,
  type HabitLifecycleState,
} from '@/domain/habits/habit-lifecycle';

describe('habit lifecycle', () => {
  it.each<HabitLifecycleState>([
    'starting',
    'building',
    'active',
    'stable',
    'at_risk',
    'recovery',
    'rebuilding',
    'needs_review',
  ])('treats %s as slot consuming', (state) => {
    expect(isSlotConsumingHabitState(state)).toBe(true);
  });

  it.each<HabitLifecycleState>([
    'draft',
    'paused',
    'stopped',
    'completed',
    'archived',
    'trash',
    'decision_required',
  ])('treats %s as not slot consuming', (state) => {
    expect(isSlotConsumingHabitState(state)).toBe(false);
  });

  it('allows only explicitly approved transitions', () => {
    expect(canTransitionHabit('draft', 'starting')).toBe(true);
    expect(canTransitionHabit('stable', 'recovery')).toBe(true);
    expect(canTransitionHabit('trash', 'rebuilding')).toBe(true);
    expect(canTransitionHabit('draft', 'stable')).toBe(false);
    expect(canTransitionHabit('trash', 'active')).toBe(false);
  });
});
```

- [x] **Step 2: Write the failing active-limit test**

Create `tests/unit/domain/active-slot-policy.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  activeHabitLimitFor,
  evaluateActivation,
} from '@/domain/habits/active-slot-policy';

describe('active slot policy', () => {
  it('returns fixed limits for every plan tier', () => {
    expect(activeHabitLimitFor('guest')).toBe(3);
    expect(activeHabitLimitFor('free')).toBe(5);
    expect(activeHabitLimitFor('premium')).toBe(20);
  });

  it('permits activation while capacity remains', () => {
    expect(evaluateActivation({ planTier: 'free', activeCount: 4 })).toEqual({
      allowed: true,
      limit: 5,
      remainingAfterActivation: 0,
    });
  });

  it('rejects activation when the limit is reached', () => {
    expect(evaluateActivation({ planTier: 'guest', activeCount: 3 })).toEqual({
      allowed: false,
      limit: 3,
      reason: 'active_limit_reached',
    });
  });
});
```

- [x] **Step 3: Run both tests and confirm failure**

Run:

```bash
pnpm exec vitest run tests/unit/domain/habit-lifecycle.test.ts tests/unit/domain/active-slot-policy.test.ts
```

Expected: FAIL because the domain modules do not exist.

- [x] **Step 4: Implement identity and plan contracts**

Create `src/domain/shared/identity-mode.ts`:

```typescript
export const identityModes = ['guest', 'account'] as const;

export type IdentityMode = (typeof identityModes)[number];

export function isIdentityMode(value: string): value is IdentityMode {
  return identityModes.includes(value as IdentityMode);
}
```

Create `src/domain/shared/plan-tier.ts`:

```typescript
export const planTiers = ['guest', 'free', 'premium'] as const;

export type PlanTier = (typeof planTiers)[number];

export function isPlanTier(value: string): value is PlanTier {
  return planTiers.includes(value as PlanTier);
}
```

Create `src/domain/shared/sync-state.ts`:

```typescript
export const synchronizationStates = [
  'local_only',
  'pending',
  'synchronized',
  'blocked',
  'failed',
] as const;

export type SynchronizationState = (typeof synchronizationStates)[number];
```

- [x] **Step 5: Implement lifecycle rules**

Create `src/domain/habits/habit-lifecycle.ts`:

```typescript
export const habitLifecycleStates = [
  'draft',
  'starting',
  'building',
  'active',
  'stable',
  'at_risk',
  'recovery',
  'rebuilding',
  'needs_review',
  'paused',
  'stopped',
  'completed',
  'archived',
  'trash',
  'decision_required',
] as const;

export type HabitLifecycleState = (typeof habitLifecycleStates)[number];

const slotConsumingStates = new Set<HabitLifecycleState>([
  'starting',
  'building',
  'active',
  'stable',
  'at_risk',
  'recovery',
  'rebuilding',
  'needs_review',
]);

const allowedTransitions: Readonly<Record<HabitLifecycleState, readonly HabitLifecycleState[]>> = {
  draft: ['starting', 'trash'],
  starting: ['building', 'paused', 'trash'],
  building: ['active', 'recovery', 'paused', 'trash'],
  active: ['stable', 'recovery', 'paused', 'stopped', 'completed', 'trash'],
  stable: ['at_risk', 'recovery', 'paused', 'stopped', 'completed', 'trash'],
  at_risk: ['recovery', 'paused', 'stopped', 'trash'],
  recovery: ['rebuilding', 'needs_review', 'paused', 'trash'],
  rebuilding: ['building', 'active', 'recovery', 'paused', 'trash'],
  needs_review: ['rebuilding', 'paused', 'stopped', 'trash'],
  paused: ['rebuilding', 'stopped', 'trash'],
  stopped: ['archived', 'rebuilding', 'trash'],
  completed: ['archived', 'rebuilding', 'trash'],
  archived: ['rebuilding', 'trash'],
  trash: ['rebuilding'],
  decision_required: ['draft', 'paused', 'rebuilding', 'trash'],
};

export function isSlotConsumingHabitState(state: HabitLifecycleState): boolean {
  return slotConsumingStates.has(state);
}

export function canTransitionHabit(
  from: HabitLifecycleState,
  to: HabitLifecycleState,
): boolean {
  return allowedTransitions[from].includes(to);
}
```

- [x] **Step 6: Implement the active-slot policy**

Create `src/domain/habits/active-slot-policy.ts`:

```typescript
import type { PlanTier } from '@/domain/shared/plan-tier';

const activeHabitLimits: Readonly<Record<PlanTier, number>> = {
  guest: 3,
  free: 5,
  premium: 20,
};

export type ActivationDecision =
  | {
      allowed: true;
      limit: number;
      remainingAfterActivation: number;
    }
  | {
      allowed: false;
      limit: number;
      reason: 'active_limit_reached';
    };

export function activeHabitLimitFor(planTier: PlanTier): number {
  return activeHabitLimits[planTier];
}

export function evaluateActivation({
  planTier,
  activeCount,
}: {
  planTier: PlanTier;
  activeCount: number;
}): ActivationDecision {
  if (!Number.isInteger(activeCount) || activeCount < 0) {
    throw new RangeError('activeCount must be a non-negative integer');
  }

  const limit = activeHabitLimitFor(planTier);
  if (activeCount >= limit) {
    return { allowed: false, limit, reason: 'active_limit_reached' };
  }

  return {
    allowed: true,
    limit,
    remainingAfterActivation: limit - activeCount - 1,
  };
}
```

- [x] **Step 7: Run focused tests**

Run:

```bash
pnpm exec vitest run tests/unit/domain/habit-lifecycle.test.ts tests/unit/domain/active-slot-policy.test.ts
pnpm typecheck
```

Expected: all tests and typecheck pass.

- [x] **Step 8: Commit domain identity and lifecycle rules**

Run:

```bash
git add src/domain/shared src/domain/habits/habit-lifecycle.ts src/domain/habits/active-slot-policy.ts tests/unit/domain
git commit -m "feat: define identity lifecycle and active limits"
```

---

## Task 3: Define Recurrence, Timezone, and Session Identity

**Files:**

- Create: `src/domain/habits/recurrence.ts`
- Create: `src/domain/habits/session-identity.ts`
- Create: `tests/unit/domain/recurrence.test.ts`
- Create: `tests/unit/domain/session-identity.test.ts`

- [x] **Step 1: Write failing recurrence tests**

Create `tests/unit/domain/recurrence.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  validateRecurrenceRule,
  type RecurrenceRule,
} from '@/domain/habits/recurrence';

describe('recurrence validation', () => {
  it.each<RecurrenceRule>([
    { kind: 'daily' },
    { kind: 'weekdays', weekdays: [1, 3, 5] },
    { kind: 'times_per_week', count: 3, placement: [1, 3, 6] },
    { kind: 'finite_dates', dates: ['2026-08-01', '2026-08-03'] },
  ])('accepts a supported rule %#', (rule) => {
    expect(validateRecurrenceRule(rule)).toEqual({ valid: true });
  });

  it('rejects duplicate weekdays', () => {
    expect(
      validateRecurrenceRule({ kind: 'weekdays', weekdays: [1, 1] }),
    ).toEqual({ valid: false, reason: 'duplicate_weekday' });
  });

  it('rejects mismatched times-per-week placement', () => {
    expect(
      validateRecurrenceRule({
        kind: 'times_per_week',
        count: 3,
        placement: [1, 3],
      }),
    ).toEqual({ valid: false, reason: 'placement_count_mismatch' });
  });
});
```

- [x] **Step 2: Write failing session identity tests**

Create `tests/unit/domain/session-identity.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  buildSessionIdentity,
  isValidIanaTimezone,
} from '@/domain/habits/session-identity';

describe('session identity', () => {
  it('creates the same identity for the same occurrence', () => {
    const input = {
      habitId: '11111111-1111-4111-8111-111111111111',
      habitVersionId: '22222222-2222-4222-8222-222222222222',
      scheduledLocalDate: '2026-08-01',
      scheduledLocalTime: '07:30',
    } as const;

    expect(buildSessionIdentity(input)).toBe(buildSessionIdentity(input));
  });

  it('distinguishes timed and all-day sessions', () => {
    const base = {
      habitId: '11111111-1111-4111-8111-111111111111',
      habitVersionId: '22222222-2222-4222-8222-222222222222',
      scheduledLocalDate: '2026-08-01',
    } as const;

    expect(buildSessionIdentity({ ...base, scheduledLocalTime: null })).not.toBe(
      buildSessionIdentity({ ...base, scheduledLocalTime: '07:30' }),
    );
  });

  it('validates IANA timezone names', () => {
    expect(isValidIanaTimezone('Asia/Jakarta')).toBe(true);
    expect(isValidIanaTimezone('Not/A_Timezone')).toBe(false);
  });
});
```

- [x] **Step 3: Run tests and confirm failure**

Run:

```bash
pnpm exec vitest run tests/unit/domain/recurrence.test.ts tests/unit/domain/session-identity.test.ts
```

Expected: FAIL because the modules do not exist.

- [x] **Step 4: Implement recurrence contracts**

Create `src/domain/habits/recurrence.ts`:

```typescript
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RecurrenceRule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; weekdays: IsoWeekday[] }
  | {
      kind: 'times_per_week';
      count: number;
      placement: IsoWeekday[];
    }
  | { kind: 'finite_dates'; dates: string[] };

export type RecurrenceValidation =
  | { valid: true }
  | {
      valid: false;
      reason:
        | 'empty_weekdays'
        | 'invalid_weekday'
        | 'duplicate_weekday'
        | 'invalid_weekly_count'
        | 'placement_count_mismatch'
        | 'invalid_local_date'
        | 'duplicate_local_date';
    };

const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function hasDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size !== values.length;
}

export function validateRecurrenceRule(
  rule: RecurrenceRule,
): RecurrenceValidation {
  if (rule.kind === 'daily') return { valid: true };

  if (rule.kind === 'weekdays') {
    if (rule.weekdays.length === 0) return { valid: false, reason: 'empty_weekdays' };
    if (rule.weekdays.some((day) => day < 1 || day > 7)) {
      return { valid: false, reason: 'invalid_weekday' };
    }
    if (hasDuplicates(rule.weekdays)) {
      return { valid: false, reason: 'duplicate_weekday' };
    }
    return { valid: true };
  }

  if (rule.kind === 'times_per_week') {
    if (!Number.isInteger(rule.count) || rule.count < 1 || rule.count > 7) {
      return { valid: false, reason: 'invalid_weekly_count' };
    }
    if (rule.placement.length !== rule.count) {
      return { valid: false, reason: 'placement_count_mismatch' };
    }
    if (rule.placement.some((day) => day < 1 || day > 7)) {
      return { valid: false, reason: 'invalid_weekday' };
    }
    if (hasDuplicates(rule.placement)) {
      return { valid: false, reason: 'duplicate_weekday' };
    }
    return { valid: true };
  }

  if (rule.dates.some((date) => !localDatePattern.test(date))) {
    return { valid: false, reason: 'invalid_local_date' };
  }
  if (hasDuplicates(rule.dates)) {
    return { valid: false, reason: 'duplicate_local_date' };
  }
  return { valid: true };
}
```

- [x] **Step 5: Implement deterministic session identity**

Create `src/domain/habits/session-identity.ts`:

```typescript
export type SessionIdentityInput = {
  habitId: string;
  habitVersionId: string;
  scheduledLocalDate: string;
  scheduledLocalTime: string | null;
};

export function buildSessionIdentity(input: SessionIdentityInput): string {
  const time = input.scheduledLocalTime ?? 'all-day';
  return [
    input.habitId,
    input.habitVersionId,
    input.scheduledLocalDate,
    time,
  ].join(':');
}

export function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
```

- [x] **Step 6: Run focused verification**

Run:

```bash
pnpm exec vitest run tests/unit/domain/recurrence.test.ts tests/unit/domain/session-identity.test.ts
pnpm typecheck
```

Expected: all tests and typecheck pass.

- [x] **Step 7: Commit recurrence and session identity**

Run:

```bash
git add src/domain/habits/recurrence.ts src/domain/habits/session-identity.ts tests/unit/domain/recurrence.test.ts tests/unit/domain/session-identity.test.ts
git commit -m "feat: define recurrence and session identity"
```

---

## Task 4: Define Check-in Outcomes, Metrics, and Recovery Counter

**Files:**

- Create: `src/domain/check-ins/check-in.ts`
- Create: `src/domain/check-ins/metrics.ts`
- Create: `tests/unit/domain/check-in-metrics.test.ts`

- [x] **Step 1: Write the failing check-in metric tests**

Create `tests/unit/domain/check-in-metrics.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  calculateConsistency,
  calculateContinuity,
  nextManualSkipCounter,
} from '@/domain/check-ins/metrics';

describe('check-in metrics', () => {
  it('counts Full and Minimum as successful consistency', () => {
    expect(
      calculateConsistency(['full', 'minimum', 'manual_skipped', 'excused']),
    ).toEqual({ successful: 2, resolved: 3, percentage: 66.67 });
  });

  it('excludes Excused and Unrecorded from the denominator', () => {
    expect(calculateConsistency(['excused', 'unrecorded'])).toEqual({
      successful: 0,
      resolved: 0,
      percentage: null,
    });
  });

  it('preserves continuity for Full and Minimum', () => {
    expect(calculateContinuity(['full', 'minimum', 'full'])).toBe(3);
  });

  it('breaks continuity after a skipped outcome', () => {
    expect(calculateContinuity(['full', 'minimum', 'automatic_skipped', 'full'])).toBe(1);
  });

  it('increments only for Manual Skipped and resets on success', () => {
    expect(nextManualSkipCounter(2, 'manual_skipped')).toBe(3);
    expect(nextManualSkipCounter(2, 'automatic_skipped')).toBe(2);
    expect(nextManualSkipCounter(2, 'excused')).toBe(2);
    expect(nextManualSkipCounter(2, 'full')).toBe(0);
    expect(nextManualSkipCounter(2, 'minimum')).toBe(0);
  });
});
```

- [x] **Step 2: Run the test and confirm failure**

Run:

```bash
pnpm exec vitest run tests/unit/domain/check-in-metrics.test.ts
```

Expected: FAIL because the check-in modules do not exist.

- [x] **Step 3: Implement check-in contracts**

Create `src/domain/check-ins/check-in.ts`:

```typescript
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

export type UserRecordableCheckInOutcome =
  (typeof userRecordableCheckInOutcomes)[number];

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
```

- [x] **Step 4: Implement deterministic metrics**

Create `src/domain/check-ins/metrics.ts`:

```typescript
import {
  isSuccessfulOutcome,
  type CheckInOutcome,
} from '@/domain/check-ins/check-in';

export type ConsistencyMetric = {
  successful: number;
  resolved: number;
  percentage: number | null;
};

export function calculateConsistency(
  outcomes: readonly CheckInOutcome[],
): ConsistencyMetric {
  const resolvedOutcomes = outcomes.filter(
    (outcome) => outcome !== 'excused' && outcome !== 'unrecorded',
  );
  const successful = resolvedOutcomes.filter(isSuccessfulOutcome).length;
  const resolved = resolvedOutcomes.length;

  return {
    successful,
    resolved,
    percentage: resolved === 0 ? null : Number(((successful / resolved) * 100).toFixed(2)),
  };
}

export function calculateContinuity(
  outcomesOldestToNewest: readonly CheckInOutcome[],
): number {
  let continuity = 0;

  for (let index = outcomesOldestToNewest.length - 1; index >= 0; index -= 1) {
    const outcome = outcomesOldestToNewest[index];
    if (outcome === 'full' || outcome === 'minimum') {
      continuity += 1;
      continue;
    }
    if (outcome === 'excused' || outcome === 'unrecorded') continue;
    break;
  }

  return continuity;
}

export function nextManualSkipCounter(
  currentCount: number,
  outcome: CheckInOutcome,
): number {
  if (!Number.isInteger(currentCount) || currentCount < 0) {
    throw new RangeError('currentCount must be a non-negative integer');
  }

  if (outcome === 'full' || outcome === 'minimum') return 0;
  if (outcome === 'manual_skipped') return currentCount + 1;
  return currentCount;
}
```

- [x] **Step 5: Run focused verification**

Run:

```bash
pnpm exec vitest run tests/unit/domain/check-in-metrics.test.ts
pnpm typecheck
```

Expected: all tests and typecheck pass.

- [x] **Step 6: Commit check-in domain contracts**

Run:

```bash
git add src/domain/check-ins tests/unit/domain/check-in-metrics.test.ts
git commit -m "feat: define check-in metrics and recovery counter"
```

---

## Task 5: Define Recommendation, Recovery, and Entitlement State Contracts

**Files:**

- Create: `src/domain/recovery/recommendation.ts`
- Create: `src/domain/recovery/recovery.ts`
- Create: `src/domain/subscriptions/entitlement.ts`
- Create: `tests/unit/domain/recovery.test.ts`
- Create: `tests/unit/domain/entitlement.test.ts`

- [x] **Step 1: Write failing Recovery tests**

Create `tests/unit/domain/recovery.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  evaluateRecoveryEligibility,
  evaluateRecoveryPlan,
} from '@/domain/recovery/recovery';

describe('Recovery rules', () => {
  it('triggers after three consecutive Manual Skipped outcomes', () => {
    expect(evaluateRecoveryEligibility(3)).toEqual({ eligible: true });
  });

  it('does not trigger before three Manual Skipped outcomes', () => {
    expect(evaluateRecoveryEligibility(2)).toEqual({
      eligible: false,
      remainingManualSkips: 1,
    });
  });

  it('succeeds when the threshold is reached', () => {
    expect(
      evaluateRecoveryPlan({
        completedSessions: 3,
        successfulSessions: 2,
        durationSessions: 3,
        successThreshold: 2,
      }),
    ).toBe('succeeded');
  });

  it('remains active until all scheduled recovery sessions resolve', () => {
    expect(
      evaluateRecoveryPlan({
        completedSessions: 2,
        successfulSessions: 2,
        durationSessions: 3,
        successThreshold: 2,
      }),
    ).toBe('active');
  });
});
```

- [x] **Step 2: Write failing entitlement tests**

Create `tests/unit/domain/entitlement.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  grantsPremiumAccess,
  type EntitlementStatus,
} from '@/domain/subscriptions/entitlement';

describe('entitlement status', () => {
  it.each<EntitlementStatus>(['trial_active', 'active', 'grace_period'])(
    'grants Premium access for %s',
    (status) => {
      expect(grantsPremiumAccess(status)).toBe(true);
    },
  );

  it.each<EntitlementStatus>([
    'past_due',
    'cancelled',
    'expired',
    'refunded',
    'revoked',
  ])('does not grant Premium access for %s', (status) => {
    expect(grantsPremiumAccess(status)).toBe(false);
  });
});
```

- [x] **Step 3: Run tests and confirm failure**

Run:

```bash
pnpm exec vitest run tests/unit/domain/recovery.test.ts tests/unit/domain/entitlement.test.ts
```

Expected: FAIL because the modules do not exist.

- [x] **Step 4: Implement recommendation contracts**

Create `src/domain/recovery/recommendation.ts`:

```typescript
export const recommendationStatuses = [
  'pending',
  'applied',
  'customized',
  'kept_current',
  'expired',
] as const;

export type RecommendationStatus =
  (typeof recommendationStatuses)[number];

export const recommendationDecisions = [
  'apply',
  'customize',
  'keep_current',
  'defer',
] as const;

export type RecommendationDecision =
  (typeof recommendationDecisions)[number];
```

- [x] **Step 5: Implement Recovery contracts**

Create `src/domain/recovery/recovery.ts`:

```typescript
export const recoveryPlanStatuses = [
  'proposed',
  'active',
  'deferred',
  'succeeded',
  'failed',
  'cancelled',
] as const;

export type RecoveryPlanStatus = (typeof recoveryPlanStatuses)[number];

export type RecoveryEligibility =
  | { eligible: true }
  | { eligible: false; remainingManualSkips: number };

export function evaluateRecoveryEligibility(
  consecutiveManualSkips: number,
): RecoveryEligibility {
  if (!Number.isInteger(consecutiveManualSkips) || consecutiveManualSkips < 0) {
    throw new RangeError('consecutiveManualSkips must be a non-negative integer');
  }

  if (consecutiveManualSkips >= 3) return { eligible: true };
  return { eligible: false, remainingManualSkips: 3 - consecutiveManualSkips };
}

export function evaluateRecoveryPlan({
  completedSessions,
  successfulSessions,
  durationSessions,
  successThreshold,
}: {
  completedSessions: number;
  successfulSessions: number;
  durationSessions: number;
  successThreshold: number;
}): 'active' | 'succeeded' | 'failed' {
  if (completedSessions < durationSessions) return 'active';
  return successfulSessions >= successThreshold ? 'succeeded' : 'failed';
}
```

- [x] **Step 6: Implement entitlement contracts**

Create `src/domain/subscriptions/entitlement.ts`:

```typescript
export const entitlementStatuses = [
  'trial_active',
  'active',
  'grace_period',
  'past_due',
  'cancelled',
  'expired',
  'refunded',
  'revoked',
] as const;

export type EntitlementStatus = (typeof entitlementStatuses)[number];

export function grantsPremiumAccess(status: EntitlementStatus): boolean {
  return status === 'trial_active' || status === 'active' || status === 'grace_period';
}
```

- [x] **Step 7: Run focused verification**

Run:

```bash
pnpm exec vitest run tests/unit/domain/recovery.test.ts tests/unit/domain/entitlement.test.ts
pnpm test:domain
pnpm typecheck
```

Expected: all domain tests and typecheck pass.

- [x] **Step 8: Commit Recovery and entitlement contracts**

Run:

```bash
git add src/domain/recovery src/domain/subscriptions tests/unit/domain/recovery.test.ts tests/unit/domain/entitlement.test.ts
git commit -m "feat: define recovery and entitlement states"
```

---
## Task 6: Create PostgreSQL Types, Account Identity, Habit, Session, and Check-in Schema

**Files:**

- Create: `supabase/migrations/20260729010000_domain_enums_and_profiles.sql`
- Create: `supabase/migrations/20260729011000_habits_sessions_checkins.sql`
- Create: `supabase/tests/00010_schema_contract.test.sql`

- [ ] **Step 1: Create shared PostgreSQL enums, timestamps, profiles, and browser installations**

Create `supabase/migrations/20260729010000_domain_enums_and_profiles.sql`:

```sql
create type public.plan_tier as enum ('free', 'premium');
create type public.habit_lifecycle_state as enum (
  'draft',
  'starting',
  'building',
  'active',
  'stable',
  'at_risk',
  'recovery',
  'rebuilding',
  'needs_review',
  'paused',
  'stopped',
  'completed',
  'archived',
  'trash',
  'decision_required'
);
create type public.session_status as enum (
  'unrecorded',
  'full',
  'minimum',
  'manual_skipped',
  'automatic_skipped',
  'excused'
);
create type public.check_in_outcome as enum (
  'full',
  'minimum',
  'manual_skipped',
  'excused'
);
create type public.recommendation_status as enum (
  'pending',
  'applied',
  'customized',
  'kept_current',
  'expired'
);
create type public.recovery_plan_status as enum (
  'proposed',
  'active',
  'deferred',
  'succeeded',
  'failed',
  'cancelled'
);
create type public.entitlement_status as enum (
  'trial_active',
  'active',
  'grace_period',
  'past_due',
  'cancelled',
  'expired',
  'refunded',
  'revoked'
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  locale text not null default 'en-US' check (char_length(locale) between 2 and 35),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  week_start smallint not null default 1 check (week_start between 1 and 7),
  quiet_hours_start time,
  quiet_hours_end time,
  plan_code public.plan_tier not null default 'free',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deletion_requested_at timestamptz,
  constraint profiles_quiet_hours_pair check (
    (quiet_hours_start is null and quiet_hours_end is null)
    or (quiet_hours_start is not null and quiet_hours_end is not null)
  )
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create table public.browser_installations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  push_capability text not null default 'unsupported'
    check (push_capability in ('supported', 'unsupported', 'denied', 'granted', 'expired')),
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, id)
);

create index browser_installations_user_last_seen_idx
  on public.browser_installations (user_id, last_seen_at desc);
```

- [ ] **Step 2: Create habit, immutable version, session, and check-in tables**

Create `supabase/migrations/20260729011000_habits_sessions_checkins.sql`:

```sql
create table public.habits (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text check (category is null or char_length(category) <= 50),
  lifecycle_state public.habit_lifecycle_state not null default 'draft',
  current_version_id uuid,
  state_changed_at timestamptz not null default timezone('utc', now()),
  revision bigint not null default 1 check (revision >= 1),
  consecutive_manual_skips integer not null default 0 check (consecutive_manual_skips >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  purge_after timestamptz,
  constraint habits_trash_dates check (
    (lifecycle_state <> 'trash' and deleted_at is null and purge_after is null)
    or (
      lifecycle_state = 'trash'
      and deleted_at is not null
      and purge_after is not null
      and purge_after >= deleted_at
    )
  )
);

create trigger habits_set_updated_at
before update on public.habits
for each row execute function private.set_updated_at();

create table public.habit_versions (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  normal_target jsonb not null check (jsonb_typeof(normal_target) = 'object'),
  minimum_target jsonb not null check (jsonb_typeof(minimum_target) = 'object'),
  schedule_rule jsonb not null check (jsonb_typeof(schedule_rule) = 'object'),
  cue jsonb check (cue is null or jsonb_typeof(cue) = 'object'),
  recovery_structure jsonb not null default '{"durationSessions":3,"successThreshold":2}'::jsonb
    check (jsonb_typeof(recovery_structure) = 'object'),
  effective_from_session_id uuid,
  source text not null check (source in ('creation', 'redesign', 'recommendation', 'restore')),
  parent_version_id uuid references public.habit_versions(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (habit_id, version_number),
  unique (habit_id, id),
  constraint habit_versions_target_difference check (normal_target <> minimum_target)
);

alter table public.habits
  add constraint habits_current_version_fk
  foreign key (id, current_version_id)
  references public.habit_versions(habit_id, id)
  deferrable initially deferred;

create or replace function private.reject_habit_version_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'published_habit_versions_are_immutable';
end;
$$;

create trigger habit_versions_reject_update
before update on public.habit_versions
for each row execute function private.reject_habit_version_mutation();

create trigger habit_versions_reject_delete
before delete on public.habit_versions
for each row execute function private.reject_habit_version_mutation();

create table public.sessions (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  habit_version_id uuid not null references public.habit_versions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_local_date date not null,
  scheduled_local_time time,
  timezone_snapshot text not null check (char_length(timezone_snapshot) between 1 and 100),
  eligible_at timestamptz not null,
  resolution_due_at timestamptz not null,
  status public.session_status not null default 'unrecorded',
  status_source text not null default 'system' check (status_source in ('user', 'system', 'import')),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sessions_resolution_after_eligibility check (resolution_due_at >= eligible_at),
  constraint sessions_user_date_identity unique nulls not distinct (
    habit_id,
    habit_version_id,
    scheduled_local_date,
    scheduled_local_time
  )
);

create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function private.set_updated_at();

alter table public.habit_versions
  add constraint habit_versions_effective_session_fk
  foreign key (effective_from_session_id)
  references public.sessions(id)
  deferrable initially deferred;

create table public.check_ins (
  id uuid primary key,
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome public.check_in_outcome not null,
  friction_code text check (
    friction_code is null
    or friction_code in (
      'forgot',
      'no_time',
      'too_tired',
      'target_too_heavy',
      'schedule_changed',
      'environment',
      'no_motivation',
      'other'
    )
  ),
  friction_note text check (friction_note is null or char_length(friction_note) <= 500),
  recorded_at timestamptz not null default timezone('utc', now()),
  recorded_local_at timestamptz not null,
  timezone_snapshot text not null check (char_length(timezone_snapshot) between 1 and 100),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint check_ins_friction_only_for_skip check (
    outcome = 'manual_skipped'
    or (friction_code is null and friction_note is null)
  )
);

create trigger check_ins_set_updated_at
before update on public.check_ins
for each row execute function private.set_updated_at();

create table public.check_in_history (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_ins(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  previous_outcome public.check_in_outcome not null,
  previous_friction_code text,
  previous_friction_note text,
  previous_revision bigint not null,
  replaced_at timestamptz not null default timezone('utc', now())
);

create index habits_user_lifecycle_idx
  on public.habits (user_id, lifecycle_state);
create index habits_user_deleted_idx
  on public.habits (user_id, deleted_at);
create index habit_versions_habit_version_idx
  on public.habit_versions (habit_id, version_number desc);
create index sessions_user_date_idx
  on public.sessions (user_id, scheduled_local_date);
create index sessions_habit_date_idx
  on public.sessions (habit_id, scheduled_local_date);
create index sessions_resolution_idx
  on public.sessions (user_id, status, resolution_due_at);
create index check_ins_user_recorded_idx
  on public.check_ins (user_id, recorded_at desc);
create index check_in_history_check_in_idx
  on public.check_in_history (check_in_id, replaced_at desc);
```

- [ ] **Step 3: Write the schema contract test**

Create `supabase/tests/00010_schema_contract.test.sql`:

```sql
begin;

select plan(24);

select has_type('public', 'habit_lifecycle_state', 'habit lifecycle enum exists');
select has_type('public', 'session_status', 'session status enum exists');
select has_type('public', 'check_in_outcome', 'check-in outcome enum exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'browser_installations', 'browser installations table exists');
select has_table('public', 'habits', 'habits table exists');
select has_table('public', 'habit_versions', 'habit versions table exists');
select has_table('public', 'sessions', 'sessions table exists');
select has_table('public', 'check_ins', 'check-ins table exists');
select has_table('public', 'check_in_history', 'check-in history table exists');
select has_column('public', 'habits', 'revision', 'habits expose revisions');
select has_column('public', 'habits', 'deleted_at', 'habits expose soft deletion');
select has_column('public', 'habits', 'purge_after', 'habits expose purge schedule');
select has_column('public', 'habits', 'consecutive_manual_skips', 'habits store recovery counter');
select has_column('public', 'habit_versions', 'version_number', 'habit versions are ordered');
select has_column('public', 'habit_versions', 'schedule_rule', 'habit versions store recurrence');
select has_column('public', 'sessions', 'timezone_snapshot', 'sessions snapshot timezone');
select has_column('public', 'sessions', 'resolution_due_at', 'sessions expose resolution deadline');
select has_column('public', 'check_ins', 'friction_code', 'check-ins store controlled friction');
select has_column('public', 'check_ins', 'revision', 'check-ins expose revisions');
select has_index('public', 'habits', 'habits_user_lifecycle_idx', 'habit lifecycle index exists');
select has_index('public', 'sessions', 'sessions_user_date_idx', 'session date index exists');
select has_index('public', 'sessions', 'sessions_resolution_idx', 'unrecorded resolution index exists');
select has_index('public', 'check_ins', 'check_ins_user_recorded_idx', 'check-in history access index exists');

select * from finish();
rollback;
```

- [ ] **Step 4: Reset and test the schema**

Run:

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
```

Expected: migrations apply from an empty database and pgTAP reports all Foundation plus schema assertions passing.

- [ ] **Step 5: Commit the core schema**

Run:

```bash
git add supabase/migrations/20260729010000_domain_enums_and_profiles.sql supabase/migrations/20260729011000_habits_sessions_checkins.sql supabase/tests/00010_schema_contract.test.sql
git commit -m "feat: add core recovery-first database schema"
```

---

## Task 7: Add Recovery, Review, Reminder, Entitlement, Idempotency, and Audit Tables

**Files:**

- Create: `supabase/migrations/20260729012000_recovery_reviews_reminders.sql`
- Create: `supabase/migrations/20260729013000_entitlements_commands_audit.sql`
- Create: `supabase/tests/00020_constraints.test.sql`

- [ ] **Step 1: Create Recovery, review, and reminder tables**

Create `supabase/migrations/20260729012000_recovery_reviews_reminders.sql`:

```sql
create table public.recommendations (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  habit_version_id uuid not null references public.habit_versions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_code text not null check (char_length(signal_code) between 1 and 80),
  evidence jsonb not null check (jsonb_typeof(evidence) = 'object'),
  proposed_change jsonb not null check (jsonb_typeof(proposed_change) = 'object'),
  explanation_key text not null check (char_length(explanation_key) between 1 and 120),
  status public.recommendation_status not null default 'pending',
  decision_payload jsonb check (decision_payload is null or jsonb_typeof(decision_payload) = 'object'),
  decided_at timestamptz,
  created_version_id uuid references public.habit_versions(id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint recommendations_decision_state check (
    (status = 'pending' and decided_at is null)
    or (status <> 'pending' and decided_at is not null)
  )
);

create table public.recovery_plans (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  habit_version_id uuid not null references public.habit_versions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.recovery_plan_status not null default 'proposed',
  target_definition jsonb not null check (jsonb_typeof(target_definition) = 'object'),
  duration_sessions integer not null default 3 check (duration_sessions between 1 and 14),
  success_threshold integer not null default 2 check (success_threshold >= 1),
  started_at timestamptz,
  completed_at timestamptz,
  failure_sequence integer not null default 0 check (failure_sequence >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint recovery_threshold_within_duration check (success_threshold <= duration_sessions),
  constraint recovery_completion_state check (
    (status in ('proposed', 'deferred') and started_at is null and completed_at is null)
    or (status = 'active' and started_at is not null and completed_at is null)
    or (status in ('succeeded', 'failed', 'cancelled') and completed_at is not null)
  )
);

create table public.review_cycles (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start date not null,
  window_end date not null,
  status text not null default 'open' check (status in ('open', 'completed', 'dismissed')),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint review_cycle_window check (window_end >= window_start),
  unique (user_id, window_start, window_end)
);

create table public.review_items (
  id uuid primary key,
  review_cycle_id uuid references public.review_cycles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  item_type text not null check (
    item_type in ('weekly_summary', 'recovery', 'at_risk', 'unrecorded', 'recommendation', 'downgrade')
  ),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  priority integer not null default 100 check (priority between 1 and 1000),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.reminder_configs (
  id uuid primary key,
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel in ('web_push', 'email')),
  local_time time not null,
  timezone text not null check (char_length(timezone) between 1 and 100),
  follow_up_minutes integer check (follow_up_minutes is null or follow_up_minutes between 5 and 1440),
  enabled boolean not null default true,
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (habit_id, channel)
);

create trigger reminder_configs_set_updated_at
before update on public.reminder_configs
for each row execute function private.set_updated_at();

create table public.push_subscriptions (
  id uuid primary key,
  installation_id uuid not null references public.browser_installations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint_hash text not null,
  encrypted_subscription jsonb not null check (jsonb_typeof(encrypted_subscription) = 'object'),
  capability_status text not null check (capability_status in ('granted', 'expired', 'revoked')),
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, endpoint_hash)
);

create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row execute function private.set_updated_at();

create table public.email_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_opt_in boolean not null default false,
  reminder_frequency text not null default 'off'
    check (reminder_frequency in ('off', 'daily', 'weekly')),
  unsubscribed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger email_preferences_set_updated_at
before update on public.email_preferences
for each row execute function private.set_updated_at();

create index recommendations_user_status_idx
  on public.recommendations (user_id, status, created_at desc);
create index recovery_plans_user_status_idx
  on public.recovery_plans (user_id, status, created_at desc);
create index review_items_user_status_idx
  on public.review_items (user_id, status, priority);
create index reminder_configs_user_enabled_idx
  on public.reminder_configs (user_id, enabled);
```

- [ ] **Step 2: Create entitlement, payment event, idempotency, and audit tables**

Create `supabase/migrations/20260729013000_entitlements_commands_audit.sql`:

```sql
create table public.entitlements (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null check (char_length(product_code) between 1 and 80),
  status public.entitlement_status not null,
  valid_from timestamptz not null,
  valid_until timestamptz,
  cancel_at_period_end boolean not null default false,
  provider_customer_id text,
  provider_subscription_id text,
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint entitlement_window check (valid_until is null or valid_until >= valid_from),
  unique (provider_subscription_id)
);

create trigger entitlements_set_updated_at
before update on public.entitlements
for each row execute function private.set_updated_at();

create table private.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('xendit', 'paddle')),
  provider_event_id text not null,
  signature_valid boolean not null,
  processing_status text not null check (
    processing_status in ('received', 'processed', 'ignored', 'failed')
  ),
  payload_hash text not null,
  normalized_payload jsonb not null check (jsonb_typeof(normalized_payload) = 'object'),
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  error_code text,
  unique (provider, provider_event_id)
);

create table private.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_type text not null check (char_length(operation_type) between 1 and 100),
  idempotency_key uuid not null,
  request_hash text not null,
  result_payload jsonb not null check (jsonb_typeof(result_payload) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  unique (user_id, operation_type, idempotency_key)
);

create table private.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  installation_id uuid,
  event_type text not null check (char_length(event_type) between 1 and 120),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index entitlements_user_status_idx
  on public.entitlements (user_id, status);
create index payment_events_provider_event_idx
  on private.payment_events (provider, provider_event_id);
create index idempotency_user_operation_idx
  on private.idempotency_records (user_id, operation_type, idempotency_key);
create index audit_events_user_created_idx
  on private.audit_events (user_id, created_at desc);

revoke all on table private.payment_events from public, anon, authenticated;
revoke all on table private.idempotency_records from public, anon, authenticated;
revoke all on table private.audit_events from public, anon, authenticated;
```

- [ ] **Step 3: Write database constraint tests**

Create `supabase/tests/00020_constraints.test.sql`:

```sql
begin;

select plan(12);

insert into auth.users (id, email)
values ('10000000-0000-4000-8000-000000000001', 'fixture-owner@example.invalid');

insert into public.profiles (id, timezone)
values ('10000000-0000-4000-8000-000000000001', 'Asia/Jakarta');

insert into public.habits (id, user_id, title)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Fixture Habit'
);

insert into public.habit_versions (
  id,
  habit_id,
  user_id,
  version_number,
  normal_target,
  minimum_target,
  schedule_rule,
  source
)
values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"count","value":20}'::jsonb,
  '{"kind":"count","value":5}'::jsonb,
  '{"kind":"daily"}'::jsonb,
  'creation'
);

update public.habits
set current_version_id = '30000000-0000-4000-8000-000000000001'
where id = '20000000-0000-4000-8000-000000000001';

select throws_ok(
  $$insert into public.habits (id, user_id, title) values (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    ''
  )$$,
  '23514',
  null,
  'empty habit titles are rejected'
);

select throws_ok(
  $$update public.habit_versions
    set source = 'redesign'
    where id = '30000000-0000-4000-8000-000000000001'$$,
  '55000',
  'published_habit_versions_are_immutable',
  'published habit versions reject updates'
);

select throws_ok(
  $$delete from public.habit_versions
    where id = '30000000-0000-4000-8000-000000000001'$$,
  '55000',
  'published_habit_versions_are_immutable',
  'published habit versions reject deletes'
);

select throws_ok(
  $$insert into public.recovery_plans (
    id, habit_id, habit_version_id, user_id, target_definition,
    duration_sessions, success_threshold
  ) values (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '{}'::jsonb, 3, 4
  )$$,
  '23514',
  null,
  'Recovery threshold cannot exceed duration'
);

select throws_ok(
  $$insert into public.entitlements (
    id, user_id, product_code, status, valid_from, valid_until
  ) values (
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'premium', 'active', '2026-08-10', '2026-08-01'
  )$$,
  '23514',
  null,
  'entitlement validity window is ordered'
);

select has_table('public', 'recommendations', 'recommendations table exists');
select has_table('public', 'recovery_plans', 'Recovery plans table exists');
select has_table('public', 'review_cycles', 'review cycles table exists');
select has_table('public', 'review_items', 'review items table exists');
select has_table('public', 'reminder_configs', 'reminder configs table exists');
select has_table('public', 'entitlements', 'entitlements table exists');
select has_table('private', 'idempotency_records', 'idempotency records are private');

select * from finish();
rollback;
```

- [ ] **Step 4: Reset and test all schema constraints**

Run:

```bash
pnpm db:reset
pnpm db:test
```

Expected: all pgTAP files pass with zero failed assertions.

- [ ] **Step 5: Commit supporting tables and constraints**

Run:

```bash
git add supabase/migrations/20260729012000_recovery_reviews_reminders.sql supabase/migrations/20260729013000_entitlements_commands_audit.sql supabase/tests/00020_constraints.test.sql
git commit -m "feat: add recovery review reminder and entitlement schema"
```

---
## Task 8: Add Transactional Active-Limit, Version, Session, and Check-in Functions

**Files:**

- Create: `supabase/migrations/20260729014000_domain_functions.sql`
- Create: `supabase/tests/00030_domain_functions.test.sql`

- [ ] **Step 1: Create authoritative plan and idempotency helpers**

Create `supabase/migrations/20260729014000_domain_functions.sql` with the complete content below:

```sql
create or replace function private.is_slot_consuming(
  p_state public.habit_lifecycle_state
)
returns boolean
language sql
immutable
strict
as $$
  select p_state in (
    'starting',
    'building',
    'active',
    'stable',
    'at_risk',
    'recovery',
    'rebuilding',
    'needs_review'
  );
$$;

create or replace function private.effective_plan_tier(p_user_id uuid)
returns public.plan_tier
language sql
stable
security definer
set search_path = public, private
as $$
  select case
    when exists (
      select 1
      from public.entitlements
      where user_id = p_user_id
        and status in ('trial_active', 'active', 'grace_period')
        and valid_from <= timezone('utc', now())
        and (valid_until is null or valid_until > timezone('utc', now()))
    ) then 'premium'::public.plan_tier
    else 'free'::public.plan_tier
  end;
$$;

create or replace function private.active_habit_limit(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, private
as $$
  select case private.effective_plan_tier(p_user_id)
    when 'premium' then 20
    else 5
  end;
$$;

create or replace function private.command_hash(p_request jsonb)
returns text
language sql
immutable
strict
set search_path = public, private, extensions
as $$
  select encode(digest(convert_to(p_request::text, 'UTF8'), 'sha256'), 'hex');
$$;

create or replace function private.replay_idempotent_result(
  p_user_id uuid,
  p_operation_type text,
  p_command_id uuid,
  p_request jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, private, extensions
as $$
declare
  v_record private.idempotency_records%rowtype;
begin
  select *
  into v_record
  from private.idempotency_records
  where user_id = p_user_id
    and operation_type = p_operation_type
    and idempotency_key = p_command_id;

  if not found then
    return null;
  end if;

  if v_record.request_hash <> private.command_hash(p_request) then
    raise exception using
      errcode = '22000',
      message = 'idempotency_key_reused_with_different_request';
  end if;

  return v_record.result_payload;
end;
$$;

create or replace function private.store_idempotent_result(
  p_user_id uuid,
  p_operation_type text,
  p_command_id uuid,
  p_request jsonb,
  p_result jsonb
)
returns void
language sql
security definer
set search_path = public, private, extensions
as $$
  insert into private.idempotency_records (
    user_id,
    operation_type,
    idempotency_key,
    request_hash,
    result_payload,
    expires_at
  )
  values (
    p_user_id,
    p_operation_type,
    p_command_id,
    private.command_hash(p_request),
    p_result,
    timezone('utc', now()) + interval '90 days'
  )
  on conflict (user_id, operation_type, idempotency_key) do nothing;
$$;
```

Continue the same file with active-habit activation:

```sql
create or replace function public.activate_habit(
  p_habit_id uuid,
  p_expected_revision bigint,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_habit public.habits%rowtype;
  v_active_count integer;
  v_limit integer;
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  v_request := jsonb_build_object(
    'habitId', p_habit_id,
    'expectedRevision', p_expected_revision
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'activate_habit',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  select * into v_habit
  from public.habits
  where id = p_habit_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'habit_not_found';
  end if;
  if v_habit.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'revision_conflict';
  end if;
  if v_habit.current_version_id is null then
    raise exception using errcode = '23514', message = 'habit_version_required';
  end if;

  if private.is_slot_consuming(v_habit.lifecycle_state) then
    v_result := jsonb_build_object(
      'habitId', v_habit.id,
      'lifecycleState', v_habit.lifecycle_state,
      'revision', v_habit.revision,
      'alreadyActive', true
    );
    perform private.store_idempotent_result(
      v_user_id,
      'activate_habit',
      p_command_id,
      v_request,
      v_result
    );
    return v_result;
  end if;

  select count(*)::integer into v_active_count
  from public.habits
  where user_id = v_user_id
    and deleted_at is null
    and private.is_slot_consuming(lifecycle_state);

  v_limit := private.active_habit_limit(v_user_id);
  if v_active_count >= v_limit then
    raise exception using errcode = 'P0001', message = 'active_limit_reached';
  end if;

  update public.habits
  set lifecycle_state = 'starting',
      state_changed_at = timezone('utc', now()),
      revision = revision + 1
  where id = p_habit_id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id)
  values (v_user_id, 'habit_activated', 'habit', p_habit_id);

  v_result := jsonb_build_object(
    'habitId', v_habit.id,
    'lifecycleState', v_habit.lifecycle_state,
    'revision', v_habit.revision,
    'activeCount', v_active_count + 1,
    'limit', v_limit,
    'alreadyActive', false
  );

  perform private.store_idempotent_result(
    v_user_id,
    'activate_habit',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;
```

Continue the same file with immutable version creation:

```sql
create or replace function public.create_habit_version(
  p_habit_id uuid,
  p_version_id uuid,
  p_expected_revision bigint,
  p_normal_target jsonb,
  p_minimum_target jsonb,
  p_schedule_rule jsonb,
  p_cue jsonb,
  p_recovery_structure jsonb,
  p_source text,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_habit public.habits%rowtype;
  v_version_number integer;
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_source not in ('creation', 'redesign', 'recommendation', 'restore') then
    raise exception using errcode = '23514', message = 'invalid_version_source';
  end if;
  if jsonb_typeof(p_normal_target) <> 'object'
     or jsonb_typeof(p_minimum_target) <> 'object'
     or jsonb_typeof(p_schedule_rule) <> 'object'
     or jsonb_typeof(p_recovery_structure) <> 'object' then
    raise exception using errcode = '22023', message = 'invalid_version_payload';
  end if;
  if p_normal_target = p_minimum_target then
    raise exception using errcode = '23514', message = 'minimum_must_differ_from_normal';
  end if;

  v_request := jsonb_build_object(
    'habitId', p_habit_id,
    'versionId', p_version_id,
    'expectedRevision', p_expected_revision,
    'normalTarget', p_normal_target,
    'minimumTarget', p_minimum_target,
    'scheduleRule', p_schedule_rule,
    'cue', p_cue,
    'recoveryStructure', p_recovery_structure,
    'source', p_source
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'create_habit_version',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  select * into v_habit
  from public.habits
  where id = p_habit_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'habit_not_found';
  end if;
  if v_habit.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'revision_conflict';
  end if;

  select coalesce(max(version_number), 0) + 1
  into v_version_number
  from public.habit_versions
  where habit_id = p_habit_id;

  insert into public.habit_versions (
    id,
    habit_id,
    user_id,
    version_number,
    normal_target,
    minimum_target,
    schedule_rule,
    cue,
    recovery_structure,
    source,
    parent_version_id
  )
  values (
    p_version_id,
    p_habit_id,
    v_user_id,
    v_version_number,
    p_normal_target,
    p_minimum_target,
    p_schedule_rule,
    p_cue,
    p_recovery_structure,
    p_source,
    v_habit.current_version_id
  );

  update public.habits
  set current_version_id = p_version_id,
      revision = revision + 1
  where id = p_habit_id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'habit_version_created',
    'habit',
    p_habit_id,
    jsonb_build_object('versionId', p_version_id, 'versionNumber', v_version_number)
  );

  v_result := jsonb_build_object(
    'habitId', p_habit_id,
    'versionId', p_version_id,
    'versionNumber', v_version_number,
    'habitRevision', v_habit.revision
  );

  perform private.store_idempotent_result(
    v_user_id,
    'create_habit_version',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;
```

Continue the same file with deterministic session creation:

```sql
create or replace function public.ensure_session(
  p_session_id uuid,
  p_habit_id uuid,
  p_habit_version_id uuid,
  p_scheduled_local_date date,
  p_scheduled_local_time time,
  p_timezone_snapshot text,
  p_eligible_at timestamptz,
  p_resolution_due_at timestamptz,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
  v_existing public.sessions%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_resolution_due_at < p_eligible_at then
    raise exception using errcode = '23514', message = 'invalid_resolution_window';
  end if;
  if not exists (
    select 1
    from public.habits h
    join public.habit_versions hv
      on hv.habit_id = h.id
     and hv.id = p_habit_version_id
    where h.id = p_habit_id
      and h.user_id = v_user_id
      and hv.user_id = v_user_id
  ) then
    raise exception using errcode = 'P0002', message = 'habit_version_not_found';
  end if;

  v_request := jsonb_build_object(
    'sessionId', p_session_id,
    'habitId', p_habit_id,
    'habitVersionId', p_habit_version_id,
    'scheduledLocalDate', p_scheduled_local_date,
    'scheduledLocalTime', p_scheduled_local_time,
    'timezoneSnapshot', p_timezone_snapshot,
    'eligibleAt', p_eligible_at,
    'resolutionDueAt', p_resolution_due_at
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'ensure_session',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  insert into public.sessions (
    id,
    habit_id,
    habit_version_id,
    user_id,
    scheduled_local_date,
    scheduled_local_time,
    timezone_snapshot,
    eligible_at,
    resolution_due_at
  )
  values (
    p_session_id,
    p_habit_id,
    p_habit_version_id,
    v_user_id,
    p_scheduled_local_date,
    p_scheduled_local_time,
    p_timezone_snapshot,
    p_eligible_at,
    p_resolution_due_at
  )
  on conflict (
    habit_id,
    habit_version_id,
    scheduled_local_date,
    scheduled_local_time
  ) do nothing;

  select * into v_existing
  from public.sessions
  where habit_id = p_habit_id
    and habit_version_id = p_habit_version_id
    and scheduled_local_date = p_scheduled_local_date
    and scheduled_local_time is not distinct from p_scheduled_local_time;

  v_result := jsonb_build_object(
    'sessionId', v_existing.id,
    'revision', v_existing.revision,
    'status', v_existing.status
  );

  perform private.store_idempotent_result(
    v_user_id,
    'ensure_session',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;
```

Continue the same file with transactional check-in recording:

```sql
create or replace function public.record_check_in(
  p_check_in_id uuid,
  p_session_id uuid,
  p_outcome public.check_in_outcome,
  p_friction_code text,
  p_friction_note text,
  p_recorded_local_at timestamptz,
  p_timezone_snapshot text,
  p_expected_session_revision bigint,
  p_command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_existing public.check_ins%rowtype;
  v_habit public.habits%rowtype;
  v_counter integer;
  v_next_state public.habit_lifecycle_state;
  v_request jsonb;
  v_result jsonb;
  v_replayed jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;
  if p_outcome <> 'manual_skipped'
     and (p_friction_code is not null or p_friction_note is not null) then
    raise exception using errcode = '23514', message = 'friction_only_allowed_for_manual_skip';
  end if;

  v_request := jsonb_build_object(
    'checkInId', p_check_in_id,
    'sessionId', p_session_id,
    'outcome', p_outcome,
    'frictionCode', p_friction_code,
    'frictionNote', p_friction_note,
    'recordedLocalAt', p_recorded_local_at,
    'timezoneSnapshot', p_timezone_snapshot,
    'expectedSessionRevision', p_expected_session_revision
  );

  v_replayed := private.replay_idempotent_result(
    v_user_id,
    'record_check_in',
    p_command_id,
    v_request
  );
  if v_replayed is not null then
    return v_replayed;
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'session_not_found';
  end if;
  if v_session.revision <> p_expected_session_revision then
    raise exception using errcode = '40001', message = 'revision_conflict';
  end if;

  select * into v_existing
  from public.check_ins
  where session_id = p_session_id
  for update;

  if found then
    insert into public.check_in_history (
      check_in_id,
      session_id,
      user_id,
      previous_outcome,
      previous_friction_code,
      previous_friction_note,
      previous_revision
    )
    values (
      v_existing.id,
      v_existing.session_id,
      v_existing.user_id,
      v_existing.outcome,
      v_existing.friction_code,
      v_existing.friction_note,
      v_existing.revision
    );

    update public.check_ins
    set outcome = p_outcome,
        friction_code = p_friction_code,
        friction_note = p_friction_note,
        recorded_at = timezone('utc', now()),
        recorded_local_at = p_recorded_local_at,
        timezone_snapshot = p_timezone_snapshot,
        revision = revision + 1
    where id = v_existing.id
    returning * into v_existing;
  else
    insert into public.check_ins (
      id,
      session_id,
      user_id,
      outcome,
      friction_code,
      friction_note,
      recorded_local_at,
      timezone_snapshot
    )
    values (
      p_check_in_id,
      p_session_id,
      v_user_id,
      p_outcome,
      p_friction_code,
      p_friction_note,
      p_recorded_local_at,
      p_timezone_snapshot
    )
    returning * into v_existing;
  end if;

  update public.sessions
  set status = p_outcome::text::public.session_status,
      status_source = 'user',
      revision = revision + 1
  where id = p_session_id
  returning * into v_session;

  select * into v_habit
  from public.habits
  where id = v_session.habit_id
    and user_id = v_user_id
  for update;

  if p_outcome in ('full', 'minimum') then
    v_counter := 0;
  elsif p_outcome = 'manual_skipped' then
    v_counter := v_habit.consecutive_manual_skips + 1;
  else
    v_counter := v_habit.consecutive_manual_skips;
  end if;

  v_next_state := v_habit.lifecycle_state;
  if v_counter >= 3
     and v_habit.lifecycle_state in ('building', 'active', 'stable', 'at_risk', 'rebuilding') then
    v_next_state := 'recovery';
  end if;

  update public.habits
  set consecutive_manual_skips = v_counter,
      lifecycle_state = v_next_state,
      state_changed_at = case
        when lifecycle_state <> v_next_state then timezone('utc', now())
        else state_changed_at
      end,
      revision = revision + 1
  where id = v_habit.id
  returning * into v_habit;

  insert into private.audit_events (user_id, event_type, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'check_in_recorded',
    'session',
    p_session_id,
    jsonb_build_object('outcome', p_outcome, 'habitId', v_habit.id)
  );

  v_result := jsonb_build_object(
    'checkInId', v_existing.id,
    'checkInRevision', v_existing.revision,
    'sessionId', v_session.id,
    'sessionRevision', v_session.revision,
    'sessionStatus', v_session.status,
    'habitId', v_habit.id,
    'habitRevision', v_habit.revision,
    'habitLifecycleState', v_habit.lifecycle_state,
    'consecutiveManualSkips', v_habit.consecutive_manual_skips,
    'recoveryTriggered', v_habit.lifecycle_state = 'recovery'
  );

  perform private.store_idempotent_result(
    v_user_id,
    'record_check_in',
    p_command_id,
    v_request,
    v_result
  );
  return v_result;
end;
$$;

revoke all on function public.activate_habit(uuid, bigint, uuid) from public;
revoke all on function public.create_habit_version(uuid, uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, text, uuid) from public;
revoke all on function public.ensure_session(uuid, uuid, uuid, date, time, text, timestamptz, timestamptz, uuid) from public;
revoke all on function public.record_check_in(uuid, uuid, public.check_in_outcome, text, text, timestamptz, text, bigint, uuid) from public;

grant execute on function public.activate_habit(uuid, bigint, uuid) to authenticated;
grant execute on function public.create_habit_version(uuid, uuid, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, text, uuid) to authenticated;
grant execute on function public.ensure_session(uuid, uuid, uuid, date, time, text, timestamptz, timestamptz, uuid) to authenticated;
grant execute on function public.record_check_in(uuid, uuid, public.check_in_outcome, text, text, timestamptz, text, bigint, uuid) to authenticated;
```

- [ ] **Step 2: Write transactional function tests**

Create `supabase/tests/00030_domain_functions.test.sql`:

```sql
begin;

select plan(15);

insert into auth.users (id, email)
values ('11000000-0000-4000-8000-000000000001', 'function-owner@example.invalid');
insert into public.profiles (id, timezone)
values ('11000000-0000-4000-8000-000000000001', 'Asia/Jakarta');

insert into public.habits (id, user_id, title)
values (
  '21000000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000001',
  'Function Fixture Habit'
);

select set_config('request.jwt.claim.sub', '11000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.create_habit_version(
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"count","value":20}'::jsonb,
    '{"kind":"count","value":5}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    '{"kind":"after_breakfast"}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation',
    '41000000-0000-4000-8000-000000000001'
  )$$,
  'first habit version is created'
);

select results_eq(
  $$select version_number from public.habit_versions where id = '31000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'first version number is one'
);

select lives_ok(
  $$select public.create_habit_version(
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    1,
    '{"kind":"count","value":20}'::jsonb,
    '{"kind":"count","value":5}'::jsonb,
    '{"kind":"daily"}'::jsonb,
    '{"kind":"after_breakfast"}'::jsonb,
    '{"durationSessions":3,"successThreshold":2}'::jsonb,
    'creation',
    '41000000-0000-4000-8000-000000000001'
  )$$,
  'duplicate version command replays safely'
);

select results_eq(
  $$select count(*)::integer from public.habit_versions where habit_id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'duplicate command does not duplicate the version'
);

select lives_ok(
  $$select public.activate_habit(
    '21000000-0000-4000-8000-000000000001',
    2,
    '42000000-0000-4000-8000-000000000001'
  )$$,
  'habit activation succeeds'
);

select results_eq(
  $$select lifecycle_state::text from public.habits where id = '21000000-0000-4000-8000-000000000001'$$,
  $$values ('starting'::text)$$,
  'activation moves the habit to Starting'
);

select lives_ok(
  $$select public.ensure_session(
    '51000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '2026-08-01',
    '07:30',
    'Asia/Jakarta',
    '2026-08-01 00:30:00+00',
    '2026-08-04 16:59:59+00',
    '43000000-0000-4000-8000-000000000001'
  )$$,
  'deterministic session creation succeeds'
);

select lives_ok(
  $$select public.ensure_session(
    '51000000-0000-4000-8000-000000000099',
    '21000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    '2026-08-01',
    '07:30',
    'Asia/Jakarta',
    '2026-08-01 00:30:00+00',
    '2026-08-04 16:59:59+00',
    '43000000-0000-4000-8000-000000000002'
  )$$,
  'duplicate occurrence resolves to the existing session'
);

select results_eq(
  $$select count(*)::integer from public.sessions where habit_id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'duplicate occurrence does not duplicate a session'
);

select lives_ok(
  $$select public.record_check_in(
    '61000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'manual_skipped',
    'too_tired',
    null,
    '2026-08-01 07:35:00+07',
    'Asia/Jakarta',
    1,
    '44000000-0000-4000-8000-000000000001'
  )$$,
  'first Manual Skipped check-in succeeds'
);

select results_eq(
  $$select consecutive_manual_skips from public.habits where id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'Manual Skipped increments the Recovery counter'
);

select lives_ok(
  $$select public.record_check_in(
    '61000000-0000-4000-8000-000000000099',
    '51000000-0000-4000-8000-000000000001',
    'minimum',
    null,
    null,
    '2026-08-01 08:00:00+07',
    'Asia/Jakarta',
    2,
    '44000000-0000-4000-8000-000000000002'
  )$$,
  'same-session edit succeeds'
);

select results_eq(
  $$select count(*)::integer from public.check_in_history where session_id = '51000000-0000-4000-8000-000000000001'$$,
  $$values (1)$$,
  'same-session edit preserves prior history'
);

select results_eq(
  $$select consecutive_manual_skips from public.habits where id = '21000000-0000-4000-8000-000000000001'$$,
  $$values (0)$$,
  'Minimum resets the Recovery counter'
);

select throws_ok(
  $$select public.activate_habit(
    '21000000-0000-4000-8000-000000000001',
    999,
    '42000000-0000-4000-8000-000000000099'
  )$$,
  '40001',
  'revision_conflict',
  'stale revisions are rejected'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Reset and run transactional tests**

Run:

```bash
pnpm db:reset
pnpm db:test
```

Expected: schema, constraints, idempotency, revision, version, session, history, and Recovery-counter assertions pass.

- [ ] **Step 4: Commit authoritative database functions**

Run:

```bash
git add supabase/migrations/20260729014000_domain_functions.sql supabase/tests/00030_domain_functions.test.sql
git commit -m "feat: add idempotent domain database functions"
```

---
## Task 9: Enable RLS, Least-Privilege Grants, and Safe Read Views

**Files:**

- Create: `supabase/migrations/20260729015000_row_level_security.sql`
- Create: `supabase/tests/00040_row_level_security.test.sql`

- [ ] **Step 1: Enable RLS and create least-privilege policies**

Create `supabase/migrations/20260729015000_row_level_security.sql`:

```sql
alter table public.profiles enable row level security;
alter table public.browser_installations enable row level security;
alter table public.habits enable row level security;
alter table public.habit_versions enable row level security;
alter table public.sessions enable row level security;
alter table public.check_ins enable row level security;
alter table public.check_in_history enable row level security;
alter table public.recommendations enable row level security;
alter table public.recovery_plans enable row level security;
alter table public.review_cycles enable row level security;
alter table public.review_items enable row level security;
alter table public.reminder_configs enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.email_preferences enable row level security;
alter table public.entitlements enable row level security;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.browser_installations to authenticated;
grant select, insert on public.habits to authenticated;
grant select on public.habit_versions to authenticated;
grant select on public.sessions to authenticated;
grant select on public.check_ins to authenticated;
grant select on public.check_in_history to authenticated;
grant select on public.recommendations to authenticated;
grant select on public.recovery_plans to authenticated;
grant select on public.review_cycles to authenticated;
grant select on public.review_items to authenticated;
grant select, insert, update, delete on public.reminder_configs to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.email_preferences to authenticated;
grant select on public.entitlements to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy browser_installations_select_own
on public.browser_installations
for select
to authenticated
using (user_id = auth.uid());

create policy browser_installations_insert_own
on public.browser_installations
for insert
to authenticated
with check (user_id = auth.uid());

create policy browser_installations_update_own
on public.browser_installations
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy browser_installations_delete_own
on public.browser_installations
for delete
to authenticated
using (user_id = auth.uid());

create policy habits_select_own
on public.habits
for select
to authenticated
using (user_id = auth.uid());

create policy habits_insert_own_draft
on public.habits
for insert
to authenticated
with check (
  user_id = auth.uid()
  and lifecycle_state = 'draft'
  and current_version_id is null
  and deleted_at is null
  and purge_after is null
);

create policy habit_versions_select_own
on public.habit_versions
for select
to authenticated
using (user_id = auth.uid());

create policy sessions_select_own
on public.sessions
for select
to authenticated
using (user_id = auth.uid());

create policy check_ins_select_own
on public.check_ins
for select
to authenticated
using (user_id = auth.uid());

create policy check_in_history_select_own
on public.check_in_history
for select
to authenticated
using (user_id = auth.uid());

create policy recommendations_select_own
on public.recommendations
for select
to authenticated
using (user_id = auth.uid());

create policy recovery_plans_select_own
on public.recovery_plans
for select
to authenticated
using (user_id = auth.uid());

create policy review_cycles_select_own
on public.review_cycles
for select
to authenticated
using (user_id = auth.uid());

create policy review_items_select_own
on public.review_items
for select
to authenticated
using (user_id = auth.uid());

create policy reminder_configs_select_own
on public.reminder_configs
for select
to authenticated
using (user_id = auth.uid());

create policy reminder_configs_insert_own
on public.reminder_configs
for insert
to authenticated
with check (user_id = auth.uid());

create policy reminder_configs_update_own
on public.reminder_configs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy reminder_configs_delete_own
on public.reminder_configs
for delete
to authenticated
using (user_id = auth.uid());

create policy push_subscriptions_select_own
on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy push_subscriptions_insert_own
on public.push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

create policy push_subscriptions_update_own
on public.push_subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy push_subscriptions_delete_own
on public.push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

create policy email_preferences_select_own
on public.email_preferences
for select
to authenticated
using (user_id = auth.uid());

create policy email_preferences_insert_own
on public.email_preferences
for insert
to authenticated
with check (user_id = auth.uid());

create policy email_preferences_update_own
on public.email_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy email_preferences_delete_own
on public.email_preferences
for delete
to authenticated
using (user_id = auth.uid());

create policy entitlements_select_own
on public.entitlements
for select
to authenticated
using (user_id = auth.uid());
```

Continue the same migration with security-invoker read views:

```sql
create view public.today_session_view
with (security_invoker = true)
as
select
  s.id as session_id,
  s.user_id,
  s.habit_id,
  h.title as habit_title,
  h.lifecycle_state,
  s.habit_version_id,
  s.scheduled_local_date,
  s.scheduled_local_time,
  s.timezone_snapshot,
  s.status,
  s.revision
from public.sessions s
join public.habits h on h.id = s.habit_id
where h.deleted_at is null;

create view public.habit_summary_view
with (security_invoker = true)
as
select
  h.id as habit_id,
  h.user_id,
  h.title,
  h.lifecycle_state,
  h.current_version_id,
  h.revision,
  h.consecutive_manual_skips,
  count(s.id) filter (where s.status in ('full', 'minimum')) as successful_sessions,
  count(s.id) filter (
    where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
  ) as resolved_sessions
from public.habits h
left join public.sessions s on s.habit_id = h.id
where h.deleted_at is null
group by h.id;

create view public.weekly_review_summary_view
with (security_invoker = true)
as
select
  rc.id as review_cycle_id,
  rc.user_id,
  rc.window_start,
  rc.window_end,
  rc.status,
  count(ri.id) filter (where ri.status = 'pending') as pending_items,
  count(ri.id) filter (where ri.status = 'resolved') as resolved_items
from public.review_cycles rc
left join public.review_items ri on ri.review_cycle_id = rc.id
group by rc.id;

create view public.insight_consistency_view
with (security_invoker = true)
as
select
  s.user_id,
  s.habit_id,
  count(*) filter (where s.status in ('full', 'minimum')) as successful_sessions,
  count(*) filter (
    where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
  ) as resolved_sessions,
  case
    when count(*) filter (
      where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
    ) = 0 then null
    else round(
      100.0
      * count(*) filter (where s.status in ('full', 'minimum'))
      / count(*) filter (
          where s.status in ('full', 'minimum', 'manual_skipped', 'automatic_skipped')
        ),
      2
    )
  end as consistency_percentage
from public.sessions s
group by s.user_id, s.habit_id;

create view public.subscription_status_view
with (security_invoker = true)
as
select
  id,
  user_id,
  product_code,
  status,
  valid_from,
  valid_until,
  cancel_at_period_end,
  revision,
  updated_at
from public.entitlements;

grant select on public.today_session_view to authenticated;
grant select on public.habit_summary_view to authenticated;
grant select on public.weekly_review_summary_view to authenticated;
grant select on public.insight_consistency_view to authenticated;
grant select on public.subscription_status_view to authenticated;
```

- [ ] **Step 2: Write RLS coverage and cross-user denial tests**

Create `supabase/tests/00040_row_level_security.test.sql`:

```sql
begin;

select plan(9);

insert into auth.users (id, email)
values
  ('12000000-0000-4000-8000-000000000001', 'rls-owner@example.invalid'),
  ('12000000-0000-4000-8000-000000000002', 'rls-other@example.invalid');

insert into public.profiles (id, timezone)
values
  ('12000000-0000-4000-8000-000000000001', 'Asia/Jakarta'),
  ('12000000-0000-4000-8000-000000000002', 'UTC');

insert into public.browser_installations (id, user_id, display_name)
values (
  '22000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'Fixture Browser'
);

insert into public.habits (id, user_id, title)
values (
  '32000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'RLS Fixture Habit'
);

insert into public.habit_versions (
  id, habit_id, user_id, version_number, normal_target, minimum_target,
  schedule_rule, source
)
values (
  '42000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"count","value":20}'::jsonb,
  '{"kind":"count","value":5}'::jsonb,
  '{"kind":"daily"}'::jsonb,
  'creation'
);

update public.habits
set current_version_id = '42000000-0000-4000-8000-000000000001'
where id = '32000000-0000-4000-8000-000000000001';

insert into public.sessions (
  id, habit_id, habit_version_id, user_id, scheduled_local_date,
  timezone_snapshot, eligible_at, resolution_due_at
)
values (
  '52000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '2026-08-01',
  'Asia/Jakarta',
  '2026-08-01 00:00:00+00',
  '2026-08-04 16:59:59+00'
);

insert into public.check_ins (
  id, session_id, user_id, outcome, recorded_local_at, timezone_snapshot
)
values (
  '62000000-0000-4000-8000-000000000001',
  '52000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'minimum',
  '2026-08-01 07:00:00+07',
  'Asia/Jakarta'
);

insert into public.check_in_history (
  check_in_id, session_id, user_id, previous_outcome, previous_revision
)
values (
  '62000000-0000-4000-8000-000000000001',
  '52000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'manual_skipped',
  1
);

insert into public.recommendations (
  id, habit_id, habit_version_id, user_id, signal_code, evidence,
  proposed_change, explanation_key
)
values (
  '72000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'fixture_signal',
  '{}'::jsonb,
  '{"field":"minimumTarget"}'::jsonb,
  'recommendation.fixture'
);

insert into public.recovery_plans (
  id, habit_id, habit_version_id, user_id, target_definition
)
values (
  '82000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '{"kind":"minimum"}'::jsonb
);

insert into public.review_cycles (id, user_id, window_start, window_end)
values (
  '92000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '2026-07-27',
  '2026-08-02'
);

insert into public.review_items (
  id, review_cycle_id, user_id, habit_id, item_type
)
values (
  'a2000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  'weekly_summary'
);

insert into public.reminder_configs (
  id, habit_id, user_id, channel, local_time, timezone
)
values (
  'b2000000-0000-4000-8000-000000000001',
  '32000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'web_push',
  '07:00',
  'Asia/Jakarta'
);

insert into public.push_subscriptions (
  id, installation_id, user_id, endpoint_hash, encrypted_subscription,
  capability_status
)
values (
  'c2000000-0000-4000-8000-000000000001',
  '22000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'fixture-endpoint-hash',
  '{"ciphertext":"fixture"}'::jsonb,
  'granted'
);

insert into public.email_preferences (user_id, reminder_opt_in, reminder_frequency)
values ('12000000-0000-4000-8000-000000000001', true, 'daily');

insert into public.entitlements (
  id, user_id, product_code, status, valid_from, valid_until
)
values (
  'd2000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'premium',
  'active',
  '2026-07-01',
  '2026-09-01'
);

select results_eq(
  $$
    select c.relname::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'profiles', 'browser_installations', 'habits', 'habit_versions',
        'sessions', 'check_ins', 'check_in_history', 'recommendations',
        'recovery_plans', 'review_cycles', 'review_items', 'reminder_configs',
        'push_subscriptions', 'email_preferences', 'entitlements'
      )
      and c.relrowsecurity
    order by c.relname
  $$,
  $$values
    ('browser_installations'::text),
    ('check_in_history'::text),
    ('check_ins'::text),
    ('email_preferences'::text),
    ('entitlements'::text),
    ('habit_versions'::text),
    ('habits'::text),
    ('profiles'::text),
    ('push_subscriptions'::text),
    ('recommendations'::text),
    ('recovery_plans'::text),
    ('reminder_configs'::text),
    ('review_cycles'::text),
    ('review_items'::text),
    ('sessions'::text)
  $$,
  'RLS is enabled on every account-owned table'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '12000000-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  $$select count(*)::bigint from public.habits$$,
  $$values (1::bigint)$$,
  'owner can read own habit'
);

select results_eq(
  $$select count(*)::bigint from public.today_session_view$$,
  $$values (1::bigint)$$,
  'security-invoker Today view exposes owner rows'
);

select results_eq(
  $$select count(*)::bigint from public.subscription_status_view$$,
  $$values (1::bigint)$$,
  'subscription view exposes owner entitlement without provider identifiers'
);

select set_config('request.jwt.claim.sub', '12000000-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"12000000-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select results_eq(
  $$
    select sum(visible_count)::bigint
    from (
      select count(*)::bigint as visible_count from public.browser_installations
      union all select count(*) from public.habits
      union all select count(*) from public.habit_versions
      union all select count(*) from public.sessions
      union all select count(*) from public.check_ins
      union all select count(*) from public.check_in_history
      union all select count(*) from public.recommendations
      union all select count(*) from public.recovery_plans
      union all select count(*) from public.review_cycles
      union all select count(*) from public.review_items
      union all select count(*) from public.reminder_configs
      union all select count(*) from public.push_subscriptions
      union all select count(*) from public.email_preferences
      union all select count(*) from public.entitlements
    ) visible
  $$,
  $$values (0::bigint)$$,
  'other users cannot read any owner-scoped fixture row'
);

select throws_ok(
  $$insert into public.habits (id, user_id, title)
    values (
      '32000000-0000-4000-8000-000000000099',
      '12000000-0000-4000-8000-000000000001',
      'Cross-user insert'
    )$$,
  '42501',
  null,
  'other users cannot insert rows for the owner'
);

select results_eq(
  $$update public.reminder_configs
    set enabled = false
    where id = 'b2000000-0000-4000-8000-000000000001'
    returning id$$,
  $$select null::uuid where false$$,
  'other users cannot update owner reminder configuration'
);

select results_eq(
  $$select count(*)::bigint from public.today_session_view$$,
  $$values (0::bigint)$$,
  'security-invoker Today view denies cross-user rows'
);

select results_eq(
  $$select count(*)::bigint from public.subscription_status_view$$,
  $$values (0::bigint)$$,
  'subscription view denies cross-user entitlements'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Reset and run RLS tests**

Run:

```bash
pnpm db:reset
pnpm db:test
```

Expected: all RLS tables are covered; owner reads pass; cross-user reads and writes are denied.

- [ ] **Step 4: Verify browser roles cannot access private tables**

Run:

```bash
pnpm exec supabase db lint --local --level warning
```

Expected: command exits with status `0`; no warning reports browser access to `private.payment_events`, `private.idempotency_records`, or `private.audit_events`.

- [ ] **Step 5: Commit RLS and views**

Run:

```bash
git add supabase/migrations/20260729015000_row_level_security.sql supabase/tests/00040_row_level_security.test.sql
git commit -m "feat: enforce database ownership with row level security"
```

---
## Task 10: Generate and Verify Supabase TypeScript Types

**Files:**

- Create: `src/lib/supabase/database.types.ts`
- Create: `tests/unit/supabase/database-types.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Start the migrated local database**

Run:

```bash
pnpm db:start
pnpm db:reset
```

Expected: all Plan 01 and Plan 03 migrations apply from an empty database.

- [ ] **Step 2: Generate the canonical TypeScript database types**

Run:

```bash
pnpm db:types:write
```

Expected: `src/lib/supabase/database.types.ts` contains generated `public` tables, views, functions, and enums.

- [ ] **Step 3: Write a compile-time type contract test**

Create `tests/unit/supabase/database-types.test.ts`:

```typescript
import { describe, expectTypeOf, it } from 'vitest';

import type { Database } from '@/lib/supabase/database.types';

type HabitRow = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type ActivateHabitArgs =
  Database['public']['Functions']['activate_habit']['Args'];
type TodaySessionRow =
  Database['public']['Views']['today_session_view']['Row'];

describe('generated database types', () => {
  it('exposes the locked schema contracts', () => {
    expectTypeOf<HabitRow['id']>().toEqualTypeOf<string>();
    expectTypeOf<HabitRow['revision']>().toEqualTypeOf<number>();
    expectTypeOf<HabitInsert['title']>().toEqualTypeOf<string>();
    expectTypeOf<SessionRow['timezone_snapshot']>().toEqualTypeOf<string>();
    expectTypeOf<ActivateHabitArgs['p_command_id']>().toEqualTypeOf<string>();
    expectTypeOf<TodaySessionRow['session_id']>().toEqualTypeOf<string | null>();
  });
});
```

- [ ] **Step 4: Add the Supabase type test to the unit suite without weakening existing scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'test:database-types': 'vitest run tests/unit/supabase/database-types.test.ts',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

- [ ] **Step 5: Verify generated types and compile-time contracts**

Run:

```bash
pnpm db:types:check
pnpm test:database-types
pnpm typecheck
```

Expected:

- generated types match the local migrated schema;
- the type contract test passes;
- strict typecheck passes.

- [ ] **Step 6: Commit generated types**

Run:

```bash
git add src/lib/supabase/database.types.ts tests/unit/supabase/database-types.test.ts package.json
git commit -m "feat: generate typed Supabase database contracts"
```

---

## Task 11: Create Versioned Dexie Guest, Cache, Draft, and Pending-Operation Schemas

**Files:**

- Create: `src/lib/indexed-db/types.ts`
- Create: `src/lib/indexed-db/schema.ts`
- Create: `src/lib/indexed-db/migrations.ts`
- Create: `src/lib/indexed-db/database.ts`
- Create: `tests/unit/indexed-db/database.test.ts`
- Create: `tests/unit/indexed-db/migrations.test.ts`

- [ ] **Step 1: Write failing IndexedDB database tests**

Create `tests/unit/indexed-db/database.test.ts`:

```typescript
import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it } from 'vitest';

import {
  GuestActiveLimitError,
  RecoveryFirstDatabase,
} from '@/lib/indexed-db/database';
import type { LocalHabitRecord } from '@/lib/indexed-db/types';

const openedDatabases: RecoveryFirstDatabase[] = [];

function createDatabase(): RecoveryFirstDatabase {
  const database = new RecoveryFirstDatabase(`database-test-${crypto.randomUUID()}`);
  openedDatabases.push(database);
  return database;
}

function habit(
  id: string,
  lifecycleState: LocalHabitRecord['lifecycleState'],
): LocalHabitRecord {
  return {
    id,
    ownerType: 'guest',
    ownerId: 'guest-1',
    title: `Habit ${id}`,
    lifecycleState,
    currentVersionId: null,
    revision: 1,
    synchronizationState: 'local_only',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    deletedAt: null,
  };
}

afterEach(async () => {
  await Promise.all(
    openedDatabases.splice(0).map(async (database) => {
      const name = database.name;
      database.close();
      await database.delete();
    }),
  );
});

describe('RecoveryFirstDatabase', () => {
  it('persists Guest canonical records after reopen', async () => {
    const database = createDatabase();
    await database.habits.put(habit('habit-1', 'draft'));
    database.close();
    await database.open();

    await expect(database.habits.get('habit-1')).resolves.toMatchObject({
      ownerType: 'guest',
      synchronizationState: 'local_only',
    });
  });

  it('activates a Guest habit transactionally while capacity remains', async () => {
    const database = createDatabase();
    await database.habits.bulkPut([
      habit('habit-1', 'starting'),
      habit('habit-2', 'active'),
      habit('habit-3', 'draft'),
    ]);

    await expect(database.activateGuestHabit('guest-1', 'habit-3')).resolves.toBe(3);
    await expect(database.habits.get('habit-3')).resolves.toMatchObject({
      lifecycleState: 'starting',
      revision: 2,
    });
  });

  it('rejects a fourth active Guest habit without partial writes', async () => {
    const database = createDatabase();
    await database.habits.bulkPut([
      habit('habit-1', 'starting'),
      habit('habit-2', 'active'),
      habit('habit-3', 'recovery'),
      habit('habit-4', 'draft'),
    ]);

    await expect(database.activateGuestHabit('guest-1', 'habit-4')).rejects.toBeInstanceOf(
      GuestActiveLimitError,
    );
    await expect(database.habits.get('habit-4')).resolves.toMatchObject({
      lifecycleState: 'draft',
      revision: 1,
    });
  });
});
```

- [ ] **Step 2: Write the failing migration-preservation test**

Create `tests/unit/indexed-db/migrations.test.ts`:

```typescript
import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';

import { recoveryFirstStoresV1 } from '@/lib/indexed-db/schema';
import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';

const databaseNames: string[] = [];

afterEach(async () => {
  await Promise.all(
    databaseNames.splice(0).map(
      (name) => new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => resolve();
      }),
    ),
  );
});

describe('IndexedDB migrations', () => {
  it('upgrades version 1 Guest data without deleting canonical records', async () => {
    const name = `migration-test-${crypto.randomUUID()}`;
    databaseNames.push(name);

    const versionOne = new Dexie(name);
    versionOne.version(1).stores(recoveryFirstStoresV1);
    await versionOne.open();
    await versionOne.table('habits').put({
      id: 'habit-1',
      ownerType: 'guest',
      ownerId: 'guest-1',
      title: 'Preserved Habit',
      lifecycleState: 'draft',
      currentVersionId: null,
      revision: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      deletedAt: null,
    });
    versionOne.close();

    const current = new RecoveryFirstDatabase(name);
    await current.open();

    await expect(current.habits.get('habit-1')).resolves.toMatchObject({
      title: 'Preserved Habit',
      synchronizationState: 'local_only',
    });
    expect(await current.syncMetadata.count()).toBe(0);
    expect(await current.queryCache.count()).toBe(0);
    current.close();
  });
});
```

- [ ] **Step 3: Run tests and confirm failure**

Run:

```bash
pnpm exec vitest run tests/unit/indexed-db/database.test.ts tests/unit/indexed-db/migrations.test.ts
```

Expected: FAIL because the IndexedDB modules do not exist.

- [ ] **Step 4: Define all local record contracts**

Create `src/lib/indexed-db/types.ts`:

```typescript
import type { CheckInOutcome, FrictionReason } from '@/domain/check-ins/check-in';
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import type { RecoveryPlanStatus } from '@/domain/recovery/recovery';
import type { RecommendationStatus } from '@/domain/recovery/recommendation';
import type { IdentityMode } from '@/domain/shared/identity-mode';
import type { PlanTier } from '@/domain/shared/plan-tier';
import type { SynchronizationState } from '@/domain/shared/sync-state';

export type LocalOwnerType = 'guest' | 'account';

export type LocalProfileRecord = {
  id: string;
  identityMode: IdentityMode;
  planTier: PlanTier;
  locale: string;
  timezone: string;
  weekStart: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  createdAt: string;
  updatedAt: string;
};

export type BrowserInstallationRecord = {
  id: string;
  userId: string | null;
  displayName: string;
  pushCapability: 'supported' | 'unsupported' | 'denied' | 'granted' | 'expired';
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
};

export type LocalHabitRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  title: string;
  lifecycleState: HabitLifecycleState;
  currentVersionId: string | null;
  revision: number;
  synchronizationState: SynchronizationState;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type LocalHabitVersionRecord = {
  id: string;
  habitId: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  versionNumber: number;
  normalTarget: Record<string, unknown>;
  minimumTarget: Record<string, unknown>;
  scheduleRule: RecurrenceRule;
  cue: Record<string, unknown> | null;
  recoveryStructure: Record<string, unknown>;
  source: 'creation' | 'redesign' | 'recommendation' | 'restore';
  parentVersionId: string | null;
  createdAt: string;
};

export type LocalSessionRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  habitVersionId: string;
  scheduledLocalDate: string;
  scheduledLocalTime: string | null;
  timezoneSnapshot: string;
  eligibleAt: string;
  resolutionDueAt: string;
  status: CheckInOutcome;
  revision: number;
  synchronizationState: SynchronizationState;
};

export type LocalCheckInRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  sessionId: string;
  outcome: Exclude<CheckInOutcome, 'automatic_skipped' | 'unrecorded'>;
  frictionCode: FrictionReason | null;
  frictionNote: string | null;
  recordedLocalAt: string;
  timezoneSnapshot: string;
  revision: number;
  synchronizationState: SynchronizationState;
};

export type LocalRecommendationRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  habitVersionId: string;
  status: RecommendationStatus;
  signalCode: string;
  evidence: Record<string, unknown>;
  proposedChange: Record<string, unknown>;
  createdAt: string;
};

export type LocalRecoveryPlanRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  habitVersionId: string;
  status: RecoveryPlanStatus;
  targetDefinition: Record<string, unknown>;
  durationSessions: number;
  successThreshold: number;
  createdAt: string;
};

export type LocalReviewItemRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string | null;
  itemType: string;
  status: 'pending' | 'resolved' | 'dismissed';
  priority: number;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type LocalReminderConfigRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  habitId: string;
  channel: 'web_push' | 'email';
  localTime: string;
  timezone: string;
  enabled: boolean;
  revision: number;
};

export type DraftRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  draftType: 'habit_wizard' | 'habit_edit' | 'recommendation_customize';
  payload: Record<string, unknown>;
  updatedAt: string;
};

export type PendingOperationRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  operationType: string;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  expectedRevision?: number;
  payload: unknown;
  createdAt: string;
  attemptCount: number;
  nextAttemptAt: string;
  status: 'pending' | 'processing' | 'blocked' | 'failed';
  lastErrorCode?: string;
};

export type SyncMetadataRecord = {
  key: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  cursor: string | null;
  lastSuccessfulAt: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
};

export type QueryCacheRecord = {
  key: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  payload: unknown;
  expiresAt: string;
  updatedAt: string;
};

export type SettingRecord = {
  key: string;
  value: unknown;
  updatedAt: string;
};
```

- [ ] **Step 5: Define append-only schema versions**

Create `src/lib/indexed-db/schema.ts`:

```typescript
export const recoveryFirstStoresV1 = {
  localProfiles: 'id, identityMode, planTier',
  browserInstallations: 'id, userId, lastSeenAt',
  habits: 'id, [ownerType+ownerId], lifecycleState, updatedAt, deletedAt',
  habitVersions: 'id, habitId, [ownerType+ownerId], [habitId+versionNumber]',
  sessions:
    'id, [ownerType+ownerId], habitId, habitVersionId, scheduledLocalDate, status',
  checkIns: 'id, sessionId, [ownerType+ownerId], outcome, recordedLocalAt',
  recommendations: 'id, habitId, [ownerType+ownerId], status, createdAt',
  recoveryPlans: 'id, habitId, [ownerType+ownerId], status, createdAt',
  reviewItems: 'id, [ownerType+ownerId], habitId, status, priority',
  reminderConfigs: 'id, habitId, [ownerType+ownerId], enabled',
  drafts: 'id, [ownerType+ownerId], draftType, updatedAt',
  pendingOperations:
    'id, [ownerType+ownerId], [entityType+entityId], status, nextAttemptAt, createdAt',
  settings: 'key, updatedAt',
} as const;

export const recoveryFirstStoresV2 = {
  ...recoveryFirstStoresV1,
  syncMetadata: 'key, [ownerType+ownerId], lastSuccessfulAt, leaseExpiresAt',
  queryCache: 'key, [ownerType+ownerId], expiresAt, updatedAt',
} as const;

export const currentIndexedDbVersion = 2;
```

- [ ] **Step 6: Define the version 2 migration**

Create `src/lib/indexed-db/migrations.ts`:

```typescript
import type { Transaction } from 'dexie';

import type { LocalHabitRecord } from '@/lib/indexed-db/types';

export async function migrateVersionOneToTwo(transaction: Transaction): Promise<void> {
  await transaction
    .table<LocalHabitRecord>('habits')
    .toCollection()
    .modify((habit) => {
      habit.synchronizationState ??= 'local_only';
    });
}
```

- [ ] **Step 7: Implement the Dexie database and Guest activation transaction**

Create `src/lib/indexed-db/database.ts`:

```typescript
import Dexie, { type Table } from 'dexie';

import { activeHabitLimitFor } from '@/domain/habits/active-slot-policy';
import { isSlotConsumingHabitState } from '@/domain/habits/habit-lifecycle';
import { migrateVersionOneToTwo } from '@/lib/indexed-db/migrations';
import {
  recoveryFirstStoresV1,
  recoveryFirstStoresV2,
} from '@/lib/indexed-db/schema';
import type {
  BrowserInstallationRecord,
  DraftRecord,
  LocalCheckInRecord,
  LocalHabitRecord,
  LocalHabitVersionRecord,
  LocalProfileRecord,
  LocalRecommendationRecord,
  LocalRecoveryPlanRecord,
  LocalReminderConfigRecord,
  LocalReviewItemRecord,
  LocalSessionRecord,
  PendingOperationRecord,
  QueryCacheRecord,
  SettingRecord,
  SyncMetadataRecord,
} from '@/lib/indexed-db/types';

export class GuestActiveLimitError extends Error {
  constructor() {
    super('guest_active_limit_reached');
    this.name = 'GuestActiveLimitError';
  }
}

export class RecoveryFirstDatabase extends Dexie {
  localProfiles!: Table<LocalProfileRecord, string>;
  browserInstallations!: Table<BrowserInstallationRecord, string>;
  habits!: Table<LocalHabitRecord, string>;
  habitVersions!: Table<LocalHabitVersionRecord, string>;
  sessions!: Table<LocalSessionRecord, string>;
  checkIns!: Table<LocalCheckInRecord, string>;
  recommendations!: Table<LocalRecommendationRecord, string>;
  recoveryPlans!: Table<LocalRecoveryPlanRecord, string>;
  reviewItems!: Table<LocalReviewItemRecord, string>;
  reminderConfigs!: Table<LocalReminderConfigRecord, string>;
  drafts!: Table<DraftRecord, string>;
  pendingOperations!: Table<PendingOperationRecord, string>;
  syncMetadata!: Table<SyncMetadataRecord, string>;
  queryCache!: Table<QueryCacheRecord, string>;
  settings!: Table<SettingRecord, string>;

  constructor(name = 'recovery_first_web') {
    super(name);

    this.version(1).stores(recoveryFirstStoresV1);
    this.version(2)
      .stores(recoveryFirstStoresV2)
      .upgrade(migrateVersionOneToTwo);
  }

  async activateGuestHabit(ownerId: string, habitId: string): Promise<number> {
    return this.transaction('rw', this.habits, async () => {
      const habit = await this.habits.get(habitId);
      if (!habit || habit.ownerType !== 'guest' || habit.ownerId !== ownerId) {
        throw new Error('guest_habit_not_found');
      }

      if (isSlotConsumingHabitState(habit.lifecycleState)) {
        return this.countGuestActiveHabits(ownerId);
      }

      const activeCount = await this.countGuestActiveHabits(ownerId);
      if (activeCount >= activeHabitLimitFor('guest')) {
        throw new GuestActiveLimitError();
      }

      await this.habits.update(habitId, {
        lifecycleState: 'starting',
        revision: habit.revision + 1,
        updatedAt: new Date().toISOString(),
      });

      return activeCount + 1;
    });
  }

  private async countGuestActiveHabits(ownerId: string): Promise<number> {
    const habits = await this.habits
      .where('[ownerType+ownerId]')
      .equals(['guest', ownerId])
      .toArray();

    return habits.filter(
      (habit) => habit.deletedAt === null && isSlotConsumingHabitState(habit.lifecycleState),
    ).length;
  }
}
```

- [ ] **Step 8: Run IndexedDB tests**

Run:

```bash
pnpm test:indexed-db
pnpm typecheck
```

Expected:

- Guest data survives close and reopen;
- v1 data upgrades to v2;
- canonical habit records remain present;
- migration adds `synchronizationState: local_only`;
- Guest activation is atomic;
- the fourth active Guest habit is rejected without partial writes.

- [ ] **Step 9: Commit IndexedDB schema contracts**

Run:

```bash
git add src/lib/indexed-db tests/unit/indexed-db
git commit -m "feat: add versioned browser local data schema"
```

---

## Task 12: Add Deterministic Non-Personal Seed Fixtures and Architecture Records

**Files:**

- Modify: `supabase/seed.sql`
- Create: `docs/architecture/ADR-003-indexeddb-dexie.md`
- Create: `docs/architecture/ADR-004-domain-determinism.md`
- Create: `docs/operations/DATABASE-DEVELOPMENT.md`

- [ ] **Step 1: Replace the Foundation seed with deterministic product fixtures**

Replace `supabase/seed.sql` with:

```sql
insert into private.foundation_metadata (key, value)
values
  ('seed_stage', 'database-domain-model'),
  ('seed_fixture_policy', 'synthetic-only')
on conflict (key) do update set value = excluded.value;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '13000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'seed-user@example.invalid',
  crypt('local-development-only', gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now())
)
on conflict (id) do nothing;

insert into public.profiles (
  id,
  display_name,
  locale,
  timezone,
  week_start,
  plan_code
)
values (
  '13000000-0000-4000-8000-000000000001',
  'Seed User',
  'en-US',
  'Asia/Jakarta',
  1,
  'free'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  locale = excluded.locale,
  timezone = excluded.timezone,
  week_start = excluded.week_start;

insert into public.habits (
  id,
  user_id,
  title,
  category,
  lifecycle_state,
  revision
)
values (
  '23000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  'Read for ten minutes',
  'learning',
  'starting',
  1
)
on conflict (id) do nothing;

insert into public.habit_versions (
  id,
  habit_id,
  user_id,
  version_number,
  normal_target,
  minimum_target,
  schedule_rule,
  cue,
  recovery_structure,
  source
)
values (
  '33000000-0000-4000-8000-000000000001',
  '23000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  1,
  '{"kind":"duration_minutes","value":10}'::jsonb,
  '{"kind":"duration_minutes","value":2}'::jsonb,
  '{"kind":"daily"}'::jsonb,
  '{"kind":"after_breakfast"}'::jsonb,
  '{"durationSessions":3,"successThreshold":2}'::jsonb,
  'creation'
)
on conflict (id) do nothing;

update public.habits
set current_version_id = '33000000-0000-4000-8000-000000000001'
where id = '23000000-0000-4000-8000-000000000001';

insert into public.sessions (
  id,
  habit_id,
  habit_version_id,
  user_id,
  scheduled_local_date,
  scheduled_local_time,
  timezone_snapshot,
  eligible_at,
  resolution_due_at,
  status,
  status_source
)
values (
  '43000000-0000-4000-8000-000000000001',
  '23000000-0000-4000-8000-000000000001',
  '33000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  '2026-08-01',
  '07:00',
  'Asia/Jakarta',
  '2026-08-01 00:00:00+00',
  '2026-08-04 16:59:59+00',
  'minimum',
  'user'
)
on conflict (id) do nothing;

insert into public.check_ins (
  id,
  session_id,
  user_id,
  outcome,
  recorded_local_at,
  timezone_snapshot
)
values (
  '53000000-0000-4000-8000-000000000001',
  '43000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000001',
  'minimum',
  '2026-08-01 07:05:00+07',
  'Asia/Jakarta'
)
on conflict (id) do nothing;
```

- [ ] **Step 2: Document the IndexedDB decision**

Create `docs/architecture/ADR-003-indexeddb-dexie.md`:

```markdown
# ADR-003: IndexedDB with Dexie

## Status

Accepted.

## Context

Guest users require durable browser-local canonical data. Signed-in users require local cache, drafts, and pending operations. Native IndexedDB is asynchronous and transactional but verbose to version and test directly.

## Decision

Use one Dexie database named `recovery_first_web` per website origin. Schema versions are append-only. Guest domain records are not deliberately evicted. Derived query-cache rows are evictable. Migration tests start from every supported prior version.

## Consequences

- Guest data remains limited to the current browser profile and origin.
- Clearing browser storage can remove Guest data.
- Schema changes require explicit Dexie version upgrades.
- Live queue leadership and synchronization are deferred to Plan 05.
```

- [ ] **Step 3: Document deterministic domain computation**

Create `docs/architecture/ADR-004-domain-determinism.md`:

```markdown
# ADR-004: Deterministic Domain Rules

## Status

Accepted.

## Context

Habit limits, recurrence validation, check-in metrics, continuity, Recovery counters, and entitlement interpretation must produce the same result in tests, browser-local workflows, and authoritative server transactions.

## Decision

Implement framework-independent TypeScript domain functions for client and test use. Mirror transaction-sensitive invariants in PostgreSQL functions and constraints. Use fixed UUIDs and timestamps in database fixtures. Store immutable habit versions rather than mutating historical definitions.

## Consequences

- UI components cannot own business rules.
- PostgreSQL remains authoritative for signed-in writes.
- Cross-language fixtures must be reviewed when algorithms change.
- Derived metrics can be recomputed from authoritative sessions and check-ins.
```

- [ ] **Step 4: Document local database development commands**

Create `docs/operations/DATABASE-DEVELOPMENT.md`:

```markdown
# Database Development

## Start and reset

```bash
pnpm db:start
pnpm db:reset
```

## Run database tests

```bash
pnpm db:test
```

## Regenerate TypeScript types

```bash
pnpm db:types:write
pnpm db:types:check
```

## Stop local services

```bash
pnpm db:stop
```

## Migration rules

- Never edit a migration already shared or applied outside a disposable local database.
- Add a new timestamped migration for every schema change.
- Keep browser-accessible tables in `public` with RLS enabled.
- Keep payment payloads, idempotency records, and audit details in `private`.
- Use synthetic `.invalid` email addresses and fixed UUIDs in fixtures.
- Never place real personal data, provider payloads, tokens, or secrets in seeds.
```

- [ ] **Step 5: Verify deterministic reset and seed data**

Run:

```bash
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm format
pnpm format:check
```

Expected:

- reset succeeds repeatedly;
- all database tests pass;
- generated types remain current;
- formatting passes.

- [ ] **Step 6: Commit fixtures and architecture records**

Run:

```bash
git add supabase/seed.sql docs/architecture/ADR-003-indexeddb-dexie.md docs/architecture/ADR-004-domain-determinism.md docs/operations/DATABASE-DEVELOPMENT.md
git commit -m "docs: record database and local storage contracts"
```

---

## Task 13: Run the Plan 03 Quality Gate and Record the Handoff

**Files:**

- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [ ] **Step 1: Mark Plan 03 verified only after every prior task commit exists**

In `docs/implementation/IMPLEMENTATION-PLAN.md`, update only the Plan 03 tracking row from:

```markdown
| 03 | `03-database-domain-model.md` | Not created | Plan 02 verified |
```

to:

```markdown
| 03 | `03-database-domain-model.md` | Verified | Plan 02 verified |
```

Do not mark Plan 04 started.

- [ ] **Step 2: Run formatting, lint, type, domain, and IndexedDB checks**

Run:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:domain
pnpm test:indexed-db
pnpm test:database-types
```

Expected: every command exits with status `0`.

- [ ] **Step 3: Run all regression suites and production build**

Run:

```bash
pnpm test:unit
pnpm test:component
pnpm test:integration
pnpm test:accessibility
pnpm test:e2e
pnpm test:visual
pnpm build
```

Expected: Plan 01 and Plan 02 tests continue to pass and production build succeeds.

- [ ] **Step 4: Run complete database verification from a clean local reset**

Run:

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm exec supabase db lint --local --level warning
pnpm db:stop
```

Expected:

- every migration applies in timestamp order;
- all pgTAP assertions pass;
- generated types match;
- database lint exits with status `0`;
- Supabase stops cleanly.

- [ ] **Step 5: Run repository policy checks**

Run:

```bash
pnpm check:repository
git diff --check
git status --short
```

Expected: repository policy and whitespace checks pass; only the master-plan status change is uncommitted.

- [ ] **Step 6: Commit the verified status**

Run:

```bash
git add docs/implementation/IMPLEMENTATION-PLAN.md
git commit -m "docs: mark database domain plan verified"
```

- [ ] **Step 7: Verify from a clean checkout**

Run:

```bash
temporary_directory="$(mktemp -d)"
git clone --local . "$temporary_directory/recovery-first-habit-tracker"
cd "$temporary_directory/recovery-first-habit-tracker"
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm verify
pnpm test:domain
pnpm test:indexed-db
pnpm test:accessibility
pnpm test:e2e
pnpm test:visual
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm exec supabase db lint --local --level warning
pnpm db:stop
pnpm build
pnpm check:repository
```

Expected: every command exits with status `0` using only tracked files and generated local dependencies.

- [ ] **Step 8: Return and capture final evidence**

Run:

```bash
cd -
git log --oneline --decorate -13
git status --short
```

Expected:

- Plan 03 commits appear in order;
- the working tree is clean.

---

# 4. Final Acceptance Checklist

Plan 03 is complete only when fresh command output proves every item:

- [ ] Framework-independent identity, plan, lifecycle, synchronization, recurrence, session identity, check-in, recommendation, Recovery, and entitlement types exist.
- [ ] Guest, Free, and Premium active limits are exactly 3, 5, and 20.
- [ ] Slot-consuming lifecycle states match the PRD.
- [ ] Full and Minimum count as successful consistency and continuity.
- [ ] Manual Skipped increments the Recovery counter; Full or Minimum resets it.
- [ ] Automatic Skipped cannot increment the Manual Skipped Recovery counter.
- [ ] PostgreSQL contains every Plan 03 core table, ownership column, revision, timestamp, soft-delete field, constraint, and required index.
- [ ] Published Habit Version rows reject updates and deletes.
- [ ] Active-habit limits are enforced inside an authoritative transaction.
- [ ] Habit version creation is monotonic, immutable, revision-checked, and idempotent.
- [ ] Session creation is deterministic and duplicate-safe.
- [ ] Check-in writes preserve prior history, update session state, update Recovery counters, and reject stale revisions.
- [ ] Reusing a command ID with the same request returns the prior result without duplicate state.
- [ ] Reusing a command ID with a different request is rejected.
- [ ] RLS is enabled for every account-owned table.
- [ ] Owner access succeeds and cross-user access fails.
- [ ] Browser roles cannot read private payment, idempotency, or audit tables.
- [ ] Read views use security-invoker behavior and exclude provider identifiers.
- [ ] Supabase TypeScript types are reproducibly generated and drift-checked.
- [ ] Dexie schema version 1 upgrades to version 2 without deleting Guest records.
- [ ] Guest activation is atomic and rejects the fourth slot without partial writes.
- [ ] Seed fixtures use fixed synthetic data and `.invalid` email addresses only.
- [ ] Domain, IndexedDB, database, accessibility, browser, visual, and regression suites pass.
- [ ] Database reset, pgTAP, type generation, database lint, production build, and clean-checkout verification pass.
- [ ] Working tree is clean.

---

# 5. Plan 04 Handoff Contract

Plan 04 may begin only after every Final Acceptance Checklist item passes.

Plan 03 supplies these verified contracts:

- deterministic framework-independent product types and calculations;
- locked lifecycle transitions and active-slot rules;
- validated recurrence representations and session identity;
- check-in consistency, continuity, and Recovery-counter semantics;
- complete account-owned PostgreSQL schema;
- immutable Habit Version history;
- transactional active-limit, version, session, and check-in functions;
- idempotent command replay and optimistic revision enforcement;
- RLS and safe security-invoker read views;
- reproducible generated Supabase TypeScript types;
- versioned Dexie Guest/cache/draft/outbox schemas;
- deterministic synthetic fixtures and database operations documentation.

Plan 04 must consume these contracts rather than duplicating business rules in React components, Server Actions, Route Handlers, or form validators. It may add habit/session/check-in repositories, application services, forms, Today read models, and user-facing workflows while preserving immutable versions, idempotency, revisions, RLS, and Guest active-slot transactions.
