# Web Billing and Entitlements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement monthly and annual Lite and Premium website subscriptions with an explicit 14-day trial, Paddle Billing sandbox checkout, verified webhook reconciliation, backend-authoritative entitlement, subscription management, and non-destructive downgrade handling.

**Architecture:** Product code depends on a provider-neutral `PaymentProvider` interface. The initial adapter uses Paddle Billing in sandbox and production environments, while domain code consumes normalized billing events rather than Paddle-specific payloads. Checkout attempts are created by the authenticated server, the browser opens Paddle Checkout with a server-created transaction, and Lite or Premium capabilities change only after a verified webhook or authoritative provider reconciliation updates PostgreSQL.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Zod, Supabase Auth and PostgreSQL, Supabase Edge Functions, Paddle Node.js SDK, Paddle.js, React Hook Form, TanStack Query, Vitest, React Testing Library, Playwright, pgTAP, axe-core, pnpm.

**03A amendment:** Billing must support both paid tiers. Free is the default account tier; Lite and Premium entitlements are resolved only from verified backend events. The active limits are Free `5`, Lite `10`, and Premium `30`; any original Premium-only task examples must be expanded to cover Lite before execution.

Guest is not a supported billing or entitlement identity. Historical Guest examples elsewhere in this plan are migration context and must not be reintroduced into checkout, subscription, downgrade, or capability code.

---

# 1. Prerequisites and Boundaries

## Prerequisites

Begin only after Plans 01–08 are verified complete. The repository must already provide:

- strict TypeScript, deterministic clock and UUID services, structured command results, safe logging, and environment validation;
- authenticated SSR sessions, route protection, account profiles, browser installations, and safe sign-out;
- PostgreSQL `entitlements`, private `payment_events`, private `idempotency_records`, private `audit_events`, and subscription status read views;
- the Plan 08 capability contract in `src/domain/entitlements/` and server-side capability resolution;
- Premium routes and actions that already reject missing authoritative capability;
- active-habit limits of 5 for Free, 10 for Lite, and 30 for Premium;
- lifecycle, versioning, Recovery, Weekly Review, Premium program, reminder, and Insights data that must survive downgrade;
- accessible buttons, cards, banners, dialogs, tables, skeletons, focus management, and responsive application shell.

## Initial provider decision

- Initial website payment provider: Paddle Billing.
- Paddle is isolated behind `PaymentProvider` and `BillingEventNormalizer` contracts.
- Paddle API keys and webhook secrets are server-only.
- Paddle.js receives only a client-side token.
- Sandbox is mandatory until Plan 11 production release work.
- A future Xendit or other adapter must pass the same contract tests before activation.

## Explicit exclusions

This plan does not implement:

- production Paddle credentials or live-mode activation;
- final commercial pricing approval;
- tax, legal, accounting, or refund-policy advice;
- custom invoice rendering or custom payment-method management;
- support staffing or manual finance operations beyond the included incident runbook;
- full production alerting, penetration testing, data export, account deletion, or launch certification;
- mobile-store billing or native application purchases.

## Product invariants

- No plan is selected by default.
- A trial begins only after an authenticated user explicitly selects monthly or annual, accepts the displayed terms, confirms checkout, and the backend receives authoritative provider evidence.
- Checkout return parameters, browser storage, Paddle.js events, or client-side receipts never grant Lite or Premium.
- The application displays `Processing` until authoritative entitlement exists.
- Duplicate valid provider events produce one state transition.
- Events are ordered by provider `occurredAt`, not HTTP arrival time.
- An older event cannot overwrite a newer subscription state.
- Malformed or invalid-signature webhooks do not mutate billing or entitlement state.
- Trial and billing dates are calculated or confirmed server-side.
- `trial_active`, `active`, and `grace_period` grant Premium within their valid windows.
- `trial_cancelled` and `cancelled` retain Premium until authoritative expiry.
- `past_due` follows the stored entitlement window and displays payment-recovery guidance.
- `expired`, `refunded`, and `revoked` disable Premium actions without deleting history.
- Downgrade above five active habits creates an explicit resolution workflow; no habit is silently deleted.
- Excess habits are paused transactionally only after the user confirms which five remain active.
- Premium adaptive programs become `decision_required`; the user chooses static continuation or pause.
- Customer portal URLs are generated on demand and are never cached.
- Raw webhook retention is bounded and excludes logs from browser-visible or analytics systems.
- Logs and audit events never contain card data, payment instruments, complete raw payloads, API keys, webhook secrets, or portal-session tokens.

---

# 2. File Map

```text
src/
├── app/
│   ├── (public)/pricing/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── (application)/settings/subscription/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── downgrade/page.tsx
│   ├── billing/return/page.tsx
│   └── api/billing/
│       ├── checkout/route.ts
│       ├── portal/route.ts
│       ├── status/route.ts
│       ├── refresh/route.ts
│       └── webhook/route.ts
├── domain/
│   └── billing/
│       ├── billing-plan.ts
│       ├── billing-status.ts
│       ├── normalized-event.ts
│       ├── transition-policy.ts
│       ├── disclosure.ts
│       └── downgrade-resolution.ts
├── features/
│   ├── subscriptions/
│   │   ├── checkout-service.ts
│   │   ├── subscription-query.ts
│   │   ├── subscription-management-service.ts
│   │   ├── entitlement-refresh-service.ts
│   │   ├── downgrade-service.ts
│   │   └── components/
│   └── entitlements/
│       └── billing-entitlement-projector.ts
├── lib/
│   └── payments/
│       ├── payment-provider.ts
│       ├── payment-provider-registry.ts
│       ├── paddle-client.ts
│       ├── paddle-provider.ts
│       ├── paddle-normalizer.ts
│       ├── webhook-envelope.ts
│       └── redaction.ts
└── server/
    └── billing/
        ├── create-checkout.ts
        ├── process-webhook.ts
        ├── reconcile-subscription.ts
        └── create-portal-session.ts
supabase/
├── functions/payment-webhook/index.ts
├── migrations/
│   ├── 20260729060000_billing_provider_state.sql
│   ├── 20260729061000_billing_event_processing.sql
│   ├── 20260729062000_entitlement_projection.sql
│   ├── 20260729063000_subscription_management.sql
│   └── 20260729064000_billing_rls.sql
└── tests/
    ├── 00160_billing_constraints.test.sql
    ├── 00170_entitlement_projection.test.sql
    ├── 00180_billing_event_ordering.test.sql
    ├── 00190_downgrade_resolution.test.sql
    └── 00200_billing_rls.test.sql
tests/
├── accessibility/subscription-accessibility.test.tsx
├── component/
│   ├── plan-selector.test.tsx
│   ├── checkout-confirmation.test.tsx
│   ├── billing-processing-state.test.tsx
│   ├── subscription-status-card.test.tsx
│   └── downgrade-resolution.test.tsx
├── contract/
│   └── paddle-provider.contract.test.ts
├── e2e/
│   └── subscription-flow.spec.ts
├── integration/
│   ├── checkout-service.test.ts
│   ├── webhook-processing.test.ts
│   ├── entitlement-reconciliation.test.ts
│   ├── customer-portal.test.ts
│   └── downgrade-service.test.ts
└── unit/
    ├── billing-transition-policy.test.ts
    ├── paddle-normalizer.test.ts
    ├── billing-disclosure.test.ts
    └── billing-redaction.test.ts
docs/
├── architecture/ADR-012-provider-neutral-billing.md
└── operations/PAYMENT-INCIDENTS.md
```

---

# 3. Tasks

## Task 1: Install Billing SDKs, Add Verification Commands, and Record the Architecture Decision

