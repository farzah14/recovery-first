# Habits, Sessions, and Check-ins Implementation Plan

> **Execution mode:** Single-agent sequential execution. Use the `executing-plans` workflow. Do not create, delegate to, or dispatch subagents. Complete one task, run its fresh verification commands, commit it, and only then continue. Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** Deliver the complete browser-local Guest core loop and signed-in-compatible application contracts for creating habits, generating sessions, viewing Today, recording Full/Minimum/Skipped outcomes, capturing optional friction, editing same-day check-ins, and preserving immutable history.

**Architecture:** Framework-independent application services orchestrate the deterministic domain rules and persistence contracts established in Plan 03. Guest mode uses a Dexie-backed repository as the canonical source, while a Supabase-backed repository implements the same interface for later authenticated wiring. React routes consume feature-level query and command services rather than reading IndexedDB or PostgreSQL directly.

**Tech Stack:** Next.js App Router, React, strict TypeScript, React Hook Form, Zod, `@hookform/resolvers`, Dexie, Supabase PostgreSQL functions and views, TanStack Query contracts, Tailwind CSS, shadcn/ui primitives, Lucide, Vitest, React Testing Library, `fake-indexeddb`, Playwright, pnpm.

**Save as:** `docs/implementation/04-habits-sessions-checkins.md`

**Source of truth:**

1. `AGENTS.md`
2. `docs/specs/PRD.md`
3. `docs/specs/UX-FLOWS.md`
4. `docs/specs/UI-SPEC.md`
5. `docs/specs/TECHNICAL-DESIGN.md`
6. `docs/implementation/IMPLEMENTATION-PLAN.md`
7. `docs/implementation/03-database-domain-model.md`
8. This plan

**Prerequisites:**

- Plan 01 Final Acceptance Checklist passes.
- Plan 02 Final Acceptance Checklist passes.
- Plan 03 Final Acceptance Checklist passes.
- The repository is on a dedicated implementation branch or worktree.
- `pnpm verify`, `pnpm db:reset`, `pnpm db:test`, `pnpm db:types:check`, and `pnpm build` pass before Task 1.

**Explicitly excluded:** Cross-device synchronization processing, service-worker write replay, Web Push delivery, email reminder delivery, automated Recovery Plan creation, Weekly Review recommendations, authentication screens, Guest-to-account transfer, Premium analytics, payment-provider integration, production monitoring, and release operations.

---

# 1. Locked Product Contracts

Plan 04 must implement these rules exactly:

- Guest may have at most `3` slot-consuming habits.
- Free and Premium limits remain represented by shared repository contracts but are not exposed through authenticated UI in this plan.
- Draft habits do not consume active slots and generate no sessions.
- Every active habit has an immutable published Habit Version containing Normal, Minimum, schedule, cue, and timezone context.
- Normal and Minimum definitions are both required.
- Minimum is a successful continuity outcome, never a partial failure.
- Supported user-recordable outcomes are `full`, `minimum`, `manual_skipped`, and `excused` where explicitly surfaced.
- The core Today UI exposes `Full`, `Minimum`, and `Skipped`; it does not expose Automatic Skipped as a user action.
- Skipped friction capture is optional.
- The controlled friction codes are the Plan 03 `frictionReasons` values.
- Free-text friction notes remain private and must not enter analytics payloads.
- Session generation is deterministic and duplicate-safe.
- This plan uses a bounded rolling generation horizon of `35` local calendar days: the previous `3` days, the current day, and the next `31` days.
- Existing sessions retain their timezone snapshot and Habit Version reference.
- A new check-in command uses a stable UUID command ID and the expected session revision.
- Replaying the same command ID with the same payload returns the prior result without duplication.
- A same-day edit replaces the current check-in projection while preserving prior history.
- Unrecorded remains distinct from Manual Skipped.
- The resolution window is three local calendar days; Automatic Skipped conversion uses the authoritative domain/database function and cannot trigger Recovery by itself.
- Guest writes are confirmed from the IndexedDB transaction result, not from transient component state.
- Signed-in repository methods call the server-authoritative functions and views created in Plan 03; React components never duplicate database invariants.
- No screen uses punitive streak-loss language.

---

# 2. File Map

```text
package.json
pnpm-lock.yaml

src/features/templates/
├── catalog.ts
├── template-card.tsx
└── template-picker.tsx

src/features/habits/
├── application/
│   ├── create-habit.ts
│   ├── save-habit-draft.ts
│   ├── activate-habit.ts
│   ├── get-habit-detail.ts
│   └── list-habits.ts
├── components/
│   ├── active-limit-dialog.tsx
│   ├── habit-card.tsx
│   ├── habit-detail.tsx
│   ├── habit-history.tsx
│   ├── habit-list.tsx
│   ├── habit-wizard.tsx
│   ├── habit-wizard-footer.tsx
│   └── leave-draft-dialog.tsx
├── forms/
│   ├── habit-form-schema.ts
│   ├── habit-form-types.ts
│   └── habit-form-defaults.ts
├── mappers/
│   └── habit-form-mapper.ts
├── queries/
│   └── habit-query-keys.ts
└── public.ts

src/features/sessions/
├── application/
│   ├── ensure-session-horizon.ts
│   └── resolve-expired-unrecorded.ts
├── session-horizon.ts
└── public.ts

src/features/today/
├── application/
│   └── get-today-read-model.ts
├── components/
│   ├── daily-progress-card.tsx
│   ├── first-check-in-guide.tsx
│   ├── today-empty-state.tsx
│   ├── today-page-client.tsx
│   └── today-session-card.tsx
├── today-ordering.ts
├── today-types.ts
└── public.ts

src/features/check-ins/
├── application/
│   ├── edit-check-in.ts
│   └── record-check-in.ts
├── components/
│   ├── check-in-action-group.tsx
│   ├── check-in-confirmation.tsx
│   ├── edit-check-in-dialog.tsx
│   └── friction-dialog.tsx
├── forms/
│   └── friction-form-schema.ts
├── check-in-command.ts
└── public.ts

src/lib/indexed-db/
├── database.ts                         # modified: version 3 tables
├── migrations.ts                       # modified: version 3 migration
├── schema.ts                           # modified: commandResults store
└── types.ts                            # modified: command result and history metadata

src/lib/repositories/
├── product-repository.ts
├── repository-errors.ts
├── repository-provider.tsx
├── guest/
│   └── dexie-product-repository.ts
└── signed-in/
    ├── supabase-product-repository.ts
    └── supabase-product-repository.test.ts

src/app/(application)/today/
├── page.tsx
├── loading.tsx
└── error.tsx

src/app/(application)/habits/
├── page.tsx
├── new/
│   └── page.tsx
└── [habitId]/
    ├── page.tsx
    └── history/
        └── page.tsx

tests/features/templates/
└── catalog.test.ts

tests/features/habits/
├── active-limit-dialog.test.tsx
├── create-habit.test.ts
├── habit-detail.test.tsx
├── habit-form-schema.test.ts
├── habit-list.test.tsx
├── habit-wizard.test.tsx
└── save-habit-draft.test.ts

tests/features/sessions/
├── ensure-session-horizon.test.ts
└── resolve-expired-unrecorded.test.ts

tests/features/today/
├── get-today-read-model.test.ts
├── today-page.test.tsx
└── today-session-card.test.tsx

tests/features/check-ins/
├── edit-check-in.test.ts
├── friction-form-schema.test.ts
├── record-check-in.test.ts
└── check-in-components.test.tsx

tests/unit/indexed-db/
└── command-results-migration.test.ts

tests/integration/
├── guest-habit-core-loop.test.ts
└── signed-in-product-repository.test.ts

tests/accessibility/
└── guest-core-loop.accessibility.test.tsx

tests/e2e/
└── guest-core-loop.spec.ts
```

---

# 3. Tasks

## Task 1: Add Core-Loop Dependencies and Focused Test Commands

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Verify the Plan 03 baseline**

Run:

```bash
pnpm verify
pnpm test:domain
pnpm test:indexed-db
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm db:stop
pnpm build
git status --short
```

Expected: every command exits with status `0` and the working tree is clean.

- [x] **Step 2: Install the form and query dependencies required by this plan**

Run:

```bash
pnpm add react-hook-form zod @hookform/resolvers @tanstack/react-query
```

Expected: `package.json` and `pnpm-lock.yaml` contain the four dependencies and no unrelated package changes.

- [x] **Step 3: Add focused scripts without replacing existing scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'test:templates': 'vitest run tests/features/templates',
  'test:habits': 'vitest run tests/features/habits',
  'test:sessions': 'vitest run tests/features/sessions',
  'test:today': 'vitest run tests/features/today',
  'test:check-ins': 'vitest run tests/features/check-ins',
  'test:core-loop': 'vitest run tests/features/templates tests/features/habits tests/features/sessions tests/features/today tests/features/check-ins tests/integration/guest-habit-core-loop.test.ts',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
pnpm install --lockfile-only
```

Expected: all six scripts exist and `pnpm-lock.yaml` remains synchronized.

- [x] **Step 4: Run package and repository checks**

Run:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:repository
```

Expected: every command exits with status `0`.

- [x] **Step 5: Commit dependency and script changes**

Run:

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add core loop form and query tooling"
```

---

## Task 2: Define Account-Neutral Product Repository Contracts

**Files:**

- Create: `src/lib/repositories/product-repository.ts`
- Create: `src/lib/repositories/repository-errors.ts`
- Create: `src/lib/repositories/repository-provider.tsx`
- Create: `tests/features/habits/product-repository-contract.test.ts`

- [x] **Step 1: Write a failing repository contract test**

Create `tests/features/habits/product-repository-contract.test.ts`:

```typescript
import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  CreateHabitCommand,
  ProductRepository,
  RecordCheckInRepositoryCommand,
} from '@/lib/repositories/product-repository';

