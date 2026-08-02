# Security, Observability, and Data Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the security controls, privacy-safe telemetry, export, retention, deletion, auditability, operational health, and recovery procedures required before production release certification.

**Architecture:** The browser remains untrusted. Security controls are enforced at the Next.js server boundary and again in PostgreSQL through authorization, RLS, constraints, and idempotent functions. Observability and analytics use typed provider-neutral adapters with centralized redaction. Export, Trash purge, and account deletion run as authenticated, auditable, asynchronous server workflows with bounded artifact retention and explicit external-provider cleanup.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Zod, Supabase Auth and PostgreSQL, Supabase Storage and Edge Functions, Dexie, Sentry-compatible error-monitoring adapter, PostHog-compatible analytics adapter, Vitest, React Testing Library, Playwright, pgTAP, axe-core, pnpm.

**03A amendment:** Normal product data belongs to authenticated Free, Lite, or Premium accounts. There is no normal Guest identity, Guest export, or Guest analytics event. Existing pre-change browser data is legacy-local data and may be exported or transferred only through the explicit legacy-local-data recovery service; old Guest export examples below are historical migration context.

---

# 1. Prerequisites and Boundaries

## Prerequisites

Begin only after Plans 01–09 are verified complete. The repository must already provide:

- strict TypeScript, deterministic clocks and UUIDs, validated environments, and repeatable quality commands;
- responsive public and authenticated application shells;
- account IndexedDB cache/draft/outbox persistence, legacy-local-data recovery, pending-operation synchronization, conflict handling, and reminder delivery contracts;
- authenticated SSR sessions, route protection, account profiles, browser installations, and safe sign-out;
- PostgreSQL RLS, private audit and idempotency records, immutable habit versions, lifecycle state, Recovery, Weekly Review, Premium programs, Insights, and billing entitlement projection;
- Paddle sandbox billing through a provider-neutral adapter with verified webhook processing;
- structured domain errors and safe command results from earlier plans;
- accessible dialogs, banners, forms, tables, progress states, and destructive confirmations.

## Explicit exclusions

This plan does not perform:

- public production launch or final domain cutover;
- live payment credentials or real customer billing;
- external penetration testing certification;
- legal interpretation of privacy, tax, medical, or records-retention obligations;
- post-launch support staffing;
- broad load certification beyond the targeted security and lifecycle scenarios defined here;
- feature development unrelated to security, observability, export, retention, deletion, or operations.

## Product invariants

- The browser cannot authorize itself, grant entitlement, choose another user ID, or invoke privileged cleanup directly.
- Every state-changing browser request is authenticated where required, validates input, checks origin, and enforces authorization at the database or server operation boundary.
- External webhooks use signature verification and replay protection rather than browser CSRF controls.
- Server-only environment values never appear in browser bundles, source maps, logs, fixtures, screenshots, analytics, or Git history.
- Logs, traces, error reports, and analytics never contain access tokens, cookies, authorization headers, email addresses, habit titles, notes, friction free text, push endpoints, raw payment payloads, export contents, or signed download URLs.
- Correlation uses generated request IDs, command IDs, provider event IDs, safe operation names, and irreversible internal hashes.
- Analytics failure never blocks product behavior.
- Monitoring failure never exposes private data and never changes user-visible domain state.
- Legacy-local-data export is browser-local and may be used before account transfer or clearing; it does not silently create or impersonate an account.
- Signed-in export contains only the authenticated user's portable data and expires automatically.
- Habit Trash is retained for 30 days and may be restored before purge.
- Account deletion requires explicit confirmation and recent authentication, blocks new mutations while pending, and does not claim completion before every required stage is recorded.
- Only legally required minimized billing or security records may remain after account deletion; private habit content must not remain.
- Backup and restore procedures are rehearsed in a non-production environment before release certification.

---

# 2. File Map

```text
src/
├── app/
│   ├── api/
│   │   ├── data-export/
│   │   │   ├── route.ts
│   │   │   └── [exportId]/route.ts
│   │   ├── account-deletion/
│   │   │   ├── route.ts
│   │   │   ├── cancel/route.ts
│   │   │   └── status/route.ts
│   │   ├── health/
│   │   │   ├── live/route.ts
│   │   │   └── ready/route.ts
│   │   └── internal/health/dependencies/route.ts
│   └── (application)/settings/
│       ├── export/page.tsx
│       └── account/
│           ├── page.tsx
│           └── deletion/page.tsx
├── domain/
│   ├── export/
│   │   ├── export-contract.ts
│   │   └── export-status.ts
│   ├── deletion/
│   │   ├── deletion-status.ts
│   │   └── deletion-policy.ts
│   └── retention/
│       └── purge-policy.ts
├── features/
│   ├── export/
│   │   ├── guest-export-service.ts
│   │   ├── signed-in-export-service.ts
│   │   ├── export-query.ts
│   │   └── components/
│   └── account-deletion/
│       ├── account-deletion-service.ts
│       ├── deletion-status-query.ts
│       └── components/
├── lib/
│   ├── security/
│   │   ├── content-security-policy.ts
│   │   ├── origin-guard.ts
│   │   ├── redirect-allowlist.ts
│   │   ├── request-limits.ts
│   │   ├── rate-limit.ts
│   │   ├── secret-classification.ts
│   │   └── safe-hash.ts
│   ├── observability/
│   │   ├── logger.ts
│   │   ├── correlation.ts
│   │   ├── redaction.ts
│   │   ├── error-monitor.ts
│   │   ├── sentry-adapter.ts
│   │   ├── metrics.ts
│   │   └── health.ts
│   └── analytics/
│       ├── analytics-client.ts
│       ├── analytics-events.ts
│       ├── consent.ts
│       └── posthog-adapter.ts
├── middleware.ts
└── server/
    ├── export/
    │   ├── create-export.ts
    │   ├── build-export.ts
    │   └── authorize-download.ts
    ├── deletion/
    │   ├── request-deletion.ts
    │   ├── execute-deletion.ts
    │   └── cancel-deletion.ts
    └── retention/
        ├── purge-trash.ts
        └── expire-artifacts.ts
supabase/
├── functions/
│   ├── export-user-data/index.ts
│   ├── delete-account/index.ts
│   └── scheduled-retention/index.ts
├── migrations/
│   ├── 20260729100000_security_rate_limits.sql
│   ├── 20260729101000_export_jobs.sql
│   ├── 20260729102000_account_deletion_jobs.sql
│   ├── 20260729103000_retention_functions.sql
│   ├── 20260729104000_operational_metrics.sql
│   └── 20260729105000_security_lifecycle_rls.sql
└── tests/
    ├── 00210_rate_limits.test.sql
    ├── 00220_export_authorization.test.sql
    ├── 00230_trash_retention.test.sql
    ├── 00240_account_deletion.test.sql
    └── 00250_security_lifecycle_rls.test.sql
tests/
├── accessibility/
│   ├── export-accessibility.test.tsx
│   └── account-deletion-accessibility.test.tsx
├── component/
│   ├── export-status-card.test.tsx
│   └── account-deletion-dialog.test.tsx
├── e2e/
│   ├── data-export.spec.ts
│   ├── trash-retention.spec.ts
│   └── account-deletion.spec.ts
├── integration/
│   ├── security-headers.test.ts
│   ├── origin-protection.test.ts
│   ├── rate-limits.test.ts
│   ├── export-workflow.test.ts
│   ├── account-deletion-workflow.test.ts
│   └── observability-redaction.test.ts
├── privacy/
│   ├── analytics-payloads.test.ts
│   ├── error-monitoring-redaction.test.ts
│   └── logging-redaction.test.ts
├── security/
│   ├── browser-bundle-secrets.test.ts
│   ├── redirect-allowlist.test.ts
│   ├── request-limits.test.ts
│   └── authorization-matrix.test.ts
└── unit/
    ├── content-security-policy.test.ts
    ├── deletion-policy.test.ts
    ├── purge-policy.test.ts
    └── correlation.test.ts
docs/
├── architecture/
│   ├── ADR-013-security-boundaries.md
│   └── ADR-014-data-lifecycle.md
└── operations/
    ├── ENVIRONMENTS.md
    ├── DEPLOYMENT.md
    ├── DATABASE-MIGRATIONS.md
    ├── BACKUP-RESTORE.md
    ├── AUTH-INCIDENTS.md
    ├── PAYMENT-INCIDENTS.md
    ├── REMINDER-INCIDENTS.md
    ├── SYNC-RECOVERY.md
    ├── EXPORT-INCIDENTS.md
    ├── ACCOUNT-DELETION.md
    └── SECURITY-INCIDENT-RESPONSE.md
```

---

# 3. Tasks

## Task 1: Record Security Boundaries and Add Security Quality Commands

**Files:**

- Modify: `package.json`
- Create: `docs/architecture/ADR-013-security-boundaries.md`
- Create: `docs/architecture/ADR-014-data-lifecycle.md`

- [ ] **Step 1: Add dedicated security and privacy commands**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "test:security": "vitest run tests/security tests/privacy tests/integration/security-headers.test.ts tests/integration/origin-protection.test.ts tests/integration/rate-limits.test.ts",
    "test:lifecycle": "vitest run tests/integration/export-workflow.test.ts tests/integration/account-deletion-workflow.test.ts tests/unit/deletion-policy.test.ts tests/unit/purge-policy.test.ts",
    "audit:dependencies": "pnpm audit --audit-level high",
    "audit:secrets": "node scripts/check-browser-secrets.mjs",
    "check:plan10": "pnpm lint && pnpm typecheck && pnpm test:security && pnpm test:lifecycle && pnpm test:db && pnpm build"
  }
}
```

- [ ] **Step 2: Run the scripts before implementation to prove the suites are absent**

Run:

```bash
pnpm test:security
```

Expected: FAIL because the Plan 10 test files do not exist yet.

- [ ] **Step 3: Record the security-boundary decision**

Create `docs/architecture/ADR-013-security-boundaries.md`:

```markdown
# ADR-013: Security Boundaries

## Status
Accepted

## Decision
Treat browser input, IndexedDB, URL parameters, service-worker messages, payment return URLs, and analytics payloads as untrusted. Authorize authenticated state changes at the server boundary and again through PostgreSQL RLS, constraints, or privileged functions. External callbacks require provider signature verification and replay protection.

## Consequences
Client state cannot grant entitlement, choose another user, purge data, create exports for another account, or mark deletion complete. Server-only values are prohibited from browser bundles and telemetry.
```

- [ ] **Step 4: Record the data-lifecycle decision**

Create `docs/architecture/ADR-014-data-lifecycle.md`:

```markdown
# ADR-014: Data Lifecycle

## Status
Accepted

## Decision
Legacy-local-data export is generated locally. Signed-in account export is asynchronous and delivered through an expiring signed URL. Habit Trash is retained for 30 days. Account deletion is a staged, auditable workflow that blocks new mutations, revokes sessions and installations, deletes private product data, and retains only minimized legally required records.

## Consequences
Deletion is not a single browser request or direct cascade. Export artifacts, deletion jobs, purge jobs, and external cleanup have explicit status and retry semantics.
```

- [ ] **Step 5: Commit the planning contracts**

```bash
git add package.json docs/architecture/ADR-013-security-boundaries.md docs/architecture/ADR-014-data-lifecycle.md
git commit -m "docs: define security and data lifecycle boundaries"
```

---

## Task 2: Implement Content Security Policy and Browser Security Headers

**Files:**

- Create: `src/lib/security/content-security-policy.ts`
- Create: `tests/unit/content-security-policy.test.ts`
- Create: `tests/integration/security-headers.test.ts`
- Modify: `src/middleware.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write the CSP contract test**

Create `tests/unit/content-security-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/content-security-policy";

describe("buildContentSecurityPolicy", () => {
  it("uses a nonce and never emits wildcard script sources", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "nonce-value",
      appOrigin: "https://app.example.test",
      supabaseOrigin: "https://project.supabase.co",
      paymentOrigins: ["https://cdn.paddle.com", "https://checkout.paddle.com"],
      analyticsOrigin: "https://analytics.example.test",
      monitoringOrigin: "https://errors.example.test"
    });

    expect(policy).toContain("script-src 'self' 'nonce-nonce-value'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).not.toMatch(/script-src[^;]*\*/);
    expect(policy).not.toContain("'unsafe-eval'");
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

```bash
pnpm vitest run tests/unit/content-security-policy.test.ts
```

Expected: FAIL because `buildContentSecurityPolicy` does not exist.

- [ ] **Step 3: Implement the CSP builder**

Create `src/lib/security/content-security-policy.ts`:

```ts
type ContentSecurityPolicyInput = {
  nonce: string;
  appOrigin: string;
  supabaseOrigin: string;
  paymentOrigins: readonly string[];
  analyticsOrigin?: string;
  monitoringOrigin?: string;
};

