# Offline Resilience and Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable browser resilience, idempotent signed-in synchronization, same-origin multi-tab coordination, installable PWA behavior, and capability-aware in-app, Web Push, and email reminder delivery without making false delivery claims.

**Architecture:** IndexedDB through Dexie remains the durable browser boundary. Signed-in mutations are written first as stable command envelopes, then processed by one leased queue worker per account and installation. PostgreSQL remains authoritative for acknowledged account data. A service worker caches only the approved shell and handles push display and notification clicks; it does not execute product domain rules. Reminder intent is stored independently from channel delivery, and every dispatch attempt is idempotent, auditable, cancellable, and explicit about provider acceptance versus human receipt.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Dexie, TanStack Query, Supabase PostgreSQL, Supabase Edge Functions, BroadcastChannel, Service Worker API, Notifications API, Push API, Web Push/VAPID, Vitest, React Testing Library, Playwright, pgTAP, pnpm.

---

# 1. Prerequisites and Boundaries

## Prerequisites

This plan begins only after Plans 01–04 are verified complete. The repository must already provide:

- strict TypeScript and deterministic clock/UUID contracts;
- the responsive application shell and operational-state components;
- PostgreSQL domain schema, RLS, reminder configuration tables, and generated database types;
- versioned Dexie Guest/cache/draft/pending-operation storage;
- `ProductRepository` and signed-in-compatible repository contracts;
- deterministic sessions, Today read models, and idempotent check-in commands;
- Plan 04 Guest core-loop browser coverage.

## Explicit exclusions

This plan does not implement:

- lifecycle recommendation logic;
- Recovery trigger or Recovery plan evaluation;
- Weekly Review generation;
- Guest-to-account conversion;
- sign-in or account-management screens;
- Premium adaptive reminder analysis;
- checkout, billing, or entitlement enforcement;
- account export or deletion;
- production release certification.

## Product invariants

- Browser `navigator.onLine` is a hint, not proof that the application server is reachable.
- Guest canonical writes remain browser-local and are not uploaded implicitly.
- Signed-in PostgreSQL data remains canonical after acknowledgement.
- Stable command IDs and idempotency keys survive reload, retry, tab changes, and temporary network loss.
- Full, Minimum, Manual Skipped, and Automatic Skipped remain distinct.
- Queue retry never silently overwrites a conflict.
- Reminder scheduling does not imply provider acceptance or human receipt.
- Notification permission is requested only after contextual explanation and explicit user action.
- Push content excludes habit names, private notes, and friction free text.
- Service-worker code does not contain lifecycle, Recovery, entitlement, or billing rules.

---

# 2. File Map

```text
src/
├── app/
│   ├── api/
│   │   ├── connectivity/route.ts
│   │   ├── sync/
│   │   │   ├── commands/route.ts
│   │   │   └── pull/route.ts
│   │   └── reminders/
│   │       ├── preferences/route.ts
│   │       ├── push-subscriptions/route.ts
│   │       └── push-subscriptions/[installationId]/route.ts
│   ├── offline/page.tsx
│   └── reminders/page.tsx
├── components/
│   └── operational-states/
│       ├── conflict-dialog.tsx
│       ├── offline-banner.tsx
│       └── synchronization-banner.tsx
├── domain/
│   └── reminders/
│       ├── compute-delivery-intents.ts
│       ├── reminder-configuration.ts
│       └── reminder-status.ts
├── features/
│   ├── reminders/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── reminder-repository.ts
│   │   └── reminder-settings-form.tsx
│   └── synchronization/
│       ├── conflict-presenter.ts
│       ├── synchronization-provider.tsx
│       └── use-synchronization-state.ts
└── lib/
    ├── offline/
    │   ├── connectivity-monitor.ts
    │   ├── connectivity-store.ts
    │   └── use-connectivity.ts
    ├── service-worker/
    │   ├── register-service-worker.ts
    │   └── service-worker-events.ts
    └── sync/
        ├── backoff.ts
        ├── command-envelope.ts
        ├── conflict-classifier.ts
        ├── leader-election.ts
        ├── pull-synchronizer.ts
        ├── queue-repository.ts
        ├── queue-worker.ts
        └── sync-client.ts
public/
├── manifest.webmanifest
├── offline.html
└── service-worker.js
supabase/
├── functions/
│   └── reminder-dispatch/
│       ├── adapters.ts
│       ├── index.ts
│       └── types.ts
├── migrations/
│   ├── 20260729020000_sync_and_reminder_delivery.sql
│   └── 20260729021000_reminder_delivery_functions.sql
└── tests/
    └── 00050_reminders_and_sync.test.sql
tests/
├── component/
│   ├── conflict-dialog.test.tsx
│   ├── connectivity-banners.test.tsx
│   └── reminder-settings.test.tsx
├── e2e/
│   ├── multi-tab-queue.spec.ts
│   ├── offline-check-in.spec.ts
│   ├── reminder-permission.spec.ts
│   └── service-worker-upgrade.spec.ts
├── integration/
│   ├── pull-synchronizer.test.ts
│   ├── queue-worker.test.ts
│   └── reminder-dispatch.test.ts
├── service-worker/
│   └── service-worker-contract.test.ts
└── unit/
    ├── connectivity-monitor.test.ts
    ├── reminder-intents.test.ts
    └── sync-backoff.test.ts
```

---

# 3. Tasks

## Task 1: Add Plan 05 Commands and Environment Contracts

**Files:**

- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/lib/env/server.ts`
- Modify: `src/lib/env/client.ts`
- Create: `docs/architecture/ADR-008-web-push-email-reminders.md`

- [ ] **Step 1: Add focused verification scripts**

Add these scripts to `package.json` without removing existing scripts:

```json
{
  "scripts": {
    "test:offline": "vitest run tests/unit/connectivity-monitor.test.ts tests/integration/queue-worker.test.ts tests/integration/pull-synchronizer.test.ts",
    "test:sync": "vitest run tests/unit/sync-backoff.test.ts tests/integration/queue-worker.test.ts tests/integration/pull-synchronizer.test.ts",
    "test:reminders": "vitest run tests/unit/reminder-intents.test.ts tests/component/reminder-settings.test.tsx tests/integration/reminder-dispatch.test.ts",
    "test:service-worker": "vitest run tests/service-worker/service-worker-contract.test.ts",
    "test:e2e:offline": "playwright test tests/e2e/offline-check-in.spec.ts tests/e2e/multi-tab-queue.spec.ts tests/e2e/service-worker-upgrade.spec.ts",
    "test:e2e:reminders": "playwright test tests/e2e/reminder-permission.spec.ts"
  }
}
```

- [ ] **Step 2: Add explicit environment variables**

Append to `.env.example`:

```dotenv
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:operations@example.com
PUSH_SUBSCRIPTION_ENCRYPTION_KEY=
REMINDER_DISPATCH_SECRET=
EMAIL_PROVIDER_API_URL=
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=reminders@example.com
```

Extend server validation so:

- VAPID values are required only when Web Push delivery is enabled;
- email provider values are required only when email delivery is enabled;
- `PUSH_SUBSCRIPTION_ENCRYPTION_KEY` decodes to exactly 32 bytes;
- private values are never exported from the client environment module.

Client validation exposes only:

```ts
export type ReminderClientEnvironment = {
  vapidPublicKey: string | null;
};
```

- [ ] **Step 3: Record the approved reminder architecture**

Create `docs/architecture/ADR-008-web-push-email-reminders.md`:

```markdown
# ADR-008: Web Push and Email Reminder Channels

