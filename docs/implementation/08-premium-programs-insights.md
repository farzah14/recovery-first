# Premium Programs and Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement server-authorized Premium program access, a safe three-day simulation for authenticated Free and Lite users, adaptive program and reminder recommendations that require approval, and accessible aggregate and habit-level Insights.

**Architecture:** Premium access is resolved on the server through an internal capability service backed by authoritative entitlement rows; browser state may render a pending or locked presentation but never grant access. Program previews run in an isolated non-persistent simulation domain for Free and Lite accounts, while real enrollments use versioned PostgreSQL records and explicit recommendation decisions. Insights are calculated from privacy-safe aggregate functions, preserve current-version versus lifetime boundaries, and expose the same information through charts and accessible tables.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Zod, Supabase PostgreSQL and RLS, Server Components, Route Handlers, TanStack Query, Dexie schema version 7, Recharts, React Hook Form, Vitest, React Testing Library, Playwright, pgTAP, axe-core, pnpm.

**03A amendment:** The active identity model is authenticated accounts with the ordered tiers Free, Lite, and Premium. Guest is not a supported runtime identity. Any Guest wording or repository examples later in this historical plan are migration context only and must not be implemented. Free/Lite previews remain non-persistent; pre-change browser data is handled only by the legacy-local-data recovery/export service.

---

# 1. Prerequisites and Boundaries

## Prerequisites

Begin only after Plans 01–07 are verified complete. The repository must already provide:

- strict TypeScript, deterministic clock and UUID services, structured results, and safe logging;
- the approved emerald, gold, purple, blue, amber, coral, and neutral design tokens;
- desktop sidebar, mobile bottom navigation, route metadata, feedback components, dialogs, drawers, skeletons, and accessible tables;
- PostgreSQL habits, immutable habit versions, sessions, check-ins, history, recommendations, Recovery Plans, Weekly Reviews, reminders, entitlements, idempotency records, and RLS;
- account repositories, Dexie cache/draft/outbox ownership, legacy-local-data recovery, conflict handling, and cross-tab coordination;
- Today, Habits, check-in, lifecycle, Recovery, Weekly Review, authentication, legacy-local-data recovery, and signed-in synchronization;
- server, browser, and privileged Supabase clients with enforced import boundaries.

## Explicit exclusions

This plan does not implement:

- checkout sessions, payment-provider redirects, provider webhooks, refunds, cancellation, or subscription reconciliation;
- production pricing configuration or commercial disclosure approval;
- data export package generation, account deletion workers, or retention cleanup;
- final security penetration testing, production incident dashboards, or launch certification;
- generative coaching, social comparison, competitive ranking, or diagnosis-like predictions.

## Product invariants

- Authenticated Free and Lite users may browse and simulate Premium programs but cannot start a real Premium program.
- A browser flag, query parameter, redirect value, local-storage value, or cached entitlement can never authorize Lite or Premium access.
- A three-day preview is clearly labeled as simulation and never creates habits, sessions, check-ins, reminders, recommendations, active-slot usage, or analytics derived from real user outcomes.
- Preview activity is cleared when reset, closed, or expired and is not uploaded as operational habit data.
- Each simulated or real adaptation changes at most one of: Normal target, Minimum version, cue, or reminder.
- Real program changes require Apply, Customize, or Keep Current according to the standard decision contract.
- Premium programs use structured 7-, 14-, or 30-day definitions.
- Starting a real program consumes an active-habit slot and uses the server-authoritative Premium limit of 20.
- Expired or revoked paid-tier access blocks new paid-tier actions but does not delete historical program, Recovery, reminder-trial, or Insights data.
- Minimum counts as a successful outcome for consistency and continuity.
- Current-version metrics reset at a version boundary while lifetime metrics remain intact.
- Insights never expose habit names, notes, friction free text, or other sensitive free text through analytics events.
- Charts are never the sole representation of information; an accessible summary or table is always available.
- Low-sample friction analysis is shown as insufficient data rather than a confident pattern.
- Adaptive reminder suggestions never change reminder settings automatically.

---

# 2. File Map

```text
src/
├── app/
│   └── (application)/
│       ├── insights/
│       │   ├── page.tsx
│       │   ├── loading.tsx
│       │   ├── error.tsx
│       │   └── habits/[habitId]/page.tsx
│       └── programs/
│           ├── page.tsx
│           ├── [programId]/page.tsx
│           ├── [programId]/preview/page.tsx
│           └── enrollments/[enrollmentId]/page.tsx
├── domain/
│   ├── entitlements/
│   │   ├── capability.ts
│   │   └── capability-policy.ts
│   ├── premium-programs/
│   │   ├── program-definition.ts
│   │   ├── preview-simulation.ts
│   │   ├── adaptation-rule.ts
│   │   ├── enrollment-state.ts
│   │   └── program-decision.ts
│   └── insights/
│       ├── insight-range.ts
│       ├── insight-metrics.ts
│       ├── friction-confidence.ts
│       └── reminder-analysis.ts
├── features/
│   ├── entitlements/
│   │   ├── capability-service.ts
│   │   ├── capability-provider.tsx
│   │   └── premium-gate.tsx
│   ├── premium-programs/
│   │   ├── program-catalog-repository.ts
│   │   ├── preview-session-store.ts
│   │   ├── preview-simulation-service.ts
│   │   ├── start-program-service.ts
│   │   ├── program-adaptation-service.ts
│   │   └── components/
│   ├── insights/
│   │   ├── insights-repository.ts
│   │   ├── insights-query.ts
│   │   ├── insight-formatters.ts
│   │   └── components/
│   └── reminders/
│       ├── adaptive-reminder-analysis.ts
│       └── reminder-reduction-trial.ts
├── lib/
│   └── indexed-db/
│       └── premium-insights-migrations.ts
└── server/
    ├── entitlements/resolve-capabilities.ts
    ├── premium-programs/program-commands.ts
    └── insights/read-insights.ts
supabase/
├── migrations/
│   ├── 20260729050000_premium_program_catalog.sql
│   ├── 20260729051000_program_enrollments.sql
│   ├── 20260729052000_program_commands.sql
│   ├── 20260729053000_insight_functions.sql
│   └── 20260729054000_premium_program_rls.sql
├── seed.sql
└── tests/
    ├── 00120_premium_program_catalog.test.sql
    ├── 00130_premium_program_commands.test.sql
    ├── 00140_insight_functions.test.sql
    └── 00150_premium_program_rls.test.sql
tests/
├── accessibility/
│   └── insights-accessibility.test.tsx
├── component/
│   ├── premium-program-card.test.tsx
│   ├── premium-preview.test.tsx
│   ├── insight-chart-panel.test.tsx
│   └── entitlement-state.test.tsx
├── e2e/
│   ├── premium-preview.spec.ts
│   ├── premium-program.spec.ts
│   └── insights.spec.ts
├── integration/
│   ├── capability-service.test.ts
│   ├── start-program-service.test.ts
│   ├── program-adaptation-service.test.ts
│   ├── insights-repository.test.ts
│   └── premium-expiry.test.ts
└── unit/
    ├── capability-policy.test.ts
    ├── preview-simulation.test.ts
    ├── program-definition.test.ts
    ├── insight-metrics.test.ts
    ├── friction-confidence.test.ts
    └── reminder-analysis.test.ts
```

---

# 3. Tasks

## Task 1: Define Plan 08 Verification Commands and Architecture Decision

**Files:**

- Modify: `package.json`
- Create: `docs/architecture/ADR-011-premium-programs-insights.md`

- [ ] **Step 1: Add focused verification scripts**

Add the following entries without removing existing scripts:

```json
{
  "scripts": {
    "test:premium": "vitest run tests/unit/capability-policy.test.ts tests/unit/program-definition.test.ts tests/unit/preview-simulation.test.ts tests/integration/capability-service.test.ts tests/integration/start-program-service.test.ts tests/integration/program-adaptation-service.test.ts tests/component/premium-program-card.test.tsx tests/component/premium-preview.test.tsx tests/component/entitlement-state.test.tsx",
    "test:insights": "vitest run tests/unit/insight-metrics.test.ts tests/unit/friction-confidence.test.ts tests/unit/reminder-analysis.test.ts tests/integration/insights-repository.test.ts tests/component/insight-chart-panel.test.tsx tests/accessibility/insights-accessibility.test.tsx",
    "test:e2e:premium": "playwright test tests/e2e/premium-preview.spec.ts tests/e2e/premium-program.spec.ts",
    "test:e2e:insights": "playwright test tests/e2e/insights.spec.ts"
  }
}
```

- [ ] **Step 2: Record the architecture decision**

Create `docs/architecture/ADR-011-premium-programs-insights.md`:

```markdown
# ADR-011: Authoritative Premium Capabilities and Accessible Insights

## Status

Accepted.

## Decision

Paid-tier capabilities are resolved on the server from authoritative entitlement data and returned as a bounded capability set. Free and Lite previews use an isolated non-persistent simulation domain. Real program enrollments are versioned, idempotent, and subject to active-slot limits. Insights are produced by privacy-safe aggregate functions and always include an accessible textual or tabular representation.

## Consequences

- Client state cannot grant Premium access.
- Preview decisions never mutate operational habit records.
- Program adaptations require explicit user decisions.
- Expiry disables actions without deleting history.
- Insight queries never return free-text notes.
- Chart components require table or summary alternatives.
```

- [ ] **Step 3: Run the focused suites before implementation**

Run:

```bash
pnpm test:premium
pnpm test:insights
```

Expected: both commands FAIL because Plan 08 tests do not exist.

- [ ] **Step 4: Commit the plan boundary**

```bash
git add package.json docs/architecture/ADR-011-premium-programs-insights.md
git commit -m "chore: define premium programs and insights boundary"
```

---

## Task 2: Define Capability Types and Server-Authoritative Policy

**Files:**

- Create: `src/domain/entitlements/capability.ts`
- Create: `src/domain/entitlements/capability-policy.ts`
- Create: `tests/unit/capability-policy.test.ts`