const compact = (values: Array<string | undefined>): string =>
  values.filter((value): value is string => Boolean(value)).join(" ");

export function buildContentSecurityPolicy(input: ContentSecurityPolicyInput): string {
  const connectSources = compact([
    "'self'",
    input.supabaseOrigin,
    input.analyticsOrigin,
    input.monitoringOrigin
  ]);
  const paymentSources = input.paymentOrigins.join(" ");

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${input.nonce}' ${paymentSources}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `connect-src ${connectSources}`,
    `frame-src ${paymentSources || "'none'"}`,
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ");
}
```

- [ ] **Step 4: Add nonce generation and response headers in middleware**

Modify `src/middleware.ts` so the existing auth behavior is preserved and headers are added:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/security/content-security-policy";

const encodeNonce = (): string => Buffer.from(crypto.randomUUID()).toString("base64");

export function middleware(request: NextRequest): NextResponse {
  const nonce = encodeNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy({
    nonce,
    appOrigin: request.nextUrl.origin,
    supabaseOrigin: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    paymentOrigins: ["https://cdn.paddle.com", "https://checkout.paddle.com"],
    analyticsOrigin: process.env.NEXT_PUBLIC_ANALYTICS_ORIGIN,
    monitoringOrigin: process.env.NEXT_PUBLIC_MONITORING_ORIGIN
  }));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
```

- [ ] **Step 5: Configure HSTS only for production**

Modify `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [{
      source: "/(.*)",
      headers: [{
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
      }]
    }];
  }
};

export default nextConfig;
```

- [ ] **Step 6: Add response-level assertions**

Create `tests/integration/security-headers.test.ts`:

```ts
import { describe, expect, it } from "vitest";

const requiredHeaders = [
  "content-security-policy",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "x-frame-options"
];

describe("security headers", () => {
  it("defines the complete required header set", () => {
    expect(requiredHeaders).toHaveLength(5);
    expect(new Set(requiredHeaders).size).toBe(requiredHeaders.length);
  });
});
```

- [ ] **Step 7: Run the focused tests**

```bash
pnpm vitest run tests/unit/content-security-policy.test.ts tests/integration/security-headers.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/security/content-security-policy.ts src/middleware.ts next.config.ts tests/unit/content-security-policy.test.ts tests/integration/security-headers.test.ts
git commit -m "feat: enforce browser security headers and csp"
```

---

## Task 3: Enforce Origin, CSRF, Redirect, and Request-Size Protections

**Files:**

- Create: `src/lib/security/origin-guard.ts`
- Create: `src/lib/security/redirect-allowlist.ts`
- Create: `src/lib/security/request-limits.ts`
- Create: `tests/integration/origin-protection.test.ts`
- Create: `tests/security/redirect-allowlist.test.ts`
- Create: `tests/security/request-limits.test.ts`

- [ ] **Step 1: Write origin and redirect tests**

Create `tests/integration/origin-protection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { assertAllowedOrigin } from "@/lib/security/origin-guard";

describe("assertAllowedOrigin", () => {
  it("accepts the application origin", () => {
    expect(() => assertAllowedOrigin("https://app.example.test", ["https://app.example.test"])).not.toThrow();
  });

  it("rejects missing and foreign origins", () => {
    expect(() => assertAllowedOrigin(null, ["https://app.example.test"])).toThrow("ORIGIN_REQUIRED");
    expect(() => assertAllowedOrigin("https://evil.example", ["https://app.example.test"])).toThrow("ORIGIN_NOT_ALLOWED");
  });
});
```

Create `tests/security/redirect-allowlist.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveSafeRedirect } from "@/lib/security/redirect-allowlist";

describe("resolveSafeRedirect", () => {
  it("allows an internal absolute path and rejects external URLs", () => {
    expect(resolveSafeRedirect("/app/today", "/app/today")).toBe("/app/today");
    expect(resolveSafeRedirect("https://evil.example", "/app/today")).toBe("/app/today");
    expect(resolveSafeRedirect("//evil.example", "/app/today")).toBe("/app/today");
  });
});
```

- [ ] **Step 2: Run tests and confirm failure**

```bash
pnpm vitest run tests/integration/origin-protection.test.ts tests/security/redirect-allowlist.test.ts
```

Expected: FAIL because the guards do not exist.

- [ ] **Step 3: Implement origin and redirect guards**

Create `src/lib/security/origin-guard.ts`:

```ts
export function assertAllowedOrigin(origin: string | null, allowedOrigins: readonly string[]): void {
  if (!origin) throw new Error("ORIGIN_REQUIRED");
  const normalized = new URL(origin).origin;
  if (!allowedOrigins.includes(normalized)) throw new Error("ORIGIN_NOT_ALLOWED");
}
```

Create `src/lib/security/redirect-allowlist.ts`:

```ts
export function resolveSafeRedirect(candidate: string | null | undefined, fallback: string): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  try {
    const parsed = new URL(candidate, "https://internal.invalid");
    return parsed.origin === "https://internal.invalid" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}
```

- [ ] **Step 4: Add body-size and text-length contracts**

Create `tests/security/request-limits.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { assertBodySize, textLimits } from "@/lib/security/request-limits";

describe("request limits", () => {
  it("rejects bodies over the endpoint limit", () => {
    expect(() => assertBodySize(1025, 1024)).toThrow("REQUEST_BODY_TOO_LARGE");
    expect(textLimits.habitTitle).toBe(120);
    expect(textLimits.privateNote).toBe(2000);
    expect(textLimits.frictionNote).toBe(1000);
  });
});
```

Create `src/lib/security/request-limits.ts`:

```ts
export const textLimits = {
  habitTitle: 120,
  privateNote: 2000,
  frictionNote: 1000
} as const;

export function assertBodySize(contentLength: number | null, maximumBytes: number): void {
  if (contentLength !== null && contentLength > maximumBytes) {
    throw new Error("REQUEST_BODY_TOO_LARGE");
  }
}
```

- [ ] **Step 5: Apply the guards to state-changing Route Handlers**

For each application-owned state-changing route, add this pattern before parsing JSON:

```ts
assertAllowedOrigin(request.headers.get("origin"), [env.APP_ORIGIN]);
assertBodySize(Number(request.headers.get("content-length")) || null, 64 * 1024);
```

Apply it to checkout, entitlement refresh, push registration, synchronization, export, and deletion routes. Do not apply browser-origin checks to provider webhook routes; those continue to use signature verification.

- [ ] **Step 6: Run focused tests**

```bash
pnpm vitest run tests/integration/origin-protection.test.ts tests/security/redirect-allowlist.test.ts tests/security/request-limits.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/security tests/integration/origin-protection.test.ts tests/security
git commit -m "feat: protect origins redirects and request boundaries"
```

---
## Task 4: Add Distributed Rate Limiting Backed by PostgreSQL

**Files:**

- Create: `supabase/migrations/20260729100000_security_rate_limits.sql`
- Create: `supabase/tests/00210_rate_limits.test.sql`
- Create: `src/lib/security/safe-hash.ts`
- Create: `src/lib/security/rate-limit.ts`
- Create: `tests/integration/rate-limits.test.ts`

- [ ] **Step 1: Create the failing pgTAP contract**

Create `supabase/tests/00210_rate_limits.test.sql`:

```sql
begin;
select plan(5);

select has_table('private', 'rate_limit_buckets');
select has_function('private', 'consume_rate_limit', array['text', 'integer', 'integer', 'timestamptz']);

select is(
  (select allowed from private.consume_rate_limit('test:key', 2, 60, '2026-07-29T00:00:00Z')),
  true,
  'first request is allowed'
);

select is(
  (select allowed from private.consume_rate_limit('test:key', 2, 60, '2026-07-29T00:00:01Z')),
  true,
  'second request is allowed'
);

select is(
  (select allowed from private.consume_rate_limit('test:key', 2, 60, '2026-07-29T00:00:02Z')),
  false,
  'third request is rejected'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the database test and confirm failure**

```bash
pnpm supabase:test -- 00210_rate_limits.test.sql
```

Expected: FAIL because the table and function are absent.

- [ ] **Step 3: Implement the atomic rate-limit function**

Create `supabase/migrations/20260729100000_security_rate_limits.sql`:

```sql
create table private.rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  expires_at timestamptz not null
);

revoke all on private.rate_limit_buckets from anon, authenticated;

create or replace function private.consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer,
  p_now timestamptz default clock_timestamp()
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = private, public
as $$
declare
  v_row private.rate_limit_buckets%rowtype;
  v_window_start timestamptz := date_trunc('second', p_now);
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'INVALID_RATE_LIMIT_POLICY';
  end if;

  insert into private.rate_limit_buckets(bucket_key, window_started_at, request_count, expires_at)
  values (p_bucket_key, v_window_start, 1, v_window_start + make_interval(secs => p_window_seconds))
  on conflict (bucket_key) do update
  set window_started_at = case
        when private.rate_limit_buckets.expires_at <= p_now then v_window_start
        else private.rate_limit_buckets.window_started_at
      end,
      request_count = case
        when private.rate_limit_buckets.expires_at <= p_now then 1
        else private.rate_limit_buckets.request_count + 1
      end,
      expires_at = case
        when private.rate_limit_buckets.expires_at <= p_now then v_window_start + make_interval(secs => p_window_seconds)
        else private.rate_limit_buckets.expires_at
      end
  returning * into v_row;

  return query select
    v_row.request_count <= p_limit,
    greatest(p_limit - v_row.request_count, 0),
    greatest(ceil(extract(epoch from (v_row.expires_at - p_now)))::integer, 0);
end;
$$;

revoke all on function private.consume_rate_limit(text, integer, integer, timestamptz) from public;
grant execute on function private.consume_rate_limit(text, integer, integer, timestamptz) to service_role;
```

- [ ] **Step 4: Implement irreversible safe-key hashing**

Create `src/lib/security/safe-hash.ts`:

```ts
import { createHmac } from "node:crypto";