## Status

Accepted.

## Decision

Reminder intent is independent from delivery channel. In-application state is always available. Web Push is installation-specific and permission-gated. Email is account-specific and opt-in. Delivery records distinguish scheduled, attempted, provider-accepted, failed, cancelled, and expired. No state claims that a person received or read a reminder.

## Consequences

- Notification permission is requested only after contextual education.
- Push payloads exclude sensitive habit content.
- Completed check-ins invalidate unnecessary follow-up intents.
- Provider outages preserve reminder intent and record failed attempts.
- Service workers display notifications and route clicks but do not run domain rules.
```

- [ ] **Step 4: Verify environment boundaries**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit -- --run src/lib/env
```

Expected: all commands exit `0`, and no private reminder variable appears in a browser bundle test.

- [ ] **Step 5: Commit**

```bash
git add package.json .env.example src/lib/env docs/architecture/ADR-008-web-push-email-reminders.md
git commit -m "chore: define offline and reminder plan contracts"
```

---

## Task 2: Define Synchronization Command, Acknowledgement, and Error Contracts

**Files:**

- Create: `src/lib/sync/command-envelope.ts`
- Create: `src/lib/sync/conflict-classifier.ts`
- Create: `tests/unit/sync-backoff.test.ts`
- Create: `tests/unit/sync-contracts.test.ts`

- [ ] **Step 1: Write failing contract tests**

Create tests proving:

```ts
import { describe, expect, it } from 'vitest';

import {
  parseSyncAcknowledgement,
  parseSyncCommandEnvelope,
} from '@/lib/sync/command-envelope';
import { classifySyncFailure } from '@/lib/sync/conflict-classifier';

describe('sync command contracts', () => {
  it('accepts a stable account command envelope', () => {
    expect(
      parseSyncCommandEnvelope({
        id: '018f0000-0000-7000-8000-000000000001',
        ownerType: 'account',
        ownerId: '018f0000-0000-7000-8000-000000000002',
        installationId: '018f0000-0000-7000-8000-000000000003',
        operationType: 'record_check_in',
        entityType: 'session',
        entityId: '018f0000-0000-7000-8000-000000000004',
        idempotencyKey: '018f0000-0000-7000-8000-000000000001',
        expectedRevision: 1,
        payload: { outcome: 'minimum' },
        createdAt: '2026-07-29T14:00:00.000Z',
      }).ownerType,
    ).toBe('account');
  });

  it('rejects Guest commands from cloud synchronization', () => {
    expect(() =>
      parseSyncCommandEnvelope({
        id: crypto.randomUUID(),
        ownerType: 'guest',
      }),
    ).toThrow();
  });

  it('classifies stale revisions as explicit conflicts', () => {
    expect(
      classifySyncFailure({ code: 'stale_revision', retryable: false }),
    ).toBe('conflict');
  });

  it('parses prior idempotent results as acknowledgements', () => {
    expect(
      parseSyncAcknowledgement({
        commandId: crypto.randomUUID(),
        status: 'duplicate_applied',
        serverTime: '2026-07-29T14:00:00.000Z',
        revisions: { session: 2 },
      }).status,
    ).toBe('duplicate_applied');
  });
});
```

- [ ] **Step 2: Run the tests and confirm failure**

```bash
pnpm exec vitest run tests/unit/sync-contracts.test.ts
```

Expected: fail because the modules do not exist.

- [ ] **Step 3: Implement complete Zod contracts**

`command-envelope.ts` must export:

```ts
export type SyncCommandEnvelope = {
  id: string;
  ownerType: 'account';
  ownerId: string;
  installationId: string;
  operationType: string;
  entityType: string;
  entityId: string;
  idempotencyKey: string;
  expectedRevision?: number;
  payload: unknown;
  createdAt: string;
};

export type SyncAcknowledgement = {
  commandId: string;
  status: 'applied' | 'duplicate_applied' | 'rejected' | 'conflict';
  serverTime: string;
  revisions: Record<string, number>;
  error?: {
    code: string;
    messageKey: string;
    retryable: boolean;
    conflict?: unknown;
  };
};
```

Use Zod UUID, ISO timestamp, non-empty operation/entity strings, non-negative revisions, and `ownerType: z.literal('account')`. Export parser functions that return typed values or throw `ZodError`.

`conflict-classifier.ts` must return one of:

```ts
type SyncFailureClass =
  | 'retryable'
  | 'authentication'
  | 'validation'
  | 'conflict'
  | 'permanent';
```

Classification rules:

- `network_unreachable`, `server_unavailable`, `rate_limited` → retryable;
- `session_expired`, `authentication_required` → authentication;
- `invalid_payload`, `active_limit_reached` → validation;
- `stale_revision`, `deleted_remotely`, `concurrent_version` → conflict;
- all other non-retryable errors → permanent.

- [ ] **Step 4: Verify**

```bash
pnpm exec vitest run tests/unit/sync-contracts.test.ts
pnpm typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync tests/unit/sync-contracts.test.ts
git commit -m "feat: define synchronization command contracts"
```

---

## Task 3: Extend Dexie for Queue Leases, Cursors, Conflicts, and Reminder State

**Files:**

- Modify: `src/lib/indexed-db/types.ts`
- Modify: `src/lib/indexed-db/schema.ts`
- Modify: `src/lib/indexed-db/database.ts`
- Modify: `src/lib/indexed-db/migrations.ts`
- Create: `tests/unit/indexed-db/offline-schema.test.ts`

- [ ] **Step 1: Write a failing version-upgrade test**

The test must create a version-3 database containing a habit, session, check-in, pending operation, and command result; then open `RecoveryFirstDatabase` and prove every prior record remains while new tables are empty.

Expected new records:

```ts
export type LocalQueueLeaseRecord = {
  leaseKey: string;
  ownerTabId: string;
  ownerInstallationId: string;
  expiresAt: string;
  renewedAt: string;
};

export type LocalSyncCursorRecord = {
  ownerId: string;
  cursor: string | null;
  synchronizedAt: string | null;
};

export type LocalSyncConflictRecord = {
  id: string;
  ownerId: string;
  commandId: string;
  entityType: string;
  entityId: string;
  code: string;
  localPayload: unknown;
  authoritativePayload: unknown;
  createdAt: string;
  resolvedAt: string | null;
};

export type LocalReminderStateRecord = {
  id: string;
  ownerType: 'guest' | 'account';
  ownerId: string;
  habitId: string;
  dueAt: string;
  kind: 'primary' | 'follow_up';
  status: 'scheduled' | 'shown' | 'dismissed' | 'cancelled' | 'expired';
  sourceRevision: number;
};
```

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm exec vitest run tests/unit/indexed-db/offline-schema.test.ts
```

Expected: fail because schema version 4 and tables are absent.

- [ ] **Step 3: Add schema version 4**

Add stores:

```ts
export const recoveryFirstStoresV4 = {
  ...recoveryFirstStoresV3,
  queueLeases: '&leaseKey, ownerTabId, expiresAt',
  syncCursors: '&ownerId, synchronizedAt',
  syncConflicts: '&id, ownerId, commandId, [entityType+entityId], resolvedAt',
  localReminderStates:
    '&id, ownerType, ownerId, habitId, dueAt, status, [ownerId+dueAt]',
};
```

Register `version(4).stores(recoveryFirstStoresV4)` without mutation of prior canonical tables. Expose typed Dexie tables on `RecoveryFirstDatabase`.

- [ ] **Step 4: Add queue-safe database methods**

Implement atomic methods:

```ts
claimQueueLease(input: {
  leaseKey: string;
  ownerTabId: string;
  ownerInstallationId: string;
  now: string;
  expiresAt: string;
}): Promise<boolean>;