- [ ] **Step 1: Write failing capability-policy tests**

Create `tests/unit/capability-policy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveCapabilitySet } from '@/domain/entitlements/capability-policy';

const now = new Date('2026-07-29T12:00:00.000Z');

describe('resolveCapabilitySet', () => {
  it('returns preview-only capabilities for Guest', () => {
    expect(resolveCapabilitySet({ identity: 'guest', entitlement: null, now })).toMatchObject({
      premiumPrograms: 'preview',
      advancedInsights: false,
      adaptiveReminderAnalysis: false,
      activeHabitLimit: 3,
    });
  });

  it('returns preview-only capabilities for a Free account', () => {
    expect(resolveCapabilitySet({ identity: 'account', entitlement: null, now })).toMatchObject({
      premiumPrograms: 'preview',
      advancedInsights: false,
      adaptiveReminderAnalysis: false,
      activeHabitLimit: 5,
    });
  });

  it('grants Premium only during an authoritative valid interval', () => {
    expect(resolveCapabilitySet({
      identity: 'account',
      now,
      entitlement: {
        status: 'active',
        validFrom: new Date('2026-07-01T00:00:00.000Z'),
        validUntil: new Date('2026-08-01T00:00:00.000Z'),
      },
    })).toMatchObject({
      premiumPrograms: 'full',
      advancedInsights: true,
      adaptiveReminderAnalysis: true,
      activeHabitLimit: 20,
    });
  });

  it('blocks Premium actions after expiry while preserving read history', () => {
    expect(resolveCapabilitySet({
      identity: 'account',
      now,
      entitlement: {
        status: 'expired',
        validFrom: new Date('2026-06-01T00:00:00.000Z'),
        validUntil: new Date('2026-07-01T00:00:00.000Z'),
      },
    })).toMatchObject({
      premiumPrograms: 'preview',
      canReadHistoricalPremiumData: true,
      canStartPremiumProgram: false,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/unit/capability-policy.test.ts
```

Expected: FAIL because the entitlement modules do not exist.

- [ ] **Step 3: Implement capability contracts**

Create `src/domain/entitlements/capability.ts`:

```ts
export type PremiumProgramAccess = 'preview' | 'full';

export type CapabilitySet = Readonly<{
  premiumPrograms: PremiumProgramAccess;
  advancedInsights: boolean;
  adaptiveReminderAnalysis: boolean;
  enhancedRecoveryGuidance: boolean;
  canStartPremiumProgram: boolean;
  canReadHistoricalPremiumData: boolean;
  activeHabitLimit: 3 | 5 | 20;
}>;

export type EntitlementWindow = Readonly<{
  status: 'trial_active' | 'active' | 'grace_period' | 'past_due' | 'cancelled' | 'expired' | 'refunded' | 'revoked';
  validFrom: Date;
  validUntil: Date | null;
}>;
```

Create `src/domain/entitlements/capability-policy.ts`:

```ts
import type { CapabilitySet, EntitlementWindow } from './capability';

type Input = Readonly<{
  identity: 'guest' | 'account';
  entitlement: EntitlementWindow | null;
  now: Date;
}>;

const grantsPremium = (entitlement: EntitlementWindow | null, now: Date): boolean => {
  if (!entitlement) return false;
  if (!['trial_active', 'active', 'grace_period'].includes(entitlement.status)) return false;
  if (entitlement.validFrom.getTime() > now.getTime()) return false;
  return entitlement.validUntil === null || entitlement.validUntil.getTime() > now.getTime();
};

export function resolveCapabilitySet(input: Input): CapabilitySet {
  const premium = input.identity === 'account' && grantsPremium(input.entitlement, input.now);
  const historical = input.identity === 'account' && input.entitlement !== null;

  return {
    premiumPrograms: premium ? 'full' : 'preview',
    advancedInsights: premium,
    adaptiveReminderAnalysis: premium,
    enhancedRecoveryGuidance: premium,
    canStartPremiumProgram: premium,
    canReadHistoricalPremiumData: premium || historical,
    activeHabitLimit: input.identity === 'guest' ? 3 : premium ? 20 : 5,
  };
}
```

- [ ] **Step 4: Run the test and verify success**

```bash
pnpm vitest run tests/unit/capability-policy.test.ts
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/entitlements tests/unit/capability-policy.test.ts
git commit -m "feat: define authoritative premium capability policy"
```

---

## Task 3: Implement the Server Capability Service and Route Guard

**Files:**

- Create: `src/server/entitlements/resolve-capabilities.ts`
- Create: `src/features/entitlements/capability-service.ts`
- Create: `src/features/entitlements/premium-gate.tsx`
- Create: `tests/integration/capability-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Create `tests/integration/capability-service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createCapabilityService } from '@/features/entitlements/capability-service';

const now = new Date('2026-07-29T12:00:00.000Z');