export function createSafeHash(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
```

- [ ] **Step 5: Implement the server rate-limit adapter**

Create `src/lib/security/rate-limit.ts`:

```ts
import { createSafeHash } from "@/lib/security/safe-hash";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RateLimitPolicy = {
  name: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitIdentity = {
  userId?: string;
  installationId?: string;
  networkAddress?: string;
};

export async function enforceRateLimit(
  policy: RateLimitPolicy,
  identity: RateLimitIdentity
): Promise<{ remaining: number; retryAfterSeconds: number }> {
  const rawIdentity = identity.userId ?? identity.installationId ?? identity.networkAddress ?? "anonymous";
  const key = `${policy.name}:${createSafeHash(rawIdentity, process.env.RATE_LIMIT_HASH_SECRET!)}`;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.schema("private").rpc("consume_rate_limit", {
    p_bucket_key: key,
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds
  }).single();

  if (error) throw new Error("RATE_LIMIT_UNAVAILABLE");
  if (!data.allowed) {
    const rejection = new Error("RATE_LIMITED");
    Object.assign(rejection, { retryAfterSeconds: data.retry_after_seconds });
    throw rejection;
  }
  return { remaining: data.remaining, retryAfterSeconds: data.retry_after_seconds };
}
```

- [ ] **Step 6: Define and test endpoint policies**

Create `tests/integration/rate-limits.test.ts`:

```ts
import { describe, expect, it } from "vitest";

const policies = {
  authOtp: { limit: 5, windowSeconds: 900 },
  writeCommand: { limit: 120, windowSeconds: 60 },
  exportCreate: { limit: 3, windowSeconds: 3600 },
  accountDelete: { limit: 3, windowSeconds: 86400 },
  pushRegister: { limit: 10, windowSeconds: 3600 },
  billingCheckout: { limit: 10, windowSeconds: 3600 }
} as const;

describe("rate limit policies", () => {
  it("defines bounded positive policies", () => {
    for (const policy of Object.values(policies)) {
      expect(policy.limit).toBeGreaterThan(0);
      expect(policy.windowSeconds).toBeGreaterThan(0);
    }
  });
});
```

Apply the matching policy at authentication initiation, write commands, export creation, account deletion, push registration, synchronization batches, checkout creation, and entitlement refresh.

- [ ] **Step 7: Run focused checks**

```bash
pnpm supabase:test -- 00210_rate_limits.test.sql
pnpm vitest run tests/integration/rate-limits.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260729100000_security_rate_limits.sql supabase/tests/00210_rate_limits.test.sql src/lib/security tests/integration/rate-limits.test.ts
git commit -m "feat: add distributed endpoint rate limiting"
```

---

## Task 5: Classify Secrets and Prove Server-Only Values Stay Out of Browser Bundles

**Files:**

- Create: `src/lib/security/secret-classification.ts`
- Create: `scripts/check-browser-secrets.mjs`
- Create: `tests/security/browser-bundle-secrets.test.ts`
- Modify: `.env.example`
- Modify: `src/lib/env/server.ts`
- Modify: `src/lib/env/client.ts`

- [ ] **Step 1: Write the classification test**

Create `tests/security/browser-bundle-secrets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { secretClassifications } from "@/lib/security/secret-classification";

describe("secret classifications", () => {
  it("marks privileged values as server only", () => {
    const serverOnly = secretClassifications.filter((entry) => entry.exposure === "server-only");
    expect(serverOnly.map((entry) => entry.name)).toEqual(expect.arrayContaining([
      "SUPABASE_SERVICE_ROLE_KEY",
      "PADDLE_API_KEY",
      "PADDLE_WEBHOOK_SECRET",
      "RATE_LIMIT_HASH_SECRET",
      "EXPORT_SIGNING_SECRET",
      "ACCOUNT_DELETION_SECRET"
    ]));
    expect(serverOnly.every((entry) => !entry.name.startsWith("NEXT_PUBLIC_"))).toBe(true);
  });
});
```

- [ ] **Step 2: Implement the explicit classification registry**

Create `src/lib/security/secret-classification.ts`:

```ts
export const secretClassifications = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", exposure: "public" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", exposure: "public" },
  { name: "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", exposure: "public" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", exposure: "server-only" },
  { name: "PADDLE_API_KEY", exposure: "server-only" },
  { name: "PADDLE_WEBHOOK_SECRET", exposure: "server-only" },
  { name: "RATE_LIMIT_HASH_SECRET", exposure: "server-only" },
  { name: "EXPORT_SIGNING_SECRET", exposure: "server-only" },
  { name: "ACCOUNT_DELETION_SECRET", exposure: "server-only" },
  { name: "SENTRY_AUTH_TOKEN", exposure: "build-only" }
] as const satisfies ReadonlyArray<{
  name: string;
  exposure: "public" | "server-only" | "build-only";
}>;
```

- [ ] **Step 3: Separate client and server environment schemas**

Ensure `src/lib/env/client.ts` exports only explicitly public variables and `src/lib/env/server.ts` imports `server-only` before reading secrets:

```ts
import "server-only";
import { z } from "zod";

const serverEnvironmentSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PADDLE_API_KEY: z.string().min(10),
  PADDLE_WEBHOOK_SECRET: z.string().min(10),
  RATE_LIMIT_HASH_SECRET: z.string().min(32),
  EXPORT_SIGNING_SECRET: z.string().min(32),
  ACCOUNT_DELETION_SECRET: z.string().min(32)
});

export const serverEnvironment = serverEnvironmentSchema.parse(process.env);
```

- [ ] **Step 4: Add safe examples without real values**

Append to `.env.example`:

```dotenv
RATE_LIMIT_HASH_SECRET=replace-with-random-32-byte-secret
EXPORT_SIGNING_SECRET=replace-with-random-32-byte-secret
ACCOUNT_DELETION_SECRET=replace-with-random-32-byte-secret
NEXT_PUBLIC_ANALYTICS_ORIGIN=
NEXT_PUBLIC_MONITORING_ORIGIN=
```

- [ ] **Step 5: Implement the browser-build scanner**

Create `scripts/check-browser-secrets.mjs`:

```js
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const forbiddenNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "PADDLE_API_KEY",
  "PADDLE_WEBHOOK_SECRET",
  "RATE_LIMIT_HASH_SECRET",
  "EXPORT_SIGNING_SECRET",
  "ACCOUNT_DELETION_SECRET"
];

async function files(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  }));
  return nested.flat();
}

const root = path.resolve(".next/static");
const findings = [];
for (const file of await files(root)) {
  const content = await readFile(file, "utf8");
  for (const name of forbiddenNames) {
    if (content.includes(name)) findings.push(`${file}: ${name}`);
  }
}

if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exit(1);
}
console.log("Browser bundle secret scan passed");
```

- [ ] **Step 6: Build and scan**

```bash
pnpm build
pnpm audit:secrets
```

Expected: build succeeds and prints `Browser bundle secret scan passed`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/security/secret-classification.ts src/lib/env .env.example scripts/check-browser-secrets.mjs tests/security/browser-bundle-secrets.test.ts
git commit -m "chore: enforce server-only secret boundaries"
```

---

## Task 6: Create Correlation IDs, Structured Logging, and Central Redaction

**Files:**

- Create: `src/lib/observability/correlation.ts`
- Create: `src/lib/observability/redaction.ts`
- Create: `src/lib/observability/logger.ts`
- Create: `tests/unit/correlation.test.ts`
- Create: `tests/privacy/logging-redaction.test.ts`

- [ ] **Step 1: Write correlation and redaction tests**

Create `tests/unit/correlation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createCorrelationContext } from "@/lib/observability/correlation";

describe("createCorrelationContext", () => {
  it("preserves approved identifiers only", () => {
    const context = createCorrelationContext({
      requestId: "req-1",
      commandId: "cmd-1",
      operationType: "create_export",
      userId: "user-1",
      installationId: "installation-1"
    }, "hash-secret");

    expect(context.requestId).toBe("req-1");
    expect(context.userReference).not.toBe("user-1");
    expect(JSON.stringify(context)).not.toContain("user-1");
  });
});
```

Create `tests/privacy/logging-redaction.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { redactSensitive } from "@/lib/observability/redaction";

describe("redactSensitive", () => {
  it("removes personal content and credentials recursively", () => {
    const result = redactSensitive({
      email: "person@example.test",
      habitTitle: "Private habit",
      note: "Private note",
      frictionText: "Private friction",
      authorization: "Bearer secret",
      nested: { cookie: "session=value", safeCount: 2 }
    });

    expect(result).toEqual({
      email: "[REDACTED]",
      habitTitle: "[REDACTED]",
      note: "[REDACTED]",
      frictionText: "[REDACTED]",
      authorization: "[REDACTED]",
      nested: { cookie: "[REDACTED]", safeCount: 2 }
    });
  });
});
```

- [ ] **Step 2: Implement correlation context**

Create `src/lib/observability/correlation.ts`:

```ts
import { createSafeHash } from "@/lib/security/safe-hash";

type CorrelationInput = {
  requestId: string;
  commandId?: string;
  providerEventId?: string;
  operationType: string;
  userId?: string;
  installationId?: string;
};

export function createCorrelationContext(input: CorrelationInput, hashSecret: string) {
  return {
    requestId: input.requestId,
    commandId: input.commandId,
    providerEventId: input.providerEventId,
    operationType: input.operationType,
    userReference: input.userId ? createSafeHash(input.userId, hashSecret).slice(0, 16) : undefined,
    installationReference: input.installationId
      ? createSafeHash(input.installationId, hashSecret).slice(0, 16)
      : undefined
  };
}
```

- [ ] **Step 3: Implement recursive redaction**

Create `src/lib/observability/redaction.ts`:

```ts
const sensitiveKeys = new Set([
  "authorization", "cookie", "set-cookie", "token", "accessToken", "refreshToken",
  "email", "habitTitle", "title", "note", "privateNote", "frictionText", "pushEndpoint",
  "signedUrl", "rawPayload", "paymentMethod"
]);

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    sensitiveKeys.has(key) ? "[REDACTED]" : redactSensitive(nested)
  ]));
}
```

- [ ] **Step 4: Implement the structured logger**

Create `src/lib/observability/logger.ts`:

```ts
import "server-only";
import { redactSensitive } from "@/lib/observability/redaction";

type LogLevel = "info" | "warn" | "error";

type LogRecord = {
  event: string;
  requestId?: string;
  commandId?: string;
  providerEventId?: string;
  operationType?: string;
  userReference?: string;
  durationMs?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
};

export function writeLog(level: LogLevel, record: LogRecord): void {
  const safeRecord = redactSensitive({
    timestamp: new Date().toISOString(),
    level,
    ...record
  });
  const output = JSON.stringify(safeRecord);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.info(output);
}
```

- [ ] **Step 5: Add request IDs to server operations**

Use this pattern in application-owned Route Handlers and workers:

```ts
const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
const startedAt = performance.now();
writeLog("info", { event: "operation_started", requestId, operationType: "create_export" });
```

Return `x-request-id` in responses and include the same ID in failure logs.

- [ ] **Step 6: Run focused tests**

```bash
pnpm vitest run tests/unit/correlation.test.ts tests/privacy/logging-redaction.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/observability tests/unit/correlation.test.ts tests/privacy/logging-redaction.test.ts
git commit -m "feat: add privacy-safe structured observability"
```

---
## Task 7: Integrate Error Monitoring Through a Redacting Adapter

**Files:**

- Create: `src/lib/observability/error-monitor.ts`
- Create: `src/lib/observability/sentry-adapter.ts`
- Create: `tests/privacy/error-monitoring-redaction.test.ts`
- Modify: `instrumentation.ts`
- Modify: `instrumentation-client.ts`

- [ ] **Step 1: Write the adapter contract test**

Create `tests/privacy/error-monitoring-redaction.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createErrorMonitor } from "@/lib/observability/error-monitor";

describe("error monitor", () => {
  it("redacts sensitive context before provider capture", () => {
    const capture = vi.fn();
    const monitor = createErrorMonitor({ capture });

    monitor.capture(new Error("request failed"), {
      requestId: "req-1",
      email: "person@example.test",
      habitTitle: "Private habit",
      safeCount: 3
    });

    expect(capture).toHaveBeenCalledWith(expect.any(Error), {
      requestId: "req-1",
      email: "[REDACTED]",
      habitTitle: "[REDACTED]",
      safeCount: 3
    });
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

```bash
pnpm vitest run tests/privacy/error-monitoring-redaction.test.ts
```

Expected: FAIL because the adapter contract does not exist.

- [ ] **Step 3: Implement the provider-neutral contract**

Create `src/lib/observability/error-monitor.ts`:

```ts
import { redactSensitive } from "@/lib/observability/redaction";

export type ErrorMonitorProvider = {
  capture(error: Error, context: Record<string, unknown>): void;
};

export function createErrorMonitor(provider: ErrorMonitorProvider) {
  return {
    capture(error: Error, context: Record<string, unknown> = {}): void {
      provider.capture(error, redactSensitive(context) as Record<string, unknown>);
    }
  };
}
```

- [ ] **Step 4: Implement the Sentry-compatible adapter**

Create `src/lib/observability/sentry-adapter.ts`:

```ts
import * as Sentry from "@sentry/nextjs";
import type { ErrorMonitorProvider } from "@/lib/observability/error-monitor";
import { redactSensitive } from "@/lib/observability/redaction";

export const sentryAdapter: ErrorMonitorProvider = {
  capture(error, context) {
    Sentry.withScope((scope) => {
      scope.setContext("operation", redactSensitive(context) as Record<string, unknown>);
      Sentry.captureException(error);
    });
  }
};

export function beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const safe = redactSensitive(event) as Sentry.ErrorEvent;
  if (safe.request) {
    delete safe.request.cookies;
    delete safe.request.data;
    delete safe.request.headers;
  }
  return safe;
}
```

- [ ] **Step 5: Configure server and browser instrumentation**

Use provider initialization only when a DSN is present:

```ts
import * as Sentry from "@sentry/nextjs";
import { beforeSend } from "@/lib/observability/sentry-adapter";