renewQueueLease(input: {
  leaseKey: string;
  ownerTabId: string;
  now: string;
  expiresAt: string;
}): Promise<boolean>;

releaseQueueLease(leaseKey: string, ownerTabId: string): Promise<void>;

storeSyncConflict(record: LocalSyncConflictRecord): Promise<void>;

advanceSyncCursor(ownerId: string, cursor: string, synchronizedAt: string): Promise<void>;
```

A lease can be claimed only when absent, expired, or already owned by the same tab. Renewal by another tab returns `false`.

- [ ] **Step 5: Verify migration preservation and lease behavior**

```bash
pnpm exec vitest run tests/unit/indexed-db/migrations.test.ts tests/unit/indexed-db/offline-schema.test.ts
pnpm typecheck
```

Expected: all version 1→4, 2→4, and 3→4 preservation tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/indexed-db tests/unit/indexed-db/offline-schema.test.ts
git commit -m "feat: add durable offline coordination storage"
```

---

## Task 4: Implement Honest Connectivity Monitoring

**Files:**

- Create: `src/app/api/connectivity/route.ts`
- Create: `src/lib/offline/connectivity-monitor.ts`
- Create: `src/lib/offline/connectivity-store.ts`
- Create: `src/lib/offline/use-connectivity.ts`
- Create: `tests/unit/connectivity-monitor.test.ts`

- [ ] **Step 1: Write failing connectivity tests**

Cover these transitions:

```text
navigator offline → offline
navigator online before probe → checking
successful same-origin probe → reachable
probe timeout/network failure → unreachable
three consecutive successful probes → reachable remains stable
window online event → immediate probe
window offline event → offline without probe
```

The public state is:

```ts
type ConnectivityState =
  | { status: 'checking'; checkedAt: string | null }
  | { status: 'offline'; checkedAt: string }
  | { status: 'unreachable'; checkedAt: string }
  | { status: 'reachable'; checkedAt: string };
```

- [ ] **Step 2: Run and confirm failure**

```bash
pnpm exec vitest run tests/unit/connectivity-monitor.test.ts
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement the connectivity route**

`GET /api/connectivity` returns status `204`, `Cache-Control: no-store`, and no body. It performs no database read and exposes no environment details.

- [ ] **Step 4: Implement monitor and React subscription**

The monitor must:

- accept injected `fetch`, clock, scheduler, and browser-online reader for deterministic tests;
- use a 4-second probe timeout;
- probe on start, browser `online`, and every 30 seconds while visible;
- stop periodic probes while `document.visibilityState === 'hidden'`;
- never convert `navigator.onLine === true` directly into `reachable`;
- expose `subscribe`, `getSnapshot`, `start`, `stop`, and `probeNow`;
- use `useSyncExternalStore` in `useConnectivity`.

- [ ] **Step 5: Verify**

```bash
pnpm test:offline
pnpm typecheck
```

Expected: connectivity tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/connectivity src/lib/offline tests/unit/connectivity-monitor.test.ts
git commit -m "feat: add honest connectivity monitoring"
```

---

## Task 5: Implement Deterministic Retry, Queue Selection, and Leased Processing

**Files:**

- Create: `src/lib/sync/backoff.ts`
- Create: `src/lib/sync/queue-repository.ts`
- Create: `src/lib/sync/queue-worker.ts`
- Create: `tests/integration/queue-worker.test.ts`
- Modify: `tests/unit/sync-backoff.test.ts`

- [ ] **Step 1: Write failing backoff tests**

Use an injected random value. Verify:

```ts
computeRetryDelay({ attemptCount: 0, random: 0 }) === 1_000;
computeRetryDelay({ attemptCount: 1, random: 0 }) === 2_000;
computeRetryDelay({ attemptCount: 6, random: 0 }) === 60_000;
computeRetryDelay({ attemptCount: 10, random: 1 }) <= 72_000;
```

Policy:

```text
base = min(60 seconds, 1 second × 2^attemptCount)
jitter = base × up to 20 percent
maximum = 72 seconds
```

- [ ] **Step 2: Write failing worker tests**

Prove:

- one worker claims the lease and a second worker does not;
- commands for one entity preserve creation order;
- independent entities process with concurrency limit `3`;
- duplicate acknowledgement deletes the pending operation;
- retryable failure increments attempts and sets `nextAttemptAt`;
- authentication failure marks `blocked`;
- conflict stores a conflict record and marks `blocked`;
- validation/permanent failure marks `failed` without automatic retry;
- worker renewal stops processing when lease ownership is lost;
- queue state survives database close and reopen.

- [ ] **Step 3: Implement queue repository**

`QueueRepository` must expose:

```ts
listReady(ownerId: string, now: string, limit: number): Promise<PendingOperation[]>;
markProcessing(id: string): Promise<void>;
acknowledge(id: string): Promise<void>;
markRetry(input: { id: string; nextAttemptAt: string; errorCode: string }): Promise<void>;
markBlocked(input: { id: string; errorCode: string }): Promise<void>;
markFailed(input: { id: string; errorCode: string }): Promise<void>;
```

Selection excludes future `nextAttemptAt`, groups by entity, and returns only the earliest command for each entity.

- [ ] **Step 4: Implement `QueueWorker`**

Constructor dependencies:

```ts
{
  ownerId: string;
  installationId: string;
  tabId: string;
  database: RecoveryFirstDatabase;
  client: SyncClient;
  clock: Clock;
  uuid: UuidGenerator;
  random: () => number;
  concurrency: 3;
  leaseDurationMs: 15_000;
  leaseRenewalMs: 5_000;
}
```

Processing rules follow Task 2 classification. The worker emits typed events for `started`, `acknowledged`, `retry_scheduled`, `blocked`, `failed`, `conflict`, and `idle` without including sensitive payloads.

- [ ] **Step 5: Verify**

```bash
pnpm test:sync
pnpm typecheck
```