describe('capability service', () => {
  it('ignores caller-supplied Premium flags', async () => {
    const readEntitlement = vi.fn().mockResolvedValue(null);
    const service = createCapabilityService({ readEntitlement, now: () => now });

    const result = await service.forAccount('user-1');

    expect(result.canStartPremiumProgram).toBe(false);
    expect(readEntitlement).toHaveBeenCalledWith('user-1');
  });

  it('grants active entitlement capabilities', async () => {
    const readEntitlement = vi.fn().mockResolvedValue({
      status: 'active',
      validFrom: new Date('2026-07-01T00:00:00.000Z'),
      validUntil: new Date('2026-08-01T00:00:00.000Z'),
    });
    const service = createCapabilityService({ readEntitlement, now: () => now });

    await expect(service.forAccount('user-1')).resolves.toMatchObject({
      canStartPremiumProgram: true,
      advancedInsights: true,
    });
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/integration/capability-service.test.ts
```

Expected: FAIL because the capability service does not exist.

- [ ] **Step 3: Implement the service and server resolver**

Create `src/features/entitlements/capability-service.ts`:

```ts
import { resolveCapabilitySet } from '@/domain/entitlements/capability-policy';
import type { EntitlementWindow } from '@/domain/entitlements/capability';

type Dependencies = Readonly<{
  readEntitlement: (userId: string) => Promise<EntitlementWindow | null>;
  now: () => Date;
}>;

export function createCapabilityService(deps: Dependencies) {
  return {
    forGuest: () => resolveCapabilitySet({ identity: 'guest', entitlement: null, now: deps.now() }),
    forAccount: async (userId: string) => resolveCapabilitySet({
      identity: 'account',
      entitlement: await deps.readEntitlement(userId),
      now: deps.now(),
    }),
  };
}
```

Create `src/server/entitlements/resolve-capabilities.ts`:

```ts
import 'server-only';
import { createCapabilityService } from '@/features/entitlements/capability-service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { systemClock } from '@/lib/time/system-clock';

export async function resolveCurrentCapabilities(userId: string | null) {
  const supabase = await createServerSupabaseClient();
  const service = createCapabilityService({
    now: systemClock.now,
    readEntitlement: async (accountId) => {
      const { data, error } = await supabase
        .from('entitlements')
        .select('status, valid_from, valid_until')
        .eq('user_id', accountId)
        .eq('product_code', 'premium')
        .order('valid_from', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? {
        status: data.status,
        validFrom: new Date(data.valid_from),
        validUntil: data.valid_until ? new Date(data.valid_until) : null,
      } : null;
    },
  });

  return userId ? service.forAccount(userId) : service.forGuest();
}
```

Create `src/features/entitlements/premium-gate.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { CapabilitySet } from '@/domain/entitlements/capability';

export function PremiumGate(props: {
  capabilities: CapabilitySet;
  children: ReactNode;
  locked: ReactNode;
}) {
  return props.capabilities.canStartPremiumProgram ? props.children : props.locked;
}
```

- [ ] **Step 4: Run the test and verify success**

```bash
pnpm vitest run tests/integration/capability-service.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/server/entitlements src/features/entitlements tests/integration/capability-service.test.ts
git commit -m "feat: resolve premium capabilities on the server"
```

---

## Task 4: Define Premium Program Domain Contracts

**Files:**

- Create: `src/domain/premium-programs/program-definition.ts`
- Create: `src/domain/premium-programs/adaptation-rule.ts`
- Create: `src/domain/premium-programs/enrollment-state.ts`
- Create: `src/domain/premium-programs/program-decision.ts`
- Create: `tests/unit/program-definition.test.ts`

- [ ] **Step 1: Write failing definition tests**

Create `tests/unit/program-definition.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseProgramDefinition } from '@/domain/premium-programs/program-definition';

const valid = {
  id: 'program-gentle-morning',
  slug: 'gentle-morning',
  title: 'Gentle Morning Reset',
  durationDays: 14,
  category: 'wellbeing',
  normalTarget: '10 minutes',
  minimumTarget: '2 minutes',
  cue: 'After breakfast',
  days: Array.from({ length: 14 }, (_, index) => ({
    dayNumber: index + 1,
    instruction: `Day ${index + 1}`,
  })),
};

describe('program definition', () => {
  it('accepts structured 7, 14, or 30 day programs', () => {
    expect(parseProgramDefinition(valid).durationDays).toBe(14);
  });

  it('rejects unsupported durations', () => {
    expect(() => parseProgramDefinition({ ...valid, durationDays: 10 })).toThrow();
  });

  it('requires one definition for every day', () => {
    expect(() => parseProgramDefinition({ ...valid, days: valid.days.slice(0, 3) })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/unit/program-definition.test.ts
```

Expected: FAIL because the program domain does not exist.

- [ ] **Step 3: Implement the domain contracts**

Create `src/domain/premium-programs/program-definition.ts`:

```ts
import { z } from 'zod';

const daySchema = z.object({
  dayNumber: z.number().int().positive(),
  instruction: z.string().min(1).max(240),
});

const schema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(80),
  durationDays: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  category: z.string().min(1).max(40),
  normalTarget: z.string().min(1).max(120),
  minimumTarget: z.string().min(1).max(120),
  cue: z.string().min(1).max(120),
  days: z.array(daySchema),
}).superRefine((value, context) => {
  if (value.days.length !== value.durationDays) {
    context.addIssue({ code: 'custom', path: ['days'], message: 'Program must define every day' });
  }
  value.days.forEach((day, index) => {
    if (day.dayNumber !== index + 1) {
      context.addIssue({ code: 'custom', path: ['days', index, 'dayNumber'], message: 'Days must be sequential' });
    }
  });
});

export type ProgramDefinition = z.infer<typeof schema>;
export const parseProgramDefinition = (input: unknown): ProgramDefinition => schema.parse(input);
```

Create `src/domain/premium-programs/adaptation-rule.ts`:

```ts
export type AdaptationVariable = 'normal_target' | 'minimum_target' | 'cue' | 'reminder';

export type ProgramAdaptation = Readonly<{
  variable: AdaptationVariable;
  before: string;
  proposed: string;
  rationaleCode: 'repeated_minimum' | 'manual_skipped' | 'friction_time' | 'friction_energy' | 'reminder_mismatch';
}>;

export function assertSingleVariableAdaptation(adaptations: readonly ProgramAdaptation[]): ProgramAdaptation {
  if (adaptations.length !== 1) throw new Error('Exactly one adaptation variable is allowed');
  return adaptations[0];
}
```

Create `src/domain/premium-programs/enrollment-state.ts`:

```ts
export type ProgramEnrollmentStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'decision_required'
  | 'ended_entitlement_expired';
```

Create `src/domain/premium-programs/program-decision.ts`:

```ts
export type ProgramDecision = 'apply' | 'customize' | 'keep_current';
```

- [ ] **Step 4: Run the test and verify success**

```bash
pnpm vitest run tests/unit/program-definition.test.ts
```

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/premium-programs tests/unit/program-definition.test.ts
git commit -m "feat: define premium program domain contracts"
```

---

## Task 5: Create Premium Program Catalog and Enrollment Schema

**Files:**

- Create: `supabase/migrations/20260729050000_premium_program_catalog.sql`
- Create: `supabase/migrations/20260729051000_program_enrollments.sql`
- Create: `supabase/tests/00120_premium_program_catalog.test.sql`

- [ ] **Step 1: Write failing pgTAP tests**

Create `supabase/tests/00120_premium_program_catalog.test.sql`:

```sql
begin;
select plan(10);

select has_table('public', 'premium_programs');
select has_table('public', 'premium_program_days');
select has_table('public', 'program_enrollments');
select has_table('public', 'program_adaptation_decisions');
select col_is_pk('public', 'premium_programs', 'id');
select col_is_pk('public', 'program_enrollments', 'id');
select has_check('public', 'premium_programs', 'premium_programs_duration_days_check');
select has_index('public', 'premium_program_days', 'premium_program_days_program_day_unique');
select has_index('public', 'program_enrollments', 'program_enrollments_user_status_idx');
select has_index('public', 'program_adaptation_decisions', 'program_adaptation_decisions_enrollment_created_idx');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the database test and verify failure**

```bash
pnpm exec supabase test db --file supabase/tests/00120_premium_program_catalog.test.sql
```

Expected: FAIL because the program tables do not exist.

- [ ] **Step 3: Create catalog tables**

Create `supabase/migrations/20260729050000_premium_program_catalog.sql`:

```sql
create table public.premium_programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 1 and 80),
  summary text not null check (char_length(summary) between 1 and 240),
  benefits jsonb not null default '[]'::jsonb check (jsonb_typeof(benefits) = 'array'),
  category text not null,
  duration_days smallint not null,
  normal_target text not null,
  minimum_target text not null,
  cue text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint premium_programs_duration_days_check check (duration_days in (7, 14, 30))
);

create table public.premium_program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.premium_programs(id) on delete cascade,
  day_number smallint not null check (day_number > 0),
  instruction text not null check (char_length(instruction) between 1 and 240),
  normal_target text,
  minimum_target text,
  cue text,
  reminder_local_time time,
  created_at timestamptz not null default now()
);

create unique index premium_program_days_program_day_unique
  on public.premium_program_days(program_id, day_number);
```

- [ ] **Step 4: Create enrollment and decision tables**

Create `supabase/migrations/20260729051000_program_enrollments.sql`:

```sql
create type public.program_enrollment_status as enum (
  'active',
  'paused',
  'completed',
  'decision_required',
  'ended_entitlement_expired'
);

create table public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.premium_programs(id),
  habit_id uuid not null references public.habits(id),
  status public.program_enrollment_status not null default 'active',
  current_day smallint not null default 1 check (current_day > 0),
  started_on date not null,
  completed_on date,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index program_enrollments_user_status_idx
  on public.program_enrollments(user_id, status)
  where deleted_at is null;

create table public.program_adaptation_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id),
  decision text not null check (decision in ('apply', 'customize', 'keep_current')),
  variable text not null check (variable in ('normal_target', 'minimum_target', 'cue', 'reminder')),
  before_value text not null,
  proposed_value text not null,
  selected_value text not null,
  created_at timestamptz not null default now()
);

create index program_adaptation_decisions_enrollment_created_idx
  on public.program_adaptation_decisions(enrollment_id, created_at desc);
```

- [ ] **Step 5: Reset and run the database test**

```bash
pnpm exec supabase db reset
pnpm exec supabase test db --file supabase/tests/00120_premium_program_catalog.test.sql
```

Expected: PASS with 10 assertions.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260729050000_premium_program_catalog.sql supabase/migrations/20260729051000_program_enrollments.sql supabase/tests/00120_premium_program_catalog.test.sql
git commit -m "feat: add premium program catalog and enrollment schema"
```

---

## Task 6: Seed a Deterministic Premium Program Catalog

**Files:**

- Modify: `supabase/seed.sql`
- Create: `src/features/premium-programs/program-catalog-repository.ts`
- Create: `tests/integration/program-catalog-repository.test.ts`

- [ ] **Step 1: Write a failing repository test**

Create `tests/integration/program-catalog-repository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createProgramCatalogRepository } from '@/features/premium-programs/program-catalog-repository';
import { createTestSupabaseClient } from '../helpers/create-test-supabase-client';

describe('program catalog repository', () => {
  it('returns only published programs with ordered days', async () => {
    const repository = createProgramCatalogRepository(createTestSupabaseClient());
    const programs = await repository.listPublished();

    expect(programs.length).toBeGreaterThan(0);
    expect(programs.every((program) => program.days.length === program.durationDays)).toBe(true);
    expect(programs[0]?.days[0]?.dayNumber).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/integration/program-catalog-repository.test.ts
```

Expected: FAIL because no seeded published program or repository exists.

- [ ] **Step 3: Add deterministic seed data**

Append to `supabase/seed.sql`:

```sql
insert into public.premium_programs (
  id, slug, title, summary, benefits, category, duration_days,
  normal_target, minimum_target, cue, published, sort_order
) values (
  '81000000-0000-4000-8000-000000000001',
  'gentle-morning-reset',
  'Gentle Morning Reset',
  'Build a small morning routine that can adapt when energy or time changes.',
  '["Start with a realistic target", "Keep a Minimum version", "Review friction without punishment"]'::jsonb,
  'wellbeing',
  14,
  '10 minutes of intentional morning activity',
  '2 minutes of the easiest useful version',
  'After breakfast',
  true,
  10
) on conflict (id) do update set published = excluded.published;

insert into public.premium_program_days (program_id, day_number, instruction)
select
  '81000000-0000-4000-8000-000000000001'::uuid,
  day_number,
  format('Complete the configured morning activity for Day %s.', day_number)
from generate_series(1, 14) as day_number
on conflict (program_id, day_number) do nothing;
```

- [ ] **Step 4: Implement the repository**

Create `src/features/premium-programs/program-catalog-repository.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseProgramDefinition, type ProgramDefinition } from '@/domain/premium-programs/program-definition';
import type { Database } from '@/lib/supabase/database.types';

export function createProgramCatalogRepository(client: SupabaseClient<Database>) {
  return {
    async listPublished(): Promise<ProgramDefinition[]> {
      const { data, error } = await client
        .from('premium_programs')
        .select('id, slug, title, category, duration_days, normal_target, minimum_target, cue, premium_program_days(day_number, instruction)')
        .eq('published', true)
        .order('sort_order')
        .order('day_number', { referencedTable: 'premium_program_days' });
      if (error) throw error;

      return data.map((row) => parseProgramDefinition({
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        durationDays: row.duration_days,
        normalTarget: row.normal_target,
        minimumTarget: row.minimum_target,
        cue: row.cue,
        days: row.premium_program_days.map((day) => ({
          dayNumber: day.day_number,
          instruction: day.instruction,
        })),
      }));
    },
  };
}
```

- [ ] **Step 5: Reset and run the test**

```bash
pnpm exec supabase db reset
pnpm vitest run tests/integration/program-catalog-repository.test.ts
```

Expected: PASS with 1 test.

- [ ] **Step 6: Commit**

```bash
git add supabase/seed.sql src/features/premium-programs/program-catalog-repository.ts tests/integration/program-catalog-repository.test.ts
git commit -m "feat: seed and read premium program catalog"
```

---

## Task 7: Implement the Isolated Three-Day Preview Simulation

**Files:**

- Create: `src/domain/premium-programs/preview-simulation.ts`
- Create: `src/features/premium-programs/preview-session-store.ts`
- Create: `src/features/premium-programs/preview-simulation-service.ts`
- Create: `tests/unit/preview-simulation.test.ts`

- [ ] **Step 1: Write failing simulation tests**

Create `tests/unit/preview-simulation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { beginPreview, recordPreviewDecision, recordPreviewOutcome } from '@/domain/premium-programs/preview-simulation';

const definition = {
  id: 'program-1',
  slug: 'program-1',
  title: 'Program 1',
  durationDays: 7 as const,
  category: 'wellbeing',
  normalTarget: '10 minutes',
  minimumTarget: '2 minutes',
  cue: 'After breakfast',
  days: Array.from({ length: 7 }, (_, index) => ({ dayNumber: index + 1, instruction: `Day ${index + 1}` })),
};

describe('Premium preview simulation', () => {
  it('exposes only three simulated days', () => {
    expect(beginPreview(definition).visibleDays).toHaveLength(3);
  });

  it('changes at most one variable after an outcome', () => {
    const state = recordPreviewOutcome(beginPreview(definition), 'skipped');
    expect(state.pendingRecommendation?.variable).toBe('normal_target');
  });

  it('requires a decision before advancing', () => {
    const state = recordPreviewOutcome(beginPreview(definition), 'minimum');
    expect(() => recordPreviewOutcome(state, 'full')).toThrow('Decision required');
  });

  it('records simulated decisions without operational identifiers', () => {
    const state = recordPreviewOutcome(beginPreview(definition), 'skipped');
    const decided = recordPreviewDecision(state, 'keep_current');
    expect(decided.currentDay).toBe(2);
    expect(JSON.stringify(decided)).not.toContain('habitId');
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/unit/preview-simulation.test.ts
```

Expected: FAIL because preview simulation does not exist.

- [ ] **Step 3: Implement the pure simulation**

Create `src/domain/premium-programs/preview-simulation.ts`:

```ts
import type { ProgramDefinition } from './program-definition';
import type { ProgramDecision } from './program-decision';
import type { ProgramAdaptation } from './adaptation-rule';

export type PreviewOutcome = 'full' | 'minimum' | 'skipped';

export type PreviewState = Readonly<{
  programId: string;
  currentDay: 1 | 2 | 3 | 4;
  visibleDays: readonly ProgramDefinition['days'][number][];
  outcomes: readonly PreviewOutcome[];
  decisions: readonly ProgramDecision[];
  pendingRecommendation: ProgramAdaptation | null;
  completed: boolean;
}>;

export function beginPreview(program: ProgramDefinition): PreviewState {
  return {
    programId: program.id,
    currentDay: 1,
    visibleDays: program.days.slice(0, 3),
    outcomes: [],
    decisions: [],
    pendingRecommendation: null,
    completed: false,
  };
}

export function recordPreviewOutcome(state: PreviewState, outcome: PreviewOutcome): PreviewState {
  if (state.pendingRecommendation) throw new Error('Decision required');
  if (state.currentDay > 3) throw new Error('Preview complete');

  const recommendation: ProgramAdaptation = outcome === 'skipped'
    ? { variable: 'normal_target', before: '10 minutes', proposed: '5 minutes', rationaleCode: 'manual_skipped' }
    : outcome === 'minimum'
      ? { variable: 'minimum_target', before: '2 minutes', proposed: '3 minutes', rationaleCode: 'repeated_minimum' }
      : { variable: 'cue', before: 'After breakfast', proposed: 'Keep current cue', rationaleCode: 'friction_time' };

  return { ...state, outcomes: [...state.outcomes, outcome], pendingRecommendation: recommendation };
}

export function recordPreviewDecision(state: PreviewState, decision: ProgramDecision): PreviewState {
  if (!state.pendingRecommendation) throw new Error('No recommendation to decide');
  const nextDay = (state.currentDay + 1) as PreviewState['currentDay'];
  return {
    ...state,
    currentDay: nextDay,
    decisions: [...state.decisions, decision],
    pendingRecommendation: null,
    completed: nextDay === 4,
  };
}
```

Create `src/features/premium-programs/preview-session-store.ts`:

```ts
import type { PreviewState } from '@/domain/premium-programs/preview-simulation';

export interface PreviewSessionStore {
  read(programId: string): PreviewState | null;
  write(state: PreviewState): void;
  clear(programId: string): void;
}

export function createMemoryPreviewSessionStore(): PreviewSessionStore {
  const states = new Map<string, PreviewState>();
  return {
    read: (programId) => states.get(programId) ?? null,
    write: (state) => states.set(state.programId, state),
    clear: (programId) => states.delete(programId),
  };
}
```

Create `src/features/premium-programs/preview-simulation-service.ts`:

```ts
import { beginPreview, recordPreviewDecision, recordPreviewOutcome } from '@/domain/premium-programs/preview-simulation';
import type { ProgramDefinition } from '@/domain/premium-programs/program-definition';
import type { ProgramDecision } from '@/domain/premium-programs/program-decision';
import type { PreviewOutcome } from '@/domain/premium-programs/preview-simulation';
import type { PreviewSessionStore } from './preview-session-store';

export function createPreviewSimulationService(store: PreviewSessionStore) {
  return {
    start(program: ProgramDefinition) {
      const state = beginPreview(program);
      store.write(state);
      return state;
    },
    recordOutcome(programId: string, outcome: PreviewOutcome) {
      const current = store.read(programId);
      if (!current) throw new Error('Preview not started');
      const state = recordPreviewOutcome(current, outcome);
      store.write(state);
      return state;
    },
    decide(programId: string, decision: ProgramDecision) {
      const current = store.read(programId);
      if (!current) throw new Error('Preview not started');
      const state = recordPreviewDecision(current, decision);
      store.write(state);
      return state;
    },
    reset(programId: string) {
      store.clear(programId);
    },
  };
}
```

- [ ] **Step 4: Run the test and verify success**

```bash
pnpm vitest run tests/unit/preview-simulation.test.ts
```

Expected: PASS with 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/premium-programs/preview-simulation.ts src/features/premium-programs/preview-session-store.ts src/features/premium-programs/preview-simulation-service.ts tests/unit/preview-simulation.test.ts
git commit -m "feat: implement isolated premium preview simulation"
```

---

## Task 8: Build the Premium Catalogue and Preview UI

**Files:**

- Create: `src/features/premium-programs/components/premium-program-card.tsx`
- Create: `src/features/premium-programs/components/program-preview.tsx`
- Create: `src/features/premium-programs/components/program-preview-complete.tsx`
- Create: `src/app/(application)/programs/page.tsx`
- Create: `src/app/(application)/programs/[programId]/preview/page.tsx`
- Create: `tests/component/premium-program-card.test.tsx`
- Create: `tests/component/premium-preview.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create `tests/component/premium-program-card.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { PremiumProgramCard } from '@/features/premium-programs/components/premium-program-card';

it('shows Preview for preview-only access and Start Program for Premium', () => {
  const { rerender } = render(
    <PremiumProgramCard programId="p1" title="Gentle Morning" durationDays={14} access="preview" />,
  );
  expect(screen.getByRole('link', { name: /preview gentle morning/i })).toBeVisible();
  expect(screen.getByText(/premium/i)).toBeVisible();

  rerender(<PremiumProgramCard programId="p1" title="Gentle Morning" durationDays={14} access="full" />);
  expect(screen.getByRole('link', { name: /start gentle morning/i })).toBeVisible();
});
```

Create `tests/component/premium-preview.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramPreview } from '@/features/premium-programs/components/program-preview';

it('labels simulation and requires a decision after an outcome', async () => {
  const user = userEvent.setup();
  render(<ProgramPreview programId="p1" title="Gentle Morning" />);

  expect(screen.getByText(/simulation/i)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Minimum' }));
  expect(screen.getByRole('button', { name: /apply/i })).toBeVisible();
  expect(screen.getByRole('button', { name: /customize/i })).toBeVisible();
  expect(screen.getByRole('button', { name: /keep current/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the tests and verify failure**

```bash
pnpm vitest run tests/component/premium-program-card.test.tsx tests/component/premium-preview.test.tsx
```

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement catalogue and preview components**

Create `src/features/premium-programs/components/premium-program-card.tsx`:

```tsx
import Link from 'next/link';
import { Crown } from 'lucide-react';
import type { PremiumProgramAccess } from '@/domain/entitlements/capability';

export function PremiumProgramCard(props: {
  programId: string;
  title: string;
  durationDays: 7 | 14 | 30;
  access: PremiumProgramAccess;
}) {
  const preview = props.access === 'preview';
  const href = preview ? `/app/programs/${props.programId}/preview` : `/app/programs/${props.programId}`;
  const action = preview ? `Preview ${props.title}` : `Start ${props.title}`;

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-amber-700">
        <Crown aria-hidden="true" className="size-5" />
        <span className="text-sm font-semibold">Premium</span>
      </div>
      <h2 className="mt-3 text-lg font-semibold text-neutral-950">{props.title}</h2>
      <p className="mt-1 text-sm text-neutral-700">{props.durationDays}-day adaptive program</p>
      <Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-emerald-500 px-4 font-semibold text-white" href={href}>
        {action}
      </Link>
    </article>
  );
}
```

Create `src/features/premium-programs/components/program-preview.tsx` with a client-side simulation provider that renders the `Simulation` label, Days 1–3, Full/Minimum/Skipped buttons, one recommendation panel, and Apply/Customize/Keep Current actions. The component must call only `preview-simulation-service` and must not import Supabase, habit repositories, session services, or check-in commands.

- [ ] **Step 4: Implement route pages**

Create `src/app/(application)/programs/page.tsx` as a Server Component that resolves current capabilities, reads the published catalogue, and passes only `premiumPrograms` access to each card.

Create `src/app/(application)/programs/[programId]/preview/page.tsx` as a preview-only page that:

```tsx
export const dynamic = 'force-dynamic';

export default async function ProgramPreviewPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  return <ProgramPreview programId={programId} title="Premium Program Preview" />;
}
```

The production implementation must load the program title from the catalogue and return the typed not-found state when the program is unpublished or absent.

- [ ] **Step 5: Run component tests and accessibility smoke test**

```bash
pnpm vitest run tests/component/premium-program-card.test.tsx tests/component/premium-preview.test.tsx
pnpm lint
pnpm typecheck
```

Expected: component tests PASS; lint and typecheck exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/premium-programs/components src/app/'(application)'/programs tests/component/premium-program-card.test.tsx tests/component/premium-preview.test.tsx
git commit -m "feat: add premium catalogue and three-day preview UI"
```