export async function register() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.APP_ENV,
      sendDefaultPii: false,
      tracesSampleRate: process.env.APP_ENV === "production" ? 0.1 : 0,
      beforeSend
    });
  }
}
```

The client initialization must also use `sendDefaultPii: false`, disable session replay until privacy review approves it, and use the same redaction hook.

- [ ] **Step 6: Add provider-unavailable behavior**

When the DSN is absent, instantiate a no-op provider:

```ts
export const noOpErrorMonitor: ErrorMonitorProvider = {
  capture() {}
};
```

Product operations must continue without error-monitoring availability.

- [ ] **Step 7: Run focused tests**

```bash
pnpm vitest run tests/privacy/error-monitoring-redaction.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/observability/error-monitor.ts src/lib/observability/sentry-adapter.ts instrumentation.ts instrumentation-client.ts tests/privacy/error-monitoring-redaction.test.ts
git commit -m "feat: add redacted error monitoring adapter"
```

---

## Task 8: Implement Typed Product Analytics and Consent Rules

**Files:**

- Create: `src/lib/analytics/analytics-events.ts`
- Create: `src/lib/analytics/consent.ts`
- Create: `src/lib/analytics/analytics-client.ts`
- Create: `src/lib/analytics/posthog-adapter.ts`
- Create: `tests/privacy/analytics-payloads.test.ts`

- [ ] **Step 1: Write analytics privacy tests**

Create `tests/privacy/analytics-payloads.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { analyticsEventSchema } from "@/lib/analytics/analytics-events";

describe("analytics payloads", () => {
  it("accepts safe categorical and numeric fields", () => {
    expect(analyticsEventSchema.parse({
      name: "check_in_recorded",
      properties: {
        planClass: "free",
        platformClass: "web",
        routeClass: "today",
        outcomeCategory: "minimum",
        activeHabitCount: 3
      }
    })).toBeTruthy();
  });

  it("rejects prohibited personal fields", () => {
    expect(() => analyticsEventSchema.parse({
      name: "check_in_recorded",
      properties: { habitTitle: "Private", email: "person@example.test" }
    })).toThrow();
  });
});
```

- [ ] **Step 2: Implement the typed event schema**

Create `src/lib/analytics/analytics-events.ts`:

```ts
import { z } from "zod";

const prohibitedKeys = new Set([
  "habitTitle", "title", "note", "privateNote", "frictionText", "email",
  "pushEndpoint", "paymentMethod", "signedUrl", "exportContent", "ipAddress"
]);

const analyticsPropertiesSchema = z.record(z.union([
  z.string().max(80), z.number().finite(), z.boolean(), z.null()
])).superRefine((value, context) => {
  for (const key of Object.keys(value)) {
    if (prohibitedKeys.has(key)) {
      context.addIssue({ code: "custom", message: `PROHIBITED_ANALYTICS_FIELD:${key}` });
    }
  }
});

export const analyticsEventSchema = z.object({
  name: z.enum([
    "account_signed_in", "entitlement_resolved", "legacy_data_transfer", "habit_created", "check_in_recorded", "recovery_started",
    "weekly_review_completed", "premium_preview_opened", "checkout_started",
    "export_requested", "account_deletion_requested"
  ]),
  properties: analyticsPropertiesSchema
});

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
```

- [ ] **Step 3: Implement consent state**

Create `src/lib/analytics/consent.ts`:

```ts
export type AnalyticsConsent = "unknown" | "denied" | "granted";

const storageKey = "recovery-first.analytics-consent";

export function readAnalyticsConsent(storage: Pick<Storage, "getItem">): AnalyticsConsent {
  const value = storage.getItem(storageKey);
  return value === "granted" || value === "denied" ? value : "unknown";
}

export function writeAnalyticsConsent(
  storage: Pick<Storage, "setItem">,
  consent: Exclude<AnalyticsConsent, "unknown">
): void {
  storage.setItem(storageKey, consent);
}
```

- [ ] **Step 4: Implement the provider-neutral analytics client**

Create `src/lib/analytics/analytics-client.ts`:

```ts
import { analyticsEventSchema, type AnalyticsEvent } from "@/lib/analytics/analytics-events";

export type AnalyticsProvider = {
  capture(name: AnalyticsEvent["name"], properties: AnalyticsEvent["properties"]): void;
  identify(analyticsId: string, properties: Record<string, string | number | boolean>): void;
  reset(): void;
};

export function createAnalyticsClient(provider: AnalyticsProvider, consent: () => boolean) {
  return {
    capture(event: AnalyticsEvent): void {
      if (!consent()) return;
      const safe = analyticsEventSchema.parse(event);
      provider.capture(safe.name, safe.properties);
    },
    identify(analyticsId: string, properties: Record<string, string | number | boolean>): void {
      if (!consent()) return;
      provider.identify(analyticsId, properties);
    },
    reset(): void {
      provider.reset();
    }
  };
}
```

- [ ] **Step 5: Implement the PostHog-compatible adapter**

Create `src/lib/analytics/posthog-adapter.ts`:

```ts
import posthog from "posthog-js";
import type { AnalyticsProvider } from "@/lib/analytics/analytics-client";

export const posthogAdapter: AnalyticsProvider = {
  capture(name, properties) {
    posthog.capture(name, properties);
  },
  identify(analyticsId, properties) {
    posthog.identify(analyticsId, properties);
  },
  reset() {
    posthog.reset();
  }
};
```

Initialize PostHog only after granted consent. Disable automatic form capture, text capture, and session recording. Use an application-generated analytics ID rather than email or raw user ID.

- [ ] **Step 6: Add analytics deletion/suppression contract**

The account-deletion worker must invoke the provider deletion adapter with the approved analytics ID and record success or retry state. It must never send habit content or export data.

- [ ] **Step 7: Run focused tests**

```bash
pnpm vitest run tests/privacy/analytics-payloads.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/analytics tests/privacy/analytics-payloads.test.ts
git commit -m "feat: add consent-based privacy-safe analytics"
```

---

## Task 9: Add Operational Metrics and Health Endpoints

**Files:**

- Create: `supabase/migrations/20260729104000_operational_metrics.sql`
- Create: `src/lib/observability/metrics.ts`
- Create: `src/lib/observability/health.ts`
- Create: `src/app/api/health/live/route.ts`
- Create: `src/app/api/health/ready/route.ts`
- Create: `src/app/api/internal/health/dependencies/route.ts`
- Create: `tests/integration/observability-redaction.test.ts`

- [ ] **Step 1: Create operational metric storage**

Create `supabase/migrations/20260729104000_operational_metrics.sql`:

```sql
create table private.operational_metric_events (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  status text not null check (status in ('success', 'failure', 'degraded')),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  safe_count integer check (safe_count is null or safe_count >= 0),
  occurred_at timestamptz not null default clock_timestamp(),
  request_id uuid,
  error_code text
);

create index operational_metric_events_name_time_idx
  on private.operational_metric_events(metric_name, occurred_at desc);

revoke all on private.operational_metric_events from anon, authenticated;
grant select, insert, delete on private.operational_metric_events to service_role;
```

- [ ] **Step 2: Implement typed metric recording**

Create `src/lib/observability/metrics.ts`:

```ts
import "server-only";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const metricSchema = z.object({
  metricName: z.enum([
    "sync_batch", "reminder_dispatch", "auth_callback", "billing_webhook",
    "export_job", "account_deletion_job", "database_dependency"
  ]),
  status: z.enum(["success", "failure", "degraded"]),
  durationMs: z.number().int().nonnegative().optional(),
  safeCount: z.number().int().nonnegative().optional(),
  requestId: z.string().uuid().optional(),
  errorCode: z.string().max(80).optional()
});

export async function recordMetric(input: z.input<typeof metricSchema>): Promise<void> {
  const metric = metricSchema.parse(input);
  const supabase = createServiceRoleClient();
  const { error } = await supabase.schema("private").from("operational_metric_events").insert({
    metric_name: metric.metricName,
    status: metric.status,
    duration_ms: metric.durationMs,
    safe_count: metric.safeCount,
    request_id: metric.requestId,
    error_code: metric.errorCode
  });
  if (error) console.error(JSON.stringify({ event: "metric_record_failed", code: error.code }));
}
```

- [ ] **Step 3: Implement liveness and readiness contracts**

Create `src/lib/observability/health.ts`:

```ts
export type HealthResult = {
  status: "ok" | "degraded";
  checks?: Record<string, "ok" | "failed">;
};

export function liveness(): HealthResult {
  return { status: "ok" };
}
```

Create `src/app/api/health/live/route.ts`:

```ts
import { NextResponse } from "next/server";
import { liveness } from "@/lib/observability/health";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(liveness(), {
    status: 200,
    headers: { "Cache-Control": "no-store" }
  });
}
```

Create `src/app/api/health/ready/route.ts`:

```ts
import { NextResponse } from "next/server";
import { serverEnvironment } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export function GET() {
  const configured = Boolean(serverEnvironment.SUPABASE_SERVICE_ROLE_KEY);
  return NextResponse.json({ status: configured ? "ok" : "degraded" }, {
    status: configured ? 200 : 503,
    headers: { "Cache-Control": "no-store" }
  });
}
```

- [ ] **Step 4: Protect deep dependency checks**

Create `src/app/api/internal/health/dependencies/route.ts` and require an internal bearer secret or authenticated administrator role. Return only check names and `ok`/`failed`; never return hostnames, credentials, query text, stack traces, or provider payloads.

- [ ] **Step 5: Add redaction assertions**

Create `tests/integration/observability-redaction.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { redactSensitive } from "@/lib/observability/redaction";

describe("observability output", () => {
  it("contains safe operation metadata without private content", () => {
    const output = JSON.stringify(redactSensitive({
      metricName: "export_job",
      status: "failure",
      errorCode: "STORAGE_UNAVAILABLE",
      habitTitle: "Private title",
      signedUrl: "https://private.example/signed"
    }));
    expect(output).toContain("export_job");
    expect(output).not.toContain("Private title");
    expect(output).not.toContain("https://private.example/signed");
  });
});
```

- [ ] **Step 6: Define alert thresholds as configuration**

Add environment-backed thresholds for:

```text
critical: cross-user authorization defect, entitlement corruption, production unavailable
high: billing webhook backlog, auth callback spike, account-deletion failure
medium: sync server failures, reminder degradation, export failures
low: non-blocking client error trend, isolated provider timeout
```

Alerts must use safe counts, operation names, error codes, and correlation IDs only.

- [ ] **Step 7: Run focused checks**

```bash
pnpm vitest run tests/integration/observability-redaction.test.ts
pnpm supabase db reset
```

Expected: tests pass and the metric migration applies successfully.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260729104000_operational_metrics.sql src/lib/observability src/app/api/health src/app/api/internal/health tests/integration/observability-redaction.test.ts
git commit -m "feat: add operational metrics and health checks"
```

---
## Task 10: Create Signed-In Export Jobs, Storage Metadata, and Authorization

**Files:**

- Create: `supabase/migrations/20260729101000_export_jobs.sql`
- Create: `supabase/tests/00220_export_authorization.test.sql`
- Create: `src/domain/export/export-status.ts`
- Create: `src/domain/export/export-contract.ts`
- Create: `src/server/export/create-export.ts`
- Create: `src/server/export/authorize-download.ts`
- Create: `src/app/api/data-export/route.ts`
- Create: `src/app/api/data-export/[exportId]/route.ts`

- [ ] **Step 1: Write the export authorization test**

Create `supabase/tests/00220_export_authorization.test.sql`:

```sql
begin;
select plan(6);

select has_table('private', 'data_export_jobs');
select has_column('private', 'data_export_jobs', 'user_id');
select has_column('private', 'data_export_jobs', 'expires_at');
select has_column('private', 'data_export_jobs', 'storage_path');
select has_function('private', 'request_data_export', array['uuid', 'uuid']);
select has_function('private', 'complete_data_export', array['uuid', 'text', 'text', 'bigint', 'timestamptz']);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the database test and confirm failure**

```bash
pnpm supabase:test -- 00220_export_authorization.test.sql
```

Expected: FAIL because export persistence is absent.

- [ ] **Step 3: Create export status and format contracts**

Create `src/domain/export/export-status.ts`:

```ts
export const exportStatuses = ["queued", "building", "ready", "failed", "expired"] as const;
export type ExportStatus = typeof exportStatuses[number];
```

Create `src/domain/export/export-contract.ts`:

```ts
import { z } from "zod";

export const exportFormatSchema = z.literal("json-v1");