Expected: all retry and queue-worker tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sync tests/unit/sync-backoff.test.ts tests/integration/queue-worker.test.ts
git commit -m "feat: process pending commands with durable leases"
```

---

## Task 6: Coordinate Queue Ownership Across Tabs

**Files:**

- Create: `src/lib/sync/leader-election.ts`
- Create: `src/lib/service-worker/service-worker-events.ts`
- Create: `tests/integration/leader-election.test.ts`

- [ ] **Step 1: Write failing coordination tests**

Use two fake tabs sharing one fake IndexedDB database. Verify:

- one tab becomes queue leader;
- a follower takes over after the leader lease expires;
- acknowledged entity messages invalidate only matching entity keys;
- `BroadcastChannel` absence uses a `storage` event fallback;
- another tab cannot authorize a command or change entitlement state;
- a conflict remains visible only in the initiating tab until persisted conflict state is read.

- [ ] **Step 2: Implement typed channel messages**

```ts
type SynchronizationChannelMessage =
  | { type: 'leader-claimed'; ownerId: string; tabId: string; expiresAt: string }
  | { type: 'leader-released'; ownerId: string; tabId: string }
  | { type: 'entity-acknowledged'; ownerId: string; entityType: string; entityId: string }
  | { type: 'queue-changed'; ownerId: string }
  | { type: 'service-worker-update'; version: string };
```

Use channel name `recovery-first-sync-v1`. Validate every incoming message before acting.

- [ ] **Step 3: Implement leader-election lifecycle**

`LeaderElection` must:

- create a stable tab ID for the current page lifetime;
- claim the Dexie lease;
- renew while visible and reachable;
- release on `pagehide` when possible;
- stop the queue worker immediately after lease loss;
- publish only non-sensitive entity identifiers;
- fall back to a single `localStorage` coordination key when BroadcastChannel is unavailable.

- [ ] **Step 4: Verify**

```bash
pnpm exec vitest run tests/integration/leader-election.test.ts tests/integration/queue-worker.test.ts
pnpm typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync/leader-election.ts src/lib/service-worker/service-worker-events.ts tests/integration/leader-election.test.ts
git commit -m "feat: coordinate synchronization across browser tabs"
```

---

## Task 7: Add Server Command and Incremental Pull Endpoints

**Files:**

- Create: `src/app/api/sync/commands/route.ts`
- Create: `src/app/api/sync/pull/route.ts`
- Create: `src/lib/sync/sync-client.ts`
- Create: `src/lib/sync/pull-synchronizer.ts`
- Create: `tests/integration/pull-synchronizer.test.ts`
- Create: `tests/integration/sync-routes.test.ts`

- [ ] **Step 1: Write failing route and pull tests**

Verify:

- unauthenticated requests return `401`;
- owner ID in a command cannot differ from authenticated user ID;
- one request accepts at most 50 commands and 256 KiB JSON;
- duplicate commands return prior authoritative result;
- pull returns rows and tombstones after a cursor;
- cursor does not advance when local transaction application fails;
- successful local application advances the cursor atomically;
- malformed rows fail closed and preserve the previous cursor.

- [ ] **Step 2: Implement command route**

`POST /api/sync/commands`:

- resolves the authenticated Supabase user server-side;
- validates `{ commands: SyncCommandEnvelope[] }`;
- rejects mismatched owner IDs;
- maps each approved operation type to the authoritative Plan 03 function;
- returns one `SyncAcknowledgement` per input command in input order;
- uses `Cache-Control: no-store`;
- redacts payloads from structured logs.

Approved Plan 05 operation types are:

```text
record_check_in
edit_same_day_check_in
update_reminder_configuration
disable_reminder_configuration
```

- [ ] **Step 3: Implement pull route**

`GET /api/sync/pull?cursor=<opaque>&limit=500` returns:

```ts
type PullResponse = {
  cursor: string;
  hasMore: boolean;
  changes: Array<{
    entityType: 'habit' | 'habit_version' | 'session' | 'check_in' | 'reminder_configuration';
    entityId: string;
    revision: number;
    operation: 'upsert' | 'delete';
    value: unknown | null;
    changedAt: string;
  }>;
};
```

The cursor is opaque to the client. Server reads remain RLS-authorized and bounded.

- [ ] **Step 4: Implement client and transactional pull synchronizer**

The client distinguishes HTTP reachability, authentication, validation, conflict, and retryable server failure. The pull synchronizer:

1. reads the current cursor;
2. fetches one bounded page;
3. validates every change;
4. applies cache rows and tombstones in one Dexie transaction;
5. advances the cursor in that same transaction;
6. repeats while `hasMore` with a maximum of 10 pages per run;
7. invalidates affected TanStack Query keys after commit.

- [ ] **Step 5: Verify**

```bash
pnpm exec vitest run tests/integration/sync-routes.test.ts tests/integration/pull-synchronizer.test.ts
pnpm typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/sync src/lib/sync/sync-client.ts src/lib/sync/pull-synchronizer.ts tests/integration
git commit -m "feat: add idempotent command and incremental pull sync"
```

---

## Task 8: Present Pending, Synchronized, Failed, and Conflict States

**Files:**

- Create: `src/components/operational-states/offline-banner.tsx`
- Create: `src/components/operational-states/synchronization-banner.tsx`
- Create: `src/components/operational-states/conflict-dialog.tsx`
- Create: `src/features/synchronization/use-synchronization-state.ts`
- Create: `src/features/synchronization/conflict-presenter.ts`
- Create: `src/features/synchronization/synchronization-provider.tsx`
- Create: `tests/component/connectivity-banners.test.tsx`
- Create: `tests/component/conflict-dialog.test.tsx`

- [ ] **Step 1: Write failing component tests**

Cover:

- offline banner includes icon, heading, explanation, and supported-action text;
- unreachable state differs from browser-offline state;
- pending banner reports a count but not sensitive entity content;
- synchronized state is announced politely and then visually recedes;
- failed state includes a Retry action;
- conflict dialog contains `Review changes`, `Keep mine`, and `Use latest` only when supported by the conflict class;
- destructive or conflict meaning is not communicated by color alone;
- keyboard focus enters and returns from the dialog correctly.

- [ ] **Step 2: Implement aggregated synchronization state**

```ts
type SynchronizationViewState =
  | { status: 'synchronized'; lastSynchronizedAt: string | null }
  | { status: 'pending'; count: number }
  | { status: 'blocked'; count: number; reason: 'authentication' | 'conflict' }
  | { status: 'failed'; count: number }
  | { status: 'offline'; count: number }
  | { status: 'unreachable'; count: number };