---

## Task 9: Implement Transactional Program Start and Active-Slot Enforcement

**Files:**

- Create: `supabase/migrations/20260729052000_program_commands.sql`
- Create: `supabase/tests/00130_premium_program_commands.test.sql`
- Create: `src/server/premium-programs/program-commands.ts`
- Create: `src/features/premium-programs/start-program-service.ts`
- Create: `tests/integration/start-program-service.test.ts`

- [ ] **Step 1: Write failing database command tests**

Create `supabase/tests/00130_premium_program_commands.test.sql` with assertions that:

```sql
begin;
select plan(6);

select has_function('public', 'start_premium_program', array['uuid', 'uuid', 'uuid', 'date', 'text']);
select function_returns('public', 'start_premium_program', array['uuid', 'uuid', 'uuid', 'date', 'text'], 'jsonb');
select has_function('public', 'decide_program_adaptation', array['uuid', 'uuid', 'text', 'text', 'bigint']);
select function_returns('public', 'decide_program_adaptation', array['uuid', 'uuid', 'text', 'text', 'bigint'], 'jsonb');
select isnt_empty($$ select 1 from pg_proc where proname = 'start_premium_program' and prosecdef = true $$);
select isnt_empty($$ select 1 from pg_proc where proname = 'decide_program_adaptation' and prosecdef = true $$);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the database test and verify failure**

```bash
pnpm exec supabase test db --file supabase/tests/00130_premium_program_commands.test.sql
```

Expected: FAIL because the functions do not exist.

- [ ] **Step 3: Implement the start command**

Create `supabase/migrations/20260729052000_program_commands.sql` with `security definer`, fixed `search_path`, explicit `auth.uid()` ownership, valid Premium entitlement checks, published-program checks, duplicate command replay through `idempotency_records`, and the existing active-slot function from Plan 03.

The command must perform one transaction that:

```sql
-- Required transaction sequence inside public.start_premium_program
-- 1. Verify auth.uid() = p_user_id.
-- 2. Return the stored response for a matching idempotency key.
-- 3. Verify a valid trial_active, active, or grace_period Premium entitlement.
-- 4. Lock the user's active habits and enforce the Premium limit of 20.
-- 5. Read the published program and Day 1 configuration.
-- 6. Create one habit and immutable version.
-- 7. Create one program_enrollment linked to the habit.
-- 8. Generate the first deterministic session window.
-- 9. Store and return the idempotent JSON response.
```

The response shape is:

```json
{
  "habitId": "uuid",
  "habitVersionId": "uuid",
  "enrollmentId": "uuid",
  "status": "active",
  "revision": 1
}
```

- [ ] **Step 4: Implement the TypeScript service**

Create `src/features/premium-programs/start-program-service.ts`:

```ts
import { z } from 'zod';
import type { CapabilitySet } from '@/domain/entitlements/capability';