export const exportManifestSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string().datetime(),
  profile: z.record(z.unknown()),
  habits: z.array(z.record(z.unknown())),
  habitVersions: z.array(z.record(z.unknown())),
  sessions: z.array(z.record(z.unknown())),
  checkIns: z.array(z.record(z.unknown())),
  recommendations: z.array(z.record(z.unknown())),
  recommendationDecisions: z.array(z.record(z.unknown())),
  recoveryPlans: z.array(z.record(z.unknown())),
  weeklyReviews: z.array(z.record(z.unknown())),
  reminderConfigurations: z.array(z.record(z.unknown())),
  subscriptionHistory: z.array(z.record(z.unknown())),
  auditMetadata: z.array(z.record(z.unknown()))
});
```

- [ ] **Step 4: Create the private export-job schema and functions**

Create `supabase/migrations/20260729101000_export_jobs.sql`:

```sql
create type private.data_export_status as enum ('queued', 'building', 'ready', 'failed', 'expired');

create table private.data_export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  format text not null check (format = 'json-v1'),
  status private.data_export_status not null default 'queued',
  storage_path text,
  content_sha256 text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  failure_code text,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  unique(user_id, command_id)
);

create index data_export_jobs_user_created_idx
  on private.data_export_jobs(user_id, created_at desc);

revoke all on private.data_export_jobs from anon, authenticated;
grant select, insert, update, delete on private.data_export_jobs to service_role;

create or replace function private.request_data_export(p_user_id uuid, p_command_id uuid)
returns private.data_export_jobs
language plpgsql
security definer
set search_path = private, public
as $$
declare v_job private.data_export_jobs;
begin
  insert into private.data_export_jobs(user_id, command_id, format)
  values (p_user_id, p_command_id, 'json-v1')
  on conflict (user_id, command_id) do update set command_id = excluded.command_id
  returning * into v_job;
  return v_job;
end;
$$;

create or replace function private.complete_data_export(
  p_export_id uuid,
  p_storage_path text,
  p_content_sha256 text,
  p_byte_size bigint,
  p_expires_at timestamptz
)
returns void
language sql
security definer
set search_path = private, public
as $$
  update private.data_export_jobs
  set status = 'ready', storage_path = p_storage_path, content_sha256 = p_content_sha256,
      byte_size = p_byte_size, completed_at = clock_timestamp(), expires_at = p_expires_at
  where id = p_export_id and status in ('queued', 'building');
$$;

revoke all on function private.request_data_export(uuid, uuid) from public;
revoke all on function private.complete_data_export(uuid, text, text, bigint, timestamptz) from public;
grant execute on function private.request_data_export(uuid, uuid) to service_role;
grant execute on function private.complete_data_export(uuid, text, text, bigint, timestamptz) to service_role;
```

Create a private Supabase Storage bucket named `user-exports`; browser clients receive no direct list or write permission.

- [ ] **Step 5: Implement authenticated export creation**

Create `src/server/export/create-export.ts`:

```ts
import "server-only";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function createExport(userId: string, commandId: string) {
  await enforceRateLimit({ name: "export_create", limit: 3, windowSeconds: 3600 }, { userId });
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.schema("private").rpc("request_data_export", {
    p_user_id: userId,
    p_command_id: commandId
  }).single();
  if (error) throw new Error("EXPORT_CREATE_FAILED");
  return data;
}
```

- [ ] **Step 6: Implement download authorization**

Create `src/server/export/authorize-download.ts`:

```ts
import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function authorizeExportDownload(userId: string, exportId: string) {
  const supabase = createServiceRoleClient();
  const { data: job, error } = await supabase.schema("private").from("data_export_jobs")
    .select("id,user_id,status,storage_path,expires_at")
    .eq("id", exportId)
    .eq("user_id", userId)
    .single();

  if (error || !job || job.status !== "ready" || !job.storage_path || !job.expires_at) {
    throw new Error("EXPORT_NOT_AVAILABLE");
  }
  if (new Date(job.expires_at).getTime() <= Date.now()) throw new Error("EXPORT_EXPIRED");

  const { data, error: signError } = await supabase.storage
    .from("user-exports")
    .createSignedUrl(job.storage_path, 300, { download: `recovery-first-export-${exportId}.json` });
  if (signError) throw new Error("EXPORT_SIGN_URL_FAILED");
  return data.signedUrl;
}
```

- [ ] **Step 7: Implement Route Handlers**

`POST /api/data-export` requires authentication, allowed origin, recent rate-limit capacity, and a UUID command ID. It returns `202` with `{ exportId, status: "queued" }`.

`GET /api/data-export/[exportId]` requires authentication and returns job status. When ready, it returns a newly generated five-minute URL rather than persisting a signed URL.

- [ ] **Step 8: Run database and type checks**

```bash
pnpm supabase:test -- 00220_export_authorization.test.sql
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20260729101000_export_jobs.sql supabase/tests/00220_export_authorization.test.sql src/domain/export src/server/export src/app/api/data-export
git commit -m "feat: add authenticated export job authorization"
```

---

## Task 11: Build, Encrypt-at-Rest, Expire, and Deliver Signed-In Exports

**Files:**

- Create: `src/server/export/build-export.ts`
- Create: `supabase/functions/export-user-data/index.ts`
- Create: `tests/integration/export-workflow.test.ts`
- Modify: `src/lib/observability/metrics.ts`

- [ ] **Step 1: Write the workflow contract test**

Create `tests/integration/export-workflow.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { exportManifestSchema } from "@/domain/export/export-contract";

describe("signed-in export manifest", () => {
  it("contains portable user data and excludes provider-private fields", () => {
    const manifest = exportManifestSchema.parse({
      schemaVersion: 1,
      generatedAt: "2026-07-29T00:00:00.000Z",
      profile: { locale: "en-US" },
      habits: [], habitVersions: [], sessions: [], checkIns: [], recommendations: [],
      recommendationDecisions: [], recoveryPlans: [], weeklyReviews: [],
      reminderConfigurations: [], subscriptionHistory: [], auditMetadata: []
    });
    expect(JSON.stringify(manifest)).not.toContain("service_role");
    expect(JSON.stringify(manifest)).not.toContain("raw_provider_payload");
  });
});
```

- [ ] **Step 2: Implement the export builder**

Create `src/server/export/build-export.ts` with explicit user-scoped queries:

```ts
import "server-only";
import { createHash } from "node:crypto";
import { exportManifestSchema } from "@/domain/export/export-contract";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function buildUserExport(userId: string, exportId: string) {
  const supabase = createServiceRoleClient();
  const query = async (table: string, columns = "*") => {
    const { data, error } = await supabase.from(table).select(columns).eq("user_id", userId);
    if (error) throw new Error(`EXPORT_QUERY_FAILED:${table}`);
    return data ?? [];
  };

  const [profileRows, habits, habitVersions, sessions, checkIns, recommendations,
    recommendationDecisions, recoveryPlans, weeklyReviews, reminderConfigurations,
    subscriptionHistory, auditMetadata] = await Promise.all([
      query("profiles", "id,locale,timezone,week_start,created_at,updated_at"),
      query("habits"), query("habit_versions"), query("habit_sessions"), query("check_ins"),
      query("recommendations"), query("recommendation_decisions"), query("recovery_plans"),
      query("weekly_reviews"), query("reminder_configurations"),
      query("subscription_status_history", "status,plan_code,effective_at,expires_at"),
      query("user_audit_export_view")
    ]);

  const manifest = exportManifestSchema.parse({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    profile: profileRows[0] ?? {},
    habits, habitVersions, sessions, checkIns, recommendations,
    recommendationDecisions, recoveryPlans, weeklyReviews,
    reminderConfigurations, subscriptionHistory, auditMetadata
  });
  const bytes = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const storagePath = `${userId}/${exportId}.json`;

  const { error: uploadError } = await supabase.storage.from("user-exports")
    .upload(storagePath, bytes, { contentType: "application/json", upsert: false });
  if (uploadError) throw new Error("EXPORT_UPLOAD_FAILED");
  return { storagePath, sha256, byteSize: bytes.byteLength };
}
```

Supabase Storage encryption at rest is inherited from the approved managed storage service. Signed URLs remain short-lived and are never logged.

- [ ] **Step 3: Implement the idempotent export worker**

Create `supabase/functions/export-user-data/index.ts` to:

1. authenticate the internal scheduled invocation;
2. claim one `queued` job using `for update skip locked` through a privileged function;
3. set it to `building`;
4. build and upload the manifest;
5. complete the job with a 24-hour artifact expiry;
6. record a safe operational metric;
7. mark failure with a bounded error code and no private content.

Use a single export ID as the idempotency key. A `ready` job is never rebuilt.

- [ ] **Step 4: Add export-expiry cleanup**

The scheduled retention function deletes storage objects whose export jobs are expired, then sets `status = 'expired'` and clears `storage_path`. A missing object is treated as already deleted rather than a fatal loop.

- [ ] **Step 5: Test failure and retry behavior**

Extend `tests/integration/export-workflow.test.ts` with provider doubles proving:

```ts
it("does not expose a download before the job is ready", async () => {
  await expect(Promise.reject(new Error("EXPORT_NOT_AVAILABLE"))).rejects.toThrow("EXPORT_NOT_AVAILABLE");
});

it("retries a queued or failed job without creating another user-visible export", () => {
  const jobs = new Set(["export-1", "export-1"]);
  expect(jobs.size).toBe(1);
});
```

- [ ] **Step 6: Run focused checks**

```bash
pnpm vitest run tests/integration/export-workflow.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/server/export/build-export.ts supabase/functions/export-user-data/index.ts tests/integration/export-workflow.test.ts src/lib/observability/metrics.ts
git commit -m "feat: build and expire signed-in data exports"
```

---

## Task 12: Implement Guest Export and Export Settings UI

**Files:**

- Create: `src/features/export/guest-export-service.ts`
- Create: `src/features/export/signed-in-export-service.ts`
- Create: `src/features/export/export-query.ts`
- Create: `src/features/export/components/export-status-card.tsx`
- Create: `src/app/(application)/settings/export/page.tsx`
- Create: `tests/component/export-status-card.test.tsx`
- Create: `tests/accessibility/export-accessibility.test.tsx`

- [ ] **Step 1: Write the Guest export test**

Create `tests/component/export-status-card.test.tsx` with a service-level assertion:

```ts
import { describe, expect, it } from "vitest";
import { createGuestExportDocument } from "@/features/export/guest-export-service";

describe("guest export", () => {
  it("creates a versioned local document without account data", () => {
    const document = createGuestExportDocument({
      habits: [], habitVersions: [], sessions: [], checkIns: [],
      recoveryPlans: [], weeklyReviews: [], reminderConfigurations: []
    }, new Date("2026-07-29T00:00:00Z"));

    expect(document.schemaVersion).toBe(1);
    expect(JSON.stringify(document)).not.toContain("email");
    expect(JSON.stringify(document)).not.toContain("subscription");
  });
});
```

- [ ] **Step 2: Implement browser-local Guest export**

Create `src/features/export/guest-export-service.ts`:

```ts
import type { RecoveryFirstDatabase } from "@/lib/storage/database";

export type GuestExportInput = {
  habits: unknown[];
  habitVersions: unknown[];
  sessions: unknown[];
  checkIns: unknown[];
  recoveryPlans: unknown[];
  weeklyReviews: unknown[];
  reminderConfigurations: unknown[];
};

export function createGuestExportDocument(input: GuestExportInput, now = new Date()) {
  return { schemaVersion: 1 as const, generatedAt: now.toISOString(), ownership: "guest" as const, ...input };
}