```

Read pending counts from Dexie live queries and combine them with connectivity state. Do not place business entities in Zustand.

- [ ] **Step 3: Implement conflict actions**

- `Use latest` discards only the blocked local command after an explicit confirmation and refreshes authoritative data.
- `Keep mine` creates a new command with a new command ID and the latest expected revision; it is unavailable for deleted-remote conflicts.
- `Review changes` displays bounded field-level differences and excludes private note values from analytics/logging.
- No action silently resurrects a remotely deleted entity.

- [ ] **Step 4: Verify**

```bash
pnpm exec vitest run tests/component/connectivity-banners.test.tsx tests/component/conflict-dialog.test.tsx
pnpm test:accessibility
pnpm typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/operational-states src/features/synchronization tests/component
git commit -m "feat: expose honest synchronization states"
```

---

## Task 9: Add Installable PWA Shell, Offline Fallback, and Safe Service-Worker Updates

**Files:**

- Create: `public/manifest.webmanifest`
- Create: `public/offline.html`
- Create: `public/service-worker.js`
- Create: `src/lib/service-worker/register-service-worker.ts`
- Modify: `src/app/layout.tsx`
- Create: `tests/service-worker/service-worker-contract.test.ts`

- [ ] **Step 1: Write failing service-worker contract tests**

Parse `public/service-worker.js` as text and assert:

- cache name contains a version;
- install caches only explicit shell files;
- activate deletes only older `recovery-first-shell-*` caches;
- navigation failure returns `/offline.html`;
- mutation/API requests are never cached;
- push handler excludes habit title and free-text fields;
- notification click uses an allowlisted same-origin path;
- service worker contains no Recovery, entitlement, billing, or active-limit logic.

- [ ] **Step 2: Create the web manifest**

Use:

```json
{
  "name": "Recovery-First Habit Tracker",
  "short_name": "Recovery First",
  "description": "Build sustainable habits with flexible minimum actions and supportive recovery.",
  "start_url": "/app/today",
  "scope": "/",
  "display": "standalone",
  "background_color": "#F7F8F9",
  "theme_color": "#16A34A",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Use approved project icons generated in Plan 02; do not invent a second logo.

- [ ] **Step 3: Implement service worker**

Use a static cache version constant. Cache only:

```text
/
/offline.html
/manifest.webmanifest
approved logo/icon assets
```

For navigation requests, use network-first with offline fallback. For same-origin immutable static assets, use cache-first. Never cache `/api/`, Supabase, authentication callbacks, payment routes, or non-GET requests.

Push payload schema:

```ts
{
  notificationId: string;
  titleKey: 'reminder_primary' | 'reminder_follow_up';
  bodyKey: 'open_today' | 'check_in_when_ready';
  url: '/app/today' | '/app/reminders';
}
```

Displayed copy is generic and contains no habit name.

- [ ] **Step 4: Implement registration and update UX**

Register only in supported production/browser contexts. On a waiting worker, publish a `service-worker-update` event and show the existing non-blocking update banner. Apply update only after user activation or when no unsaved form is present. Reload once after `controllerchange`.

- [ ] **Step 5: Verify**

```bash
pnpm test:service-worker
pnpm build
```

Expected: pass and production build includes manifest metadata.

- [ ] **Step 6: Commit**

```bash
git add public src/lib/service-worker src/app/layout.tsx tests/service-worker
git commit -m "feat: add safe installable offline application shell"
```

---

## Task 10: Define Reminder Configuration and Deterministic Delivery Intents

**Files:**

- Create: `src/domain/reminders/reminder-configuration.ts`
- Create: `src/domain/reminders/reminder-status.ts`
- Create: `src/domain/reminders/compute-delivery-intents.ts`
- Create: `tests/unit/reminder-intents.test.ts`

- [ ] **Step 1: Write failing reminder-domain tests**

Test:

- primary reminder at configured local time;
- optional follow-up after configured delay;
- quiet hours move a reminder to quiet-hours end;
- overnight quiet hours such as `22:00–07:00` work;
- completed session cancels pending follow-up;
- disabled/revised configuration invalidates stale intent revisions;
- DST gap moves to the next valid local instant;
- DST overlap selects the earlier valid instant consistently;
- expired session produces no reminder;
- intent key is deterministic for config, session, kind, and revision.

- [ ] **Step 2: Implement configuration schema**

```ts
export type ReminderConfiguration = {
  id: string;
  habitId: string;
  primaryLocalTime: string | null;
  followUpDelayMinutes: number | null;
  channels: Array<'in_app' | 'web_push' | 'email'>;
  quietHours: { start: string; end: string } | null;
  enabled: boolean;
  timezone: string;
  revision: number;
};
```

Validation requires:

- valid `HH:mm` strings;
- follow-up between 5 and 1,440 minutes;
- at least one channel when enabled;
- valid IANA timezone;
- positive revision.

- [ ] **Step 3: Implement deterministic intent computation**

```ts
export type ReminderDeliveryIntent = {
  idempotencyKey: string;
  configurationId: string;
  configurationRevision: number;
  sessionId: string;
  kind: 'primary' | 'follow_up';
  dueAt: string;
  expiresAt: string;
  channels: Array<'in_app' | 'web_push' | 'email'>;
};
```

The function accepts configuration, session schedule/status, and timezone resolver. It returns no intent for recorded, automatic-skipped, excused, expired, disabled, or stale sessions.

- [ ] **Step 4: Verify**

```bash
pnpm test:reminders
pnpm typecheck
```

Expected: domain tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/reminders tests/unit/reminder-intents.test.ts
git commit -m "feat: compute deterministic reminder delivery intents"
```

---

## Task 11: Add Reminder Delivery Tables, Constraints, and Claim Functions

**Files:**

- Create: `supabase/migrations/20260729020000_sync_and_reminder_delivery.sql`
- Create: `supabase/migrations/20260729021000_reminder_delivery_functions.sql`
- Create: `supabase/tests/00050_reminders_and_sync.test.sql`
- Modify: `src/lib/supabase/database.types.ts`

- [ ] **Step 1: Write failing pgTAP tests**

Tests must prove:

- reminder config supports `in_app`, `web_push`, and `email` channels;
- quiet-hour columns validate local times;
- delivery intent idempotency key is unique;
- attempt status is restricted;
- one worker atomically claims an intent;
- a second worker cannot claim an unexpired lease;
- expired leases can be reclaimed;
- completed check-in cancels unattempted follow-ups;
- revised/disabled configuration cancels stale future intents;
- cross-user reads and writes fail under RLS;
- provider-accepted status is not named `delivered` or `received`.

- [ ] **Step 2: Create schema migration**

Add:

```sql
alter table public.reminder_configs
  add column if not exists quiet_hours_start time,
  add column if not exists quiet_hours_end time;

alter table public.reminder_configs
  drop constraint if exists reminder_configs_channel_check;

alter table public.reminder_configs
  add constraint reminder_configs_channel_check
  check (channel in ('in_app', 'web_push', 'email'));

create table public.reminder_delivery_intents (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_config_id uuid not null references public.reminder_configs(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  kind text not null check (kind in ('primary', 'follow_up')),
  channel text not null check (channel in ('in_app', 'web_push', 'email')),
  idempotency_key text not null unique,
  configuration_revision bigint not null check (configuration_revision >= 1),
  due_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'claimed', 'attempted', 'provider_accepted', 'failed', 'cancelled', 'expired')),
  claim_owner uuid,
  claim_expires_at timestamptz,
  cancelled_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (expires_at > due_at)
);

create table public.reminder_delivery_attempts (
  id uuid primary key,
  intent_id uuid not null references public.reminder_delivery_intents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null check (attempt_number >= 1),
  provider text not null,
  provider_result text not null
    check (provider_result in ('accepted', 'retryable_failure', 'permanent_failure', 'not_configured')),
  provider_message_id text,
  error_code text,
  attempted_at timestamptz not null default timezone('utc', now()),
  unique (intent_id, attempt_number)
);
```

Add indexes for due status, user history, and claim expiry. Add update triggers and RLS policies. Browser users may read their own delivery intent status but cannot mark provider acceptance. Service-role functions own claiming and attempts.

- [ ] **Step 3: Create transactional functions**

Implement:

```sql
private.claim_due_reminder_intents(
  p_worker_id uuid,
  p_now timestamptz,
  p_limit integer
)
```

It returns at most 100 due, non-expired, non-cancelled rows and sets a 60-second lease atomically with `for update skip locked`.

Implement:

```sql
private.cancel_stale_reminder_intents(
  p_session_id uuid,
  p_reason text
)
```

Only scheduled/claimed follow-up intents may be cancelled. Attempts remain immutable.

- [ ] **Step 4: Reset, test, and regenerate types**

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types
pnpm db:types:check
pnpm exec supabase db lint --local --level warning
pnpm db:stop
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations supabase/tests src/lib/supabase/database.types.ts
git commit -m "feat: add authoritative reminder delivery ledger"
```