const responseSchema = z.object({
  habitId: z.string().uuid(),
  habitVersionId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  status: z.literal('active'),
  revision: z.number().int().positive(),
});

export function createStartProgramService(deps: {
  capabilities: () => Promise<CapabilitySet>;
  execute: (input: { programId: string; startDate: string; timezone: string; commandId: string }) => Promise<unknown>;
}) {
  return {
    async start(input: { programId: string; startDate: string; timezone: string; commandId: string }) {
      const capabilities = await deps.capabilities();
      if (!capabilities.canStartPremiumProgram) throw new Error('Premium capability required');
      return responseSchema.parse(await deps.execute(input));
    },
  };
}
```

- [ ] **Step 5: Add integration tests**

Create `tests/integration/start-program-service.test.ts` to verify:

```ts
it('does not call the command when capability is locked', async () => {
  const execute = vi.fn();
  const service = createStartProgramService({
    capabilities: async () => ({
      premiumPrograms: 'preview', advancedInsights: false,
      adaptiveReminderAnalysis: false, enhancedRecoveryGuidance: false,
      canStartPremiumProgram: false, canReadHistoricalPremiumData: false,
      activeHabitLimit: 5,
    }),
    execute,
  });
  await expect(service.start({ programId: crypto.randomUUID(), startDate: '2026-07-30', timezone: 'Asia/Jakarta', commandId: crypto.randomUUID() }))
    .rejects.toThrow('Premium capability required');
  expect(execute).not.toHaveBeenCalled();
});
```

Also verify duplicate command IDs return the original enrollment and do not create a second habit.

- [ ] **Step 6: Run focused tests**

```bash
pnpm exec supabase db reset
pnpm exec supabase test db --file supabase/tests/00130_premium_program_commands.test.sql
pnpm vitest run tests/integration/start-program-service.test.ts
```

Expected: database and integration tests PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260729052000_program_commands.sql supabase/tests/00130_premium_program_commands.test.sql src/server/premium-programs src/features/premium-programs/start-program-service.ts tests/integration/start-program-service.test.ts
git commit -m "feat: start premium programs transactionally"
```

---

## Task 10: Implement Real Program Adaptation and Decision Commands

**Files:**

- Create: `src/features/premium-programs/program-adaptation-service.ts`
- Create: `tests/integration/program-adaptation-service.test.ts`
- Modify: `supabase/migrations/20260729052000_program_commands.sql`

- [ ] **Step 1: Write failing adaptation-service tests**

Create `tests/integration/program-adaptation-service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createProgramAdaptationService } from '@/features/premium-programs/program-adaptation-service';

describe('program adaptation service', () => {
  it('creates one-variable proposals and never applies them automatically', async () => {
    const saveRecommendation = vi.fn().mockResolvedValue({ id: 'recommendation-1' });
    const service = createProgramAdaptationService({ saveRecommendation });

    const result = await service.propose({
      enrollmentId: 'enrollment-1',
      current: { normalTarget: '10 minutes', minimumTarget: '2 minutes', cue: 'After breakfast' },
      outcomes: ['skipped', 'minimum', 'skipped'],
      dominantFriction: 'time',
    });

    expect(result.variable).toBe('normal_target');
    expect(saveRecommendation).toHaveBeenCalledOnce();
    expect(saveRecommendation).not.toHaveBeenCalledWith(expect.objectContaining({ decision: 'apply' }));
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/integration/program-adaptation-service.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement deterministic proposal logic**

Create `src/features/premium-programs/program-adaptation-service.ts`:

```ts
import type { PreviewOutcome } from '@/domain/premium-programs/preview-simulation';
import type { ProgramAdaptation } from '@/domain/premium-programs/adaptation-rule';

export function createProgramAdaptationService(deps: {
  saveRecommendation: (proposal: ProgramAdaptation & { enrollmentId: string }) => Promise<{ id: string }>;
}) {
  return {
    async propose(input: {
      enrollmentId: string;
      current: { normalTarget: string; minimumTarget: string; cue: string };
      outcomes: readonly PreviewOutcome[];
      dominantFriction: 'time' | 'energy' | 'forgot' | 'environment' | 'other' | null;
    }) {
      const skipped = input.outcomes.filter((outcome) => outcome === 'skipped').length;
      const proposal: ProgramAdaptation = skipped >= 2 || input.dominantFriction === 'time'
        ? {
            variable: 'normal_target',
            before: input.current.normalTarget,
            proposed: 'Reduce the Normal target by one supported step',
            rationaleCode: 'friction_time',
          }
        : {
            variable: 'minimum_target',
            before: input.current.minimumTarget,
            proposed: 'Keep the Minimum version easier to start',
            rationaleCode: 'repeated_minimum',
          };

      await deps.saveRecommendation({ ...proposal, enrollmentId: input.enrollmentId });
      return proposal;
    },
  };
}
```

- [ ] **Step 4: Complete the decision database function**

In `decide_program_adaptation`, require:

```sql
-- Validate owner, entitlement, enrollment revision, recommendation state,
-- decision in apply/customize/keep_current, and exactly one adaptation variable.
-- For apply/customize: create a new immutable habit_version and point future
-- sessions to the new version. Never rewrite historical sessions.
-- For keep_current: close the recommendation without a version change.
-- Insert program_adaptation_decisions and increment enrollment revision.
```

Return the new `enrollmentRevision`, `habitVersionId`, and `decision` as JSON.

- [ ] **Step 5: Run focused tests**

```bash
pnpm vitest run tests/integration/program-adaptation-service.test.ts
pnpm exec supabase test db --file supabase/tests/00130_premium_program_commands.test.sql
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/premium-programs/program-adaptation-service.ts tests/integration/program-adaptation-service.test.ts supabase/migrations/20260729052000_program_commands.sql
git commit -m "feat: add approval-based premium program adaptations"
```

---

## Task 11: Add Enhanced Recovery Guidance and Adaptive Reminder Analysis

**Files:**

- Create: `src/domain/insights/reminder-analysis.ts`
- Create: `src/features/reminders/adaptive-reminder-analysis.ts`
- Create: `src/features/reminders/reminder-reduction-trial.ts`
- Create: `tests/unit/reminder-analysis.test.ts`

- [ ] **Step 1: Write failing reminder-analysis tests**

Create `tests/unit/reminder-analysis.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { analyzeReminderTiming, evaluateReminderReductionTrial } from '@/domain/insights/reminder-analysis';