**Files:**

- Modify: `package.json`
- Modify: `.env.example`
- Create: `docs/architecture/ADR-012-provider-neutral-billing.md`

- [ ] **Step 1: Install the official server and browser SDKs**

Run:

```bash
pnpm add @paddle/paddle-node-sdk @paddle/paddle-js
```

Expected: `package.json` and `pnpm-lock.yaml` contain both packages.

- [ ] **Step 2: Add focused billing scripts**

Add these scripts without removing existing scripts:

```json
{
  "scripts": {
    "test:billing": "vitest run tests/unit/billing-transition-policy.test.ts tests/unit/paddle-normalizer.test.ts tests/unit/billing-disclosure.test.ts tests/unit/billing-redaction.test.ts tests/integration/checkout-service.test.ts tests/integration/webhook-processing.test.ts tests/integration/entitlement-reconciliation.test.ts tests/integration/customer-portal.test.ts tests/integration/downgrade-service.test.ts tests/component/plan-selector.test.tsx tests/component/checkout-confirmation.test.tsx tests/component/billing-processing-state.test.tsx tests/component/subscription-status-card.test.tsx tests/component/downgrade-resolution.test.tsx tests/accessibility/subscription-accessibility.test.tsx",
    "test:billing:contract": "vitest run tests/contract/paddle-provider.contract.test.ts",
    "test:e2e:billing": "playwright test tests/e2e/subscription-flow.spec.ts"
  }
}
```

- [ ] **Step 3: Define billing environment variables**

Append to `.env.example`:

```dotenv
BILLING_PROVIDER=paddle
PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=
PADDLE_NOTIFICATION_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
PADDLE_MONTHLY_PRICE_ID=
PADDLE_ANNUAL_PRICE_ID=
BILLING_WEBHOOK_RAW_RETENTION_DAYS=30
BILLING_RECONCILIATION_BATCH_SIZE=100
```

- [ ] **Step 4: Record the architecture decision**

Create `docs/architecture/ADR-012-provider-neutral-billing.md`:

```markdown
# ADR-012: Provider-Neutral Billing with Backend-Authoritative Entitlements

## Status

Accepted.

## Decision

The initial website billing adapter uses Paddle Billing. Product code depends only on internal payment-provider and normalized-event contracts. Checkout return state is informational; Lite or Premium access is projected only from verified webhook events or authoritative provider reconciliation stored in PostgreSQL.

## Consequences

- Paddle-specific event names and identifiers stay inside the adapter.
- A replacement provider must pass the shared provider contract suite.
- Browser state cannot grant Premium.
- Webhook processing is idempotent and ordered by provider occurrence time.
- Customer portal sessions are generated on demand and are never persisted.
- Downgrade preserves all history and requires explicit active-habit resolution.
```

- [ ] **Step 5: Run focused suites before implementation**

Run:

```bash
pnpm test:billing
pnpm test:billing:contract
```

Expected: FAIL because Plan 09 test files do not exist.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example docs/architecture/ADR-012-provider-neutral-billing.md
git commit -m "chore: establish provider-neutral billing boundary"
```

---

## Task 2: Define Billing Plans, Statuses, Events, and Transition Policy

**Files:**

- Create: `src/domain/billing/billing-plan.ts`
- Create: `src/domain/billing/billing-status.ts`
- Create: `src/domain/billing/normalized-event.ts`
- Create: `src/domain/billing/transition-policy.ts`
- Create: `tests/unit/billing-transition-policy.test.ts`

- [ ] **Step 1: Write failing transition-policy tests**

Create `tests/unit/billing-transition-policy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { decideBillingTransition } from '@/domain/billing/transition-policy';

const base = {
  currentStatus: 'active' as const,
  currentOccurredAt: new Date('2026-07-20T00:00:00.000Z'),
  currentRevision: 4,
};