---

## Task 12: Build Reminder Settings and In-Application Reminder Surfaces

**Files:**

- Create: `src/features/reminders/reminder-repository.ts`
- Create: `src/features/reminders/reminder-settings-form.tsx`
- Create: `src/features/reminders/components/in-app-reminder-card.tsx`
- Create: `src/features/reminders/components/reminder-capability-card.tsx`
- Create: `src/features/reminders/hooks/use-reminder-settings.ts`
- Modify: `src/app/reminders/page.tsx`
- Create: `tests/component/reminder-settings.test.tsx`

- [ ] **Step 1: Write failing component tests**

Verify:

- form edits primary time, follow-up, channels, and quiet hours;
- enabled reminder requires at least one channel;
- unsupported Web Push is explained and cannot be selected;
- denied permission remains usable with in-app reminders;
- email selection requires an eligible signed-in account but does not block in-app reminders;
- offline account changes save as pending operations;
- Guest reminder configuration remains local-only;
- save confirmation says `Saved` or `Pending synchronization`, never `Delivered`;
- in-app card disappears after session completion or intent cancellation.

- [ ] **Step 2: Implement repository interface**

```ts
interface ReminderRepository {
  getConfiguration(habitId: string): Promise<ReminderConfiguration | null>;
  saveConfiguration(input: SaveReminderConfigurationInput): Promise<
    | { status: 'saved'; configuration: ReminderConfiguration }
    | { status: 'pending'; configuration: ReminderConfiguration }
  >;
  disableConfiguration(input: DisableReminderConfigurationInput): Promise<
    | { status: 'saved' }
    | { status: 'pending' }
  >;
}
```

Guest writes use Dexie. Account writes use direct authoritative calls when reachable and durable pending commands when offline/unreachable.

- [ ] **Step 3: Implement the settings form**

Use React Hook Form and the Task 10 Zod schema. Preserve the Plan 02 design system and operational states. Permission education is contextual and separate from the browser prompt button.

- [ ] **Step 4: Implement in-app reminders**

Read due local reminder states and server-authorized intent rows. Show generic supportive copy and actions:

```text
Check in
Remind me later
Dismiss for this session
```

`Remind me later` creates one bounded local snooze and does not alter the canonical habit schedule.

- [ ] **Step 5: Verify**

```bash
pnpm test:reminders
pnpm test:accessibility
pnpm typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/reminders src/app/reminders/page.tsx tests/component/reminder-settings.test.tsx
git commit -m "feat: add reminder settings and in-app states"
```

---

## Task 13: Implement Contextual Web Push Permission and Subscription Lifecycle

**Files:**

- Create: `src/features/reminders/hooks/use-push-capability.ts`
- Create: `src/features/reminders/components/push-permission-panel.tsx`
- Create: `src/app/api/reminders/push-subscriptions/route.ts`
- Create: `src/app/api/reminders/push-subscriptions/[installationId]/route.ts`
- Create: `src/lib/crypto/encrypted-json.ts`
- Create: `tests/integration/push-subscriptions.test.ts`
- Modify: `tests/component/reminder-settings.test.tsx`

- [ ] **Step 1: Write failing capability and route tests**

Cover capability states:

```text
unsupported
default
granted
denied
expired
revoked
```

Verify native permission request occurs only after explicit click on `Enable browser reminders`. Verify subscription route rejects unauthenticated, wrong-origin, malformed, oversized, or owner-mismatched requests.

- [ ] **Step 2: Implement capability hook**

The hook checks `serviceWorker`, `PushManager`, and `Notification`. It never calls `Notification.requestPermission()` during render, mount, page load, or onboarding automatically.

- [ ] **Step 3: Implement AES-256-GCM JSON encryption**

`encrypted-json.ts` accepts a validated 32-byte server key and returns:

```ts
{
  version: 1;
  iv: string;
  ciphertext: string;
  authTag: string;
}
```

Use a new random 96-bit IV per encryption. Decryption rejects unknown versions and authentication failure. The browser never receives the encryption key.

- [ ] **Step 4: Implement subscription routes**

`POST /api/reminders/push-subscriptions`:

- verifies authenticated user and same-origin request;
- validates installation ID and browser subscription JSON;
- hashes endpoint with SHA-256 for uniqueness;
- encrypts full subscription JSON server-side;
- upserts own installation row as `granted`;
- returns capability state without endpoint or encrypted data.

`DELETE /api/reminders/push-subscriptions/[installationId]` revokes the matching user-owned installation and marks `revoked_at`.

- [ ] **Step 5: Implement UI lifecycle**

After permission grant:

1. await service-worker readiness;
2. subscribe with the public VAPID key;
3. register with the server;
4. display `Enabled on this browser` only after server acknowledgement.

On provider expiration (`404`/`410` during dispatch), server marks capability `expired`; UI offers explicit re-enable.

- [ ] **Step 6: Verify**

```bash
pnpm exec vitest run tests/integration/push-subscriptions.test.ts tests/component/reminder-settings.test.tsx
pnpm test:accessibility
pnpm typecheck
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/reminders src/app/api/reminders/push-subscriptions src/lib/crypto tests/integration/push-subscriptions.test.ts tests/component/reminder-settings.test.tsx
git commit -m "feat: manage contextual web push subscriptions"
```

---

## Task 14: Implement Email Preferences and Safe Unsubscribe Contracts

**Files:**

- Create: `src/app/api/reminders/preferences/route.ts`
- Create: `src/features/reminders/components/email-reminder-preferences.tsx`
- Create: `src/lib/reminders/unsubscribe-token.ts`
- Create: `tests/integration/email-preferences.test.ts`

- [ ] **Step 1: Write failing tests**

Verify:

- email reminders default off;
- only authenticated users with verified email may opt in;
- daily/weekly preference validation matches database constraints;
- opt-out is immediately authoritative;
- unsubscribe token is signed, scoped to user and purpose, and expiring;
- altered or expired token fails;
- unsubscribe response does not reveal whether another email exists;
- no habit title or private data appears in preference telemetry.

- [ ] **Step 2: Implement preference route**

`GET` returns own eligibility and preference. `PUT` validates:

```ts
{
  reminderOptIn: boolean;
  reminderFrequency: 'off' | 'daily' | 'weekly';
}
```

When `reminderOptIn` is false, force frequency to `off` and set `unsubscribed_at`. When true, require verified account email.

- [ ] **Step 3: Implement unsubscribe token**

Use HMAC-SHA-256 with the server reminder secret. Payload:

```ts
{
  userId: string;
  purpose: 'reminder_unsubscribe';
  expiresAt: string;
  nonce: string;
}
```

Compare signatures in constant time. Token TTL is seven days.

- [ ] **Step 4: Implement accessible preference UI**

Explain that email is a fallback channel and may be delayed. Never preselect opt-in. Include visible save state and direct unsubscribe action.