describe('adaptive reminder analysis', () => {
  it('suggests a time only with sufficient successful observations', () => {
    const result = analyzeReminderTiming([
      { localMinute: 480, outcome: 'full' },
      { localMinute: 485, outcome: 'minimum' },
      { localMinute: 490, outcome: 'full' },
      { localMinute: 500, outcome: 'full' },
      { localMinute: 495, outcome: 'minimum' },
    ]);
    expect(result).toMatchObject({ kind: 'suggestion', requiresDecision: true });
  });

  it('returns insufficient data for sparse observations', () => {
    expect(analyzeReminderTiming([{ localMinute: 480, outcome: 'full' }])).toEqual({ kind: 'insufficient_data' });
  });

  it('recommends restore after a twenty-point drop', () => {
    expect(evaluateReminderReductionTrial({ beforeSuccessful: 5, beforeEligible: 5, afterSuccessful: 3, afterEligible: 5, afterSkipped: 2 }))
      .toEqual({ action: 'suggest_restore' });
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/unit/reminder-analysis.test.ts
```

Expected: FAIL because reminder analysis does not exist.

- [ ] **Step 3: Implement deterministic analysis**

Create `src/domain/insights/reminder-analysis.ts`:

```ts
type Observation = Readonly<{ localMinute: number; outcome: 'full' | 'minimum' | 'skipped' }>;

export function analyzeReminderTiming(observations: readonly Observation[]) {
  const successful = observations.filter((item) => item.outcome === 'full' || item.outcome === 'minimum');
  if (successful.length < 5) return { kind: 'insufficient_data' } as const;
  const sorted = successful.map((item) => item.localMinute).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return { kind: 'suggestion', suggestedLocalMinute: median, requiresDecision: true } as const;
}

export function evaluateReminderReductionTrial(input: {
  beforeSuccessful: number;
  beforeEligible: number;
  afterSuccessful: number;
  afterEligible: number;
  afterSkipped: number;
}) {
  if (input.beforeEligible !== 5 || input.afterEligible !== 5) return { action: 'continue_collecting' } as const;
  const before = input.beforeSuccessful / input.beforeEligible;
  const after = input.afterSuccessful / input.afterEligible;
  return before - after >= 0.2 || input.afterSkipped >= 2
    ? { action: 'suggest_restore' } as const
    : { action: 'keep_reduced' } as const;
}
```

Create `src/features/reminders/adaptive-reminder-analysis.ts` as an account-only application service that checks `adaptiveReminderAnalysis`, excludes Excused, Pause, unscheduled, redesign, and Recovery windows, and writes one recommendation requiring Apply/Customize/Keep Current.

Create `src/features/reminders/reminder-reduction-trial.ts` to open a trial only for Stable habits, compare exactly five eligible sessions before and five after, and cancel the trial on redesign or Recovery.

- [ ] **Step 4: Integrate enhanced Recovery guidance**

Extend the existing Recovery recommendation presenter so that:

```ts
export type RecoveryGuidanceLevel = 'basic' | 'enhanced';

export function recoveryGuidanceLevel(capabilities: { enhancedRecoveryGuidance: boolean }): RecoveryGuidanceLevel {
  return capabilities.enhancedRecoveryGuidance ? 'enhanced' : 'basic';
}
```

Enhanced guidance may show deeper pattern summaries and program-compatible options, but must retain the same Recovery trigger, three-session default, user decision contract, and Needs Review rules from Plan 06.

- [ ] **Step 5: Run focused tests**

```bash
pnpm vitest run tests/unit/reminder-analysis.test.ts
pnpm test:premium
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/insights/reminder-analysis.ts src/features/reminders src/features/recovery tests/unit/reminder-analysis.test.ts
git commit -m "feat: add premium reminder analysis and enhanced recovery guidance"
```

---

## Task 12: Define Insight Ranges, Metrics, and Confidence Rules

**Files:**

- Create: `src/domain/insights/insight-range.ts`
- Create: `src/domain/insights/insight-metrics.ts`
- Create: `src/domain/insights/friction-confidence.ts`
- Create: `tests/unit/insight-metrics.test.ts`
- Create: `tests/unit/friction-confidence.test.ts`

- [ ] **Step 1: Write failing metric tests**

Create `tests/unit/insight-metrics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateInsightMetrics } from '@/domain/insights/insight-metrics';

it('counts Full and Minimum as successful and excludes ineligible sessions', () => {
  expect(calculateInsightMetrics([
    { outcome: 'full', eligible: true },
    { outcome: 'minimum', eligible: true },
    { outcome: 'skipped', eligible: true },
    { outcome: 'excused', eligible: false },
    { outcome: 'unrecorded', eligible: false },
  ])).toEqual({
    eligible: 3,
    successful: 2,
    consistencyRate: 2 / 3,
    full: 1,
    minimum: 1,
    skipped: 1,
  });
});
```

Create `tests/unit/friction-confidence.test.ts`:

```ts
import { expect, it } from 'vitest';
import { summarizeFriction } from '@/domain/insights/friction-confidence';

it('withholds a friction pattern below the sample threshold', () => {
  expect(summarizeFriction(['time', 'energy'])).toEqual({ kind: 'insufficient_data', sampleSize: 2 });
});

it('returns category counts without free text', () => {
  expect(summarizeFriction(['time', 'time', 'energy', 'time', 'environment'])).toEqual({
    kind: 'distribution',
    sampleSize: 5,
    counts: { time: 3, energy: 1, environment: 1 },
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

```bash
pnpm vitest run tests/unit/insight-metrics.test.ts tests/unit/friction-confidence.test.ts
```

Expected: FAIL because the insight domain does not exist.

- [ ] **Step 3: Implement ranges and metrics**

Create `src/domain/insights/insight-range.ts`:

```ts
import { z } from 'zod';

export const insightRangeSchema = z.enum(['7d', '28d', '90d', 'lifetime']);
export type InsightRange = z.infer<typeof insightRangeSchema>;
```

Create `src/domain/insights/insight-metrics.ts`:

```ts
type Session = Readonly<{
  outcome: 'full' | 'minimum' | 'skipped' | 'excused' | 'unrecorded';
  eligible: boolean;
}>;

export function calculateInsightMetrics(sessions: readonly Session[]) {
  const eligibleSessions = sessions.filter((session) => session.eligible);
  const full = eligibleSessions.filter((session) => session.outcome === 'full').length;
  const minimum = eligibleSessions.filter((session) => session.outcome === 'minimum').length;
  const skipped = eligibleSessions.filter((session) => session.outcome === 'skipped').length;
  const successful = full + minimum;
  return {
    eligible: eligibleSessions.length,
    successful,
    consistencyRate: eligibleSessions.length === 0 ? 0 : successful / eligibleSessions.length,
    full,
    minimum,
    skipped,
  };
}
```

Create `src/domain/insights/friction-confidence.ts`:

```ts
export type FrictionCategory = 'time' | 'energy' | 'forgot' | 'environment' | 'other';

export function summarizeFriction(categories: readonly FrictionCategory[]) {
  if (categories.length < 5) return { kind: 'insufficient_data', sampleSize: categories.length } as const;
  const counts = categories.reduce<Partial<Record<FrictionCategory, number>>>((result, category) => {
    result[category] = (result[category] ?? 0) + 1;
    return result;
  }, {});
  return { kind: 'distribution', sampleSize: categories.length, counts } as const;
}
```

- [ ] **Step 4: Run tests and verify success**

```bash
pnpm vitest run tests/unit/insight-metrics.test.ts tests/unit/friction-confidence.test.ts
```

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/insights tests/unit/insight-metrics.test.ts tests/unit/friction-confidence.test.ts
git commit -m "feat: define privacy-safe insight metrics"
```

---

## Task 13: Create Privacy-Safe PostgreSQL Insight Functions

**Files:**

- Create: `supabase/migrations/20260729053000_insight_functions.sql`
- Create: `supabase/tests/00140_insight_functions.test.sql`

- [ ] **Step 1: Write failing pgTAP tests**

Create `supabase/tests/00140_insight_functions.test.sql`:

```sql
begin;
select plan(8);

select has_function('public', 'read_account_insights', array['uuid', 'date', 'date']);
select function_returns('public', 'read_account_insights', array['uuid', 'date', 'date'], 'jsonb');
select has_function('public', 'read_habit_insights', array['uuid', 'uuid', 'date', 'date']);
select function_returns('public', 'read_habit_insights', array['uuid', 'uuid', 'date', 'date'], 'jsonb');
select isnt_empty($$ select 1 from pg_proc where proname = 'read_account_insights' and prosecdef = false $$);
select isnt_empty($$ select 1 from pg_proc where proname = 'read_habit_insights' and prosecdef = false $$);
select ok(position('note' in pg_get_functiondef('public.read_account_insights(uuid,date,date)'::regprocedure)) = 0, 'account insights do not select notes');
select ok(position('free_text' in pg_get_functiondef('public.read_habit_insights(uuid,uuid,date,date)'::regprocedure)) = 0, 'habit insights do not select free text');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm exec supabase test db --file supabase/tests/00140_insight_functions.test.sql
```

Expected: FAIL because the functions do not exist.

- [ ] **Step 3: Implement account and habit aggregate functions**

Create `supabase/migrations/20260729053000_insight_functions.sql` with `security invoker` functions that return JSON containing:

```json
{
  "range": { "from": "date", "to": "date" },
  "eligible": 0,
  "successful": 0,
  "consistencyRate": 0,
  "currentContinuity": 0,
  "outcomes": { "full": 0, "minimum": 0, "manualSkipped": 0, "automaticSkipped": 0 },
  "friction": { "sampleSize": 0, "counts": {} },
  "lifecycleHistory": [],
  "recoveryHistory": [],
  "recommendationDecisions": [],
  "versionBoundaries": []
}
```

Implementation rules:

```sql
-- Count only eligible scheduled sessions in the consistency denominator.
-- Count Full and Minimum as successful.
-- Keep Manual Skipped and Automatic Skipped distinguishable.
-- Exclude Excused, Pause, unscheduled, and pending Unrecorded from eligible totals.
-- Return friction category codes only; never return note or free-text columns.
-- Restrict rows through auth.uid(), ownership joins, and existing RLS.
-- Return current-version and lifetime summaries separately for habit insights.
```

- [ ] **Step 4: Add reference-fixture assertions**

Extend `00140_insight_functions.test.sql` with a deterministic user fixture containing Full, Minimum, Manual Skipped, Automatic Skipped, Excused, two habit versions, one Recovery Plan, and three recommendation decisions. Assert exact eligible counts, consistency, continuity, version boundaries, and category-only friction output.

- [ ] **Step 5: Reset and run database tests**

```bash
pnpm exec supabase db reset
pnpm exec supabase test db --file supabase/tests/00140_insight_functions.test.sql
```

Expected: all assertions PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260729053000_insight_functions.sql supabase/tests/00140_insight_functions.test.sql
git commit -m "feat: add privacy-safe insight aggregate functions"
```

---

## Task 14: Implement Insights Repository and URL-Owned Filters

**Files:**

- Create: `src/features/insights/insights-query.ts`
- Create: `src/features/insights/insights-repository.ts`
- Create: `src/server/insights/read-insights.ts`
- Create: `tests/integration/insights-repository.test.ts`

- [ ] **Step 1: Write failing repository tests**

Create `tests/integration/insights-repository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseInsightsQuery } from '@/features/insights/insights-query';

it('parses supported URL-owned filters and rejects unknown ranges', () => {
  expect(parseInsightsQuery(new URLSearchParams('range=28d&habit=all'))).toEqual({ range: '28d', habitId: null });
  expect(() => parseInsightsQuery(new URLSearchParams('range=13d'))).toThrow();
});

it('does not accept entitlement state from the URL', () => {
  const parsed = parseInsightsQuery(new URLSearchParams('range=7d&premium=true'));
  expect(parsed).not.toHaveProperty('premium');
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/integration/insights-repository.test.ts
```

Expected: FAIL because query and repository modules do not exist.

- [ ] **Step 3: Implement query parsing**

Create `src/features/insights/insights-query.ts`:

```ts
import { z } from 'zod';
import { insightRangeSchema } from '@/domain/insights/insight-range';

const uuidOrAll = z.union([z.literal('all'), z.string().uuid()]);

export function parseInsightsQuery(params: URLSearchParams) {
  const range = insightRangeSchema.parse(params.get('range') ?? '28d');
  const habit = uuidOrAll.parse(params.get('habit') ?? 'all');
  return { range, habitId: habit === 'all' ? null : habit } as const;
}
```

- [ ] **Step 4: Implement server reader and repository**

Create `src/server/insights/read-insights.ts` with account ownership checks and separate methods for Guest local aggregates, Free basic cloud aggregates, and Premium advanced aggregates. The server decides which fields are returned from the capability set; the client cannot request advanced fields through a parameter.

Create `src/features/insights/insights-repository.ts` with this interface:

```ts
export interface InsightsRepository {
  readAggregate(input: { range: '7d' | '28d' | '90d' | 'lifetime' }): Promise<AccountInsights>;
  readHabit(input: { habitId: string; range: '7d' | '28d' | '90d' | 'lifetime' }): Promise<HabitInsights>;
}
```

Define `AccountInsights` and `HabitInsights` from Zod schemas that reject unexpected free-text fields.

- [ ] **Step 5: Run the repository tests**

```bash
pnpm vitest run tests/integration/insights-repository.test.ts
pnpm typecheck
```

Expected: tests PASS and typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/insights src/server/insights tests/integration/insights-repository.test.ts
git commit -m "feat: add typed insights repository and URL filters"
```

---

## Task 15: Add Dexie Version 7 for Safe Program and Insight Caches

**Files:**

- Create: `src/lib/indexed-db/premium-insights-migrations.ts`
- Modify: `src/lib/indexed-db/database.ts`
- Create: `tests/indexed-db/premium-insights-migration.test.ts`

- [ ] **Step 1: Write a failing migration test**

Create `tests/indexed-db/premium-insights-migration.test.ts`:

```ts
import { expect, it } from 'vitest';
import { openDatabaseAtVersion } from './helpers/open-database-at-version';

it('upgrades version 6 data to version 7 without changing Guest habits', async () => {
  const database = await openDatabaseAtVersion(6, {
    guestHabits: [{ id: 'habit-1', name: 'Walk' }],
  });
  await database.openLatest();

  expect(await database.guestHabits.get('habit-1')).toMatchObject({ name: 'Walk' });
  expect(database.verno).toBe(7);
  expect(database.tables.map((table) => table.name)).toEqual(expect.arrayContaining([
    'programCatalogCache',
    'insightSnapshotCache',
  ]));
});
```

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run tests/indexed-db/premium-insights-migration.test.ts
```

Expected: FAIL because schema version 7 does not exist.

- [ ] **Step 3: Implement schema version 7**

Create `src/lib/indexed-db/premium-insights-migrations.ts`:

```ts
export const premiumInsightsVersion7Stores = {
  programCatalogCache: '&programId, publishedAt, expiresAt',
  insightSnapshotCache: '&cacheKey, ownerId, range, generatedAt, expiresAt',
} as const;
```

Extend the Dexie database with version 7. Cache records must include an owner context and expiry. Never store authoritative entitlement grants in IndexedDB. A cached Premium screen may render stale historical content with a clear state, but Premium actions remain blocked until the server capability check resolves.

- [ ] **Step 4: Run migration tests**

```bash
pnpm vitest run tests/indexed-db/premium-insights-migration.test.ts tests/indexed-db
```

Expected: all IndexedDB migration tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/indexed-db tests/indexed-db/premium-insights-migration.test.ts
git commit -m "feat: add safe premium and insights caches"
```

---

## Task 16: Build Accessible Insight Chart Primitives

**Files:**

- Create: `src/features/insights/components/insight-chart-panel.tsx`
- Create: `src/features/insights/components/outcome-distribution-chart.tsx`
- Create: `src/features/insights/components/continuity-chart.tsx`
- Create: `src/features/insights/components/friction-distribution.tsx`
- Create: `src/features/insights/components/insight-data-table.tsx`
- Create: `tests/component/insight-chart-panel.test.tsx`
- Create: `tests/accessibility/insights-accessibility.test.tsx`

- [ ] **Step 1: Write failing chart and accessibility tests**

Create `tests/component/insight-chart-panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { InsightChartPanel } from '@/features/insights/components/insight-chart-panel';

it('renders a textual summary and table alternative with the chart', () => {
  render(
    <InsightChartPanel
      title="Outcome distribution"
      summary="8 of 10 eligible sessions were successful."
      rows={[
        { label: 'Full', value: 5 },
        { label: 'Minimum', value: 3 },
        { label: 'Skipped', value: 2 },
      ]}
    />,
  );
  expect(screen.getByText('8 of 10 eligible sessions were successful.')).toBeVisible();
  expect(screen.getByRole('table', { name: 'Outcome distribution data' })).toBeVisible();
});
```

Create `tests/accessibility/insights-accessibility.test.tsx` using `axe` to verify no serious violations, direct labels, keyboard-reachable range controls, and no color-only legend.

- [ ] **Step 2: Run tests and verify failure**

```bash
pnpm vitest run tests/component/insight-chart-panel.test.tsx tests/accessibility/insights-accessibility.test.tsx
```

Expected: FAIL because chart primitives do not exist.

- [ ] **Step 3: Implement the shared chart panel**

Create `src/features/insights/components/insight-chart-panel.tsx`:

```tsx
import type { ReactNode } from 'react';
import { InsightDataTable } from './insight-data-table';

export function InsightChartPanel(props: {
  title: string;
  summary: string;
  rows: readonly { label: string; value: number | string }[];
  children?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5" aria-labelledby={`${props.title}-heading`}>
      <h2 id={`${props.title}-heading`} className="text-lg font-semibold text-neutral-950">{props.title}</h2>
      <p className="mt-1 text-sm text-neutral-700">{props.summary}</p>
      {props.children ? <div className="mt-4" aria-hidden="true">{props.children}</div> : null}
      <div className="mt-4">
        <InsightDataTable caption={`${props.title} data`} rows={props.rows} />
      </div>
    </section>
  );
}
```

Implement chart-specific components with emerald as the primary series and blue, purple, amber, and cyan as secondary series. Use direct labels or markers in addition to color. Respect reduced motion and avoid animated chart transitions when the user requests reduced motion.

- [ ] **Step 4: Run component and accessibility tests**

```bash
pnpm vitest run tests/component/insight-chart-panel.test.tsx tests/accessibility/insights-accessibility.test.tsx
```

Expected: PASS with zero serious accessibility violations.

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/components tests/component/insight-chart-panel.test.tsx tests/accessibility/insights-accessibility.test.tsx
git commit -m "feat: add accessible insight chart primitives"
```

---

## Task 17: Implement Aggregate and Habit-Level Insights Pages

**Files:**

- Create: `src/app/(application)/insights/page.tsx`
- Create: `src/app/(application)/insights/loading.tsx`
- Create: `src/app/(application)/insights/error.tsx`
- Create: `src/app/(application)/insights/habits/[habitId]/page.tsx`
- Create: `src/features/insights/components/insight-range-filter.tsx`
- Create: `src/features/insights/components/insights-empty-state.tsx`

- [ ] **Step 1: Implement the range filter with URL ownership**

Create `insight-range-filter.tsx` so each option updates `range` through `router.replace` while preserving valid `habit` state. Supported values are `7d`, `28d`, `90d`, and `lifetime`; the default is `28d`.

The control must expose a visible label, selected state, keyboard navigation, and a non-color-only active indicator.

- [ ] **Step 2: Implement aggregate Insights**

Create the aggregate page as a Server Component that:

```ts
// 1. Resolves identity and authoritative capabilities.
// 2. Parses URL filters.
// 3. Reads Guest browser aggregates through the client boundary or account aggregates through the server repository.
// 4. Returns basic metrics for Guest and Free.
// 5. Adds advanced friction, lifecycle, Recovery, recommendation-decision, and adaptive-reminder sections only when capabilities allow.
// 6. Provides Preview/Upgrade surfaces without exposing advanced result payloads to locked users.
```

Render:

- consistency;
- successful sessions;
- Full/Minimum/Skipped distribution;
- current continuity;
- habit selector;
- locked advanced-insights preview for Guest and Free;
- no-completed-sessions empty state;
- Guest-history-unavailable state;
- loading, error, offline cached, and stale-data states.

- [ ] **Step 3: Implement habit-level Insights**

The habit page must render:

- current-version consistency;
- lifetime consistency;
- current continuity;
- outcome distribution;
- friction categories when sample size is sufficient;
- Recovery history;
- lifecycle history;
- recommendation decisions;
- version boundaries linked to version detail;
- Stable or Stable — target review suggested explanation;
- a clear distinction between current-version and lifetime metrics.

- [ ] **Step 4: Add loading and safe error boundaries**

`loading.tsx` must preserve final card dimensions with skeletons. `error.tsx` must retain the application shell, provide Retry, and avoid logging habit names or user notes to the browser console.

- [ ] **Step 5: Run focused checks**

```bash
pnpm test:insights
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(application)'/insights src/features/insights/components
git commit -m "feat: implement aggregate and habit insights pages"
```

---

## Task 18: Enforce Premium RLS and Expiry/Downgrade States

**Files:**

- Create: `supabase/migrations/20260729054000_premium_program_rls.sql`
- Create: `supabase/tests/00150_premium_program_rls.test.sql`
- Create: `src/features/entitlements/capability-provider.tsx`
- Create: `src/features/entitlements/components/entitlement-state.tsx`
- Create: `tests/component/entitlement-state.test.tsx`
- Create: `tests/integration/premium-expiry.test.ts`

- [ ] **Step 1: Write failing RLS and presentation tests**

The pgTAP suite must verify:

```sql
-- Published catalog rows are readable without exposing unpublished programs.
-- Program enrollments and decisions are readable only by their owner.
-- Cross-user inserts, updates, and reads are denied.
-- Users cannot insert enrollment rows directly to bypass start_premium_program.
-- Service-role maintenance remains separate from browser access.
```

Create `tests/component/entitlement-state.test.tsx` to verify locked, active, expired, and downgrade states use icon, heading, explanation, and action rather than color alone.

- [ ] **Step 2: Run tests and verify failure**

```bash
pnpm exec supabase test db --file supabase/tests/00150_premium_program_rls.test.sql
pnpm vitest run tests/component/entitlement-state.test.tsx tests/integration/premium-expiry.test.ts
```

Expected: FAIL because policies and presentation components do not exist.

- [ ] **Step 3: Add RLS policies**

Create `20260729054000_premium_program_rls.sql`:

```sql
alter table public.premium_programs enable row level security;
alter table public.premium_program_days enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.program_adaptation_decisions enable row level security;

create policy premium_programs_read_published
on public.premium_programs for select
using (published = true);

create policy premium_program_days_read_published
on public.premium_program_days for select
using (exists (
  select 1 from public.premium_programs p
  where p.id = premium_program_days.program_id and p.published = true
));

create policy program_enrollments_owner_read
on public.program_enrollments for select
using (user_id = auth.uid());

create policy program_adaptation_decisions_owner_read
on public.program_adaptation_decisions for select
using (user_id = auth.uid());
```

Do not add browser INSERT or UPDATE policies for enrollment and decision tables; mutations use validated functions.

- [ ] **Step 4: Implement entitlement states**

The component must support:

```ts
export type EntitlementPresentationState =
  | 'preview'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'downgrade_decision_required';
```

Rules:

- Preview offers `Preview` and `View Plans` without implying active access.
- Active enables authorized program actions.
- Expired blocks new adaptations, preserves historical views, and offers `View Plans` or `Refresh Status` in Plan 09-compatible form.
- Downgrade never deletes data; over-limit habits and adaptive programs enter the decision path defined by the PRD.
- A real enrollment losing entitlement becomes `ended_entitlement_expired` or `decision_required` according to whether user action is needed.

- [ ] **Step 5: Run RLS and expiry tests**

```bash
pnpm exec supabase db reset
pnpm exec supabase test db --file supabase/tests/00150_premium_program_rls.test.sql
pnpm vitest run tests/component/entitlement-state.test.tsx tests/integration/premium-expiry.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260729054000_premium_program_rls.sql supabase/tests/00150_premium_program_rls.test.sql src/features/entitlements tests/component/entitlement-state.test.tsx tests/integration/premium-expiry.test.ts
git commit -m "feat: enforce premium program authorization and expiry states"
```

---

## Task 19: Add End-to-End Coverage and Complete the Plan 08 Quality Gate

**Files:**

- Create: `tests/e2e/premium-preview.spec.ts`
- Create: `tests/e2e/premium-program.spec.ts`
- Create: `tests/e2e/insights.spec.ts`
- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [ ] **Step 1: Add Premium preview E2E coverage**

Create `tests/e2e/premium-preview.spec.ts` covering:

```ts
test('Guest completes the three-day simulation without creating real data', async ({ page }) => {
  await page.goto('/app/programs');
  await page.getByRole('link', { name: /preview gentle morning reset/i }).click();
  await expect(page.getByText(/simulation/i)).toBeVisible();

  for (const outcome of ['Minimum', 'Skipped', 'Full']) {
    await page.getByRole('button', { name: outcome }).click();
    await page.getByRole('button', { name: /keep current/i }).click();
  }

  await expect(page.getByRole('link', { name: /view plans/i })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => indexedDB.databases())).not.toContainEqual(
    expect.objectContaining({ name: 'premium-operational-data' }),
  );
});
```

Also assert Days 4–7 remain locked and direct navigation to a real enrollment page does not grant access.

- [ ] **Step 2: Add Premium account E2E coverage**

Create `tests/e2e/premium-program.spec.ts` covering:

- active Premium user starts one published program;
- one active slot is consumed;
- repeated command submission creates one enrollment;
- one-variable adaptation requires Apply/Customize/Keep Current;
- expired entitlement blocks new actions but preserves history;
- cross-user enrollment URL returns not found or forbidden without leaking existence.

- [ ] **Step 3: Add Insights E2E coverage**

Create `tests/e2e/insights.spec.ts` covering:

- default `28d` range;
- range state survives refresh and Back/Forward navigation;
- Full and Minimum count as successful;
- current-version and lifetime metrics differ after redesign;
- charts have accessible table alternatives;
- Guest empty and missing-history states;
- locked advanced preview contains no advanced result data;
- mobile 390px and desktop 1440px layouts avoid clipping;
- reduced-motion mode does not animate chart transitions.

- [ ] **Step 4: Run the complete Plan 08 verification suite**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:premium
pnpm test:insights
pnpm test
pnpm test:integration
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm test:e2e:premium
pnpm test:e2e:insights
pnpm build
pnpm audit --prod
```

Expected:

- formatting exits 0;
- lint reports 0 errors;
- TypeScript reports 0 errors;
- all unit, component, integration, accessibility, database, and E2E tests pass;
- database reset applies every migration in order;
- production build exits 0;
- production dependency audit has no unresolved high or critical vulnerability.

- [ ] **Step 5: Perform manual responsive and accessibility verification**

Verify at 390px, 768px, 1024px, and 1440px:

- catalogue, preview, program detail, aggregate Insights, and habit Insights;
- keyboard-only navigation and visible focus;
- screen-reader names for charts, filters, locks, and decision controls;
- 200% zoom without lost actions or horizontal page scrolling;
- status communication through icon, label, and explanatory text;
- preview, locked, active, expired, offline cached, and error states;
- no punitive streak, diagnostic, or shame-oriented language.

- [ ] **Step 6: Update the master implementation status**

In `docs/implementation/IMPLEMENTATION-PLAN.md`, mark Plan 08 complete only after every command above has fresh passing evidence. Record:

```text
Plan 08 result: PASS
Migrations applied: 5
Focused suites: premium, insights, RLS, E2E
Premium authorization: server-authoritative
Preview persistence: isolated and non-operational
Insights accessibility: chart plus table/summary
Next plan: 09-web-billing-entitlements.md
```

- [ ] **Step 7: Commit the verified plan boundary**

```bash
git add tests/e2e docs/implementation/IMPLEMENTATION-PLAN.md
git commit -m "test: verify premium programs and insights"
```

---

# 4. Plan 08 Completion Checklist

Plan 08 is complete only when all statements below have current evidence:

- [ ] Free and Lite users can browse every published Premium program and see a truthful Preview action.
- [ ] The preview exposes description, benefits, Days 1–3, simulated outcomes, and simulated decisions.
- [ ] Days after Day 3 remain locked in preview.
- [ ] Preview activity does not create real habits, sessions, check-ins, reminders, active-slot usage, or operational analytics.
- [ ] Browser state cannot authorize Premium capabilities.
- [ ] Direct URL access cannot bypass entitlement checks.
- [ ] A valid Premium entitlement grants the correct capability set.
- [ ] Starting a real program is transactional, idempotent, owner-scoped, and active-limit-aware.
- [ ] Real program adaptations change at most one variable and require user approval.
- [ ] Enhanced Recovery guidance preserves all Plan 06 triggers and decisions.
- [ ] Adaptive reminder analysis requires Premium and never applies a change automatically.
- [ ] Reminder reduction trials compare five eligible sessions before and five after.
- [ ] A twenty-percentage-point decline or two Skipped sessions suggests restoration.
- [ ] Aggregate and habit Insights calculate consistency according to the PRD.
- [ ] Current-version and lifetime metrics remain distinct.
- [ ] Minimum-heavy Stable behavior is not framed as inferior.
- [ ] Friction charts use category codes only and withhold low-sample conclusions.
- [ ] Insight URL filters survive refresh and browser navigation.
- [ ] Every chart has an accessible summary or table equivalent.
- [ ] Free and Lite locked screens do not receive hidden advanced result payloads.
- [ ] Expired or revoked Premium access blocks new actions without deleting history.
- [ ] RLS denies cross-user program and insight access.
- [ ] Dexie version 7 preserves all version 6 Guest and account data.
- [ ] Standard formatting, lint, typecheck, test, database, E2E, build, and audit gates pass.

---

# 5. Handoff to Plan 09

Plan 09 may begin only after Plan 08 is verified. The next detailed plan is:

```text
docs/implementation/09-web-billing-entitlements.md
```

Plan 09 will add:

- monthly and annual plan configuration;
- explicit plan selection with no default choice;
- 14-day trial confirmation and disclosures;
- provider-neutral checkout orchestration;
- verified payment webhooks;
- idempotent entitlement reconciliation;
- processing, success, failure, past-due, cancellation, refund, and Refresh Status flows;
- downgrade resolution for active-habit and adaptive-program limits.

Plan 09 must reuse the capability contract established here. It must not replace capability checks with checkout redirect state, client storage, query parameters, or unverified provider responses.