describe('decideBillingTransition', () => {
  it('ignores duplicate event IDs', () => {
    expect(decideBillingTransition({
      ...base,
      alreadyProcessed: true,
      eventStatus: 'cancelled',
      eventOccurredAt: new Date('2026-07-21T00:00:00.000Z'),
    })).toEqual({ kind: 'duplicate' });
  });

  it('ignores an event older than the stored provider occurrence time', () => {
    expect(decideBillingTransition({
      ...base,
      alreadyProcessed: false,
      eventStatus: 'past_due',
      eventOccurredAt: new Date('2026-07-19T23:59:59.000Z'),
    })).toEqual({ kind: 'stale' });
  });

  it('applies a newer status with the next revision', () => {
    expect(decideBillingTransition({
      ...base,
      alreadyProcessed: false,
      eventStatus: 'cancelled',
      eventOccurredAt: new Date('2026-07-21T00:00:00.000Z'),
    })).toEqual({ kind: 'apply', nextStatus: 'cancelled', nextRevision: 5 });
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
pnpm vitest run tests/unit/billing-transition-policy.test.ts
```

Expected: FAIL because the billing domain modules do not exist.

- [ ] **Step 3: Implement plan and status contracts**

Create `src/domain/billing/billing-plan.ts`:

```ts
export type BillingInterval = 'month' | 'year';
export type BillingPlanCode = 'premium_monthly' | 'premium_annual';

export type BillingPlan = Readonly<{
  code: BillingPlanCode;
  interval: BillingInterval;
  trialDays: 14;
  providerPriceId: string;
}>;
```

Create `src/domain/billing/billing-status.ts`:

```ts
export type BillingStatus =
  | 'trial_active'
  | 'trial_cancelled'
  | 'active'
  | 'grace_period'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'revoked';

export const premiumGrantingStatuses = new Set<BillingStatus>([
  'trial_active',
  'active',
  'grace_period',
]);
```

- [ ] **Step 4: Implement the normalized event contract**

Create `src/domain/billing/normalized-event.ts`:

```ts
import type { BillingPlanCode } from './billing-plan';
import type { BillingStatus } from './billing-status';

export type NormalizedBillingEvent = Readonly<{
  provider: 'paddle';
  eventId: string;
  eventType: string;
  occurredAt: Date;
  customerId: string;
  subscriptionId: string;
  userId: string;
  planCode: BillingPlanCode;
  status: BillingStatus;
  validFrom: Date;
  validUntil: Date | null;
  cancelAtPeriodEnd: boolean;
  providerPayloadHash: string;
}>;
```

- [ ] **Step 5: Implement deterministic ordering**

Create `src/domain/billing/transition-policy.ts`:

```ts
import type { BillingStatus } from './billing-status';

type Input = Readonly<{
  currentStatus: BillingStatus;
  currentOccurredAt: Date;
  currentRevision: number;
  alreadyProcessed: boolean;
  eventStatus: BillingStatus;
  eventOccurredAt: Date;
}>;

export type BillingTransitionDecision =
  | { kind: 'duplicate' }
  | { kind: 'stale' }
  | { kind: 'apply'; nextStatus: BillingStatus; nextRevision: number };

export const decideBillingTransition = (input: Input): BillingTransitionDecision => {
  if (input.alreadyProcessed) return { kind: 'duplicate' };
  if (input.eventOccurredAt.getTime() < input.currentOccurredAt.getTime()) {
    return { kind: 'stale' };
  }
  return {
    kind: 'apply',
    nextStatus: input.eventStatus,
    nextRevision: input.currentRevision + 1,
  };
};
```

- [ ] **Step 6: Run the test and commit**

```bash
pnpm vitest run tests/unit/billing-transition-policy.test.ts
git add src/domain/billing tests/unit/billing-transition-policy.test.ts
git commit -m "feat: define normalized billing transition policy"
```

Expected: PASS.

---

## Task 3: Validate Pricing Configuration and Produce Exact Subscription Disclosures

**Files:**

- Create: `src/domain/billing/disclosure.ts`
- Create: `src/server/billing/billing-config.ts`
- Create: `tests/unit/billing-disclosure.test.ts`

- [ ] **Step 1: Write failing disclosure tests**

Create `tests/unit/billing-disclosure.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTrialDisclosure } from '@/domain/billing/disclosure';

it('calculates trial and first billing dates from the server clock', () => {
  const disclosure = buildTrialDisclosure({
    now: new Date('2026-07-29T00:00:00.000Z'),
    interval: 'month',
    displayPrice: '$5.99',
  });
  expect(disclosure.trialEndsAt.toISOString()).toBe('2026-08-12T00:00:00.000Z');
  expect(disclosure.firstBillingAt.toISOString()).toBe('2026-08-12T00:00:00.000Z');
  expect(disclosure.summary).toContain('$5.99');
});
```

- [ ] **Step 2: Verify the test fails**

```bash
pnpm vitest run tests/unit/billing-disclosure.test.ts
```

Expected: FAIL because the disclosure module does not exist.

- [ ] **Step 3: Implement disclosure calculation**

Create `src/domain/billing/disclosure.ts`:

```ts
import type { BillingInterval } from './billing-plan';

const DAY_MS = 86_400_000;

export const buildTrialDisclosure = (input: {
  now: Date;
  interval: BillingInterval;
  displayPrice: string;
}) => {
  const trialEndsAt = new Date(input.now.getTime() + 14 * DAY_MS);
  const cadence = input.interval === 'month' ? 'monthly' : 'annually';
  return {
    trialEndsAt,
    firstBillingAt: trialEndsAt,
    summary: `Your 14-day trial ends on ${trialEndsAt.toISOString().slice(0, 10)}. After that, ${input.displayPrice} is charged ${cadence} until cancelled.`,
  } as const;
};
```

- [ ] **Step 4: Implement server-only billing configuration**

Create `src/server/billing/billing-config.ts`:

```ts
import 'server-only';
import { z } from 'zod';

const schema = z.object({
  BILLING_PROVIDER: z.literal('paddle'),
  PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']),
  PADDLE_API_KEY: z.string().min(1),
  PADDLE_NOTIFICATION_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().min(1),
  PADDLE_MONTHLY_PRICE_ID: z.string().startsWith('pri_'),
  PADDLE_ANNUAL_PRICE_ID: z.string().startsWith('pri_'),
  BILLING_WEBHOOK_RAW_RETENTION_DAYS: z.coerce.number().int().min(1).max(90),
  BILLING_RECONCILIATION_BATCH_SIZE: z.coerce.number().int().min(1).max(500),
});

export const billingConfig = schema.parse(process.env);
```

- [ ] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/unit/billing-disclosure.test.ts
git add src/domain/billing/disclosure.ts src/server/billing/billing-config.ts tests/unit/billing-disclosure.test.ts
git commit -m "feat: validate billing catalog and trial disclosures"
```

Expected: PASS.

---

## Task 4: Implement the Provider Contract, Paddle Client, and Safe Redaction

**Files:**

- Create: `src/lib/payments/payment-provider.ts`
- Create: `src/lib/payments/paddle-client.ts`
- Create: `src/lib/payments/payment-provider-registry.ts`
- Create: `src/lib/payments/redaction.ts`
- Create: `tests/unit/billing-redaction.test.ts`

- [ ] **Step 1: Write failing redaction tests**

Create `tests/unit/billing-redaction.test.ts`:

```ts
import { expect, it } from 'vitest';
import { redactBillingMetadata } from '@/lib/payments/redaction';

it('removes secrets, payment instruments, payloads, and portal URLs', () => {
  expect(redactBillingMetadata({
    apiKey: 'secret',
    cardNumber: '4242424242424242',
    rawPayload: '{...}',
    portalUrl: 'https://example.invalid/token',
    eventId: 'evt_1',
  })).toEqual({ eventId: 'evt_1' });
});
```

- [ ] **Step 2: Define the provider contract**

Create `src/lib/payments/payment-provider.ts`:

```ts
import type { BillingPlanCode } from '@/domain/billing/billing-plan';
import type { NormalizedBillingEvent } from '@/domain/billing/normalized-event';

export type CreateCheckoutInput = Readonly<{
  userId: string;
  userEmail: string;
  checkoutAttemptId: string;
  planCode: BillingPlanCode;
  priceId: string;
  returnUrl: string;
}>;

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<{
    providerTransactionId: string;
  }>;
  createCustomerPortal(input: {
    providerCustomerId: string;
    providerSubscriptionId: string;
  }): Promise<{ url: string }>;
  verifyWebhook(input: {
    rawBody: string;
    signature: string;
  }): Promise<NormalizedBillingEvent>;
  fetchSubscription(providerSubscriptionId: string): Promise<NormalizedBillingEvent>;
}
```

- [ ] **Step 3: Implement safe metadata redaction**

Create `src/lib/payments/redaction.ts`:

```ts
const blocked = new Set([
  'apiKey',
  'authorization',
  'cardNumber',
  'clientToken',
  'paymentMethod',
  'portalUrl',
  'rawPayload',
  'signature',
  'webhookSecret',
]);

export const redactBillingMetadata = (input: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(input).filter(([key]) => !blocked.has(key)));
```

- [ ] **Step 4: Create the server Paddle client**

Create `src/lib/payments/paddle-client.ts`:

```ts
import 'server-only';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import { billingConfig } from '@/server/billing/billing-config';

export const paddleClient = new Paddle(billingConfig.PADDLE_API_KEY, {
  environment: billingConfig.PADDLE_ENVIRONMENT === 'sandbox'
    ? Environment.sandbox
    : Environment.production,
});
```

- [ ] **Step 5: Add the provider registry**

Create `src/lib/payments/payment-provider-registry.ts`:

```ts
import 'server-only';
import type { PaymentProvider } from './payment-provider';
import { createPaddleProvider } from './paddle-provider';

export const getPaymentProvider = (): PaymentProvider => createPaddleProvider();
```

The import intentionally fails until Task 5 implements `paddle-provider.ts`.

- [ ] **Step 6: Run focused tests and commit**

```bash
pnpm vitest run tests/unit/billing-redaction.test.ts
git add src/lib/payments src/server/billing/billing-config.ts tests/unit/billing-redaction.test.ts
git commit -m "feat: establish payment provider contract"
```

Expected: the redaction test PASS; project typecheck still fails until Task 5 adds the Paddle adapter.

---

## Task 5: Implement Paddle Normalization and Provider Adapter

**Files:**

- Create: `src/lib/payments/paddle-normalizer.ts`
- Create: `src/lib/payments/paddle-provider.ts`
- Create: `tests/unit/paddle-normalizer.test.ts`
- Create: `tests/contract/paddle-provider.contract.test.ts`

- [ ] **Step 1: Write failing normalizer tests**

Create `tests/unit/paddle-normalizer.test.ts` with fixtures for `subscription.created`, `subscription.updated`, cancellation at period end, past due, refund, and revocation. Assert that provider event names never escape the normalizer and that all dates are parsed as UTC `Date` objects.

Use this representative assertion:

```ts
expect(normalizePaddleSubscriptionEvent(fixture)).toMatchObject({
  provider: 'paddle',
  eventId: 'evt_01',
  userId: '12000000-0000-4000-8000-000000000001',
  planCode: 'premium_monthly',
  status: 'trial_active',
  cancelAtPeriodEnd: false,
});
```

- [ ] **Step 2: Verify tests fail**

```bash
pnpm vitest run tests/unit/paddle-normalizer.test.ts tests/contract/paddle-provider.contract.test.ts
```

Expected: FAIL because the adapter and normalizer do not exist.

- [ ] **Step 3: Implement the normalizer**

Create `src/lib/payments/paddle-normalizer.ts` with these rules:

```ts
const statusMap = {
  trialing: 'trial_active',
  active: 'active',
  past_due: 'past_due',
  paused: 'revoked',
  canceled: 'expired',
} as const;
```

Additional deterministic rules:

- a future scheduled cancellation maps to `cancelled` and preserves `validUntil`;
- a cancelled trial before trial end maps to `trial_cancelled`;
- an approved recovery window maps to `grace_period`;
- adjustment/refund events that remove entitlement map to `refunded`;
- an administrative revocation maps to `revoked`;
- missing `customData.userId`, unknown price ID, missing subscription ID, or invalid timestamp throws `BillingNormalizationError`;
- monthly and annual provider price IDs map only through server configuration.

- [ ] **Step 4: Implement the Paddle adapter**

Create `src/lib/payments/paddle-provider.ts`:

```ts
import 'server-only';
import { createHash } from 'node:crypto';
import type { PaymentProvider } from './payment-provider';
import { paddleClient } from './paddle-client';
import { normalizePaddleSubscriptionEvent, normalizeFetchedPaddleSubscription } from './paddle-normalizer';

export const createPaddleProvider = (): PaymentProvider => ({
  async createCheckout(input) {
    const transaction = await paddleClient.transactions.create({
      items: [{ priceId: input.priceId, quantity: 1 }],
      customData: {
        userId: input.userId,
        checkoutAttemptId: input.checkoutAttemptId,
        planCode: input.planCode,
      },
      checkout: { url: input.returnUrl },
    });
    return { providerTransactionId: transaction.id };
  },

  async createCustomerPortal(input) {
    const session = await paddleClient.customerPortalSessions.create(
      input.providerCustomerId,
      { subscriptionIds: [input.providerSubscriptionId] },
    );
    return { url: session.urls.general.overview };
  },

  async verifyWebhook(input) {
    const event = await paddleClient.webhooks.unmarshal(
      input.rawBody,
      process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET!,
      input.signature,
    );
    return normalizePaddleSubscriptionEvent(event, {
      payloadHash: createHash('sha256').update(input.rawBody).digest('hex'),
    });
  },

  async fetchSubscription(providerSubscriptionId) {
    const subscription = await paddleClient.subscriptions.get(providerSubscriptionId);
    return normalizeFetchedPaddleSubscription(subscription);
  },
});
```

During implementation, adapt property casing only to the installed official SDK types. Do not use `any` or suppress TypeScript errors.

- [ ] **Step 5: Implement the shared contract test**

Create `tests/contract/paddle-provider.contract.test.ts` using an injected Paddle client fixture. Verify:

- checkout includes user ID, attempt ID, and plan code in provider custom data;
- portal creation returns a temporary URL but does not persist it;
- invalid signatures reject before normalization;
- fetched subscription returns the same normalized contract as webhooks;
- no API key or webhook secret appears in returned values or errors.

- [ ] **Step 6: Run tests and commit**

```bash
pnpm vitest run tests/unit/paddle-normalizer.test.ts tests/contract/paddle-provider.contract.test.ts
pnpm typecheck
git add src/lib/payments tests/unit/paddle-normalizer.test.ts tests/contract/paddle-provider.contract.test.ts
git commit -m "feat: implement Paddle billing adapter"
```

Expected: PASS.

---

## Task 6: Add Billing Provider State, Checkout Attempts, and Event Retention Schema

**Files:**

- Create: `supabase/migrations/20260729060000_billing_provider_state.sql`
- Create: `supabase/tests/00160_billing_constraints.test.sql`

- [ ] **Step 1: Create billing state tables**

Create `supabase/migrations/20260729060000_billing_provider_state.sql`:

```sql
create table private.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider = 'paddle'),
  provider_customer_id text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table private.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null check (provider = 'paddle'),
  provider_customer_id text not null,
  provider_subscription_id text not null unique,
  plan_code text not null check (plan_code in ('premium_monthly', 'premium_annual')),
  provider_status text not null,
  normalized_status public.entitlement_status not null,
  provider_occurred_at timestamptz not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_id text not null,
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table private.checkout_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null check (plan_code in ('premium_monthly', 'premium_annual')),
  provider text not null check (provider = 'paddle'),
  provider_transaction_id text unique,
  idempotency_key uuid not null,
  request_hash text not null,
  status text not null check (status in ('created', 'opened', 'processing', 'confirmed', 'failed', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, idempotency_key)
);

alter table private.payment_events
  add column event_type text,
  add column occurred_at timestamptz,
  add column provider_entity_id text,
  add column raw_payload text,
  add column raw_payload_expires_at timestamptz,
  add column processing_attempts integer not null default 0,
  add column ignored_reason text;

create index billing_subscriptions_status_idx
  on private.billing_subscriptions (normalized_status, current_period_end);
create index checkout_attempts_user_created_idx
  on private.checkout_attempts (user_id, created_at desc);
create index payment_events_processing_idx
  on private.payment_events (processing_status, occurred_at);
create index payment_events_raw_expiry_idx
  on private.payment_events (raw_payload_expires_at)
  where raw_payload is not null;

revoke all on private.billing_customers from public, anon, authenticated;
revoke all on private.billing_subscriptions from public, anon, authenticated;
revoke all on private.checkout_attempts from public, anon, authenticated;
```

- [ ] **Step 2: Add updated-at triggers**

Apply the existing private `set_updated_at()` trigger to all three new tables.

- [ ] **Step 3: Write pgTAP constraint tests**

Create `supabase/tests/00160_billing_constraints.test.sql` and verify:

- duplicate provider customer IDs fail;
- duplicate provider subscription IDs fail;
- unsupported plan codes fail;
- unsupported provider names fail;
- duplicate user/idempotency key fails;
- invalid checkout status fails;
- private billing tables are inaccessible to `anon` and `authenticated`;
- raw payload expiry is required whenever raw payload is stored.

- [ ] **Step 4: Run database tests and commit**

```bash
supabase db reset
pnpm test:db
git add supabase/migrations/20260729060000_billing_provider_state.sql supabase/tests/00160_billing_constraints.test.sql
git commit -m "feat: add private billing provider state"
```

Expected: PASS.

---

## Task 7: Implement Server-Created, Idempotent Checkout Attempts

**Files:**

- Create: `src/features/subscriptions/checkout-service.ts`
- Create: `src/server/billing/create-checkout.ts`
- Create: `src/app/api/billing/checkout/route.ts`
- Create: `tests/integration/checkout-service.test.ts`

- [x] **Step 1: Write failing checkout-service tests**

Create `tests/integration/checkout-service.test.ts` verifying:

- unauthenticated users are rejected;
- a missing plan selection is rejected;
- the confirmation checkbox must be true;
- monthly and annual resolve to server-owned price IDs;
- the same idempotency key returns the same transaction ID;
- active Premium does not create a second checkout;
- checkout metadata contains authenticated user ID rather than client-supplied ownership;
- the return URL is allow-listed and same-origin.

- [x] **Step 2: Implement the checkout service**

Create `src/features/subscriptions/checkout-service.ts` with dependencies:

```ts
export type CheckoutServiceDependencies = {
  now: () => Date;
  createId: () => string;
  findAttempt: (userId: string, idempotencyKey: string) => Promise<CheckoutAttempt | null>;
  createAttempt: (attempt: CheckoutAttempt) => Promise<void>;
  attachProviderTransaction: (attemptId: string, transactionId: string) => Promise<void>;
  readCapabilities: (userId: string) => Promise<{ premium: boolean }>;
  provider: PaymentProvider;
  planCatalog: Record<BillingPlanCode, BillingPlan>;
};
```

Validate input with Zod:

```ts
const checkoutInput = z.object({
  planCode: z.enum(['premium_monthly', 'premium_annual']),
  acceptedTerms: z.literal(true),
  idempotencyKey: z.string().uuid(),
});
```

- [x] **Step 3: Implement server composition**

Create `src/server/billing/create-checkout.ts` that:

1. reads the authenticated user from the server Supabase client;
2. rejects anonymous callers;
3. reads the email from verified auth identity;
4. resolves server plan configuration;
5. creates a same-origin return URL containing only the checkout-attempt UUID;
6. records a private audit event containing plan code and attempt ID only;
7. returns `{ attemptId, providerTransactionId }`.

- [x] **Step 4: Implement the route handler**

Create `src/app/api/billing/checkout/route.ts`:

```ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const result = await createCheckoutFromRequest(request);
  return Response.json(result.body, { status: result.status });
}
```

Apply origin validation, CSRF protection, authenticated rate limiting, and `Cache-Control: no-store` using shared Plan 01/07 utilities.

- [x] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/integration/checkout-service.test.ts
pnpm typecheck
git add src/features/subscriptions/checkout-service.ts src/server/billing/create-checkout.ts src/app/api/billing/checkout/route.ts tests/integration/checkout-service.test.ts
git commit -m "feat: create idempotent subscription checkout"
```

Expected: PASS.

---

## Task 8: Build Pricing, Plan Selection, and Explicit Checkout Confirmation UI

**Files:**

- Create: `src/features/subscriptions/components/plan-selector.tsx`
- Create: `src/features/subscriptions/components/checkout-confirmation.tsx`
- Modify: `src/app/(public)/pricing/page.tsx`
- Create: `tests/component/plan-selector.test.tsx`
- Create: `tests/component/checkout-confirmation.test.tsx`

- [x] **Step 1: Write failing component tests**

Verify:

- neither monthly nor annual is selected initially;
- Continue is disabled until a plan is selected;
- checkout confirmation displays trial end, first billing date, renewal cadence, cancellation, and refund disclosure;
- Confirm is disabled until the terms checkbox is checked;
- icons, labels, and text communicate selection and validation without relying on color;
- unauthenticated confirmation redirects to sign-in with a safe return path;
- keyboard users can select plans and confirm.

- [x] **Step 2: Implement the plan selector**

Use radio semantics, not clickable cards alone:

```tsx
<fieldset>
  <legend>Select a Premium plan</legend>
  <PlanRadio value="premium_monthly" label="Monthly" />
  <PlanRadio value="premium_annual" label="Annual" />
</fieldset>
```

No `defaultValue` is allowed.

- [x] **Step 3: Implement explicit confirmation**

The confirmation view must include:

- selected plan and localized provider price;
- 14-day trial period;
- first billing date;
- automatic renewal cadence;
- cancellation behavior;
- refund-policy link;
- connectivity requirement;
- checkbox text explicitly authorizing the trial and recurring charge.

- [x] **Step 4: Integrate the public Pricing page**

The page may display illustrative values `$5.99/month` and `$47.99/year` only when returned by the server catalog. Provider-localized pricing replaces hypotheses once available. Do not hardcode a client-authoritative charge amount.

- [x] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/component/plan-selector.test.tsx tests/component/checkout-confirmation.test.tsx
git add src/features/subscriptions/components src/app/'(public)'/pricing tests/component/plan-selector.test.tsx tests/component/checkout-confirmation.test.tsx
git commit -m "feat: add explicit Premium plan confirmation"
```

Expected: PASS.

---

## Task 9: Open Paddle Checkout from the Server-Created Transaction

**Files:**

- Create: `src/features/subscriptions/components/paddle-checkout-launcher.tsx`
- Modify: `src/features/subscriptions/components/checkout-confirmation.tsx`
- Create: `tests/component/billing-processing-state.test.tsx`

- [x] **Step 1: Write a failing launcher test**

Verify that:

- Paddle.js initializes once with `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`;
- sandbox environment is selected only from validated public configuration;
- API keys are never passed to the browser;
- checkout opens with `transactionId`, not a client-selected price;
- `checkout.completed` navigates to `/billing/return?attempt=<uuid>` but does not set Premium state;
- close or error leaves the user Free and displays retry guidance.

- [x] **Step 2: Implement the launcher**

Create a client component using `initializePaddle` and keep one shared initialization promise. Open checkout with:

```ts
paddle.Checkout.open({
  transactionId: providerTransactionId,
  settings: {
    displayMode: 'overlay',
    theme: 'light',
    successUrl: returnUrl,
  },
});
```

- [x] **Step 3: Preserve state honesty**

The client callback may update only local presentation:

```ts
type CheckoutPresentationState = 'opening' | 'open' | 'processing' | 'closed' | 'error';
```

It must not call the capability provider with an optimistic Premium grant.

- [x] **Step 4: Run tests and commit**

```bash
pnpm vitest run tests/component/billing-processing-state.test.tsx
pnpm typecheck
git add src/features/subscriptions/components tests/component/billing-processing-state.test.tsx
git commit -m "feat: launch Paddle checkout from server transaction"
```

Expected: PASS.

---

## Task 10: Verify Webhooks Before Storage or Processing

**Files:**

- Create: `src/lib/payments/webhook-envelope.ts`
- Create: `src/server/billing/process-webhook.ts`
- Create: `src/app/api/billing/webhook/route.ts`
- Create: `supabase/functions/payment-webhook/index.ts`
- Create: `tests/integration/webhook-processing.test.ts`

- [x] **Step 1: Write failing webhook tests**

Verify:

- the raw request body is passed unchanged to signature verification;
- missing signature returns 400;
- invalid signature returns 400 and stores no event;
- valid duplicate returns 200 without a second transition;
- valid malformed normalized data returns 422 and records a redacted failure;
- the route never uses browser cookies or CSRF tokens;
- the response does not expose parser, SQL, or provider secrets.

- [x] **Step 2: Implement the raw webhook envelope**

Create `src/lib/payments/webhook-envelope.ts`:

```ts
export const readRawWebhook = async (request: Request) => ({
  rawBody: await request.text(),
  signature: request.headers.get('paddle-signature') ?? '',
});
```

Do not call `request.json()` before verification.

- [x] **Step 3: Implement processing orchestration**

Create `src/server/billing/process-webhook.ts` that:

1. reads the raw body and signature;
2. verifies and normalizes through the provider adapter;
3. inserts `private.payment_events` using the unique provider/event ID;
4. stores raw payload with `raw_payload_expires_at = now + configured retention` only after valid signature;
5. invokes the SQL entitlement projection function from Task 12;
6. records processed, ignored, or failed status;
7. returns success for a valid duplicate event;
8. emits only redacted logs.

- [x] **Step 4: Implement the Next.js route**

Create `src/app/api/billing/webhook/route.ts` with Node.js runtime and no session dependency.

- [x] **Step 5: Implement the Supabase Edge Function entrypoint**

Create `supabase/functions/payment-webhook/index.ts` as an alternative deployment target that delegates to the same normalized contract. Keep one authoritative public webhook URL per environment; do not activate both simultaneously.

- [x] **Step 6: Run tests and commit**

```bash
pnpm vitest run tests/integration/webhook-processing.test.ts
pnpm typecheck
git add src/lib/payments/webhook-envelope.ts src/server/billing/process-webhook.ts src/app/api/billing/webhook/route.ts supabase/functions/payment-webhook tests/integration/webhook-processing.test.ts
git commit -m "feat: verify and ingest Paddle webhooks"
```

Expected: PASS.

---

## Task 11: Add Idempotent, Ordered Billing Event Processing

**Files:**

- Create: `supabase/migrations/20260729061000_billing_event_processing.sql`
- Create: `supabase/tests/00180_billing_event_ordering.test.sql`

- [x] **Step 1: Implement the processing function**

Create `supabase/migrations/20260729061000_billing_event_processing.sql` with a private security-definer function:

```sql
private.process_normalized_billing_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_plan_code text,
  p_status public.entitlement_status,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_cancel_at_period_end boolean,
  p_payload_hash text
) returns jsonb
```

The function must:

1. set fixed `search_path`;
2. acquire a transaction advisory lock derived from provider subscription ID;
3. replay already processed event IDs as `{ "result": "duplicate" }`;
4. insert or update private billing customer ownership;
5. reject a provider customer or subscription already linked to another user;
6. compare `p_occurred_at` to `provider_occurred_at`;
7. mark older events `ignored` with `ignored_reason = 'stale_event'`;
8. upsert the billing subscription for newer or equal events;
9. call the entitlement projection function from Task 12;
10. update payment event status transactionally;
11. insert a minimized audit event;
12. return result, subscription revision, and entitlement revision.

- [x] **Step 2: Write event-ordering pgTAP tests**

Create `supabase/tests/00180_billing_event_ordering.test.sql` covering:

- first event applies;
- duplicate event replays;
- older event is ignored;
- newer cancellation applies;
- same subscription cannot move to another user;
- equal occurrence time with identical event is duplicate;
- equal occurrence time with a distinct event resolves deterministically by event ID and reconciliation requirement;
- concurrent processing produces one final revision;
- audit metadata excludes raw payload and payment details.

- [x] **Step 3: Run database tests and commit**

```bash
supabase db reset
pnpm test:db
git add supabase/migrations/20260729061000_billing_event_processing.sql supabase/tests/00180_billing_event_ordering.test.sql
git commit -m "feat: process billing events idempotently"
```

Expected: PASS.

---

## Task 12: Project Billing State into Authoritative Entitlements

**Files:**

- Create: `supabase/migrations/20260729062000_entitlement_projection.sql`
- Create: `supabase/tests/00170_entitlement_projection.test.sql`
- Create: `src/features/entitlements/billing-entitlement-projector.ts`
- Create: `tests/integration/entitlement-reconciliation.test.ts`

- [x] **Step 1: Implement SQL entitlement projection**

Create `supabase/migrations/20260729062000_entitlement_projection.sql` with:

```sql
private.project_billing_entitlement(
  p_user_id uuid,
  p_subscription_id text,
  p_plan_code text,
  p_status public.entitlement_status,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_cancel_at_period_end boolean,
  p_source_event_id text
) returns public.entitlements
```

Required behavior:

- one current entitlement per provider subscription;
- trial, active, grace, past-due, cancelled, expired, refunded, and revoked transitions preserve history through revisions and audit events;
- `trial_active`, `active`, and `grace_period` are capability-granting only inside the valid window;
- `trial_cancelled` and `cancelled` preserve the existing end date;
- `expired`, `refunded`, and `revoked` terminate Premium without deleting product records;
- refunded/revoked events may shorten validity only when authoritative occurrence is newer;
- capability resolution continues using Plan 08 contracts.

- [x] **Step 2: Write pgTAP transition tests**

Cover all nine internal statuses, valid-window boundaries, cancellation at period end, immediate refund, immediate revocation, and revision increments.

- [x] **Step 3: Implement the TypeScript projector boundary**

Create `src/features/entitlements/billing-entitlement-projector.ts` that accepts only `NormalizedBillingEvent`, calls the SQL function through the privileged server client, and returns a bounded entitlement snapshot. It must never accept a status from a browser request.

- [x] **Step 4: Write integration tests**

Verify that:

- browser query parameters cannot create entitlement;
- checkout completion callbacks cannot create entitlement;
- verified events create or update entitlement;
- expired access blocks Plan 08 Premium actions;
- historical Premium data remains queryable according to Plan 08 policy.

- [x] **Step 5: Run tests and commit**

```bash
supabase db reset
pnpm test:db
pnpm vitest run tests/integration/entitlement-reconciliation.test.ts
git add supabase/migrations/20260729062000_entitlement_projection.sql supabase/tests/00170_entitlement_projection.test.sql src/features/entitlements/billing-entitlement-projector.ts tests/integration/entitlement-reconciliation.test.ts
git commit -m "feat: project billing events into entitlements"
```

Expected: PASS.

---

## Task 13: Implement Checkout Return Processing and Authoritative Status Polling

**Files:**

- Create: `src/app/billing/return/page.tsx`
- Create: `src/app/api/billing/status/route.ts`
- Create: `src/features/subscriptions/subscription-query.ts`
- Modify: `src/features/subscriptions/components/billing-processing-state.tsx`

- [x] **Step 1: Add return-page tests**

Extend `tests/component/billing-processing-state.test.tsx` to verify:

- invalid or missing attempt UUID shows a safe error;
- valid attempt starts in `Processing`;
- the page polls only the authenticated server status endpoint;
- Premium UI appears only after the endpoint returns authoritative capability;
- timeout displays `Still processing` and manual refresh, not payment failure;
- failed/cancelled checkout displays retry guidance;
- the layout remains stable across processing, success, and error states.

- [x] **Step 2: Implement bounded subscription query**

Create `src/features/subscriptions/subscription-query.ts` returning:

```ts
type SubscriptionSnapshot = {
  status: BillingStatus | 'none' | 'processing';
  planCode: BillingPlanCode | null;
  premium: boolean;
  validUntil: string | null;
  cancelAtPeriodEnd: boolean;
  checkoutAttemptStatus: string | null;
  revision: number | null;
};
```

Do not return provider payload, customer ID, subscription ID, raw event, or portal URL.

- [x] **Step 3: Implement the status route**

`GET /api/billing/status?attempt=<uuid>` must:

- require authentication;
- validate ownership of the checkout attempt;
- return `Cache-Control: no-store`;
- rate limit polling;
- derive `premium` from Plan 08 capability resolution;
- never derive it from checkout-attempt status alone.

- [x] **Step 4: Implement the return page**

Poll with increasing intervals: 1s, 2s, 3s, then 5s up to a 60-second active window. Stop when the tab is hidden and resume when visible. After the active window, show a manual Refresh status button.

- [x] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/component/billing-processing-state.test.tsx
pnpm typecheck
git add src/app/billing/return src/app/api/billing/status src/features/subscriptions/subscription-query.ts src/features/subscriptions/components/billing-processing-state.tsx tests/component/billing-processing-state.test.tsx
git commit -m "feat: show authoritative checkout processing state"
```

Expected: PASS.

---

## Task 14: Build Subscription Status and Customer Portal Management

**Files:**

- Create: `src/features/subscriptions/subscription-management-service.ts`
- Create: `src/server/billing/create-portal-session.ts`
- Create: `src/app/api/billing/portal/route.ts`
- Create: `src/features/subscriptions/components/subscription-status-card.tsx`
- Modify: `src/app/(application)/settings/subscription/page.tsx`
- Create: `tests/integration/customer-portal.test.ts`
- Create: `tests/component/subscription-status-card.test.tsx`

- [x] **Step 1: Write failing management tests**

Verify:

- only the owner can request a portal session;
- no billing customer returns a safe unavailable state;
- each click creates a new temporary portal URL;
- portal URLs are not stored in PostgreSQL, logs, analytics, or cache;
- status card shows trial end, next billing/expiry, cancellation state, and payment issue guidance;
- `Cancelled` explains continued access until expiry;
- `Past Due` links to payment management and does not threaten data loss;
- `Expired`, `Refunded`, and `Revoked` explain access changes without deleting history.

- [x] **Step 2: Implement portal creation**

Create `src/server/billing/create-portal-session.ts` that loads the authenticated user's private provider IDs and calls `provider.createCustomerPortal()`.

- [x] **Step 3: Implement the portal route**

`POST /api/billing/portal` must validate origin/CSRF, require authentication, apply rate limiting, and return a same-provider HTTPS URL. Set `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.

- [x] **Step 4: Implement the subscription status card**

Render status with icon, text label, dates, explanation, and action. Do not rely on color alone.

- [x] **Step 5: Integrate the Subscription page**

The page includes:

- current plan and status;
- trial or paid validity dates;
- auto-renewal/cancellation disclosure;
- Manage billing button;
- Refresh status button;
- downgrade-resolution link when required;
- no display of payment instrument details from local storage.

- [x] **Step 6: Run tests and commit**

```bash
pnpm vitest run tests/integration/customer-portal.test.ts tests/component/subscription-status-card.test.tsx
git add src/server/billing/create-portal-session.ts src/app/api/billing/portal src/features/subscriptions src/app/'(application)'/settings/subscription tests/integration/customer-portal.test.ts tests/component/subscription-status-card.test.tsx
git commit -m "feat: add secure subscription management"
```

Expected: PASS.

---

## Task 15: Add Authoritative Subscription Reconciliation and Manual Refresh

**Files:**

- Create: `src/server/billing/reconcile-subscription.ts`
- Create: `src/features/subscriptions/entitlement-refresh-service.ts`
- Create: `src/app/api/billing/refresh/route.ts`
- Create: `tests/integration/entitlement-reconciliation.test.ts`

- [x] **Step 1: Add reconciliation tests**

Verify:

- reconciliation fetches by stored provider subscription ID, never a browser-supplied ID;
- fetched state passes through the same normalizer and SQL processor as webhooks;
- reconciliation repairs a missed event;
- older fetched state cannot overwrite newer local state;
- repeated refresh is idempotent;
- one user cannot refresh another user's subscription;
- refresh is rate limited and audited.

- [x] **Step 2: Implement reconciliation**

Create `src/server/billing/reconcile-subscription.ts`:

```ts
export async function reconcileSubscription(userId: string) {
  const stored = await readPrivateBillingSubscription(userId);
  if (!stored) return { kind: 'none' } as const;
  const event = await getPaymentProvider().fetchSubscription(stored.providerSubscriptionId);
  return processNormalizedBillingEvent(event, { source: 'reconciliation' });
}
```

- [x] **Step 3: Implement manual refresh route**

`POST /api/billing/refresh` requires authentication, origin/CSRF validation, and a strict per-user rate limit. Return the bounded subscription snapshot after reconciliation.

- [x] **Step 4: Define scheduled reconciliation entrypoint**

Add a server entrypoint that scans a bounded batch of active, trialing, grace, past-due, or recently cancelled subscriptions. It must use the configured batch size, cursor pagination, advisory locking, and safe retry codes. Scheduling itself is configured in Plan 11.

- [x] **Step 5: Run tests and commit**

```bash
pnpm vitest run tests/integration/entitlement-reconciliation.test.ts
git add src/server/billing/reconcile-subscription.ts src/features/subscriptions/entitlement-refresh-service.ts src/app/api/billing/refresh/route.ts tests/integration/entitlement-reconciliation.test.ts
git commit -m "feat: reconcile authoritative subscription state"
```

Expected: PASS.

---

## Task 16: Implement Non-Destructive Premium Downgrade Resolution

**Files:**

- Create: `src/domain/billing/downgrade-resolution.ts`
- Create: `src/features/subscriptions/downgrade-service.ts`
- Create: `src/features/subscriptions/components/downgrade-resolution.tsx`
- Create: `src/app/(application)/settings/subscription/downgrade/page.tsx`
- Create: `supabase/migrations/20260729063000_subscription_management.sql`
- Create: `supabase/tests/00190_downgrade_resolution.test.sql`
- Create: `tests/integration/downgrade-service.test.ts`
- Create: `tests/component/downgrade-resolution.test.tsx`

- [ ] **Step 1: Write failing downgrade tests**

Verify:

- expiry with five or fewer active habits needs no resolution;
- expiry with more than five creates one open resolution item;
- user must select at most five habits to remain active;
- selected habits remain active;
- unselected active habits become Paused in one transaction;
- no habit, version, session, check-in, review, Recovery record, insight history, or reminder history is deleted;
- Premium program enrollments become `decision_required`;
- user chooses `continue_static` or `pause_program` per affected enrollment;
- repeated command IDs replay without duplicate pauses or decisions.

- [ ] **Step 2: Define the command contract**

Create `src/domain/billing/downgrade-resolution.ts`:

```ts
export type ResolveDowngradeCommand = Readonly<{
  commandId: string;
  userId: string;
  activeHabitIds: readonly string[];
  programDecisions: ReadonlyArray<{
    enrollmentId: string;
    decision: 'continue_static' | 'pause_program';
  }>;
}>;
```

- [ ] **Step 3: Implement transactional SQL**

Create `supabase/migrations/20260729063000_subscription_management.sql` with:

- `private.create_downgrade_resolution_if_needed(user_id)`;
- `public.resolve_subscription_downgrade(command_id, active_habit_ids, program_decisions)`;
- fixed search path, `auth.uid()` ownership, UUID validation, maximum five selected habits, idempotency, row locks, audit events, and one transaction;
- no delete statements against product history tables.

- [ ] **Step 4: Implement service and UI**

The page displays all currently active habits with checkboxes, a count `n of 5 selected`, clear consequences, Premium program choices, Cancel, and Confirm. Confirmation uses a descriptive dialog and never relies on red alone.

- [ ] **Step 5: Run tests and commit**

```bash
supabase db reset
pnpm test:db
pnpm vitest run tests/integration/downgrade-service.test.ts tests/component/downgrade-resolution.test.tsx
git add src/domain/billing/downgrade-resolution.ts src/features/subscriptions/downgrade-service.ts src/features/subscriptions/components/downgrade-resolution.tsx src/app/'(application)'/settings/subscription/downgrade supabase/migrations/20260729063000_subscription_management.sql supabase/tests/00190_downgrade_resolution.test.sql tests/integration/downgrade-service.test.ts tests/component/downgrade-resolution.test.tsx
git commit -m "feat: preserve user data during Premium downgrade"
```

Expected: PASS.

---

## Task 17: Lock Down Billing RLS, Grants, and Browser Boundaries

**Files:**

- Create: `supabase/migrations/20260729064000_billing_rls.sql`
- Create: `supabase/tests/00200_billing_rls.test.sql`

- [ ] **Step 1: Apply billing access rules**

Create `supabase/migrations/20260729064000_billing_rls.sql`:

- private billing tables remain inaccessible to browser roles;
- authenticated users read only the bounded `subscription_status_view` row for themselves;
- no browser insert/update/delete is allowed on `entitlements`;
- no browser access is allowed to raw payment events, payload hashes, provider customer IDs, provider subscription IDs, checkout idempotency records, or audit events;
- only security-definer functions with fixed search path may process events and downgrade commands;
- service-role functions validate explicit user ownership before returning portal or checkout data.

- [ ] **Step 2: Add RLS tests**

Verify cross-user denial, direct entitlement mutation denial, private table denial, bounded status read, valid own downgrade command, and invalid cross-user habit selection rejection.

- [ ] **Step 3: Run database tests and commit**

```bash
supabase db reset
pnpm test:db
git add supabase/migrations/20260729064000_billing_rls.sql supabase/tests/00200_billing_rls.test.sql
git commit -m "security: enforce billing database boundaries"
```

Expected: PASS.

---

## Task 18: Add Billing Accessibility, Sandbox E2E, Contract Fixtures, and Incident Runbook

**Files:**

- Create: `tests/accessibility/subscription-accessibility.test.tsx`
- Create: `tests/e2e/subscription-flow.spec.ts`
- Create: `tests/fixtures/paddle/`
- Create: `docs/operations/PAYMENT-INCIDENTS.md`

- [ ] **Step 1: Add accessibility tests**

Verify with axe and keyboard interaction:

- plan selection has a legend and radio labels;
- disabled checkout explains why;
- processing uses `aria-live="polite"`;
- errors use headings, text, icon, and retry action;
- status never relies on color alone;
- portal opens from a clearly labeled control;
- downgrade selection count is announced;
- destructive or consequential confirmations trap focus and return it correctly;
- layouts remain usable at 200% zoom.

- [ ] **Step 2: Add sanitized Paddle fixtures**

Store representative sandbox payloads for:

- trial created;
- trial cancelled;
- active subscription;
- payment past due;
- grace/recovery;
- scheduled cancellation;
- expired subscription;
- refund;
- revocation;
- duplicate event;
- out-of-order event;
- malformed payload.

Fixtures must use invalid domains, synthetic IDs, synthetic emails, and no live tokens or card data.

- [ ] **Step 3: Add the E2E subscription flow**

Create `tests/e2e/subscription-flow.spec.ts` with deterministic provider stubs and verify:

1. Pricing initially has no selected plan.
2. User selects monthly and reviews exact trial disclosure.
3. Confirmation requires explicit checkbox.
4. Checkout is created server-side.
5. Return page remains Processing before webhook.
6. Verified trial webhook enables Premium.
7. Duplicate webhook has no second effect.
8. Older webhook is ignored.
9. Scheduled cancellation preserves access until expiry.
10. Past due shows recovery guidance.
11. Refund disables Premium without deleting history.
12. User above five active habits completes downgrade resolution.
13. Portal URL is generated on demand.
14. Direct return URL manipulation never grants Premium.

- [ ] **Step 4: Write the payment incident runbook**

Create `docs/operations/PAYMENT-INCIDENTS.md` with procedures for:

- invalid signature spike;
- webhook delivery backlog;
- duplicate-event spike;
- out-of-order events;
- checkout succeeds but entitlement remains Processing;
- provider outage;
- accidental secret exposure;
- incorrect Premium grant;
- incorrect Premium removal;
- reconciliation drift;
- refund/revocation dispute;
- raw-payload retention cleanup failure.

Each procedure must include detection, containment, evidence to preserve, safe reconciliation, user-facing communication boundaries, rollback, and escalation. Do not instruct operators to edit entitlement rows manually without a reviewed corrective command.

- [ ] **Step 5: Run the focused Plan 09 suites**

```bash
pnpm test:billing
pnpm test:billing:contract
pnpm test:e2e:billing
pnpm typecheck
pnpm lint
pnpm build
supabase db reset
pnpm test:db
```

Expected: all commands exit with status `0`.

- [ ] **Step 6: Scan for secrets and unsafe billing references**

Run:

```bash
rg -n "PADDLE_API_KEY=.+|PADDLE_NOTIFICATION_WEBHOOK_SECRET=.+|live_[A-Za-z0-9]+|cardNumber|rawPayload.*console|portalUrl.*(cache|localStorage)" . \
  --glob '!pnpm-lock.yaml' \
  --glob '!docs/implementation/09-web-billing-entitlements.md'
```

Expected: no committed secret, browser API key, payment instrument logging, raw payload logging, or cached portal URL.

- [ ] **Step 7: Commit**

```bash
git add tests/accessibility/subscription-accessibility.test.tsx tests/e2e/subscription-flow.spec.ts tests/fixtures/paddle docs/operations/PAYMENT-INCIDENTS.md
git commit -m "test: verify billing and entitlement lifecycle"
```

---

# 4. Plan 09 Quality Gate

Plan 09 is complete only when all statements below are verified with fresh commands:

- [ ] Monthly and annual plans render with no default selection.
- [ ] Trial confirmation is explicit and includes trial end, first billing date, renewal, cancellation, and refund disclosure.
- [ ] Checkout attempts require an authenticated account and are created on the server.
- [ ] Checkout requests are idempotent.
- [ ] Browser code receives no Paddle API key or webhook secret.
- [ ] Paddle.js uses only a client-side token.
- [ ] Checkout return state never grants Premium.
- [ ] Paddle.js completion events never grant Premium.
- [ ] Webhook signature verification occurs against the raw body before storage or processing.
- [ ] Invalid-signature events create no entitlement mutation.
- [ ] Duplicate valid events produce one transition.
- [ ] Out-of-order events cannot overwrite newer state.
- [ ] Reconciliation repairs missing or delayed webhook state.
- [ ] All nine internal entitlement statuses are covered by tests.
- [ ] Trial and cancelled access expire according to authoritative dates.
- [ ] Refund and revocation disable access without deleting product history.
- [ ] Past-due and grace-period states display non-punitive payment guidance.
- [ ] Customer portal URLs are generated on demand and never cached.
- [ ] Downgrade above five active habits requires explicit selection.
- [ ] Unselected excess habits are paused transactionally.
- [ ] Premium program history remains intact and enters Decision Required where applicable.
- [ ] Private billing tables are inaccessible to browser roles.
- [ ] Raw webhook payload retention is bounded.
- [ ] Logs and analytics contain no payment instrument, secret, full payload, or portal token.
- [ ] Billing screens pass accessibility checks.
- [ ] Sandbox monthly, annual, trial, cancellation, past-due, refund, and revocation scenarios pass.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build`, billing tests, E2E tests, and database tests pass from a clean checkout.

---

# 5. Clean-Checkout Verification

Run from a fresh clone or isolated worktree:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
supabase start
supabase db reset
pnpm test:db
pnpm test:billing
pnpm test:billing:contract
pnpm test:e2e:billing
pnpm typecheck
pnpm lint
pnpm build
```

For local verification, use sandbox credentials only. Never place production credentials in `.env.example`, fixtures, screenshots, shell history committed to the repository, or test snapshots.

Expected result:

```text
Database tests: PASS
Billing unit/integration/component/accessibility tests: PASS
Paddle provider contract tests: PASS
Billing E2E tests: PASS
Typecheck: PASS
Lint: PASS
Production build: PASS
```

---

# 6. Handoff to Plan 10

Next plan:

```text
docs/implementation/10-security-observability-data-lifecycle.md
```

Plan 10 may assume:

- Paddle sandbox checkout and customer portal integration work;
- authoritative billing events project into entitlements;
- Premium capability remains server-authorized;
- duplicate, delayed, and out-of-order events are handled;
- reconciliation can repair drift;
- downgrade preserves history;
- billing audit metadata is minimized;
- the payment incident runbook exists.

Plan 10 must add broader rate limiting, security headers, secret rotation procedures, centralized observability, alert thresholds, retention jobs, data export, account deletion, and production-grade data-lifecycle controls without weakening the billing boundaries established here.