- [ ] **Step 5: Verify**

```bash
pnpm exec vitest run tests/integration/email-preferences.test.ts
pnpm test:accessibility
pnpm typecheck
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/reminders/preferences src/features/reminders/components/email-reminder-preferences.tsx src/lib/reminders/unsubscribe-token.ts tests/integration/email-preferences.test.ts
git commit -m "feat: add email reminder preference contracts"
```

---

## Task 15: Implement Idempotent Reminder Dispatch

**Files:**

- Create: `supabase/functions/reminder-dispatch/types.ts`
- Create: `supabase/functions/reminder-dispatch/adapters.ts`
- Create: `supabase/functions/reminder-dispatch/index.ts`
- Create: `tests/integration/reminder-dispatch.test.ts`

- [ ] **Step 1: Write failing dispatch tests**

With fake PostgreSQL, Push, Email, and clock adapters, verify:

- invalid dispatch secret returns `401`;
- one batch claims at most 100 intents;
- duplicate invocation does not duplicate attempts;
- in-app intent is marked attempted without external provider call;
- push provider acceptance records `provider_accepted`;
- `404`/`410` push response marks subscription expired and intent permanently failed;
- retryable push/email failure returns intent to scheduled with bounded next attempt;
- missing provider configuration records `not_configured`, never success;
- completed session between claim and send cancels intent;
- stale configuration revision cancels intent;
- expired intent is marked expired;
- logs contain IDs/error codes but no endpoint, email, habit name, or note.

- [ ] **Step 2: Define adapter interfaces**

```ts
export interface PushAdapter {
  send(input: {
    subscription: unknown;
    payload: {
      notificationId: string;
      titleKey: 'reminder_primary' | 'reminder_follow_up';
      bodyKey: 'open_today' | 'check_in_when_ready';
      url: '/app/today' | '/app/reminders';
    };
    idempotencyKey: string;
  }): Promise<
    | { result: 'accepted'; providerMessageId: string | null }
    | { result: 'retryable_failure'; errorCode: string }
    | { result: 'permanent_failure'; errorCode: string }
  >;
}

export interface EmailAdapter {
  send(input: {
    to: string;
    subject: string;
    text: string;
    unsubscribeUrl: string;
    idempotencyKey: string;
  }): Promise<
    | { result: 'accepted'; providerMessageId: string | null }
    | { result: 'retryable_failure'; errorCode: string }
    | { result: 'permanent_failure'; errorCode: string }
  >;
}
```

- [ ] **Step 3: Implement provider adapters**

Push adapter uses VAPID credentials and the encrypted subscription. Email adapter sends a JSON request to `EMAIL_PROVIDER_API_URL` with bearer `EMAIL_PROVIDER_API_KEY`. Missing configuration returns `not_configured`. Email body is generic and contains no habit name.

- [ ] **Step 4: Implement the Edge Function**

Flow:

1. validate `x-reminder-dispatch-secret` using constant-time comparison;
2. claim due intents transactionally;
3. re-read session status and configuration revision;
4. cancel stale/completed intents;
5. dispatch per channel;
6. insert immutable attempt row;
7. update intent to `provider_accepted`, `scheduled`, `failed`, `cancelled`, or `expired`;
8. return counts only.

Response:

```ts
{
  claimed: number;
  accepted: number;
  retried: number;
  failed: number;
  cancelled: number;
  expired: number;
}
```

- [ ] **Step 5: Verify**

```bash
pnpm exec vitest run tests/integration/reminder-dispatch.test.ts
pnpm exec supabase functions serve reminder-dispatch --no-verify-jwt &
function_pid=$!
sleep 3
curl --fail-with-body -X POST http://127.0.0.1:54321/functions/v1/reminder-dispatch \
  -H "x-reminder-dispatch-secret: local-test-secret"
kill "$function_pid"
```

Expected: tests pass and local function returns a bounded count response.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/reminder-dispatch tests/integration/reminder-dispatch.test.ts
git commit -m "feat: dispatch reminders with idempotent delivery records"
```

---

## Task 16: Cancel Follow-Ups After Check-in and Invalidate Stale Reminders

**Files:**

- Modify: `src/features/check-ins/guest-check-in-repository.ts`
- Modify: `src/features/check-ins/supabase-check-in-repository.ts`
- Modify: `supabase/migrations/20260729021000_reminder_delivery_functions.sql`
- Create: `tests/integration/reminder-cancellation.test.ts`

- [ ] **Step 1: Write failing cancellation tests**

Verify:

- Guest Full/Minimum/Manual Skipped cancels local primary/follow-up states for the session;
- account check-in transaction cancels unattempted follow-ups in the same database transaction;
- an already recorded attempt remains immutable;
- editing a check-in does not recreate a cancelled reminder;
- disabling or revising configuration invalidates old revision intents;
- retrying the same check-in command does not duplicate cancellation effects.

- [ ] **Step 2: Implement Guest cancellation**

Extend the existing atomic Guest check-in transaction to update matching `localReminderStates` to `cancelled`. Do not add a separate post-write best-effort step.

- [ ] **Step 3: Implement account cancellation**

Extend authoritative `record_check_in` and `edit_same_day_check_in` SQL functions to call `private.cancel_stale_reminder_intents` inside the same transaction after successful check-in projection update.

- [ ] **Step 4: Verify**

```bash
pnpm exec vitest run tests/integration/reminder-cancellation.test.ts
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/check-ins supabase/migrations/20260729021000_reminder_delivery_functions.sql tests/integration/reminder-cancellation.test.ts
git commit -m "feat: cancel stale reminders after check-ins"
```

---

## Task 17: Add Browser E2E Coverage for Offline, Multi-Tab, Service Worker, and Permission States

**Files:**

- Create: `tests/e2e/offline-check-in.spec.ts`
- Create: `tests/e2e/multi-tab-queue.spec.ts`
- Create: `tests/e2e/service-worker-upgrade.spec.ts`
- Create: `tests/e2e/reminder-permission.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Add deterministic test fixtures**

Create test-only helpers that seed an authenticated local Supabase account, a habit/session, and an installation without bypassing RLS. Use provider fakes only in test environment. Do not place service-role credentials in browser context.

- [ ] **Step 2: Implement offline check-in scenario**

Scenario:

1. load Today while reachable;
2. set browser context offline;
3. record Minimum;
4. verify `Pending synchronization` and local UI update;
5. reload while offline;
6. verify the same pending state survives;
7. reconnect;
8. wait for acknowledgement;
9. verify exactly one server check-in and synchronized state.

- [ ] **Step 3: Implement two-tab queue scenario**

Open two pages for the same account. Queue one operation in each. Assert only one active lease, both operations are eventually applied once, entity order is preserved, and both tabs invalidate after acknowledgement.

- [ ] **Step 4: Implement service-worker upgrade scenario**

Install version A, seed a stale shell cache, serve version B, trigger update, accept update banner, and assert only prior Recovery First caches are removed. Unrelated origin cache entries remain.

- [ ] **Step 5: Implement permission scenarios**

Cover `unsupported`, `default`, `denied`, and `granted` using Playwright permissions/mocks. Assert no native prompt is requested before explicit click. Denied state keeps in-app reminders available.

- [ ] **Step 6: Run browser and accessibility suites**