describe('ProductRepository contract', () => {
  it('requires stable command identifiers for habit and check-in mutations', () => {
    expectTypeOf<CreateHabitCommand>().toHaveProperty('commandId');
    expectTypeOf<RecordCheckInRepositoryCommand>().toHaveProperty('commandId');
    expectTypeOf<RecordCheckInRepositoryCommand>().toHaveProperty(
      'expectedSessionRevision',
    );
  });

  it('keeps read and write operations behind one account-neutral interface', () => {
    expectTypeOf<ProductRepository>().toHaveProperty('createHabit');
    expectTypeOf<ProductRepository>().toHaveProperty('ensureSessionHorizon');
    expectTypeOf<ProductRepository>().toHaveProperty('getToday');
    expectTypeOf<ProductRepository>().toHaveProperty('recordCheckIn');
    expectTypeOf<ProductRepository>().toHaveProperty('editCheckIn');
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm vitest run tests/features/habits/product-repository-contract.test.ts
```

Expected: FAIL because `product-repository.ts` does not exist.

- [x] **Step 3: Define repository commands, results, and reads**

Create `src/lib/repositories/product-repository.ts`:

```typescript
import type { FrictionReason, UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import type { HabitLifecycleState } from '@/domain/habits/habit-lifecycle';
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import type { IdentityMode } from '@/domain/shared/identity-mode';
import type { PlanTier } from '@/domain/shared/plan-tier';

export type ProductOwner = {
  ownerId: string;
  identityMode: IdentityMode;
  planTier: PlanTier;
  timezone: string;
};

export type HabitTarget = {
  action: string;
  quantity: number | null;
  unit: string | null;
  estimatedMinutes: number | null;
};

export type HabitCue = {
  type: 'time' | 'after_activity' | 'location' | 'none';
  value: string | null;
};

export type CreateHabitCommand = {
  commandId: string;
  habitId: string;
  habitVersionId: string;
  owner: ProductOwner;
  title: string;
  category: string;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  recurrence: RecurrenceRule;
  cue: HabitCue;
  reminderIntent: {
    enabled: boolean;
    localTime: string | null;
  };
  startLocalDate: string;
  activate: boolean;
  clientCreatedAt: string;
};

export type CreateHabitResult = {
  habitId: string;
  habitVersionId: string;
  lifecycleState: HabitLifecycleState;
  activeCount: number;
  firstEligibleSessionId: string | null;
};

export type SessionSummary = {
  id: string;
  habitId: string;
  habitVersionId: string;
  title: string;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  cue: HabitCue;
  scheduledLocalDate: string;
  scheduledLocalTime: string | null;
  timezoneSnapshot: string;
  status:
    | 'unrecorded'
    | 'full'
    | 'minimum'
    | 'manual_skipped'
    | 'automatic_skipped'
    | 'excused';
  revision: number;
  synchronizationState: 'local_only' | 'pending' | 'synced' | 'failed' | 'conflict';
};

export type TodayRepositoryRead = {
  localDate: string;
  sessions: SessionSummary[];
  activeHabitCount: number;
  activeHabitLimit: number;
};

export type RecordCheckInRepositoryCommand = {
  commandId: string;
  owner: ProductOwner;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  frictionCode: FrictionReason | null;
  frictionNote: string | null;
  expectedSessionRevision: number;
  clientRecordedAt: string;
};

export type RecordCheckInResult = {
  checkInId: string;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  sessionRevision: number;
  synchronizationState: SessionSummary['synchronizationState'];
};

export type EditCheckInRepositoryCommand = RecordCheckInRepositoryCommand & {
  currentCheckInId: string;
  expectedCheckInRevision: number;
};

export type HabitListItem = {
  id: string;
  title: string;
  lifecycleState: HabitLifecycleState;
  currentVersionId: string | null;
  updatedAt: string;
};

export type HabitDetailRead = {
  habit: HabitListItem;
  currentVersion: {
    id: string;
    versionNumber: number;
    normalTarget: HabitTarget;
    minimumTarget: HabitTarget;
    recurrence: RecurrenceRule;
    cue: HabitCue;
    createdAt: string;
  };
  versions: Array<{
    id: string;
    versionNumber: number;
    createdAt: string;
    source: 'creation' | 'redesign' | 'recommendation' | 'restore';
  }>;
  sessions: SessionSummary[];
};

export interface ProductRepository {
  createHabit(command: CreateHabitCommand): Promise<CreateHabitResult>;
  saveHabitDraft(
    owner: ProductOwner,
    draftId: string,
    payload: unknown,
    updatedAt: string,
  ): Promise<void>;
  getHabitDraft(owner: ProductOwner, draftId: string): Promise<unknown | null>;
  deleteHabitDraft(owner: ProductOwner, draftId: string): Promise<void>;
  listHabits(owner: ProductOwner): Promise<HabitListItem[]>;
  getHabitDetail(owner: ProductOwner, habitId: string): Promise<HabitDetailRead | null>;
  ensureSessionHorizon(owner: ProductOwner, throughLocalDate: string): Promise<number>;
  resolveExpiredUnrecorded(owner: ProductOwner, now: string): Promise<number>;
  getToday(owner: ProductOwner, localDate: string): Promise<TodayRepositoryRead>;
  recordCheckIn(
    command: RecordCheckInRepositoryCommand,
  ): Promise<RecordCheckInResult>;
  editCheckIn(command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult>;
}
```

- [x] **Step 4: Define repository error codes**

Create `src/lib/repositories/repository-errors.ts`:

```typescript
export const repositoryErrorCodes = [
  'active_limit_reached',
  'draft_not_found',
  'habit_not_found',
  'session_not_found',
  'session_not_eligible',
  'same_day_edit_closed',
  'stale_revision',
  'idempotency_conflict',
  'repository_unavailable',
] as const;

export type RepositoryErrorCode = (typeof repositoryErrorCodes)[number];

export class ProductRepositoryError extends Error {
  constructor(
    public readonly code: RepositoryErrorCode,
    message = code,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ProductRepositoryError';
  }
}
```

- [x] **Step 5: Add the client repository provider**

Create `src/lib/repositories/repository-provider.tsx`:

```tsx
'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const ProductRepositoryContext = createContext<ProductRepository | null>(null);

export function ProductRepositoryProvider({
  repository,
  children,
}: {
  repository: ProductRepository;
  children: ReactNode;
}) {
  return (
    <ProductRepositoryContext.Provider value={repository}>
      {children}
    </ProductRepositoryContext.Provider>
  );
}

export function useProductRepository(): ProductRepository {
  const repository = useContext(ProductRepositoryContext);
  if (!repository) {
    throw new Error('product_repository_provider_missing');
  }
  return repository;
}
```

- [x] **Step 6: Run focused and static checks**

Run:

```bash
pnpm vitest run tests/features/habits/product-repository-contract.test.ts
pnpm typecheck
pnpm lint
```

Expected: the focused test passes and static checks exit with status `0`.

- [x] **Step 7: Commit repository contracts**

Run:

```bash
git add src/lib/repositories tests/features/habits/product-repository-contract.test.ts
git commit -m "feat: define account neutral product repository"
```

---

## Task 3: Implement the Basic Habit Template Catalog

**Files:**

- Create: `src/features/templates/catalog.ts`
- Create: `src/features/templates/template-card.tsx`
- Create: `src/features/templates/template-picker.tsx`
- Create: `tests/features/templates/catalog.test.ts`

- [x] **Step 1: Write failing catalog tests**

Create `tests/features/templates/catalog.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  basicHabitTemplates,
  findHabitTemplates,
} from '@/features/templates/catalog';

describe('basicHabitTemplates', () => {
  it('provides editable Normal and Minimum definitions for every template', () => {
    expect(basicHabitTemplates.length).toBeGreaterThanOrEqual(6);
    for (const template of basicHabitTemplates) {
      expect(template.normalTarget.action.length).toBeGreaterThan(0);
      expect(template.minimumTarget.action.length).toBeGreaterThan(0);
      expect(template.normalTarget.action).not.toBe(template.minimumTarget.action);
    }
  });

  it('searches by title and category without exposing private user data', () => {
    expect(findHabitTemplates('sleep').map((template) => template.id)).toContain(
      'wind-down',
    );
    expect(findHabitTemplates('movement').length).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2: Run the test and confirm the expected failure**

Run:

```bash
pnpm test:templates
```

Expected: FAIL because the catalog module does not exist.

- [x] **Step 3: Implement deterministic, local template data**

Create `src/features/templates/catalog.ts`:

```typescript
import type { RecurrenceRule } from '@/domain/habits/recurrence';
import type { HabitCue, HabitTarget } from '@/lib/repositories/product-repository';

export type BasicHabitTemplate = {
  id: string;
  title: string;
  category: 'movement' | 'mindfulness' | 'learning' | 'sleep' | 'planning';
  description: string;
  normalTarget: HabitTarget;
  minimumTarget: HabitTarget;
  recurrence: RecurrenceRule;
  cue: HabitCue;
};

const everyDay: RecurrenceRule = { kind: 'daily' };

export const basicHabitTemplates: readonly BasicHabitTemplate[] = [
  {
    id: 'daily-walk',
    title: 'Daily walk',
    category: 'movement',
    description: 'Build regular movement with a smaller option for difficult days.',
    normalTarget: { action: 'Walk', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
    minimumTarget: { action: 'Walk outside', quantity: 5, unit: 'minutes', estimatedMinutes: 5 },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'After lunch' },
  },
  {
    id: 'stretch',
    title: 'Stretch',
    category: 'movement',
    description: 'Maintain mobility with a brief continuity option.',
    normalTarget: { action: 'Stretch', quantity: 10, unit: 'minutes', estimatedMinutes: 10 },
    minimumTarget: { action: 'Do one stretch', quantity: 2, unit: 'minutes', estimatedMinutes: 2 },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'After waking up' },
  },
  {
    id: 'mindful-breathing',
    title: 'Mindful breathing',
    category: 'mindfulness',
    description: 'Practice calm attention without requiring a long session.',
    normalTarget: { action: 'Practice mindful breathing', quantity: 10, unit: 'minutes', estimatedMinutes: 10 },
    minimumTarget: { action: 'Take ten mindful breaths', quantity: 10, unit: 'breaths', estimatedMinutes: 2 },
    recurrence: everyDay,
    cue: { type: 'time', value: '20:00' },
  },
  {
    id: 'read',
    title: 'Read',
    category: 'learning',
    description: 'Keep reading momentum with a one-page Minimum.',
    normalTarget: { action: 'Read', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
    minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'After dinner' },
  },
  {
    id: 'wind-down',
    title: 'Evening wind-down',
    category: 'sleep',
    description: 'Create a predictable transition toward sleep.',
    normalTarget: { action: 'Follow wind-down routine', quantity: 30, unit: 'minutes', estimatedMinutes: 30 },
    minimumTarget: { action: 'Dim lights and put phone away', quantity: 5, unit: 'minutes', estimatedMinutes: 5 },
    recurrence: everyDay,
    cue: { type: 'time', value: '21:30' },
  },
  {
    id: 'plan-tomorrow',
    title: 'Plan tomorrow',
    category: 'planning',
    description: 'Reduce morning friction with a small planning ritual.',
    normalTarget: { action: 'Plan tomorrow', quantity: 10, unit: 'minutes', estimatedMinutes: 10 },
    minimumTarget: { action: 'Write the top priority', quantity: 1, unit: 'priority', estimatedMinutes: 2 },
    recurrence: everyDay,
    cue: { type: 'after_activity', value: 'Before ending work' },
  },
] as const;

export function findHabitTemplates(query: string): readonly BasicHabitTemplate[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return basicHabitTemplates;

  return basicHabitTemplates.filter((template) =>
    [template.title, template.category, template.description]
      .join(' ')
      .toLowerCase()
      .includes(normalized),
  );
}
```

- [x] **Step 4: Implement reusable template presentation components**

Create `src/features/templates/template-card.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BasicHabitTemplate } from '@/features/templates/catalog';

export function TemplateCard({
  template,
  onSelect,
}: {
  template: BasicHabitTemplate;
  onSelect: (templateId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="space-y-2 text-sm">
          <div><dt className="font-medium">Normal</dt><dd>{template.normalTarget.action}</dd></div>
          <div><dt className="font-medium">Minimum</dt><dd>{template.minimumTarget.action}</dd></div>
        </dl>
        <Button type="button" onClick={() => onSelect(template.id)}>Use template</Button>
      </CardContent>
    </Card>
  );
}
```

Create `src/features/templates/template-picker.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { basicHabitTemplates, findHabitTemplates } from '@/features/templates/catalog';
import { TemplateCard } from '@/features/templates/template-card';

export function TemplatePicker({ onSelect }: { onSelect: (templateId: string) => void }) {
  const [query, setQuery] = useState('');
  const templates = useMemo(
    () => (query ? findHabitTemplates(query) : basicHabitTemplates),
    [query],
  );

  return (
    <section aria-labelledby="template-heading" className="space-y-4">
      <div>
        <h2 id="template-heading" className="text-xl font-semibold">Start from a basic template</h2>
        <p className="text-sm text-muted-foreground">Every template remains fully editable.</p>
      </div>
      <Input
        aria-label="Search templates"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
```

- [x] **Step 5: Run focused and component checks**

Run:

```bash
pnpm test:templates
pnpm test:component
pnpm typecheck
pnpm lint
```

Expected: all tests and static checks pass.

- [x] **Step 6: Commit the template catalog**

Run:

```bash
git add src/features/templates tests/features/templates
git commit -m "feat: add editable basic habit templates"
```

---

## Task 4: Define the Habit Wizard Schema, Defaults, and Mapping

**Files:**

- Create: `src/features/habits/forms/habit-form-schema.ts`
- Create: `src/features/habits/forms/habit-form-types.ts`
- Create: `src/features/habits/forms/habit-form-defaults.ts`
- Create: `src/features/habits/mappers/habit-form-mapper.ts`
- Create: `tests/features/habits/habit-form-schema.test.ts`

- [x] **Step 1: Write failing schema and mapping tests**

Create `tests/features/habits/habit-form-schema.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { habitFormSchema } from '@/features/habits/forms/habit-form-schema';
import { mapHabitFormToCreateCommand } from '@/features/habits/mappers/habit-form-mapper';

const validForm = {
  creationRoute: 'custom' as const,
  templateId: null,
  category: 'movement',
  title: 'Walk after lunch',
  normalAction: 'Walk for 20 minutes',
  normalQuantity: 20,
  normalUnit: 'minutes',
  minimumAction: 'Walk for 5 minutes',
  minimumQuantity: 5,
  minimumUnit: 'minutes',
  recurrenceKind: 'weekdays' as const,
  weekdays: [1, 2, 3, 4, 5],
  timesPerWeek: null,
  cueType: 'after_activity' as const,
  cueValue: 'After lunch',
  timezone: 'Asia/Jakarta',
  reminderEnabled: false,
  reminderLocalTime: null,
  startLocalDate: '2026-07-30',
  activate: true,
};

describe('habitFormSchema', () => {
  it('requires distinct non-empty Normal and Minimum actions', () => {
    expect(habitFormSchema.safeParse(validForm).success).toBe(true);
    expect(
      habitFormSchema.safeParse({ ...validForm, minimumAction: validForm.normalAction })
        .success,
    ).toBe(false);
  });

  it('requires weekdays for selected-weekday recurrence', () => {
    expect(habitFormSchema.safeParse({ ...validForm, weekdays: [] }).success).toBe(false);
  });

  it('maps validated form values to a stable create command', () => {
    const command = mapHabitFormToCreateCommand(validForm, {
      commandId: '00000000-0000-4000-8000-000000000401',
      habitId: '00000000-0000-4000-8000-000000000402',
      habitVersionId: '00000000-0000-4000-8000-000000000403',
      owner: {
        ownerId: 'guest-installation-1',
        identityMode: 'guest',
        planTier: 'guest',
        timezone: 'Asia/Jakarta',
      },
      now: '2026-07-29T13:00:00.000Z',
    });
    expect(command.normalTarget.action).toBe('Walk for 20 minutes');
    expect(command.minimumTarget.action).toBe('Walk for 5 minutes');
    expect(command.owner.planTier).toBe('guest');
  });
});
```

- [x] **Step 2: Run the focused test and confirm failure**

Run:

```bash
pnpm vitest run tests/features/habits/habit-form-schema.test.ts
```

Expected: FAIL because the form modules do not exist.

- [x] **Step 3: Implement the form schema**

Create `src/features/habits/forms/habit-form-schema.ts`:

```typescript
import { z } from 'zod';

const weekdaySchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4),
  z.literal(5), z.literal(6), z.literal(7),
]);

export const habitFormSchema = z
  .object({
    creationRoute: z.enum(['template', 'custom']),
    templateId: z.string().nullable(),
    category: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(80),
    normalAction: z.string().trim().min(1).max(160),
    normalQuantity: z.number().positive().nullable(),
    normalUnit: z.string().trim().max(30).nullable(),
    minimumAction: z.string().trim().min(1).max(160),
    minimumQuantity: z.number().positive().nullable(),
    minimumUnit: z.string().trim().max(30).nullable(),
    recurrenceKind: z.enum(['daily', 'weekdays', 'times_per_week']),
    weekdays: z.array(weekdaySchema),
    timesPerWeek: z.number().int().min(1).max(7).nullable(),
    cueType: z.enum(['time', 'after_activity', 'location', 'none']),
    cueValue: z.string().trim().max(120).nullable(),
    timezone: z.string().trim().min(1),
    reminderEnabled: z.boolean(),
    reminderLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
    startLocalDate: z.string().date(),
    activate: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.normalAction.toLowerCase() === value.minimumAction.toLowerCase()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['minimumAction'],
        message: 'Minimum must describe a smaller valid action.',
      });
    }
    if (value.recurrenceKind === 'weekdays' && value.weekdays.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weekdays'],
        message: 'Choose at least one weekday.',
      });
    }
    if (value.recurrenceKind === 'times_per_week') {
      if (value.timesPerWeek === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timesPerWeek'],
          message: 'Choose how many sessions occur each week.',
        });
      } else if (value.weekdays.length !== value.timesPerWeek) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['weekdays'],
          message: 'Choose one placement day for each weekly session.',
        });
      }
    }
    if (value.reminderEnabled && value.reminderLocalTime === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reminderLocalTime'],
        message: 'Choose a reminder time.',
      });
    }
  });
```

- [x] **Step 4: Export inferred form types and deterministic defaults**

Create `src/features/habits/forms/habit-form-types.ts`:

```typescript
import type { z } from 'zod';

import type { habitFormSchema } from '@/features/habits/forms/habit-form-schema';

export type HabitFormValues = z.infer<typeof habitFormSchema>;
```

Create `src/features/habits/forms/habit-form-defaults.ts`:

```typescript
import type { BasicHabitTemplate } from '@/features/templates/catalog';
import type { HabitFormValues } from '@/features/habits/forms/habit-form-types';

export function createHabitFormDefaults(input: {
  timezone: string;
  startLocalDate: string;
  template?: BasicHabitTemplate;
}): HabitFormValues {
  const template = input.template;
  return {
    creationRoute: template ? 'template' : 'custom',
    templateId: template?.id ?? null,
    category: template?.category ?? 'other',
    title: template?.title ?? '',
    normalAction: template?.normalTarget.action ?? '',
    normalQuantity: template?.normalTarget.quantity ?? null,
    normalUnit: template?.normalTarget.unit ?? null,
    minimumAction: template?.minimumTarget.action ?? '',
    minimumQuantity: template?.minimumTarget.quantity ?? null,
    minimumUnit: template?.minimumTarget.unit ?? null,
    recurrenceKind:
      template?.recurrence.kind === 'daily'
        ? 'daily'
        : template?.recurrence.kind === 'weekdays'
          ? 'weekdays'
          : template?.recurrence.kind === 'times_per_week'
            ? 'times_per_week'
            : 'daily',
    weekdays:
      template?.recurrence.kind === 'weekdays'
        ? [...template.recurrence.weekdays]
        : template?.recurrence.kind === 'times_per_week'
          ? [...template.recurrence.placement]
          : [],
    timesPerWeek:
      template?.recurrence.kind === 'times_per_week'
        ? template.recurrence.count
        : null,
    cueType: template?.cue.type ?? 'none',
    cueValue: template?.cue.value ?? null,
    timezone: input.timezone,
    reminderEnabled: false,
    reminderLocalTime: null,
    startLocalDate: input.startLocalDate,
    activate: true,
  };
}
```

- [x] **Step 5: Map validated values to the repository command**

Create `src/features/habits/mappers/habit-form-mapper.ts`:

```typescript
import type { HabitFormValues } from '@/features/habits/forms/habit-form-types';
import type {
  CreateHabitCommand,
  ProductOwner,
} from '@/lib/repositories/product-repository';

export function mapHabitFormToCreateCommand(
  values: HabitFormValues,
  context: {
    commandId: string;
    habitId: string;
    habitVersionId: string;
    owner: ProductOwner;
    now: string;
  },
): CreateHabitCommand {
  return {
    commandId: context.commandId,
    habitId: context.habitId,
    habitVersionId: context.habitVersionId,
    owner: { ...context.owner, timezone: values.timezone },
    title: values.title,
    category: values.category,
    normalTarget: {
      action: values.normalAction,
      quantity: values.normalQuantity,
      unit: values.normalUnit,
      estimatedMinutes: values.normalUnit === 'minutes' ? values.normalQuantity : null,
    },
    minimumTarget: {
      action: values.minimumAction,
      quantity: values.minimumQuantity,
      unit: values.minimumUnit,
      estimatedMinutes: values.minimumUnit === 'minutes' ? values.minimumQuantity : null,
    },
    recurrence:
      values.recurrenceKind === 'daily'
        ? { kind: 'daily' }
        : values.recurrenceKind === 'weekdays'
          ? { kind: 'weekdays', weekdays: values.weekdays }
          : {
              kind: 'times_per_week',
              count: values.timesPerWeek ?? 1,
              placement: values.weekdays,
            },
    cue: { type: values.cueType, value: values.cueValue },
    reminderIntent: {
      enabled: values.reminderEnabled,
      localTime: values.reminderLocalTime,
    },
    startLocalDate: values.startLocalDate,
    activate: values.activate,
    clientCreatedAt: context.now,
  };
}
```

- [x] **Step 6: Run focused, domain, and static checks**

Run:

```bash
pnpm vitest run tests/features/habits/habit-form-schema.test.ts
pnpm test:domain
pnpm typecheck
pnpm lint
```

Expected: all commands pass.

- [x] **Step 7: Commit form contracts**

Run:

```bash
git add src/features/habits/forms src/features/habits/mappers tests/features/habits/habit-form-schema.test.ts
git commit -m "feat: define validated habit creation form"
```

---

## Task 5: Implement the Guest Dexie Product Repository

**Files:**

- Modify: `src/lib/indexed-db/types.ts`
- Modify: `src/lib/indexed-db/schema.ts`
- Modify: `src/lib/indexed-db/migrations.ts`
- Modify: `src/lib/indexed-db/database.ts`
- Create: `tests/unit/indexed-db/command-results-migration.test.ts`
- Create: `src/lib/repositories/guest/dexie-product-repository.ts`
- Create: `tests/integration/guest-habit-core-loop.test.ts`

- [x] **Step 1: Write a failing Dexie version 3 migration test**

Create `tests/unit/indexed-db/command-results-migration.test.ts` and prove that upgrading a populated version 2 database:

- preserves profiles, habits, versions, sessions, check-ins, and drafts;
- adds an empty `commandResults` table;
- adds nullable `replacedAt` and `replacedById` metadata to existing check-in records without changing their outcome;
- reports `currentIndexedDbVersion === 3`.

- [x] **Step 2: Run the migration test and confirm failure**

Run:

```bash
pnpm vitest run tests/unit/indexed-db/command-results-migration.test.ts
```

Expected: FAIL because Dexie version 3 and `commandResults` do not exist.

- [x] **Step 3: Add append-only Dexie version 3 contracts**

Extend `src/lib/indexed-db/types.ts`:

```typescript
export type LocalCommandResultRecord = {
  id: string;
  ownerType: LocalOwnerType;
  ownerId: string;
  operationType: 'create_habit' | 'record_check_in' | 'edit_check_in';
  requestHash: string;
  result: unknown;
  createdAt: string;
  expiresAt: string;
};
```

Extend `LocalCheckInRecord` with:

```typescript
replacedAt: string | null;
replacedById: string | null;
```

Extend `src/lib/indexed-db/schema.ts`:

```typescript
export const recoveryFirstStoresV3 = {
  ...recoveryFirstStoresV2,
  commandResults: 'id, [ownerType+ownerId], operationType, expiresAt',
} as const;

export const currentIndexedDbVersion = 3;
```

Add `migrateVersionTwoToThree` in `src/lib/indexed-db/migrations.ts` to set missing replacement metadata to `null` on every existing check-in.

Register version 3 and `commandResults!: Table<LocalCommandResultRecord, string>` in `RecoveryFirstDatabase`.

- [x] **Step 4: Run migration and IndexedDB regression tests**

Run:

```bash
pnpm vitest run tests/unit/indexed-db/command-results-migration.test.ts
pnpm test:indexed-db
pnpm typecheck
```

Expected: version 1 to 2 to 3 upgrades preserve all existing records and pass.

- [x] **Step 5: Write the first failing Guest repository integration test**

Create `tests/integration/guest-habit-core-loop.test.ts`:

```typescript
import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import { DexieProductRepository } from '@/lib/repositories/guest/dexie-product-repository';
import type { CreateHabitCommand } from '@/lib/repositories/product-repository';

const owner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest' as const,
  planTier: 'guest' as const,
  timezone: 'Asia/Jakarta',
};

function command(index: number): CreateHabitCommand {
  return {
    commandId: `00000000-0000-4000-8000-0000000004${index}1`,
    habitId: `00000000-0000-4000-8000-0000000004${index}2`,
    habitVersionId: `00000000-0000-4000-8000-0000000004${index}3`,
    owner,
    title: `Habit ${index}`,
    category: 'movement',
    normalTarget: { action: 'Walk 20 minutes', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
    minimumTarget: { action: 'Walk 5 minutes', quantity: 5, unit: 'minutes', estimatedMinutes: 5 },
    recurrence: { kind: 'daily' },
    cue: { type: 'after_activity', value: 'After lunch' },
    reminderIntent: { enabled: false, localTime: null },
    startLocalDate: '2026-07-29',
    activate: true,
    clientCreatedAt: '2026-07-29T03:00:00.000Z',
  };
}

describe('DexieProductRepository', () => {
  let database: RecoveryFirstDatabase;
  let repository: DexieProductRepository;

  beforeEach(() => {
    database = new RecoveryFirstDatabase(`plan04-${crypto.randomUUID()}`);
    repository = new DexieProductRepository(database);
  });

  afterEach(async () => {
    await database.delete();
  });

  it('creates a habit, immutable version, and deterministic sessions atomically', async () => {
    const result = await repository.createHabit(command(1));
    expect(result.lifecycleState).toBe('starting');
    expect(await database.habits.count()).toBe(1);
    expect(await database.habitVersions.count()).toBe(1);
    expect(await database.sessions.count()).toBeGreaterThan(0);
  });

  it('rejects the fourth active Guest habit without partial records', async () => {
    await repository.createHabit(command(1));
    await repository.createHabit(command(2));
    await repository.createHabit(command(3));
    await expect(repository.createHabit(command(4))).rejects.toMatchObject({
      code: 'active_limit_reached',
    });
    expect(await database.habits.count()).toBe(3);
    expect(await database.habitVersions.count()).toBe(3);
  });

  it('replays the same create command without duplication', async () => {
    const input = command(1);
    const first = await repository.createHabit(input);
    const replay = await repository.createHabit(input);
    expect(replay).toEqual(first);
    expect(await database.habits.count()).toBe(1);
  });
});
```

- [x] **Step 6: Run the integration test and confirm the expected failure**

Run:

```bash
pnpm vitest run tests/integration/guest-habit-core-loop.test.ts
```

Expected: FAIL because `DexieProductRepository` does not exist.

- [x] **Step 7: Implement atomic Guest habit creation and idempotent replay**

Create `src/lib/repositories/guest/dexie-product-repository.ts` with this class skeleton and complete every interface method in later tasks:

```typescript
import type { RecoveryFirstDatabase } from '@/lib/indexed-db/database';
import type { LocalCommandResultRecord } from '@/lib/indexed-db/types';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import type {
  CreateHabitCommand,
  CreateHabitResult,
  EditCheckInRepositoryCommand,
  HabitDetailRead,
  HabitListItem,
  ProductOwner,
  ProductRepository,
  RecordCheckInRepositoryCommand,
  RecordCheckInResult,
  TodayRepositoryRead,
} from '@/lib/repositories/product-repository';
import { generateSessionsForCommand } from '@/features/sessions/application/ensure-session-horizon';

export class DexieProductRepository implements ProductRepository {
  constructor(private readonly database: RecoveryFirstDatabase) {}

  async createHabit(command: CreateHabitCommand): Promise<CreateHabitResult> {
    return this.database.transaction(
      'rw',
      this.database.habits,
      this.database.habitVersions,
      this.database.sessions,
      this.database.commandResults,
      async () => {
        const requestHash = JSON.stringify(command);
        const replay = await this.database.commandResults.get(command.commandId);
        if (replay) {
          if (replay.requestHash !== requestHash) {
            throw new ProductRepositoryError('idempotency_conflict');
          }
          return replay.result as CreateHabitResult;
        }

        const activeHabits = await this.database.habits
          .where('[ownerType+ownerId]')
          .equals(['guest', command.owner.ownerId])
          .filter((habit) =>
            habit.deletedAt === null &&
            ['starting', 'building', 'active', 'stable', 'at_risk', 'recovery', 'rebuilding', 'needs_review']
              .includes(habit.lifecycleState),
          )
          .count();

        if (command.activate && activeHabits >= 3) {
          throw new ProductRepositoryError('active_limit_reached', 'Guest active habit limit reached', {
            limit: 3,
          });
        }

        await this.database.habits.add({
          id: command.habitId,
          ownerType: 'guest',
          ownerId: command.owner.ownerId,
          title: command.title,
          lifecycleState: command.activate ? 'starting' : 'draft',
          currentVersionId: command.habitVersionId,
          revision: 1,
          synchronizationState: 'local_only',
          createdAt: command.clientCreatedAt,
          updatedAt: command.clientCreatedAt,
          deletedAt: null,
        });

        await this.database.habitVersions.add({
          id: command.habitVersionId,
          habitId: command.habitId,
          ownerType: 'guest',
          ownerId: command.owner.ownerId,
          versionNumber: 1,
          normalTarget: command.normalTarget,
          minimumTarget: command.minimumTarget,
          scheduleRule: command.recurrence,
          cue: command.cue,
          recoveryStructure: {},
          source: 'creation',
          parentVersionId: null,
          createdAt: command.clientCreatedAt,
        });

        const sessions = command.activate ? generateSessionsForCommand(command) : [];
        if (sessions.length > 0) await this.database.sessions.bulkAdd(sessions);

        const result: CreateHabitResult = {
          habitId: command.habitId,
          habitVersionId: command.habitVersionId,
          lifecycleState: command.activate ? 'starting' : 'draft',
          activeCount: activeHabits + (command.activate ? 1 : 0),
          firstEligibleSessionId: sessions[0]?.id ?? null,
        };

        const expiresAt = new Date(
          Date.parse(command.clientCreatedAt) + 90 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const replayRecord: LocalCommandResultRecord = {
          id: command.commandId,
          ownerType: 'guest',
          ownerId: command.owner.ownerId,
          operationType: 'create_habit',
          requestHash,
          result,
          createdAt: command.clientCreatedAt,
          expiresAt,
        };
        await this.database.commandResults.put(replayRecord);
        return result;
      },
    );
  }

  async saveHabitDraft(
    owner: ProductOwner,
    draftId: string,
    payload: unknown,
    updatedAt: string,
  ): Promise<void> {
    await this.database.drafts.put({
      id: draftId,
      ownerType: owner.identityMode,
      ownerId: owner.ownerId,
      draftType: 'habit_wizard',
      payload: payload as Record<string, unknown>,
      updatedAt,
    });
  }

  async getHabitDraft(owner: ProductOwner, draftId: string): Promise<unknown | null> {
    const draft = await this.database.drafts.get(draftId);
    return draft?.ownerId === owner.ownerId ? draft.payload : null;
  }

  async deleteHabitDraft(owner: ProductOwner, draftId: string): Promise<void> {
    const draft = await this.database.drafts.get(draftId);
    if (draft?.ownerId === owner.ownerId) await this.database.drafts.delete(draftId);
  }

  async listHabits(_owner: ProductOwner): Promise<HabitListItem[]> {
    throw new ProductRepositoryError('repository_unavailable');
  }
  async getHabitDetail(_owner: ProductOwner, _habitId: string): Promise<HabitDetailRead | null> {
    throw new ProductRepositoryError('repository_unavailable');
  }
  async ensureSessionHorizon(_owner: ProductOwner, _throughLocalDate: string): Promise<number> {
    throw new ProductRepositoryError('repository_unavailable');
  }
  async resolveExpiredUnrecorded(_owner: ProductOwner, _now: string): Promise<number> {
    throw new ProductRepositoryError('repository_unavailable');
  }
  async getToday(_owner: ProductOwner, _localDate: string): Promise<TodayRepositoryRead> {
    throw new ProductRepositoryError('repository_unavailable');
  }
  async recordCheckIn(_command: RecordCheckInRepositoryCommand): Promise<RecordCheckInResult> {
    throw new ProductRepositoryError('repository_unavailable');
  }
  async editCheckIn(_command: EditCheckInRepositoryCommand): Promise<RecordCheckInResult> {
    throw new ProductRepositoryError('repository_unavailable');
  }
}
```

- [x] **Step 8: Run the focused test to expose the missing session generator**

Run:

```bash
pnpm vitest run tests/integration/guest-habit-core-loop.test.ts
```

Expected: FAIL because `generateSessionsForCommand` is not implemented.

- [x] **Step 9: Commit the repository boundary before session implementation**

Run:

```bash
git add src/lib/indexed-db src/lib/repositories/guest/dexie-product-repository.ts tests/unit/indexed-db/command-results-migration.test.ts tests/integration/guest-habit-core-loop.test.ts
git commit -m "feat: add atomic guest habit repository"
```

---

## Task 6: Implement Deterministic Bounded Session Generation

**Files:**

- Create: `src/features/sessions/session-horizon.ts`
- Create: `src/features/sessions/application/ensure-session-horizon.ts`
- Create: `src/features/sessions/public.ts`
- Create: `tests/features/sessions/ensure-session-horizon.test.ts`
- Modify: `src/lib/repositories/guest/dexie-product-repository.ts`

- [x] **Step 1: Write failing session horizon tests**

Create `tests/features/sessions/ensure-session-horizon.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  calculateSessionHorizon,
  generateSessionsForCommand,
  zonedLocalDateTimeToUtc,
} from '@/features/sessions/application/ensure-session-horizon';

const command = {
  commandId: '00000000-0000-4000-8000-000000000601',
  habitId: '00000000-0000-4000-8000-000000000602',
  habitVersionId: '00000000-0000-4000-8000-000000000603',
  owner: { ownerId: 'guest-1', identityMode: 'guest' as const, planTier: 'guest' as const, timezone: 'Asia/Jakarta' },
  title: 'Read',
  category: 'learning',
  normalTarget: { action: 'Read 20 minutes', quantity: 20, unit: 'minutes', estimatedMinutes: 20 },
  minimumTarget: { action: 'Read one page', quantity: 1, unit: 'page', estimatedMinutes: 3 },
  recurrence: { kind: 'weekdays' as const, weekdays: [1, 3, 5] },
  cue: { type: 'time' as const, value: '20:00' },
  reminderIntent: { enabled: false, localTime: null },
  startLocalDate: '2026-07-29',
  activate: true,
  clientCreatedAt: '2026-07-29T03:00:00.000Z',
};

describe('session horizon', () => {
  it('covers the prior three days, today, and next thirty-one days', () => {
    expect(calculateSessionHorizon('2026-07-29')).toEqual({
      fromLocalDate: '2026-07-26',
      throughLocalDate: '2026-08-29',
    });
  });

  it('converts local boundaries using the session timezone snapshot', () => {
    expect(
      zonedLocalDateTimeToUtc('2026-07-29', '00:00:00', 'Asia/Jakarta'),
    ).toBe('2026-07-28T17:00:00.000Z');
  });

  it('generates deterministic unique sessions only for eligible weekdays', () => {
    const first = generateSessionsForCommand(command);
    const replay = generateSessionsForCommand(command);
    expect(replay).toEqual(first);
    expect(new Set(first.map((session) => session.id)).size).toBe(first.length);
    expect(first.every((session) => session.habitVersionId === command.habitVersionId)).toBe(true);
  });
});
```

- [x] **Step 2: Run the focused test and confirm failure**

Run:

```bash
pnpm test:sessions
```

Expected: FAIL because the session modules do not exist.

- [x] **Step 3: Define horizon constants and date helpers**

Create `src/features/sessions/session-horizon.ts`:

```typescript
export const SESSION_LOOKBACK_DAYS = 3;
export const SESSION_LOOKAHEAD_DAYS = 31;

export function shiftIsoLocalDate(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isoWeekday(localDate: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const day = new Date(`${localDate}T12:00:00.000Z`).getUTCDay();
  return (day === 0 ? 7 : day) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsAt(instant: Date, timezone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second'),
  };
}

export function zonedLocalDateTimeToUtc(
  localDate: string,
  localTime: string,
  timezone: string,
): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const [hour, minute, second] = localTime.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = target;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsAt(new Date(guess), timezone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const adjustment = target - actualAsUtc;
    guess += adjustment;
    if (adjustment === 0) return new Date(guess).toISOString();
  }

  throw new Error('local_datetime_cannot_be_resolved');
}
```

- [x] **Step 4: Implement deterministic session generation**

Create `src/features/sessions/application/ensure-session-horizon.ts`:

```typescript
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
): LocalSessionRecord[] {
  const horizon = calculateSessionHorizon(command.startLocalDate);
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
```

- [x] **Step 5: Implement repository horizon extension with duplicate-safe bulk insert**

Extend `DexieProductRepository.ensureSessionHorizon` to:

1. read active habits and current versions for the owner;
2. construct a `CreateHabitCommand`-compatible generation input;
3. generate through the requested local date;
4. compare deterministic session IDs against existing rows;
5. `bulkAdd` only missing sessions inside one Dexie transaction;
6. return the number inserted.

The method must use `bulkGet` by deterministic IDs and must never delete or move existing sessions.

- [x] **Step 6: Add timezone regression cases**

Add tests for `Asia/Jakarta`, a daylight-saving transition in `America/New_York`, an invalid IANA timezone, and a finite-date recurrence. Document the deterministic policy for ambiguous local times as the earliest matching instant and reject nonexistent local times with `local_datetime_cannot_be_resolved`.

- [x] **Step 7: Run session and Guest integration tests**

Run:

```bash
pnpm test:sessions
pnpm vitest run tests/integration/guest-habit-core-loop.test.ts
pnpm test:indexed-db
pnpm typecheck
pnpm lint
```

Expected: all commands pass and rerunning the generator inserts zero duplicates.

- [x] **Step 8: Commit deterministic generation**

Run:

```bash
git add src/features/sessions src/lib/repositories/guest/dexie-product-repository.ts tests/features/sessions tests/integration/guest-habit-core-loop.test.ts
git commit -m "feat: generate deterministic bounded habit sessions"
```

---

## Task 7: Implement Habit Draft and Creation Application Services

**Files:**

- Create: `src/features/habits/application/create-habit.ts`
- Create: `src/features/habits/application/save-habit-draft.ts`
- Create: `src/features/habits/application/activate-habit.ts`
- Create: `src/features/habits/public.ts`
- Create: `tests/features/habits/create-habit.test.ts`
- Create: `tests/features/habits/save-habit-draft.test.ts`

- [x] **Step 1: Write failing application-service tests**

Create `tests/features/habits/create-habit.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';

import { createHabit } from '@/features/habits/application/create-habit';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import type {
  CreateHabitCommand,
  ProductOwner,
  ProductRepository,
} from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

const validValues = {
  creationRoute: 'custom' as const,
  templateId: null,
  category: 'movement',
  title: 'Walk after lunch',
  normalAction: 'Walk for 20 minutes',
  normalQuantity: 20,
  normalUnit: 'minutes',
  minimumAction: 'Walk for 5 minutes',
  minimumQuantity: 5,
  minimumUnit: 'minutes',
  recurrenceKind: 'weekdays' as const,
  weekdays: [1, 2, 3, 4, 5] as const,
  timesPerWeek: null,
  cueType: 'after_activity' as const,
  cueValue: 'After lunch',
  timezone: 'Asia/Jakarta',
  reminderEnabled: false,
  reminderLocalTime: null,
  startLocalDate: '2026-07-30',
  activate: true,
};

const ids = {
  commandId: '00000000-0000-4000-8000-000000000701',
  habitId: '00000000-0000-4000-8000-000000000702',
  habitVersionId: '00000000-0000-4000-8000-000000000703',
};

function createRepositorySpy(options: { activeLimit?: boolean } = {}): ProductRepository {
  return {
    createHabit: vi.fn(async (command: CreateHabitCommand) => {
      if (options.activeLimit) {
        throw new ProductRepositoryError('active_limit_reached');
      }
      return {
        habitId: command.habitId,
        habitVersionId: command.habitVersionId,
        lifecycleState: command.activate ? 'starting' : 'draft',
        activeCount: command.activate ? 1 : 0,
        firstEligibleSessionId: null,
      };
    }),
    saveHabitDraft: vi.fn(async () => undefined),
    getHabitDraft: vi.fn(async () => null),
    deleteHabitDraft: vi.fn(async () => undefined),
    listHabits: vi.fn(async () => []),
    getHabitDetail: vi.fn(async () => null),
    ensureSessionHorizon: vi.fn(async () => 0),
    resolveExpiredUnrecorded: vi.fn(async () => 0),
    getToday: vi.fn(async () => ({
      localDate: '2026-07-30',
      sessions: [],
      activeHabitCount: 0,
      activeHabitLimit: 3,
    })),
    recordCheckIn: vi.fn(),
    editCheckIn: vi.fn(),
  };
}

describe('createHabit', () => {
  it('validates form input before calling the repository', async () => {
    const repository = createRepositorySpy();
    await expect(
      createHabit({
        repository,
        values: { ...validValues, minimumAction: validValues.normalAction },
        identity: owner,
        ids,
        now: '2026-07-29T13:00:00.000Z',
      }),
    ).rejects.toMatchObject({ name: 'ZodError' });
    expect(repository.createHabit).not.toHaveBeenCalled();
  });

  it('returns an active-limit result without deleting an existing habit', async () => {
    const repository = createRepositorySpy({ activeLimit: true });
    await expect(
      createHabit({
        repository,
        values: validValues,
        identity: owner,
        ids,
        now: '2026-07-29T13:00:00.000Z',
      }),
    ).resolves.toEqual({ kind: 'active_limit', limit: 3 });
    expect(repository.deleteHabitDraft).not.toHaveBeenCalled();
  });
});
```

Create `tests/features/habits/save-habit-draft.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';

import {
  loadHabitDraft,
  saveHabitDraft,
} from '@/features/habits/application/save-habit-draft';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

const owner: ProductOwner = {
  ownerId: 'guest-installation-1',
  identityMode: 'guest',
  planTier: 'guest',
  timezone: 'Asia/Jakarta',
};

describe('habit draft application service', () => {
  it('saves and restores the current wizard step and partial values', async () => {
    let stored: unknown = null;
    const repository = {
      saveHabitDraft: vi.fn(async (_owner, _id, payload) => { stored = payload; }),
      getHabitDraft: vi.fn(async () => stored),
    } as unknown as ProductRepository;

    await saveHabitDraft({
      repository,
      owner,
      draftId: 'new-habit',
      draft: { step: 2, values: { title: 'Read', normalAction: 'Read 20 minutes' } },
      now: '2026-07-29T13:00:00.000Z',
    });

    await expect(
      loadHabitDraft({ repository, owner, draftId: 'new-habit' }),
    ).resolves.toEqual({
      step: 2,
      values: { title: 'Read', normalAction: 'Read 20 minutes' },
    });
  });
});
```

- [x] **Step 2: Run the tests and confirm failure**

Run:

```bash
pnpm vitest run tests/features/habits/create-habit.test.ts tests/features/habits/save-habit-draft.test.ts
```

Expected: FAIL because the application services do not exist.

- [x] **Step 3: Implement create-habit orchestration**

Create `src/features/habits/application/create-habit.ts`:

```typescript
import { habitFormSchema } from '@/features/habits/forms/habit-form-schema';
import { mapHabitFormToCreateCommand } from '@/features/habits/mappers/habit-form-mapper';
import { ProductRepositoryError } from '@/lib/repositories/repository-errors';
import type {
  ProductOwner,
  ProductRepository,
} from '@/lib/repositories/product-repository';

export async function createHabit(input: {
  repository: ProductRepository;
  values: unknown;
  identity: ProductOwner;
  ids: { commandId: string; habitId: string; habitVersionId: string };
  now: string;
}) {
  const values = habitFormSchema.parse(input.values);
  const command = mapHabitFormToCreateCommand(values, {
    ...input.ids,
    owner: input.identity,
    now: input.now,
  });
  try {
    const result = await input.repository.createHabit(command);
    await input.repository.deleteHabitDraft(command.owner, 'new-habit');
    return { kind: 'created' as const, result };
  } catch (error) {
    if (error instanceof ProductRepositoryError && error.code === 'active_limit_reached') {
      return { kind: 'active_limit' as const, limit: 3 };
    }
    throw error;
  }
}
```

- [x] **Step 4: Implement validated draft persistence**

Create `src/features/habits/application/save-habit-draft.ts`:

```typescript
import { habitFormSchema } from '@/features/habits/forms/habit-form-schema';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export type HabitWizardDraft = {
  step: 1 | 2 | 3 | 4 | 5;
  values: unknown;
};

export async function saveHabitDraft(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  draftId: string;
  draft: HabitWizardDraft;
  now: string;
}) {
  const values = habitFormSchema.partial().parse(input.draft.values);
  await input.repository.saveHabitDraft(
    input.owner,
    input.draftId,
    { step: input.draft.step, values },
    input.now,
  );
}

export async function loadHabitDraft(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  draftId: string;
}): Promise<HabitWizardDraft | null> {
  const payload = await input.repository.getHabitDraft(input.owner, input.draftId);
  if (!payload || typeof payload !== 'object') return null;
  const draft = payload as HabitWizardDraft;
  return draft.step >= 1 && draft.step <= 5 ? draft : null;
}
```

- [x] **Step 5: Implement activation result mapping**

Create `src/features/habits/application/activate-habit.ts`:

```typescript
export type ActiveLimitResolution =
  | { action: 'pause_existing'; habitId: string }
  | { action: 'keep_draft' }
  | { action: 'create_account' }
  | { action: 'cancel' };

export function activeLimitOptions(planTier: 'guest' | 'free' | 'premium') {
  if (planTier === 'guest') {
    return ['pause_existing', 'create_account', 'keep_draft', 'cancel'] as const;
  }
  if (planTier === 'free') {
    return ['pause_existing', 'keep_draft', 'cancel'] as const;
  }
  return ['pause_existing', 'keep_draft', 'cancel'] as const;
}
```

- [x] **Step 6: Run focused checks**

Run:

```bash
pnpm test:habits
pnpm typecheck
pnpm lint
```

Expected: all habit application tests pass.

- [x] **Step 7: Commit application services**

Run:

```bash
git add src/features/habits tests/features/habits
git commit -m "feat: orchestrate habit creation and drafts"
```

---

## Task 8: Build the Route-Backed Habit Creation Wizard

**Files:**

- Create: `src/features/habits/components/habit-wizard.tsx`
- Create: `src/features/habits/components/habit-wizard-footer.tsx`
- Create: `src/features/habits/components/leave-draft-dialog.tsx`
- Create: `src/features/habits/components/active-limit-dialog.tsx`
- Create: `tests/features/habits/habit-wizard.test.tsx`
- Create: `tests/features/habits/active-limit-dialog.test.tsx`
- Modify: `src/app/(application)/habits/new/page.tsx`

- [x] **Step 1: Write failing component tests**

Create `tests/features/habits/habit-wizard.test.tsx` and verify:

- the wizard exposes five named steps;
- Step 2 requires distinct Normal and Minimum fields;
- navigation preserves entered values;
- `Save draft and leave`, `Discard changes`, and `Continue editing` are all available after a dirty form attempts to leave;
- review displays active-slot impact and first-session guidance;
- the mobile footer remains keyboard reachable and does not cover form content.

Create `tests/features/habits/active-limit-dialog.test.tsx` and verify Guest options are `Pause an Active Habit`, `Create Account`, `Keep as Draft`, and `Cancel`.

- [x] **Step 2: Run tests and confirm failure**

Run:

```bash
pnpm vitest run tests/features/habits/habit-wizard.test.tsx tests/features/habits/active-limit-dialog.test.tsx
```

Expected: FAIL because the components do not exist.

- [x] **Step 3: Implement the wizard with React Hook Form and Zod**

The root component must use:

```tsx
const form = useForm<HabitFormValues>({
  resolver: zodResolver(habitFormSchema),
  defaultValues,
  mode: 'onBlur',
  shouldUnregister: false,
});
```

Implement these steps in order:

1. `Goal and name`
2. `Normal and Minimum`
3. `Schedule and cue`
4. `Optional reminder`
5. `Review and create`

Each step must use semantic fieldsets, visible labels, inline errors linked with `aria-describedby`, and a stable progress indicator. The Review step must display the exact values held by React Hook Form, not duplicated component state.

- [x] **Step 4: Implement save/discard/continue behavior**

`LeaveDraftDialog` must:

- open only when `formState.isDirty` is true;
- call `saveHabitDraft` before navigating on `Save draft and leave`;
- delete the draft on `Discard changes`;
- close without navigation on `Continue editing`;
- keep focus trapped while open and return focus to the triggering control.

- [x] **Step 5: Implement active-limit resolution without destructive defaults**

`ActiveLimitDialog` must:

- state the Guest limit of three;
- list active habits by title;
- keep the new habit as a draft unless the user explicitly pauses another habit;
- never delete or archive a habit automatically;
- keep `Cancel` visually available and initially focused for destructive choices.

- [x] **Step 6: Wire `/app/habits/new`**

Create `src/app/(application)/habits/new/page.tsx` as a Server Component that renders page metadata and a narrow Client Component boundary for `HabitWizard`. It must not import Dexie from the Server Component.

- [x] **Step 7: Run component, accessibility, and static checks**

Run:

```bash
pnpm test:habits
pnpm test:accessibility
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands pass; the route builds as a responsive web page.

- [x] **Step 8: Commit the habit wizard**

Run:

```bash
git add src/features/habits/components src/app/'(application)'/habits/new tests/features/habits
git commit -m "feat: build accessible habit creation wizard"
```

---

## Task 9: Implement Habit List, Detail, Versions, and History Reads

**Files:**

- Create: `src/features/habits/application/list-habits.ts`
- Create: `src/features/habits/application/get-habit-detail.ts`
- Create: `src/features/habits/components/habit-card.tsx`
- Create: `src/features/habits/components/habit-list.tsx`
- Create: `src/features/habits/components/habit-detail.tsx`
- Create: `src/features/habits/components/habit-history.tsx`
- Create: `src/features/habits/queries/habit-query-keys.ts`
- Create: `tests/features/habits/habit-list.test.tsx`
- Create: `tests/features/habits/habit-detail.test.tsx`
- Modify: `src/lib/repositories/guest/dexie-product-repository.ts`
- Modify: `src/app/(application)/habits/page.tsx`
- Modify: `src/app/(application)/habits/[habitId]/page.tsx`
- Create: `src/app/(application)/habits/[habitId]/history/page.tsx`

- [x] **Step 1: Write failing repository and component tests**

Add tests that prove:

- `listHabits` returns owner-scoped non-deleted habits ordered by most recently updated;
- active-limit summary reads `3 active habits maximum` for Guest;
- Habit Detail exposes Overview, History, Insights, and Versions tabs while Insights can display an unavailable-for-now state;
- Versions list is ordered descending and cannot edit historical rows;
- History labels Full, Minimum, Manual Skipped, Automatic Skipped, and Unrecorded with text and icon, not color alone.

- [x] **Step 2: Run focused tests and confirm failure**

Run:

```bash
pnpm vitest run tests/features/habits/habit-list.test.tsx tests/features/habits/habit-detail.test.tsx
```

Expected: FAIL because list/detail reads and components are not implemented.

- [x] **Step 3: Complete Guest repository list and detail methods**

Implement `listHabits` with the compound owner index and filter `deletedAt === null`.

Implement `getHabitDetail` in a single Dexie read transaction over `habits`, `habitVersions`, `sessions`, and `checkIns`. Map JSON targets and cues through narrow runtime validators. Return `null` when the habit does not belong to the owner.

- [x] **Step 4: Implement application read services**

`listHabits.ts` and `get-habit-detail.ts` must accept a `ProductRepository` and `ProductOwner`, then return repository reads without React dependencies. They may add display-safe derived labels but may not recalculate domain metrics differently from shared domain functions.

- [x] **Step 5: Implement responsive list and detail components**

Follow `UI-SPEC.md`:

- desktop Habits may use a two-column card grid;
- mobile uses one column;
- detail desktop uses a main column and summary rail;
- detail mobile uses back navigation and scrollable tabs;
- status always includes a visible text label;
- no history row is deleted or mutated from the list UI.

- [x] **Step 6: Wire routes and not-found behavior**

`/app/habits/[habitId]` must render `notFound()` only after the client repository reports a missing owner-scoped habit. While Guest IndexedDB initializes, show the approved loading structure rather than a false not-found state.

- [x] **Step 7: Run feature and route checks**

Run:

```bash
pnpm test:habits
pnpm test:indexed-db
pnpm test:accessibility
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands pass.

- [x] **Step 8: Commit habit read surfaces**

Run:

```bash
git add src/features/habits src/lib/repositories/guest src/app/'(application)'/habits tests/features/habits
git commit -m "feat: add habit list detail versions and history"
```

---

## Task 10: Implement Today Read Models and Ordering

**Files:**

- Create: `src/features/today/today-types.ts`
- Create: `src/features/today/today-ordering.ts`
- Create: `src/features/today/application/get-today-read-model.ts`
- Create: `src/features/today/public.ts`
- Create: `tests/features/today/get-today-read-model.test.ts`
- Modify: `src/lib/repositories/guest/dexie-product-repository.ts`

- [x] **Step 1: Write failing Today read-model tests**

Create `tests/features/today/get-today-read-model.test.ts` and prove:

- unresolved attention items sort before timed unrecorded sessions;
- unrecorded sorts before recorded sessions;
- timed sessions sort chronologically;
- all-recorded summary counts Full and Minimum as successful;
- no-habits, no-eligible-sessions, and all-recorded are distinct states;
- an Automatic Skipped historical row never appears as a user action.

- [x] **Step 2: Run the test and confirm failure**

Run:

```bash
pnpm test:today
```

Expected: FAIL because Today modules do not exist.

- [x] **Step 3: Define Today view types**

Create `src/features/today/today-types.ts`:

```typescript
import type { SessionSummary } from '@/lib/repositories/product-repository';

export type TodayEmptyState = 'none' | 'no_habits' | 'no_eligible_sessions' | 'all_recorded';

export type TodayReadModel = {
  localDate: string;
  sessions: SessionSummary[];
  activeHabitCount: number;
  activeHabitLimit: number;
  successfulCount: number;
  minimumCount: number;
  remainingCount: number;
  emptyState: TodayEmptyState;
};
```

- [x] **Step 4: Implement deterministic ordering**

Create `src/features/today/today-ordering.ts`:

```typescript
import type { SessionSummary } from '@/lib/repositories/product-repository';

const statusPriority: Record<SessionSummary['status'], number> = {
  unrecorded: 0,
  manual_skipped: 2,
  automatic_skipped: 3,
  minimum: 4,
  full: 5,
  excused: 6,
};

export function orderTodaySessions(sessions: SessionSummary[]): SessionSummary[] {
  return [...sessions].sort((left, right) => {
    const byStatus = statusPriority[left.status] - statusPriority[right.status];
    if (byStatus !== 0) return byStatus;
    const leftTime = left.scheduledLocalTime ?? '99:99';
    const rightTime = right.scheduledLocalTime ?? '99:99';
    return leftTime.localeCompare(rightTime) || left.title.localeCompare(right.title);
  });
}
```

- [x] **Step 5: Implement the Today application read model**

Create `src/features/today/application/get-today-read-model.ts`:

```typescript
import { orderTodaySessions } from '@/features/today/today-ordering';
import type { TodayReadModel } from '@/features/today/today-types';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function getTodayReadModel(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  localDate: string;
}): Promise<TodayReadModel> {
  const read = await input.repository.getToday(input.owner, input.localDate);
  const sessions = orderTodaySessions(read.sessions);
  const successfulCount = sessions.filter(
    (session) => session.status === 'full' || session.status === 'minimum',
  ).length;
  const minimumCount = sessions.filter((session) => session.status === 'minimum').length;
  const remainingCount = sessions.filter((session) => session.status === 'unrecorded').length;

  const emptyState =
    read.activeHabitCount === 0
      ? 'no_habits'
      : sessions.length === 0
        ? 'no_eligible_sessions'
        : remainingCount === 0
          ? 'all_recorded'
          : 'none';

  return {
    ...read,
    sessions,
    successfulCount,
    minimumCount,
    remainingCount,
    emptyState,
  };
}
```

- [x] **Step 6: Complete Guest repository `getToday`**

Read owner-scoped sessions for `localDate`, join current habit and Habit Version values in one Dexie transaction, map targets and cues, count slot-consuming habits, and return the Guest limit from `activeHabitLimitFor('guest')`.

- [x] **Step 7: Run Today, domain, and IndexedDB tests**

Run:

```bash
pnpm test:today
pnpm test:domain
pnpm test:indexed-db
pnpm typecheck
pnpm lint
```

Expected: all commands pass.

- [x] **Step 8: Commit Today read models**

Run:

```bash
git add src/features/today src/lib/repositories/guest tests/features/today
git commit -m "feat: build deterministic today read model"
```

---

## Task 11: Build the Today Dashboard and Session Card States

**Files:**

- Create: `src/features/today/components/daily-progress-card.tsx`
- Create: `src/features/today/components/first-check-in-guide.tsx`
- Create: `src/features/today/components/today-empty-state.tsx`
- Create: `src/features/today/components/today-session-card.tsx`
- Create: `src/features/today/components/today-page-client.tsx`
- Create: `tests/features/today/today-page.test.tsx`
- Create: `tests/features/today/today-session-card.test.tsx`
- Modify: `src/app/(application)/today/page.tsx`
- Create: `src/app/(application)/today/loading.tsx`
- Create: `src/app/(application)/today/error.tsx`

- [x] **Step 1: Write failing Today component tests**

Prove:

- every unrecorded session card exposes visible `Full`, `Minimum`, and `Skipped` buttons;
- actions remain reachable by keyboard and do not depend on hover;
- Minimum uses positive wording and a direct text label;
- recorded cards expose `Edit` for the same-day window;
- pending, failed, conflict, paused, and Recovery labels use icon plus text;
- no-habits state links to `/app/habits/new`;
- no-eligible state reports the next session when available;
- all-recorded state says `Full and Minimum both support continuity.`

- [x] **Step 2: Run component tests and confirm failure**

Run:

```bash
pnpm vitest run tests/features/today/today-page.test.tsx tests/features/today/today-session-card.test.tsx
```

Expected: FAIL because Today components do not exist.

- [x] **Step 3: Implement the daily progress card**

Display completed count, Minimum count, remaining count, and a text summary. The circular progress must expose an accessible name and cannot use a punitive missed count as the dominant metric.

- [x] **Step 4: Implement stable session-card anatomy**

`TodaySessionCard` must preserve the same layout across states:

```text
Habit name
Normal version
Minimum version
Cue or scheduled time
Current status
Action group or Edit action
```

Use the shared UI tokens from Plan 02. State changes may replace the action row but must not move the title, targets, or schedule.

- [x] **Step 5: Implement first check-in guidance**

The guide must be non-blocking, dismissible, and stored as a browser-local setting. It explains Full, Minimum, and Skipped without covering the action buttons. Help remains available from the session-card overflow menu.

- [x] **Step 6: Implement route loading and error surfaces**

`loading.tsx` must use skeletons matching the final card dimensions. `error.tsx` must preserve the application shell, display an icon, heading, explanation, and Retry action, and must not rely on red alone.

- [x] **Step 7: Wire the Today route with a narrow Client Component boundary**

The Server Component renders page metadata and shell framing. `TodayPageClient` initializes the Guest repository, ensures the horizon, resolves eligible expired local records, reads Today, and subscribes to Dexie live changes. It must not claim cloud synchronization in Guest mode.

- [x] **Step 8: Run component, accessibility, visual, and build checks**

Run:

```bash
pnpm test:today
pnpm test:component
pnpm test:accessibility
pnpm test:visual
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands pass and card layout remains stable in tested states.

- [x] **Step 9: Commit Today UI**

Run:

```bash
git add src/features/today/components src/app/'(application)'/today tests/features/today
git commit -m "feat: build responsive today dashboard"
```

---

## Task 12: Implement Full, Minimum, and Skipped Check-ins

**Files:**

- Create: `src/features/check-ins/check-in-command.ts`
- Create: `src/features/check-ins/forms/friction-form-schema.ts`
- Create: `src/features/check-ins/application/record-check-in.ts`
- Create: `src/features/check-ins/components/check-in-action-group.tsx`
- Create: `src/features/check-ins/components/friction-dialog.tsx`
- Create: `src/features/check-ins/components/check-in-confirmation.tsx`
- Create: `src/features/check-ins/public.ts`
- Create: `tests/features/check-ins/friction-form-schema.test.ts`
- Create: `tests/features/check-ins/record-check-in.test.ts`
- Create: `tests/features/check-ins/check-in-components.test.tsx`
- Modify: `src/lib/repositories/guest/dexie-product-repository.ts`

- [x] **Step 1: Write failing check-in tests**

Prove:

- Full and Minimum save in one repository call with stable command IDs;
- Minimum returns a successful confirmation message;
- Skipped accepts no reason, a controlled reason, or a controlled reason plus private note;
- duplicate command replay returns the same check-in ID;
- a repeated click cannot create a second current check-in;
- stale session revision is rejected;
- friction notes are absent from analytics-facing event data.

- [x] **Step 2: Run focused tests and confirm failure**

Run:

```bash
pnpm test:check-ins
```

Expected: FAIL because check-in modules do not exist.

- [x] **Step 3: Define the friction form schema**

Create `src/features/check-ins/forms/friction-form-schema.ts`:

```typescript
import { z } from 'zod';

import { frictionReasons } from '@/domain/check-ins/check-in';

export const frictionFormSchema = z.object({
  frictionCode: z.enum(frictionReasons).nullable(),
  frictionNote: z.string().trim().max(240).nullable(),
});
```

- [x] **Step 4: Define check-in command creation**

Create `src/features/check-ins/check-in-command.ts`:

```typescript
import type { UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import type { ProductOwner, RecordCheckInRepositoryCommand } from '@/lib/repositories/product-repository';

export function createRecordCheckInCommand(input: {
  commandId: string;
  owner: ProductOwner;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  frictionCode?: string | null;
  frictionNote?: string | null;
  expectedSessionRevision: number;
  now: string;
}): RecordCheckInRepositoryCommand {
  return {
    commandId: input.commandId,
    owner: input.owner,
    sessionId: input.sessionId,
    outcome: input.outcome,
    frictionCode: input.frictionCode ?? null,
    frictionNote: input.frictionNote ?? null,
    expectedSessionRevision: input.expectedSessionRevision,
    clientRecordedAt: input.now,
  };
}
```

- [x] **Step 5: Implement record-check-in application orchestration**

Create `src/features/check-ins/application/record-check-in.ts`:

```typescript
import { createRecordCheckInCommand } from '@/features/check-ins/check-in-command';
import { frictionFormSchema } from '@/features/check-ins/forms/friction-form-schema';
import type { UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function recordCheckIn(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  commandId: string;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  friction: unknown;
  expectedSessionRevision: number;
  now: string;
}) {
  const friction = frictionFormSchema.parse(input.friction);
  const result = await input.repository.recordCheckIn(
    createRecordCheckInCommand({ ...input, ...friction }),
  );
  return {
    result,
    confirmation:
      result.outcome === 'minimum'
        ? 'Minimum completed — you kept the habit alive today.'
        : result.outcome === 'full'
          ? 'Full completed.'
          : 'Skipped recorded — your history remains intact.',
  };
}
```

- [x] **Step 6: Complete Guest repository `recordCheckIn` atomically**

Inside one Dexie transaction over `sessions`, `checkIns`, and `commandResults`:

1. check command replay by `commandId`;
2. verify owner and session existence;
3. verify `expectedSessionRevision`;
4. reject non-user-recordable outcomes;
5. create one new current `LocalCheckInRecord` with a deterministic UUID supplied by the command service or repository UUID factory;
6. update session outcome and increment revision;
7. preserve any prior check-in as a history row rather than overwriting its record;
8. write the idempotency replay result;
9. write the request hash and result to `commandResults`;
10. return the transaction result.

For Guest mode, set synchronization state to `local_only`, not `pending`.

- [x] **Step 7: Implement action group, friction surface, and confirmation**

- `Full` and `Minimum` save directly.
- `Skipped` opens the responsive friction dialog.
- `Skip explanation` saves Manual Skipped with no friction.
- Disable only the submitted session action group while its transaction runs.
- Restore controls and announce an error when the transaction fails.
- Use `aria-live="polite"` for normal confirmations.

- [x] **Step 8: Run focused and integration checks**

Run:

```bash
pnpm test:check-ins
pnpm test:today
pnpm vitest run tests/integration/guest-habit-core-loop.test.ts
pnpm test:indexed-db
pnpm typecheck
pnpm lint
```

Expected: all commands pass; Full, Minimum, and Manual Skipped remain distinct.

- [x] **Step 9: Commit check-in creation**

Run:

```bash
git add src/features/check-ins src/lib/repositories/guest tests/features/check-ins tests/integration/guest-habit-core-loop.test.ts
git commit -m "feat: record full minimum and skipped check-ins"
```

---

## Task 13: Implement Same-Day Check-in Editing and Immutable History

**Files:**

- Create: `src/features/check-ins/application/edit-check-in.ts`
- Create: `src/features/check-ins/components/edit-check-in-dialog.tsx`
- Create: `tests/features/check-ins/edit-check-in.test.ts`
- Modify: `src/features/habits/components/habit-history.tsx`
- Modify: `src/features/today/components/today-session-card.tsx`
- Modify: `src/lib/repositories/guest/dexie-product-repository.ts`

- [x] **Step 1: Write failing edit and history tests**

Prove:

- editing Full to Minimum creates a new check-in record and preserves the prior record;
- the session points to the latest outcome and increments revision;
- changing to Skipped keeps friction optional;
- stale session or check-in revisions are rejected;
- edits after the owner-local same-day cutoff return `same_day_edit_closed`;
- the UI explains that today’s record changes while prior history remains preserved.

- [x] **Step 2: Run focused tests and confirm failure**

Run:

```bash
pnpm vitest run tests/features/check-ins/edit-check-in.test.ts
```

Expected: FAIL because edit orchestration is not implemented.

- [x] **Step 3: Implement edit orchestration**

Create `src/features/check-ins/application/edit-check-in.ts`:

```typescript
import { frictionFormSchema } from '@/features/check-ins/forms/friction-form-schema';
import type { UserRecordableCheckInOutcome } from '@/domain/check-ins/check-in';
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function editCheckIn(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  commandId: string;
  currentCheckInId: string;
  sessionId: string;
  outcome: UserRecordableCheckInOutcome;
  friction: unknown;
  expectedSessionRevision: number;
  expectedCheckInRevision: number;
  now: string;
}) {
  const friction = frictionFormSchema.parse(input.friction);
  return input.repository.editCheckIn({
    commandId: input.commandId,
    owner: input.owner,
    currentCheckInId: input.currentCheckInId,
    sessionId: input.sessionId,
    outcome: input.outcome,
    frictionCode: friction.frictionCode,
    frictionNote: friction.frictionNote,
    expectedSessionRevision: input.expectedSessionRevision,
    expectedCheckInRevision: input.expectedCheckInRevision,
    clientRecordedAt: input.now,
  });
}
```

- [x] **Step 4: Complete Guest repository `editCheckIn`**

Use one Dexie transaction. Never update the prior check-in row in place. Add a new check-in record, update the session projection, preserve both records for history, and store the idempotent replay result. Verify the local date using the session’s timezone snapshot and a deterministic clock helper.

- [x] **Step 5: Implement the edit dialog and entry points**

Entry points:

- recorded Today session card;
- Habit History for the current local day;
- confirmation action.

The dialog must show the current outcome, all alternatives, optional friction when Skipped, metric-impact text, Cancel, and explicit Save Changes.

- [x] **Step 6: Run edit, history, and regression checks**

Run:

```bash
pnpm test:check-ins
pnpm test:habits
pnpm test:today
pnpm vitest run tests/integration/guest-habit-core-loop.test.ts
pnpm typecheck
pnpm lint
```

Expected: all commands pass and prior history remains queryable.

- [ ] **Step 7: Commit same-day edits**

Run:

```bash
git add src/features/check-ins src/features/habits/components src/features/today/components src/lib/repositories/guest tests/features/check-ins tests/integration/guest-habit-core-loop.test.ts
git commit -m "feat: preserve history during same day check-in edits"
```

---

## Task 14: Implement Unrecorded Resolution and Three-Day Conversion

**Files:**

- Create: `src/features/sessions/application/resolve-expired-unrecorded.ts`
- Create: `tests/features/sessions/resolve-expired-unrecorded.test.ts`
- Modify: `src/lib/repositories/guest/dexie-product-repository.ts`
- Modify: `src/features/today/components/today-page-client.tsx`
- Modify: `src/features/habits/components/habit-history.tsx`

- [x] **Step 1: Write failing resolution tests**

Prove:

- an unresolved session before `resolutionDueAt` remains `unrecorded`;
- an unresolved session after `resolutionDueAt` becomes `automatic_skipped`;
- Automatic Skipped does not create a Manual Skipped check-in row;
- Automatic Skipped does not increment the Manual Skipped Recovery counter;
- a resolved Full, Minimum, or Manual Skipped session is never reclassified;
- rerunning resolution is idempotent.

- [x] **Step 2: Run the test and confirm failure**

Run:

```bash
pnpm vitest run tests/features/sessions/resolve-expired-unrecorded.test.ts
```

Expected: FAIL because resolution application logic is not implemented.

- [x] **Step 3: Implement the resolution application service**

Create `src/features/sessions/application/resolve-expired-unrecorded.ts`:

```typescript
import type { ProductOwner, ProductRepository } from '@/lib/repositories/product-repository';

export async function resolveExpiredUnrecorded(input: {
  repository: ProductRepository;
  owner: ProductOwner;
  now: string;
}): Promise<number> {
  return input.repository.resolveExpiredUnrecorded(input.owner, input.now);
}
```

- [x] **Step 4: Complete the Guest repository resolution transaction**

Query owner-scoped sessions with `status === 'unrecorded'` and `resolutionDueAt < now`. Update only those sessions to `automatic_skipped`, increment revision, and preserve synchronization state. Do not create a check-in row and do not call Manual Skipped counter logic.

- [x] **Step 5: Invoke safe catch-up before Today reads**

`TodayPageClient` calls resolution once after local repository initialization and before its first Today read. The operation must be safe to rerun on reload.

- [x] **Step 6: Display Automatic Skipped distinctly in history**

Use text `Automatically marked skipped after the check-in window closed` with a clock-related icon. Do not offer friction editing for an Automatic Skipped record.

- [x] **Step 7: Run session, domain, and full core-loop tests**

Run:

```bash
pnpm test:sessions
pnpm test:domain
pnpm test:core-loop
pnpm typecheck
pnpm lint
```

Expected: all commands pass.

- [ ] **Step 8: Commit Unrecorded resolution**

Run:

```bash
git add src/features/sessions src/features/today/components src/features/habits/components src/lib/repositories/guest tests/features/sessions
git commit -m "feat: resolve expired unrecorded sessions"
```

---

## Task 15: Implement the Signed-in Supabase Repository Adapter Contract

**Files:**

- Create: `src/lib/repositories/signed-in/supabase-product-repository.ts`
- Create: `src/lib/repositories/signed-in/supabase-product-repository.test.ts`
- Create: `tests/integration/signed-in-product-repository.test.ts`

- [ ] **Step 1: Write failing adapter tests with a typed Supabase mock**

Prove:

- habit creation calls the Plan 03 transactional `activate_habit` or approved create-and-activate RPC with command ID and expected ownership context;
- Today reads from `today_session_view`;
- detail reads from `habit_summary_view` plus owner-scoped history;
- check-in creation calls the Plan 03 check-in RPC with expected revision and idempotency key;
- database error codes map to `ProductRepositoryError` codes;
- no browser service-role client is accepted.

- [ ] **Step 2: Run adapter tests and confirm failure**

Run:

```bash
pnpm vitest run src/lib/repositories/signed-in/supabase-product-repository.test.ts tests/integration/signed-in-product-repository.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement a dependency-injected adapter**

The constructor accepts only an authenticated, typed Supabase client and an explicit user ID. It must implement the same `ProductRepository` interface. Mutations call Plan 03 RPCs; reads call security-invoker views or owner-scoped tables. The adapter must never infer Premium entitlement from browser storage.

- [ ] **Step 4: Map database errors centrally**

Map:

```text
active_habit_limit_reached -> active_limit_reached
stale_revision -> stale_revision
idempotency_payload_conflict -> idempotency_conflict
same_day_edit_closed -> same_day_edit_closed
row_not_found or RLS denial -> habit_not_found/session_not_found as operation appropriate
```

Unknown errors map to `repository_unavailable` while retaining a privacy-safe internal cause for monitoring adapters introduced later.

- [ ] **Step 5: Verify RLS and typed database contracts**

Run:

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm vitest run src/lib/repositories/signed-in/supabase-product-repository.test.ts tests/integration/signed-in-product-repository.test.ts
pnpm db:stop
```

Expected: database tests and repository adapter tests pass.

- [ ] **Step 6: Commit the signed-in-compatible adapter**

Run:

```bash
git add src/lib/repositories/signed-in tests/integration/signed-in-product-repository.test.ts
git commit -m "feat: add supabase product repository adapter"
```

---

## Task 16: Add Accessibility and End-to-End Coverage for the Guest Core Loop

**Files:**

- Create: `tests/accessibility/guest-core-loop.accessibility.test.tsx`
- Create: `tests/e2e/guest-core-loop.spec.ts`
- Modify: `playwright.config.ts` only if a named mobile project is not already defined

- [ ] **Step 1: Write accessibility coverage**

Cover:

- wizard field labels, error associations, step progress, and focus movement;
- Today Full/Minimum/Skipped button names;
- Minimum announced as a successful outcome;
- friction dialog focus trap and optional reason semantics;
- confirmation announcements;
- active-limit dialog focus and non-destructive default;
- status labels independent of color;
- 200% zoom without overlapping action controls.

- [ ] **Step 2: Write the desktop Guest core-loop Playwright test**

The test must:

1. open a clean browser context;
2. enter Guest mode;
3. create a custom habit with Normal and Minimum definitions;
4. verify the habit appears in Today;
5. record Minimum;
6. reload and verify the recorded state persists;
7. edit the same-day result to Full;
8. open Habit History and verify both historical records remain represented;
9. create two more active habits;
10. attempt a fourth and verify the active-limit dialog;
11. keep the fourth as a draft;
12. reload and verify the draft remains recoverable.

- [ ] **Step 3: Write the mobile-web Guest core-loop test**

Use a 390 px viewport and verify:

- bottom navigation remains visible outside focused wizard/dialog surfaces;
- wizard fields and sticky actions do not overlap;
- Skipped opens a mobile drawer;
- `Skip explanation` records successfully;
- Today cards do not require horizontal scrolling;
- touch targets remain at least the approved minimum size.

- [ ] **Step 4: Run accessibility and browser suites**

Run:

```bash
pnpm test:accessibility
pnpm test:e2e -- --grep "Guest core loop"
pnpm test:visual
```

Expected: all suites pass on desktop and mobile-web projects.

- [ ] **Step 5: Commit end-to-end coverage**

Run:

```bash
git add tests/accessibility/guest-core-loop.accessibility.test.tsx tests/e2e/guest-core-loop.spec.ts playwright.config.ts
git commit -m "test: cover guest habit core loop"
```

---

## Task 17: Run the Plan 04 Quality Gate and Record the Handoff

**Files:**

- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [ ] **Step 1: Mark Plan 04 verified only after every prior task commit exists**

In `docs/implementation/IMPLEMENTATION-PLAN.md`, update only the Plan 04 tracking row from:

```markdown
| 04 | `04-habits-sessions-checkins.md` | Not created | Plan 03 verified |
```

to:

```markdown
| 04 | `04-habits-sessions-checkins.md` | Verified complete | Plan 03 verified |
```

Do not mark Plan 05 started.

- [ ] **Step 2: Run all focused Plan 04 suites**

Run:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:templates
pnpm test:habits
pnpm test:sessions
pnpm test:today
pnpm test:check-ins
pnpm test:core-loop
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

Expected: Plan 01–03 regressions and all Plan 04 tests pass; production build succeeds.

- [ ] **Step 4: Run complete database verification**

Run:

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm exec supabase db lint --local --level warning
pnpm db:stop
```

Expected: all migrations, pgTAP tests, generated-type checks, and database lint pass.

- [ ] **Step 5: Run repository policy checks**

Run:

```bash
pnpm check:repository
git diff --check
git status --short
```

Expected: only the master-plan status change is uncommitted.

- [ ] **Step 6: Commit the verified status**

Run:

```bash
git add docs/implementation/IMPLEMENTATION-PLAN.md
git commit -m "docs: mark habits sessions check-ins plan verified"
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
pnpm test:core-loop
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

- [ ] **Step 8: Capture final evidence**

Run:

```bash
cd -
git log --oneline --decorate -18
git status --short
```

Expected: Plan 04 commits appear in order and the working tree is clean.

---

# 4. Final Acceptance Checklist

Plan 04 is complete only when fresh command output proves every item:

- [ ] Basic templates provide editable Normal and Minimum definitions.
- [ ] Custom habit creation uses a route-backed five-step wizard.
- [ ] React Hook Form owns wizard state and Zod validates every submitted value.
- [ ] Draft save, restore, discard, and continue-editing paths work.
- [ ] Draft habits consume no active slot and generate no sessions.
- [ ] Dexie version 3 preserves existing records and adds durable command-result replay storage.
- [ ] Guest creation writes the habit, immutable version, sessions, and replay record atomically.
- [ ] A Guest can activate at most three slot-consuming habits.
- [ ] Attempting a fourth active habit leaves no partial habit, version, or session records.
- [ ] Active-limit resolution never deletes another habit automatically.
- [ ] Session generation is deterministic, bounded, timezone-snapshotted, DST-tested, and duplicate-safe.
- [ ] Existing sessions retain their original Habit Version and timezone snapshot.
- [ ] Today distinguishes no habits, no eligible sessions, all recorded, and active sessions.
- [ ] Today orders action-required and unrecorded sessions before completed sessions.
- [ ] Full, Minimum, and Skipped are immediately distinguishable by text.
- [ ] Minimum is counted and presented as a successful continuity outcome.
- [ ] Skipped friction reason and note remain optional.
- [ ] Free-text friction notes are excluded from analytics-facing data.
- [ ] Guest check-in writes are atomic and confirm from IndexedDB transaction results.
- [ ] Duplicate command replay does not create duplicate check-ins.
- [ ] Stale session revisions are rejected.
- [ ] Same-day edits preserve prior check-in rows and update the current session projection.
- [ ] Closed edit windows produce a clear non-destructive explanation.
- [ ] Unrecorded sessions remain resolvable within the three-day window.
- [ ] Expired unresolved sessions become Automatic Skipped idempotently.
- [ ] Automatic Skipped remains distinct from Manual Skipped and does not trigger Manual Skipped Recovery counting.
- [ ] Habit Detail includes Overview, History, Insights, and Versions surfaces.
- [ ] Historical versions and check-ins are never silently deleted or rewritten.
- [ ] The signed-in Supabase adapter implements the same repository interface and calls authoritative Plan 03 functions/views.
- [ ] Browser code never receives a service-role client.
- [ ] Desktop and 390 px mobile-web Guest core-loop tests pass.
- [ ] Keyboard, screen-reader, focus, contrast, target-size, 200% zoom, and reduced-motion checks pass.
- [ ] Formatting, lint, strict typecheck, unit, component, integration, accessibility, E2E, visual, database, and build checks pass.
- [ ] Clean-checkout verification passes.
- [ ] Working tree is clean.

---

# 5. Plan 05 Handoff Contract

Plan 05 may begin only after every Final Acceptance Checklist item passes.

Plan 04 supplies these verified contracts:

- account-neutral `ProductRepository` reads and commands;
- canonical Guest Dexie repository implementation;
- signed-in-compatible Supabase repository adapter;
- validated habit-creation forms and editable basic templates;
- atomic Guest habit, immutable version, and initial-session creation;
- active-limit handling without destructive defaults;
- deterministic bounded session generation and safe horizon extension;
- Today read models and stable responsive card states;
- Full, Minimum, and Manual Skipped check-ins;
- optional controlled friction and private notes;
- idempotent check-in commands and optimistic revision enforcement;
- immutable same-day edit history;
- three-day Unrecorded resolution and Automatic Skipped conversion;
- browser-local persistence verified across reload;
- desktop and mobile-web Guest core-loop coverage.

Plan 05 must consume these contracts to add durable pending-operation processing, connectivity state, multiple-tab coordination, conflict resolution, Web Push registration, reminder scheduling, delivery-state honesty, and optional email-reminder interfaces. It must not replace the repository interface, rewrite session identity, collapse Full and Minimum, or reinterpret Automatic Skipped.