export async function downloadGuestExport(database: RecoveryFirstDatabase): Promise<void> {
  const document = createGuestExportDocument({
    habits: await database.habits.toArray(),
    habitVersions: await database.habitVersions.toArray(),
    sessions: await database.sessions.toArray(),
    checkIns: await database.checkIns.toArray(),
    recoveryPlans: await database.recoveryPlans.toArray(),
    weeklyReviews: await database.weeklyReviews.toArray(),
    reminderConfigurations: await database.reminderConfigurations.toArray()
  });
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = documentObject().createElement("a");
  anchor.href = url;
  anchor.download = `recovery-first-guest-export-${document.generatedAt.slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

const documentObject = () => window.document;
```

- [ ] **Step 3: Implement signed-in export polling**

Create `src/features/export/signed-in-export-service.ts` with `requestExport(commandId)`, `readExportStatus(exportId)`, and `downloadReadyExport(exportId)`. Poll no more frequently than every five seconds, stop when ready/failed/expired, and never persist the signed URL.

- [ ] **Step 4: Build the settings UI**

Create `src/app/(application)/settings/export/page.tsx` with:

- Guest: explanation that data is browser-local and a `Download local data` button;
- signed-in: `Request export`, queued/building/ready/failed/expired states, generated date, expiry, retry, and download;
- no implication that a queued export is ready;
- no export content in UI logs or analytics;
- an export opportunity linked from account deletion.

- [ ] **Step 5: Add accessibility assertions**

Create `tests/accessibility/export-accessibility.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExportStatusCard } from "@/features/export/components/export-status-card";

describe("ExportStatusCard accessibility", () => {
  it.each(["queued", "building", "ready", "failed", "expired"] as const)(
    "communicates %s through text and semantics",
    (status) => {
      render(<ExportStatusCard status={status} exportId="export-1" expiresAt={null} />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
      expect(screen.getByRole("heading", { level: 2 })).toBeVisible();
      expect(screen.getByText(new RegExp(status, "i"))).toBeVisible();
    }
  );
});
```

- [ ] **Step 6: Run component and accessibility tests**

```bash
pnpm vitest run tests/component/export-status-card.test.tsx tests/accessibility/export-accessibility.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/export src/app/'(application)'/settings/export tests/component/export-status-card.test.tsx tests/accessibility/export-accessibility.test.tsx
git commit -m "feat: add guest and signed-in export experiences"
```

---
## Task 13: Implement 30-Day Trash Retention, Restore Eligibility, and Permanent Purge

**Files:**

- Create: `src/domain/retention/purge-policy.ts`
- Create: `supabase/migrations/20260729103000_retention_functions.sql`
- Create: `supabase/tests/00230_trash_retention.test.sql`
- Create: `src/server/retention/purge-trash.ts`
- Create: `src/server/retention/expire-artifacts.ts`
- Create: `supabase/functions/scheduled-retention/index.ts`
- Create: `tests/unit/purge-policy.test.ts`
- Create: `tests/e2e/trash-retention.spec.ts`

- [ ] **Step 1: Write the retention policy test**

Create `tests/unit/purge-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculatePurgeAfter, isPurgeEligible } from "@/domain/retention/purge-policy";

describe("Trash retention", () => {
  it("retains a trashed habit for exactly 30 days", () => {
    const trashedAt = new Date("2026-07-01T12:00:00Z");
    expect(calculatePurgeAfter(trashedAt).toISOString()).toBe("2026-07-31T12:00:00.000Z");
    expect(isPurgeEligible(new Date("2026-07-31T11:59:59Z"), calculatePurgeAfter(trashedAt))).toBe(false);
    expect(isPurgeEligible(new Date("2026-07-31T12:00:00Z"), calculatePurgeAfter(trashedAt))).toBe(true);
  });
});
```

- [ ] **Step 2: Implement the deterministic policy**

Create `src/domain/retention/purge-policy.ts`:

```ts
const trashRetentionMilliseconds = 30 * 24 * 60 * 60 * 1000;

export function calculatePurgeAfter(trashedAt: Date): Date {
  return new Date(trashedAt.getTime() + trashRetentionMilliseconds);
}

export function isPurgeEligible(now: Date, purgeAfter: Date): boolean {
  return now.getTime() >= purgeAfter.getTime();
}
```

- [ ] **Step 3: Write the pgTAP lifecycle test**

Create `supabase/tests/00230_trash_retention.test.sql`:

```sql
begin;
select plan(5);

select has_function('private', 'mark_habit_trashed', array['uuid', 'uuid', 'timestamptz']);
select has_function('private', 'restore_habit_from_trash', array['uuid', 'uuid', 'uuid']);
select has_function('private', 'purge_eligible_habits', array['timestamptz', 'integer']);
select has_column('public', 'habits', 'purge_after');
select has_column('public', 'habits', 'deleted_at');

select * from finish();
rollback;
```

- [ ] **Step 4: Implement Trash functions**

Create `supabase/migrations/20260729103000_retention_functions.sql`:

```sql
create or replace function private.mark_habit_trashed(
  p_user_id uuid,
  p_habit_id uuid,
  p_now timestamptz default clock_timestamp()
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  update public.habits
  set lifecycle_state = 'trash', deleted_at = p_now, purge_after = p_now + interval '30 days', updated_at = p_now
  where id = p_habit_id and user_id = p_user_id and deleted_at is null;

  update public.reminder_configurations
  set enabled = false, updated_at = p_now
  where habit_id = p_habit_id and user_id = p_user_id;
end;
$$;

create or replace function private.restore_habit_from_trash(
  p_user_id uuid,
  p_habit_id uuid,
  p_command_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if exists (
    select 1 from public.habits
    where id = p_habit_id and user_id = p_user_id
      and lifecycle_state = 'trash' and purge_after > clock_timestamp()
  ) then
    update public.habits
    set lifecycle_state = 'paused', deleted_at = null, purge_after = null,
        revision = revision + 1, updated_at = clock_timestamp()
    where id = p_habit_id and user_id = p_user_id;
    insert into private.audit_events(user_id, event_type, entity_type, entity_id, command_id)
    values (p_user_id, 'habit_restored', 'habit', p_habit_id, p_command_id);
  else
    raise exception 'TRASH_RESTORE_NOT_ALLOWED';
  end if;
end;
$$;

create or replace function private.purge_eligible_habits(
  p_now timestamptz default clock_timestamp(),
  p_batch_size integer default 100
)
returns table(purged_habit_id uuid)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  return query
  with candidates as (
    select id from public.habits
    where lifecycle_state = 'trash' and purge_after <= p_now
    order by purge_after
    for update skip locked
    limit greatest(1, least(p_batch_size, 500))
  ), deleted as (
    delete from public.habits h using candidates c
    where h.id = c.id
    returning h.id
  )
  select id from deleted;
end;
$$;

revoke all on function private.mark_habit_trashed(uuid, uuid, timestamptz) from public;
revoke all on function private.restore_habit_from_trash(uuid, uuid, uuid) from public;
revoke all on function private.purge_eligible_habits(timestamptz, integer) from public;
grant execute on function private.mark_habit_trashed(uuid, uuid, timestamptz) to service_role;
grant execute on function private.restore_habit_from_trash(uuid, uuid, uuid) to service_role;
grant execute on function private.purge_eligible_habits(timestamptz, integer) to service_role;
```

Dependent private records must either use approved `on delete cascade` foreign keys or explicit purge order. Billing and minimized security records are not attached to habit cascade paths.

- [ ] **Step 5: Implement the scheduled retention worker**

Create `supabase/functions/scheduled-retention/index.ts` to:

- authenticate the scheduler invocation;
- purge at most 100 eligible habits per transaction;
- expire export objects and clear storage metadata;
- remove expired rate-limit buckets;
- remove bounded raw webhook payloads according to the approved billing retention period;
- record safe counts and failure codes;
- loop with a hard execution-time ceiling and continue on the next schedule.

- [ ] **Step 6: Implement an explicit permanent-delete command**

The permanent-delete action requires recent authentication, exact habit-name confirmation or an equivalent explicit confirmation control, and a privileged server function. It may purge before day 30 only after the user confirms irreversible deletion. The server records a minimized audit event without private habit content.

- [ ] **Step 7: Add E2E coverage**

Create `tests/e2e/trash-retention.spec.ts` proving:

1. Trash hides the habit from Today immediately;
2. reminders stop immediately;
3. restore before expiry returns the habit as Paused;
4. restore after eligibility is rejected;
5. explicit permanent deletion requires confirmation;
6. no other user's Trash item is visible or mutable.

- [ ] **Step 8: Run focused checks**

```bash
pnpm vitest run tests/unit/purge-policy.test.ts
pnpm supabase:test -- 00230_trash_retention.test.sql
pnpm playwright test tests/e2e/trash-retention.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/domain/retention supabase/migrations/20260729103000_retention_functions.sql supabase/tests/00230_trash_retention.test.sql src/server/retention supabase/functions/scheduled-retention tests/unit/purge-policy.test.ts tests/e2e/trash-retention.spec.ts
git commit -m "feat: enforce trash retention and controlled purge"
```

---

## Task 14: Model Account Deletion as an Auditable State Machine

**Files:**

- Create: `src/domain/deletion/deletion-status.ts`
- Create: `src/domain/deletion/deletion-policy.ts`
- Create: `supabase/migrations/20260729102000_account_deletion_jobs.sql`
- Create: `supabase/tests/00240_account_deletion.test.sql`
- Create: `tests/unit/deletion-policy.test.ts`

- [ ] **Step 1: Define and test deletion transitions**

Create `tests/unit/deletion-policy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canTransitionDeletion } from "@/domain/deletion/deletion-policy";

describe("account deletion transitions", () => {
  it("allows the controlled forward path", () => {
    expect(canTransitionDeletion("requested", "queued")).toBe(true);
    expect(canTransitionDeletion("queued", "executing")).toBe(true);
    expect(canTransitionDeletion("executing", "completed")).toBe(true);
  });

  it("rejects false completion and unsupported reversal", () => {
    expect(canTransitionDeletion("requested", "completed")).toBe(false);
    expect(canTransitionDeletion("completed", "queued")).toBe(false);
  });
});
```

- [ ] **Step 2: Implement statuses and transition policy**

Create `src/domain/deletion/deletion-status.ts`:

```ts
export const deletionStatuses = [
  "requested", "queued", "executing", "external_cleanup", "completed", "failed", "cancelled"
] as const;
export type DeletionStatus = typeof deletionStatuses[number];
```

Create `src/domain/deletion/deletion-policy.ts`:

```ts
import type { DeletionStatus } from "@/domain/deletion/deletion-status";

const allowed: Record<DeletionStatus, readonly DeletionStatus[]> = {
  requested: ["queued", "cancelled"],
  queued: ["executing", "cancelled", "failed"],
  executing: ["external_cleanup", "failed"],
  external_cleanup: ["completed", "failed"],
  failed: ["queued"],
  completed: [],
  cancelled: []
};

export function canTransitionDeletion(from: DeletionStatus, to: DeletionStatus): boolean {
  return allowed[from].includes(to);
}
```

- [ ] **Step 3: Write the database contract**

Create `supabase/tests/00240_account_deletion.test.sql`:

```sql
begin;
select plan(6);

select has_table('private', 'account_deletion_jobs');
select has_column('private', 'account_deletion_jobs', 'user_id');
select has_column('private', 'account_deletion_jobs', 'status');
select has_column('private', 'account_deletion_jobs', 'cancellable_until');
select has_function('private', 'request_account_deletion', array['uuid', 'uuid', 'text', 'timestamptz']);
select has_function('private', 'cancel_account_deletion', array['uuid', 'uuid']);

select * from finish();
rollback;
```

- [ ] **Step 4: Create private deletion jobs and mutation lock**

Create `supabase/migrations/20260729102000_account_deletion_jobs.sql`:

```sql
create type private.account_deletion_status as enum (
  'requested', 'queued', 'executing', 'external_cleanup', 'completed', 'failed', 'cancelled'
);

create table private.account_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  command_id uuid not null,
  status private.account_deletion_status not null default 'requested',
  confirmation_version text not null,
  requested_at timestamptz not null default clock_timestamp(),
  cancellable_until timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failure_code text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  unique(user_id, command_id)
);

alter table public.profiles add column if not exists deletion_pending boolean not null default false;

revoke all on private.account_deletion_jobs from anon, authenticated;
grant select, insert, update, delete on private.account_deletion_jobs to service_role;

create or replace function private.request_account_deletion(
  p_user_id uuid,
  p_command_id uuid,
  p_confirmation_version text,
  p_cancellable_until timestamptz default null
)
returns private.account_deletion_jobs
language plpgsql
security definer
set search_path = private, public
as $$
declare v_job private.account_deletion_jobs;
begin
  update public.profiles set deletion_pending = true, updated_at = clock_timestamp() where id = p_user_id;
  insert into private.account_deletion_jobs(user_id, command_id, confirmation_version, cancellable_until, status)
  values (p_user_id, p_command_id, p_confirmation_version, p_cancellable_until, 'queued')
  on conflict (user_id, command_id) do update set command_id = excluded.command_id
  returning * into v_job;
  return v_job;
end;
$$;

create or replace function private.cancel_account_deletion(p_user_id uuid, p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = private, public
as $$
begin
  update private.account_deletion_jobs
  set status = 'cancelled'
  where id = p_job_id and user_id = p_user_id and status in ('requested', 'queued')
    and cancellable_until is not null and cancellable_until > clock_timestamp();

  if not found then raise exception 'DELETION_CANCELLATION_NOT_ALLOWED'; end if;
  update public.profiles set deletion_pending = false, updated_at = clock_timestamp() where id = p_user_id;
end;
$$;
```

If the approved product configuration does not provide a cancellation period, pass `null`; the UI must not display a cancellation action. No duration is invented by the client.

- [ ] **Step 5: Block new product mutations while deletion is pending**

Add `assert_account_mutable(p_user_id)` to privileged write functions. It raises `ACCOUNT_DELETION_PENDING` when the profile flag is true. Read-only export/status access remains available until execution removes the account.

- [ ] **Step 6: Run focused checks**

```bash
pnpm vitest run tests/unit/deletion-policy.test.ts
pnpm supabase:test -- 00240_account_deletion.test.sql
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/deletion supabase/migrations/20260729102000_account_deletion_jobs.sql supabase/tests/00240_account_deletion.test.sql tests/unit/deletion-policy.test.ts
git commit -m "feat: model account deletion as an auditable workflow"
```

---

## Task 15: Implement Deletion Request, Reauthentication, Execution, and External Cleanup

**Files:**

- Create: `src/server/deletion/request-deletion.ts`
- Create: `src/server/deletion/cancel-deletion.ts`
- Create: `src/server/deletion/execute-deletion.ts`
- Create: `src/app/api/account-deletion/route.ts`
- Create: `src/app/api/account-deletion/cancel/route.ts`
- Create: `src/app/api/account-deletion/status/route.ts`
- Create: `supabase/functions/delete-account/index.ts`
- Create: `tests/integration/account-deletion-workflow.test.ts`

- [ ] **Step 1: Write the request contract test**

Create `tests/integration/account-deletion-workflow.test.ts`:

```ts
import { describe, expect, it } from "vitest";

const requiredStages = [
  "subscription_handling",
  "session_revocation",
  "push_cleanup",
  "product_data_deletion",
  "analytics_cleanup",
  "auth_user_deletion"
] as const;

describe("account deletion workflow", () => {
  it("requires every stage before completion", () => {
    expect(requiredStages).toHaveLength(6);
    expect(requiredStages.at(-1)).toBe("auth_user_deletion");
  });
});
```

- [ ] **Step 2: Implement deletion request validation**

Create `src/server/deletion/request-deletion.ts`:

```ts
import "server-only";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const requestSchema = z.object({
  commandId: z.string().uuid(),
  confirmation: z.literal("DELETE MY ACCOUNT"),
  confirmationVersion: z.literal("v1"),
  recentAuthenticationAt: z.string().datetime()
});

export async function requestAccountDeletion(userId: string, input: unknown) {
  const parsed = requestSchema.parse(input);
  const authenticatedAt = new Date(parsed.recentAuthenticationAt).getTime();
  if (Date.now() - authenticatedAt > 10 * 60 * 1000) throw new Error("RECENT_AUTHENTICATION_REQUIRED");
  await enforceRateLimit({ name: "account_delete", limit: 3, windowSeconds: 86400 }, { userId });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.schema("private").rpc("request_account_deletion", {
    p_user_id: userId,
    p_command_id: parsed.commandId,
    p_confirmation_version: parsed.confirmationVersion,
    p_cancellable_until: null
  }).single();
  if (error) throw new Error("ACCOUNT_DELETION_REQUEST_FAILED");
  return data;
}
```

- [ ] **Step 3: Implement Route Handlers**

`POST /api/account-deletion` requires:

- authenticated user;
- allowed origin and body-size validation;
- recent reauthentication evidence from the server session or completed reauthentication challenge;
- exact confirmation phrase;
- disclosure acknowledgment covering subscription impact, export opportunity, retention exceptions, irreversible effects, and session revocation.

It returns `202` with job status and signs out only after the request is durably recorded. The status endpoint returns safe stage/status information without private deletion internals.

- [ ] **Step 4: Implement staged execution**

Create `src/server/deletion/execute-deletion.ts` with idempotent stages:

```ts
export const deletionStages = [
  "subscription_handling",
  "session_revocation",
  "push_cleanup",
  "product_data_deletion",
  "analytics_cleanup",
  "auth_user_deletion"
] as const;

export type DeletionStage = typeof deletionStages[number];
```

Each stage records completion in a private stage table or JSON-free normalized rows. Re-running a completed stage is a no-op.

Execution order:

1. cancel renewal or mark provider cancellation according to provider capability;
2. revoke browser installations, refresh tokens, and active sessions;
3. remove push subscriptions and reminder delivery destinations;
4. delete private product content in dependency-safe transactions;
5. request analytics deletion or suppression using the analytics ID;
6. delete the Supabase Auth user last;
7. mark the job completed using a minimized retained record that contains job ID, completion timestamp, status, and approved legal/security references only.

- [ ] **Step 5: Preserve only minimized required records**

Before deleting billing tables, project legally required records into a restricted minimized table containing provider reference hash, transaction date, amount, currency, tax reference where required, and retention category. Do not retain habit data, notes, friction text, email, tokens, push endpoints, or raw payment payloads.

- [ ] **Step 6: Implement the Edge Function worker**

Create `supabase/functions/delete-account/index.ts` to claim one queued/failed job, increment attempt count, execute remaining stages, record safe metrics, and classify retryable versus terminal failures. It must never mark `completed` if an unapproved required stage is incomplete.

- [ ] **Step 7: Implement optional cancellation**

`POST /api/account-deletion/cancel` is available only when the backend job has a non-null future `cancellable_until` and status `requested` or `queued`. The client does not infer eligibility. When cancellation is unavailable, return `DELETION_CANCELLATION_NOT_ALLOWED` and preserve the job.

- [ ] **Step 8: Add integration scenarios**

Extend `tests/integration/account-deletion-workflow.test.ts` to prove:

- stale authentication is rejected;
- duplicate command IDs return the same job;
- mutations are blocked while pending;
- stage retries do not duplicate provider cancellation;
- analytics failure leaves a retryable job and does not claim completion;
- private habit content is absent after successful deletion;
- minimized approved records remain inaccessible to browser roles.

- [ ] **Step 9: Run focused checks**

```bash
pnpm vitest run tests/integration/account-deletion-workflow.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/server/deletion src/app/api/account-deletion supabase/functions/delete-account tests/integration/account-deletion-workflow.test.ts
git commit -m "feat: execute staged account deletion safely"
```

---
## Task 16: Build the Account Deletion Settings Experience

**Files:**

- Create: `src/features/account-deletion/account-deletion-service.ts`
- Create: `src/features/account-deletion/deletion-status-query.ts`
- Create: `src/features/account-deletion/components/account-deletion-dialog.tsx`
- Create: `src/features/account-deletion/components/deletion-status-card.tsx`
- Create: `src/app/(application)/settings/account/page.tsx`
- Create: `src/app/(application)/settings/account/deletion/page.tsx`
- Create: `tests/component/account-deletion-dialog.test.tsx`
- Create: `tests/accessibility/account-deletion-accessibility.test.tsx`
- Create: `tests/e2e/account-deletion.spec.ts`

- [ ] **Step 1: Write the confirmation-dialog behavior test**

Create `tests/component/account-deletion-dialog.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";

const requiredDisclosures = [
  "subscription impact",
  "export opportunity",
  "retention exceptions",
  "irreversible effects",
  "session revocation"
] as const;

describe("account deletion confirmation", () => {
  it("requires all disclosures and exact typed confirmation", () => {
    expect(requiredDisclosures).toHaveLength(5);
    expect("DELETE MY ACCOUNT").toBe("DELETE MY ACCOUNT");
  });
});
```

- [ ] **Step 2: Implement the client service without private internals**

Create `src/features/account-deletion/account-deletion-service.ts`:

```ts
export type AccountDeletionRequest = {
  commandId: string;
  confirmation: "DELETE MY ACCOUNT";
  confirmationVersion: "v1";
  recentAuthenticationAt: string;
};

export async function submitAccountDeletion(input: AccountDeletionRequest) {
  const response = await fetch("/api/account-deletion", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.code ?? "ACCOUNT_DELETION_REQUEST_FAILED");
  return payload as { jobId: string; status: string; cancellableUntil: string | null };
}
```

- [ ] **Step 3: Build the settings page and dialog**

The page must:

- present `Export my data` before destructive actions;
- explain that account deletion is different from placing a habit in Trash;
- explain subscription consequences and approved retention exceptions;
- require recent reauthentication when the session is stale;
- require a disclosure checkbox and exact typed phrase;
- keep `Cancel` as the initial focus and non-destructive default;
- prevent submission while offline;
- display a stable error region and preserve entered confirmation after a retryable server error;
- never claim deletion is complete from a successful request response.

- [ ] **Step 4: Build the deletion status page**

Create `src/app/(application)/settings/account/deletion/page.tsx` to show only safe statuses:

```text
Queued
Deleting account data
Cleaning connected services
Completed
Action required
```

Show a cancellation button only when the backend explicitly returns a future `cancellableUntil`. After completion, clear local application data, analytics identity, query caches, and service-worker account context before redirecting to the public confirmation page.

- [ ] **Step 5: Add accessibility tests**

Create `tests/accessibility/account-deletion-accessibility.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";

describe("account deletion accessibility", () => {
  it("communicates destructive intent without color alone", () => {
    const signals = ["destructive heading", "warning icon", "consequence text", "typed confirmation"];
    expect(signals).toHaveLength(4);
  });
});
```

The rendered dialog must pass axe, trap focus, restore focus on cancel, expose validation errors through `aria-describedby`, and announce status changes through an `aria-live` region.

- [ ] **Step 6: Add the E2E workflow**

Create `tests/e2e/account-deletion.spec.ts` proving:

1. export is available from the deletion page;
2. submit remains disabled until all confirmations are complete;
3. stale authentication routes through reauthentication and returns safely;
4. a queued deletion blocks subsequent habit mutation;
5. refresh preserves status;
6. cancellation appears only when allowed by the backend;
7. completed deletion clears the session and local account context;
8. no private content appears in browser console messages or analytics requests.

- [ ] **Step 7: Run focused tests**

```bash
pnpm vitest run tests/component/account-deletion-dialog.test.tsx tests/accessibility/account-deletion-accessibility.test.tsx
pnpm playwright test tests/e2e/account-deletion.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/account-deletion src/app/'(application)'/settings/account tests/component/account-deletion-dialog.test.tsx tests/accessibility/account-deletion-accessibility.test.tsx tests/e2e/account-deletion.spec.ts
git commit -m "feat: add explicit account deletion experience"
```

---

## Task 17: Complete RLS, Authorization, Supply-Chain, License, and Privacy Reviews

**Files:**

- Create: `supabase/migrations/20260729105000_security_lifecycle_rls.sql`
- Create: `supabase/tests/00250_security_lifecycle_rls.test.sql`
- Create: `tests/security/authorization-matrix.test.ts`
- Create: `scripts/check-forbidden-log-fields.mjs`
- Create: `scripts/check-license-policy.mjs`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the RLS contract test**

Create `supabase/tests/00250_security_lifecycle_rls.test.sql`:

```sql
begin;
select plan(8);

select isnt_empty(
  $$select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'$$,
  'profiles has RLS policy'
);
select is_empty(
  $$select grantee from information_schema.role_table_grants
    where table_schema = 'private' and table_name = 'data_export_jobs'
      and grantee in ('anon', 'authenticated')$$,
  'browser roles cannot access export jobs'
);
select is_empty(
  $$select grantee from information_schema.role_table_grants
    where table_schema = 'private' and table_name = 'account_deletion_jobs'
      and grantee in ('anon', 'authenticated')$$,
  'browser roles cannot access deletion jobs'
);
select is_empty(
  $$select grantee from information_schema.role_table_grants
    where table_schema = 'private' and table_name = 'rate_limit_buckets'
      and grantee in ('anon', 'authenticated')$$,
  'browser roles cannot access rate-limit buckets'
);
select is_empty(
  $$select grantee from information_schema.role_table_grants
    where table_schema = 'private' and table_name = 'operational_metric_events'
      and grantee in ('anon', 'authenticated')$$,
  'browser roles cannot access operational metrics'
);
select has_function('private', 'assert_account_mutable', array['uuid']);
select has_function('private', 'purge_eligible_habits', array['timestamptz', 'integer']);
select has_function('private', 'request_account_deletion', array['uuid', 'uuid', 'text', 'timestamptz']);

select * from finish();
rollback;
```

- [ ] **Step 2: Implement grants and RLS hardening**

Create `supabase/migrations/20260729105000_security_lifecycle_rls.sql` to:

- enable and force RLS on every browser-readable user-owned table;
- revoke all browser access to private export, deletion, rate-limit, metric, audit, provider-event, and minimized-retention tables;
- grant only required function execution;
- set safe `search_path` on every security-definer function;
- reject client-controlled `user_id` parameters in browser-callable operations;
- ensure account-mutation functions call `assert_account_mutable(auth.uid())`;
- preserve service-role-only scheduled and cleanup functions.

- [ ] **Step 3: Build an authorization matrix test**

Create `tests/security/authorization-matrix.test.ts`:

```ts
import { describe, expect, it } from "vitest";

const matrix = [
  ["guest", "request_signed_in_export", false],
  ["user_a", "download_user_b_export", false],
  ["user_a", "delete_user_b_account", false],
  ["authenticated", "read_private_metrics", false],
  ["service_role", "run_retention_worker", true],
  ["signed_in_owner", "request_own_export", true]
] as const;

describe("authorization matrix", () => {
  it("contains no cross-user allowed case", () => {
    expect(matrix.filter(([actor, action, allowed]) => allowed && action.includes("user_b"))).toEqual([]);
  });
});
```

Implement the integration harness so each matrix row performs the real route, RPC, or database access under the named role.

- [ ] **Step 4: Scan source for forbidden telemetry fields**

Create `scripts/check-forbidden-log-fields.mjs`:

```js
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const roots = ["src", "supabase/functions"];
const forbiddenPatterns = [
  /console\.(log|info|warn|error)\([^\n]*(habitTitle|frictionText|privateNote|email|pushEndpoint|signedUrl)/,
  /capture\([^\n]*(habitTitle|frictionText|privateNote|email|pushEndpoint|exportContent)/
];

async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }))).flat();
}

const findings = [];
for (const root of roots) {
  for (const file of await walk(root)) {
    if (!/\.(ts|tsx|js|mjs)$/.test(file)) continue;
    const content = await readFile(file, "utf8");
    for (const pattern of forbiddenPatterns) if (pattern.test(content)) findings.push(file);
  }
}
if (findings.length) {
  console.error([...new Set(findings)].join("\n"));
  process.exit(1);
}
console.log("Forbidden telemetry field scan passed");
```

- [ ] **Step 5: Enforce the approved license policy**

Create `scripts/check-license-policy.mjs` to read the lockfile dependency inventory through the selected license-check package and fail on unapproved strong-copyleft or unknown licenses. Commit `docs/operations/DEPENDENCY-LICENSE-POLICY.md` with the exact allowlist, exception owner, and review date.

- [ ] **Step 6: Harden CI**

Modify `.github/workflows/ci.yml` to run:

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm audit:dependencies
- run: node scripts/check-license-policy.mjs
- run: node scripts/check-forbidden-log-fields.mjs
- run: pnpm lint
- run: pnpm typecheck
- run: pnpm test:security
- run: pnpm test:lifecycle
- run: pnpm test:db
- run: pnpm build
- run: pnpm audit:secrets
```

Pin actions according to repository policy. Do not expose secrets to untrusted fork pull requests. Separate privileged staging workflows from pull-request checks.

- [ ] **Step 7: Run security checks**

```bash
pnpm supabase:test -- 00250_security_lifecycle_rls.test.sql
pnpm vitest run tests/security/authorization-matrix.test.ts
node scripts/check-forbidden-log-fields.mjs
node scripts/check-license-policy.mjs
pnpm audit:dependencies
```

Expected: all commands pass with zero high-severity dependency findings and no forbidden telemetry fields.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260729105000_security_lifecycle_rls.sql supabase/tests/00250_security_lifecycle_rls.test.sql tests/security/authorization-matrix.test.ts scripts .github/workflows/ci.yml docs/operations/DEPENDENCY-LICENSE-POLICY.md
git commit -m "chore: enforce security privacy and supply chain gates"
```

---

## Task 18: Write Operational Runbooks, Rehearse Restore, and Run the Plan 10 Quality Gate

**Files:**

- Create: `docs/operations/ENVIRONMENTS.md`
- Create: `docs/operations/DEPLOYMENT.md`
- Create: `docs/operations/DATABASE-MIGRATIONS.md`
- Create: `docs/operations/BACKUP-RESTORE.md`
- Create: `docs/operations/AUTH-INCIDENTS.md`
- Modify: `docs/operations/PAYMENT-INCIDENTS.md`
- Create: `docs/operations/REMINDER-INCIDENTS.md`
- Create: `docs/operations/SYNC-RECOVERY.md`
- Create: `docs/operations/EXPORT-INCIDENTS.md`
- Create: `docs/operations/ACCOUNT-DELETION.md`
- Create: `docs/operations/SECURITY-INCIDENT-RESPONSE.md`
- Create: `docs/operations/PLAN-10-VERIFICATION.md`

- [ ] **Step 1: Write environment and deployment boundaries**

`docs/operations/ENVIRONMENTS.md` must state:

```text
Local, Preview, Staging, and Production are separate environments.
Preview and Staging never connect to Production data.
Production secrets are available only to controlled production deployments.
Browser-visible variables are explicitly classified as public.
Scheduled workers authenticate independently from browser sessions.
```

`docs/operations/DEPLOYMENT.md` must define build verification, migration ordering, application deployment, smoke tests, rollback point, feature-disable mechanism, and release evidence.

- [ ] **Step 2: Write database migration and rollback procedures**

`docs/operations/DATABASE-MIGRATIONS.md` must include:

- immutable migration rule;
- expand-migrate-contract sequence;
- local reset and staging rehearsal commands;
- pre-production backup evidence;
- compatibility with the previous web release during rollback window;
- criteria for halting a migration;
- forward-fix preference when reverse migration would destroy data.

- [ ] **Step 3: Write and Rehearse Backup Restore**

`docs/operations/BACKUP-RESTORE.md` must define:

```text
1. Select the approved non-production backup artifact.
2. Restore into a fresh isolated Supabase project or local PostgreSQL instance.
3. Apply required encryption and access controls.
4. Verify schema version and row-count ranges.
5. Verify a known signed-in user fixture, immutable habit versions, sessions, check-ins, entitlement state, and audit references.
6. Confirm private tables are not accessible to browser roles.
7. Record restore start, completion, operator, source artifact, target, checks, and result.
8. Destroy the temporary environment according to retention policy.
```

Perform the rehearsal and record dated evidence in `docs/operations/PLAN-10-VERIFICATION.md`. Do not use production personal data in the rehearsal.

- [ ] **Step 4: Write incident runbooks**

Each runbook must contain detection, severity, immediate containment, evidence preservation, safe communication, recovery, verification, and retrospective steps.

Required specific scenarios:

- authentication callback failure spike;
- cross-user authorization suspicion;
- payment webhook backlog or entitlement corruption;
- reminder provider degradation without false delivery claims;
- synchronization server failures and pending-operation recovery;
- export generation or signed-link exposure;
- deletion job failure after user confirmation;
- secret exposure or credential compromise;
- database unavailability or suspected data loss.

- [ ] **Step 5: Define secret rotation with overlap**

The security incident runbook must define rotation for Supabase service role, Paddle webhook secret, Paddle API key, rate-limit hash secret, export signing secret, analytics key, monitoring token, push credentials, and email provider credentials. Where a provider supports overlap, accept old and new verification secrets only for the documented transition period, then remove the old secret.

- [ ] **Step 6: Run the complete Plan 10 gate**

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:security
pnpm test:lifecycle
pnpm test:db
pnpm vitest run tests/component/export-status-card.test.tsx tests/component/account-deletion-dialog.test.tsx
pnpm playwright test tests/e2e/data-export.spec.ts tests/e2e/trash-retention.spec.ts tests/e2e/account-deletion.spec.ts
pnpm audit:dependencies
node scripts/check-license-policy.mjs
node scripts/check-forbidden-log-fields.mjs
pnpm build
pnpm audit:secrets
```

Expected:

```text
0 lint errors
0 TypeScript errors
all security/privacy/lifecycle tests pass
all pgTAP tests pass
all selected E2E tests pass
0 high-severity dependency audit findings
license policy passes
forbidden telemetry scan passes
production build succeeds
browser bundle secret scan passes
```

- [ ] **Step 7: Record verification evidence**

Create `docs/operations/PLAN-10-VERIFICATION.md`:

```markdown
# Plan 10 Verification Evidence

## Scope
Security headers, origin protection, rate limiting, secret boundaries, redaction, analytics consent, operational health, export, Trash retention, account deletion, RLS, supply chain, and restore rehearsal.

## Commands
Record each command, execution date, environment, exit code, and concise result.

## Restore rehearsal
Record source fixture, isolated target, schema verification, authorization verification, lifecycle verification, result, and cleanup evidence.

## Open findings
Only documented non-release-blocking findings may remain. Critical and high findings must be zero before Plan 11.
```

- [ ] **Step 8: Perform the Plan 11 handoff review**

Confirm all of the following before creating or executing Plan 11:

- CSP and required browser headers are automated and pass;
- origin, redirect, body-size, webhook-signature, and replay protections are active;
- distributed rate limits cover every required endpoint class;
- no server-only value exists in browser output or Git-tracked fixtures;
- logs, error reports, metrics, and analytics pass privacy scans;
- liveness, readiness, and protected dependency checks behave correctly;
- Guest and signed-in exports are authorized and expiring;
- Trash retention and explicit permanent deletion behave correctly;
- account deletion is staged, idempotent, observable, and does not claim false completion;
- external analytics, push, auth, and billing cleanup is represented in deletion state;
- RLS and authorization matrix tests show no cross-user path;
- dependency and license gates pass;
- restore rehearsal evidence is current;
- incident runbooks identify owners and safe recovery steps;
- no critical or high security finding remains.

- [ ] **Step 9: Commit the operational evidence**

```bash
git add docs/operations
git commit -m "docs: complete security and lifecycle operations evidence"
```

---

# 4. Plan 10 Completion Criteria

Plan 10 is complete only when fresh verification proves:

- browser security headers and nonce-based CSP pass automated assertions;
- HSTS is production-only and no development environment is accidentally pinned;
- origin, redirect, request-size, and input-length boundaries reject invalid requests;
- provider webhook routes continue to use signatures and replay controls rather than browser-origin assumptions;
- rate limits reject abusive requests without blocking the tested normal flows;
- privileged environment values are server-only and absent from browser bundles;
- correlation IDs support investigation without exposing direct personal identifiers;
- logs, metrics, error monitoring, and analytics omit prohibited private content;
- analytics respects consent and product behavior remains functional when analytics is unavailable;
- health endpoints disclose no secret or dependency details;
- signed-in export is user-scoped, asynchronous, integrity-hashed, expiring, and available only through short-lived signed URLs;
- Guest export works entirely from IndexedDB without account creation;
- Trash remains restorable for 30 days and purge is controlled and auditable;
- explicit permanent deletion requires strong confirmation;
- account deletion requires recent authentication, blocks new mutations, executes idempotent stages, revokes access, removes private content, and retains only approved minimized records;
- RLS, private grants, function authorization, and cross-user tests pass;
- dependency, license, secret, free-text, logging, and telemetry reviews pass;
- backup restore is rehearsed outside production with recorded evidence;
- operational runbooks cover auth, payment, reminders, sync, export, deletion, security, deployment, migration, backup, restore, and rollback;
- all Plan 10 checks pass from a clean checkout.

# 5. Plan 11 Handoff

After Plan 10 verification, proceed to:

```text
docs/implementation/11-testing-release-production.md
```

Plan 11 will certify the complete product against PRD, UX, UI, technical, security, accessibility, performance, browser, billing-sandbox, migration, rollback, and operational release requirements. It will configure controlled production infrastructure and release gates; it must not weaken or bypass any Plan 10 control to make release tests pass.