```bash
pnpm test:e2e:offline
pnpm test:e2e:reminders
pnpm test:accessibility
pnpm test:visual
```

Expected: desktop and 390px mobile-web projects pass.

- [ ] **Step 7: Commit**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: cover offline synchronization and reminder capabilities"
```

---

## Task 18: Run the Plan 05 Quality Gate and Record the Handoff

**Files:**

- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [ ] **Step 1: Update status only after Tasks 1–17 are committed**

Change only:

```markdown
| 05 | `05-offline-resilience-reminders.md` | Not created | Plan 04 verified |
```

to:

```markdown
| 05 | `05-offline-resilience-reminders.md` | Verified complete | Plan 04 verified |
```

Do not mark Plan 06 started.

- [ ] **Step 2: Run focused Plan 05 suites**

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:offline
pnpm test:sync
pnpm test:reminders
pnpm test:service-worker
pnpm test:e2e:offline
pnpm test:e2e:reminders
```

Expected: every command exits `0`.

- [ ] **Step 3: Run complete regression and build suites**

```bash
pnpm test:unit
pnpm test:component
pnpm test:integration
pnpm test:accessibility
pnpm test:e2e
pnpm test:visual
pnpm build
```

Expected: Plans 01–04 regressions and Plan 05 tests pass.

- [ ] **Step 4: Run complete database verification**

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm exec supabase db lint --local --level warning
pnpm db:stop
```

Expected: migrations, pgTAP, generated types, and lint pass.

- [ ] **Step 5: Run repository checks**

```bash
pnpm check:repository
git diff --check
git status --short
```

Expected: only the master-plan status change is uncommitted.

- [ ] **Step 6: Commit verified status**

```bash
git add docs/implementation/IMPLEMENTATION-PLAN.md
git commit -m "docs: mark offline resilience reminders plan verified"
```

- [ ] **Step 7: Verify from a clean checkout**

```bash
temporary_directory="$(mktemp -d)"
git clone --local . "$temporary_directory/recovery-first-habit-tracker"
cd "$temporary_directory/recovery-first-habit-tracker"
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm verify
pnpm test:offline
pnpm test:sync
pnpm test:reminders
pnpm test:service-worker
pnpm test:e2e:offline
pnpm test:e2e:reminders
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types:check
pnpm exec supabase db lint --local --level warning
pnpm db:stop
pnpm build
pnpm check:repository
```

Expected: every command exits `0` using tracked files and generated local dependencies only.

- [ ] **Step 8: Capture final evidence**

```bash
cd -
git log --oneline --decorate -20
git status --short
```

Expected: Plan 05 commits appear in order and the working tree is clean.

---

# 4. Final Acceptance Checklist

Plan 05 is complete only when fresh command output proves every item:

- [ ] `navigator.onLine` is never treated as proof of server reachability.
- [ ] Browser-offline, server-unreachable, checking, and reachable states are distinct.
- [ ] Supported signed-in offline writes persist through reload and browser restart.
- [ ] Guest canonical data remains local-only.
- [ ] Stable command and idempotency IDs survive retry.
- [ ] Queue operations preserve causal order per entity.
- [ ] Independent entities use bounded concurrency.
- [ ] Retry uses deterministic exponential backoff with bounded jitter.
- [ ] Authentication, validation, permanent, and conflict failures do not retry blindly.
- [ ] Duplicate acknowledgement applies at most one server mutation.
- [ ] One Dexie queue lease prevents two tabs from processing the same queue concurrently.
- [ ] BroadcastChannel coordination has a storage-event fallback.
- [ ] Pull cursor advances only after transactional local application succeeds.
- [ ] Tombstones remove cache projections without deleting required history prematurely.
- [ ] Conflict states preserve local and authoritative candidates until explicit resolution.
- [ ] The UI distinguishes pending, synchronized, blocked, failed, offline, and unreachable.
- [ ] No operational state relies on color alone.
- [ ] PWA manifest uses the approved brand and responsive application start route.
- [ ] Service worker caches only approved shell resources and offline fallback.
- [ ] API, auth, billing, and mutation requests are never cached.
- [ ] Stale Recovery First caches are removed without deleting unrelated caches.
- [ ] Service-worker updates do not discard unsaved form work.
- [ ] Reminder configuration is independent from delivery channel.
- [ ] Quiet hours work across normal, overnight, DST-gap, and DST-overlap cases.
- [ ] Primary and follow-up intent keys are deterministic.
- [ ] Completed check-ins cancel unnecessary follow-ups atomically.
- [ ] Configuration revision invalidates stale future intents.
- [ ] In-app reminders remain available when Push is unsupported or denied.
- [ ] Notification permission is requested only after contextual explanation and explicit click.
- [ ] Push subscription data is encrypted at rest and never returned to the browser after registration.
- [ ] Push payloads exclude habit names, private notes, and friction free text.
- [ ] Email reminders default off and require verified account eligibility.
- [ ] Unsubscribe tokens are signed, scoped, expiring, and constant-time verified.
- [ ] Delivery records distinguish scheduled, attempted, provider-accepted, failed, cancelled, and expired.
- [ ] No state claims human receipt or reading.
- [ ] Duplicate dispatch does not duplicate attempts.
- [ ] Provider unavailability records honest failure and preserves retryable intent.
- [ ] Offline check-in E2E survives reload and creates exactly one server write after reconnect.
- [ ] Multi-tab E2E proves one logical worker.
- [ ] Permission-state E2E remains usable after denial.
- [ ] Formatting, lint, strict typecheck, unit, component, integration, accessibility, E2E, visual, database, and build checks pass.
- [ ] Clean-checkout verification passes.
- [ ] Working tree is clean.

---

# 5. Plan 06 Handoff Contract

Plan 06 may begin only after every Final Acceptance Checklist item passes.

Plan 05 supplies these verified contracts:

- honest connectivity states based on browser hints plus same-origin reachability probes;
- durable account command envelopes and acknowledgements;
- Dexie schema version 4 with queue leases, sync cursors, conflict records, and local reminder states;
- one leased queue worker per account/installation context;
- causal ordering, bounded concurrency, exponential retry, and explicit dead-end classifications;
- BroadcastChannel coordination with storage-event fallback;
- idempotent command endpoint and transactional incremental pull synchronization;
- explicit pending, synchronized, blocked, failed, offline, unreachable, and conflict UI states;
- installable PWA shell, offline fallback, safe update lifecycle, and generic push notification handling;
- deterministic reminder configuration and primary/follow-up intent computation;
- quiet-hour, DST, completion-cancellation, and stale-revision behavior;
- authoritative reminder intent and immutable attempt ledger;
- contextual Web Push permission and encrypted subscription lifecycle;
- opt-in email preference and safe unsubscribe contracts;
- idempotent dispatch that distinguishes provider acceptance from human receipt;
- browser coverage for reload persistence, reconnect, duplicate prevention, multi-tab ownership, service-worker upgrade, and permission denial.

Plan 06 must consume these contracts to implement lifecycle transitions, Automatic Skipped resolution orchestration, Check-in Review, Recovery triggers and plans, recommendation decisions, and Weekly Review. It must use reminder regeneration/cancellation through the Plan 05 contracts rather than adding a second scheduler or queue.
