# Authentication and Guest Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. This project uses one agent only; do not dispatch subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement secure Google and email authentication, SSR session handling, account-scoped cloud persistence, idempotent Guest-to-account conversion, and cross-browser synchronization without losing browser-local progress.

**Architecture:** Supabase Auth establishes PKCE-compatible sessions through secure SSR cookies. Lightweight request gating occurs in `proxy.ts`, while server operations and PostgreSQL RLS remain authoritative. Guest conversion is a bounded, hashed, idempotent command: the browser preserves its original IndexedDB source until the server transaction commits, the local account cache verifies the imported mapping, and the user explicitly resolves any Free-plan active-habit excess.

**Tech Stack:** Next.js App Router, React, strict TypeScript, Zod, Supabase Auth, `@supabase/ssr`, PostgreSQL functions and RLS, Dexie, TanStack Query, Web Crypto, Vitest, React Testing Library, Playwright, pgTAP, pnpm.

---

# 1. Prerequisites and Boundaries

## Prerequisites

Begin only after Plans 01–06 are verified complete. The repository must already provide:

- deterministic clock and UUID services;
- responsive public and application shells;
- Guest-mode IndexedDB persistence through Dexie schema version 5;
- durable account pending-operation envelopes, queue leases, synchronization cursors, and conflict records;
- account-neutral `ProductRepository` contracts;
- Supabase database schema, generated types, security-invoker reads, and RLS;
- Today, Habits, check-in, lifecycle, Recovery, and Weekly Review workflows;
- operational states for loading, error, offline, pending sync, conflict, and destructive confirmation.

## Explicit exclusions

This plan does not implement:

- Premium recommendation algorithms or advanced Insights;
- checkout, payment-provider callbacks, trials, or entitlement webhooks;
- account export package generation;
- account deletion and retention workers;
- production incident dashboards or final release certification.

## Product invariants

- Guest is a browser-local identity, never an anonymous Supabase Auth account.
- Authentication is required only when the user explicitly signs in or requests account-only value.
- Google and email OTP or magic-link flows return to the initiating safe context.
- Return paths are internal application paths only; external redirects are rejected.
- Guest data remains readable and recoverable until conversion is committed and locally verified.
- Retrying an identical conversion manifest creates no duplicate records.
- Existing account data is never overwritten because a Guest habit has the same name.
- No check-in history is silently discarded.
- Free accounts may have at most five active habits.
- Active-limit excess requires an explicit user selection; history can still be imported in a non-active state.
- Unsynchronized local account operations remain bound to the authenticated account that created them.
- A queue owned by one account must never synchronize into another account.
- Signing out removes session material but does not destructively erase the durable local cache without explicit user action.
- RLS remains the final data-authorization boundary.

---

# 2. File Map

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── auth-error/page.tsx
│   ├── auth/
│   │   └── callback/route.ts
│   ├── api/
│   │   ├── conversion/
│   │   │   ├── preview/route.ts
│   │   │   └── commit/route.ts
│   │   └── sync/
│   │       └── pull/route.ts
│   └── (application)/
│       └── account-transfer/page.tsx
├── domain/
│   ├── authentication/
│   │   ├── auth-intent.ts
│   │   ├── return-path.ts
│   │   └── session-state.ts
│   └── conversion/
│       ├── conversion-manifest.ts
│       ├── conversion-preview.ts
│       ├── conversion-resolution.ts
│       └── manifest-hash.ts
├── features/
│   ├── authentication/
│   │   ├── auth-actions.ts
│   │   ├── auth-bootstrap-service.ts
│   │   ├── auth-session-provider.tsx
│   │   └── components/
│   ├── guest-conversion/
│   │   ├── conversion-command-service.ts
│   │   ├── conversion-package-builder.ts
│   │   ├── conversion-repository.ts
│   │   ├── conversion-verification.ts
│   │   └── components/
│   └── synchronization/
│       ├── account-cache-bootstrap.ts
│       ├── pull-sync-service.ts
│       ├── sync-owner-guard.ts
│       └── components/
├── lib/
│   ├── indexed-db/
│   │   ├── authentication-migrations.ts
│   │   └── conversion-snapshot.ts
│   └── supabase/
│       ├── browser.ts
│       ├── server.ts
│       ├── admin.ts
│       └── update-session.ts
└── proxy.ts
supabase/
├── migrations/
│   ├── 20260729040000_account_profiles_installations.sql
│   ├── 20260729041000_guest_conversion_tables.sql
│   ├── 20260729042000_guest_conversion_function.sql
│   └── 20260729043000_incremental_sync_function.sql
└── tests/
    ├── 00090_account_identity.test.sql
    ├── 00100_guest_conversion.test.sql
    └── 00110_incremental_sync.test.sql
tests/
├── component/
│   ├── sign-in-form.test.tsx
│   ├── conversion-review.test.tsx
│   └── session-expired-banner.test.tsx
├── e2e/
│   ├── authentication.spec.ts
│   ├── account-conversion.spec.ts
│   └── cross-device-sync.spec.ts
├── integration/
│   ├── auth-bootstrap-service.test.ts
│   ├── conversion-command-service.test.ts
│   ├── pull-sync-service.test.ts
│   └── sign-out-cache-policy.test.ts
└── unit/
    ├── return-path.test.ts
    ├── conversion-manifest.test.ts
    ├── conversion-resolution.test.ts
    └── sync-owner-guard.test.ts
```

---

# 3. Tasks

## Task 1: Define Plan 07 Verification Commands and Identity Architecture

**Files:**

- Modify: `package.json`
- Create: `docs/architecture/ADR-010-authentication-guest-conversion.md`

- [ ] **Step 1: Add focused verification scripts**

Add the following entries without removing existing scripts:

```json
{
  "scripts": {
    "test:auth": "vitest run tests/unit/return-path.test.ts tests/integration/auth-bootstrap-service.test.ts tests/component/sign-in-form.test.tsx tests/component/session-expired-banner.test.tsx",
    "test:conversion": "vitest run tests/unit/conversion-manifest.test.ts tests/unit/conversion-resolution.test.ts tests/integration/conversion-command-service.test.ts tests/component/conversion-review.test.tsx",
    "test:account-sync": "vitest run tests/unit/sync-owner-guard.test.ts tests/integration/pull-sync-service.test.ts tests/integration/sign-out-cache-policy.test.ts",
    "test:e2e:auth": "playwright test tests/e2e/authentication.spec.ts",
    "test:e2e:conversion": "playwright test tests/e2e/account-conversion.spec.ts tests/e2e/cross-device-sync.spec.ts"
  }
}
```

- [ ] **Step 2: Record the architecture decision**

Create `docs/architecture/ADR-010-authentication-guest-conversion.md`:

```markdown
# ADR-010: Account Identity and Guest Conversion

## Status

Accepted.

## Decision

Guest remains a browser-local identity. Supabase Auth establishes account sessions through secure SSR cookies. Request gating is lightweight; server operations, ownership checks, and PostgreSQL RLS authorize data access. Guest conversion submits one bounded, hashed, idempotent manifest. Local Guest data is retained until the server commit and local verification both succeed.

## Consequences

- Browser, server, and service-role Supabase clients are separate modules.
- External return URLs are rejected.
- Conversion retries return the original mapping.
- Active-limit conflicts require explicit selection.
- Pending operations remain bound to their original account owner.
- Sign-out removes credentials but preserves non-sensitive cached product data.
```

- [ ] **Step 3: Run the focused suite before implementation**

Run:

```bash
pnpm test:auth
```

Expected: FAIL because Plan 07 tests do not exist.

- [ ] **Step 4: Commit the plan boundary**

```bash
git add package.json docs/architecture/ADR-010-authentication-guest-conversion.md
git commit -m "chore: define authentication and conversion boundary"
```

---

## Task 2: Separate Browser, Server, and Privileged Supabase Clients

**Files:**

- Create: `src/lib/supabase/browser.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `tests/integration/supabase-client-boundaries.test.ts`

- [ ] **Step 1: Write boundary tests**

Create `tests/integration/supabase-client-boundaries.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

const browserPath = 'src/lib/supabase/browser.ts';
const serverPath = 'src/lib/supabase/server.ts';
const adminPath = 'src/lib/supabase/admin.ts';

describe('Supabase client boundaries', () => {
  it('keeps the service-role key in a server-only module', async () => {
    const [browser, server, admin] = await Promise.all([
      readFile(browserPath, 'utf8'),
      readFile(serverPath, 'utf8'),
      readFile(adminPath, 'utf8'),
    ]);

    expect(browser).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(server).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(admin).toContain("import 'server-only'");
    expect(admin).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run:

```bash
pnpm vitest run tests/integration/supabase-client-boundaries.test.ts
```

Expected: FAIL because the three modules do not exist.

- [ ] **Step 3: Implement the browser client**

Create `src/lib/supabase/browser.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
  client ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
```

- [ ] **Step 4: Implement the server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => {
          for (const { name, value, options } of values) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
```

- [ ] **Step 5: Implement the privileged client**

Create `src/lib/supabase/admin.ts`:

```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function getSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
```

- [ ] **Step 6: Run tests and static checks**

```bash
pnpm vitest run tests/integration/supabase-client-boundaries.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/supabase tests/integration/supabase-client-boundaries.test.ts
git commit -m "feat: separate supabase client privileges"
```

---

## Task 3: Implement Safe Return Paths and Authentication Intent

**Files:**

- Create: `src/domain/authentication/return-path.ts`
- Create: `src/domain/authentication/auth-intent.ts`
- Create: `tests/unit/return-path.test.ts`

- [ ] **Step 1: Write failing return-path tests**

Create `tests/unit/return-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseSafeReturnPath } from '@/domain/authentication/return-path';

const fallback = '/app/today';

describe('parseSafeReturnPath', () => {
  it.each([
    '/app/today',
    '/app/habits/new?source=limit',
    '/app/settings/profile#email',
  ])('accepts internal application path %s', (value) => {
    expect(parseSafeReturnPath(value, fallback)).toBe(value);
  });

  it.each([
    'https://evil.example/steal',
    '//evil.example/steal',
    'javascript:alert(1)',
    '/auth/callback?next=https://evil.example',
    '',
  ])('rejects unsafe return value %s', (value) => {
    expect(parseSafeReturnPath(value, fallback)).toBe(fallback);
  });
});
```

- [ ] **Step 2: Verify the test fails**

```bash
pnpm vitest run tests/unit/return-path.test.ts
```

Expected: FAIL because `parseSafeReturnPath` does not exist.

- [ ] **Step 3: Implement the return-path parser**

Create `src/domain/authentication/return-path.ts`:

```ts
const allowedPrefixes = ['/app/', '/pricing', '/'];
const forbiddenPrefixes = ['/auth/callback', '/api/'];

export function parseSafeReturnPath(
  candidate: string | null | undefined,
  fallback = '/app/today',
): string {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate, 'https://recovery-first.local');
  } catch {
    return fallback;
  }

  if (parsed.origin !== 'https://recovery-first.local') return fallback;
  if (forbiddenPrefixes.some((prefix) => parsed.pathname.startsWith(prefix))) return fallback;
  if (!allowedPrefixes.some((prefix) => parsed.pathname.startsWith(prefix))) return fallback;

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
```

- [ ] **Step 4: Implement the authentication intent schema**

Create `src/domain/authentication/auth-intent.ts`:

```ts
import { z } from 'zod';
import { parseSafeReturnPath } from './return-path';

export const authReasonSchema = z.enum([
  'explicit_sign_in',
  'cloud_backup',
  'cross_device',
  'guest_limit',
  'email_reminders',
  'premium_checkout',
  'session_expired',
]);

export type AuthReason = z.infer<typeof authReasonSchema>;

export type AuthIntent = {
  reason: AuthReason;
  returnPath: string;
  createdAt: string;
};

export function createAuthIntent(input: {
  reason: unknown;
  returnPath?: string | null;
  now: string;
}): AuthIntent {
  return {
    reason: authReasonSchema.parse(input.reason),
    returnPath: parseSafeReturnPath(input.returnPath),
    createdAt: input.now,
  };
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm vitest run tests/unit/return-path.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/authentication tests/unit/return-path.test.ts
git commit -m "feat: validate authentication return paths"
```

---

## Task 4: Implement Session Refresh and Lightweight Request Gating

**Files:**

- Create: `src/lib/supabase/update-session.ts`
- Create: `src/proxy.ts`
- Create: `tests/integration/proxy-auth-gating.test.ts`

- [ ] **Step 1: Write route-classification tests**

Create `tests/integration/proxy-auth-gating.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { classifyRequestPath } from '@/lib/supabase/update-session';

describe('classifyRequestPath', () => {
  it('allows Guest-capable product routes without an account', () => {
    expect(classifyRequestPath('/app/today')).toBe('guest_capable');
    expect(classifyRequestPath('/app/habits/new')).toBe('guest_capable');
  });

  it('requires an account for account-only routes', () => {
    expect(classifyRequestPath('/app/settings/profile')).toBe('account_required');
    expect(classifyRequestPath('/app/subscription')).toBe('account_required');
  });

  it('leaves public and auth routes public', () => {
    expect(classifyRequestPath('/')).toBe('public');
    expect(classifyRequestPath('/sign-in')).toBe('public');
  });
});
```

- [ ] **Step 2: Verify the test fails**

```bash
pnpm vitest run tests/integration/proxy-auth-gating.test.ts
```

Expected: FAIL because the classifier does not exist.

- [ ] **Step 3: Implement session refresh and path classification**

Create `src/lib/supabase/update-session.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import { parseSafeReturnPath } from '@/domain/authentication/return-path';

const accountOnlyPrefixes = [
  '/app/settings/profile',
  '/app/settings/account',
  '/app/settings/export',
  '/app/subscription',
  '/app/account-transfer',
];

const guestCapablePrefixes = [
  '/app/today',
  '/app/habits',
  '/app/review',
  '/app/insights',
  '/app/reminders',
  '/app/settings/preferences',
];

export type RequestPathClass = 'public' | 'guest_capable' | 'account_required';

export function classifyRequestPath(pathname: string): RequestPathClass {
  if (accountOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return 'account_required';
  }
  if (guestCapablePrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return 'guest_capable';
  }
  return 'public';
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          for (const { name, value } of values) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const routeClass = classifyRequestPath(request.nextUrl.pathname);

  if (routeClass === 'account_required' && !data.user) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = '/sign-in';
    signIn.searchParams.set(
      'returnTo',
      parseSafeReturnPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
    );
    signIn.searchParams.set('reason', 'explicit_sign_in');
    return NextResponse.redirect(signIn);
  }

  return response;
}
```

- [ ] **Step 4: Add the request proxy**

Create `src/proxy.ts`:

```ts
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/update-session';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 5: Run tests and build**

```bash
pnpm vitest run tests/integration/proxy-auth-gating.test.ts
pnpm typecheck
pnpm build
```

Expected: PASS. Guest-capable routes remain accessible without an account.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/update-session.ts src/proxy.ts tests/integration/proxy-auth-gating.test.ts
git commit -m "feat: refresh sessions and gate account routes"
```

---

## Task 5: Add Account Profiles and Browser Installation Registration

**Files:**

- Create: `supabase/migrations/20260729040000_account_profiles_installations.sql`
- Create: `supabase/tests/00090_account_identity.test.sql`
- Regenerate: `src/types/supabase.ts`

- [ ] **Step 1: Write failing pgTAP coverage**

Create `supabase/tests/00090_account_identity.test.sql`:

```sql
begin;
select plan(8);

select has_table('public', 'profiles');
select has_table('public', 'account_installations');
select has_column('public', 'profiles', 'user_id');
select has_column('public', 'account_installations', 'installation_id');
select has_column('public', 'account_installations', 'last_seen_at');
select row_security_active('public', 'profiles');
select row_security_active('public', 'account_installations');
select has_function('public', 'ensure_account_profile', array[]::text[]);

select * from finish();
rollback;
```

- [ ] **Step 2: Verify the database test fails**

```bash
pnpm supabase db reset
pnpm test:db -- 00090_account_identity.test.sql
```

Expected: FAIL because the tables and function do not exist.

- [ ] **Step 3: Create profile, installation, trigger, and RLS migration**

Create `supabase/migrations/20260729040000_account_profiles_installations.sql`:

```sql
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.account_installations (
  user_id uuid not null references auth.users(id) on delete cascade,
  installation_id uuid not null,
  push_capability text not null default 'unknown'
    check (push_capability in ('unknown', 'unsupported', 'prompt', 'granted', 'denied', 'expired')),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, installation_id)
);

alter table public.profiles enable row level security;
alter table public.account_installations enable row level security;

create policy profiles_select_own on public.profiles
for select using (auth.uid() = user_id);
create policy profiles_update_own on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy installations_select_own on public.account_installations
for select using (auth.uid() = user_id);
create policy installations_insert_own on public.account_installations
for insert with check (auth.uid() = user_id);
create policy installations_update_own on public.account_installations
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy installations_delete_own on public.account_installations
for delete using (auth.uid() = user_id);

create or replace function public.ensure_account_profile()
returns public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  insert into public.profiles (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select * into result from public.profiles where user_id = auth.uid();
  return result;
end;
$$;

grant execute on function public.ensure_account_profile() to authenticated;
```

- [ ] **Step 4: Run database tests and regenerate types**

```bash
pnpm supabase db reset
pnpm test:db -- 00090_account_identity.test.sql
pnpm supabase gen types typescript --local > src/types/supabase.ts
pnpm typecheck
```

Expected: PASS with account-scoped policies active.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260729040000_account_profiles_installations.sql supabase/tests/00090_account_identity.test.sql src/types/supabase.ts
git commit -m "feat: add account profiles and installations"
```

---

## Task 6: Implement Google and Email Authentication Actions

**Files:**

- Create: `src/features/authentication/auth-actions.ts`
- Create: `tests/integration/auth-actions.test.ts`

- [ ] **Step 1: Write failing action tests**

Create `tests/integration/auth-actions.test.ts` with a hoisted Supabase mock:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithOAuth = vi.fn();
const signInWithOtp = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => ({
    auth: { signInWithOAuth, signInWithOtp },
  }),
}));

import { requestEmailSignIn, startGoogleSignIn } from '@/features/authentication/auth-actions';

describe('authentication actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses a safe callback and return path for Google', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://provider.example' }, error: null });
    const result = await startGoogleSignIn({ returnPath: '/app/today', origin: 'https://app.example' });
    expect(result).toEqual({ redirectUrl: 'https://provider.example' });
    expect(signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
  });

  it('requests email sign-in without disclosing account existence', async () => {
    signInWithOtp.mockResolvedValue({ data: {}, error: null });
    await expect(
      requestEmailSignIn({ email: 'person@example.com', returnPath: '/app/today', origin: 'https://app.example' }),
    ).resolves.toEqual({ accepted: true });
  });
});
```

- [ ] **Step 2: Verify the tests fail**

```bash
pnpm vitest run tests/integration/auth-actions.test.ts
```

Expected: FAIL because the actions do not exist.

- [ ] **Step 3: Implement server actions**

Create `src/features/authentication/auth-actions.ts`:

```ts
'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { parseSafeReturnPath } from '@/domain/authentication/return-path';

const emailSchema = z.string().trim().email().max(254);

function callbackUrl(origin: string, returnPath: string) {
  const url = new URL('/auth/callback', origin);
  url.searchParams.set('returnTo', parseSafeReturnPath(returnPath));
  return url.toString();
}

export async function startGoogleSignIn(input: { returnPath?: string; origin: string }) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl(input.origin, input.returnPath ?? '/app/today'),
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error || !data.url) throw new Error('authentication_start_failed');
  return { redirectUrl: data.url };
}

export async function requestEmailSignIn(input: {
  email: string;
  returnPath?: string;
  origin: string;
}) {
  const email = emailSchema.parse(input.email);
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl(input.origin, input.returnPath ?? '/app/today'),
      shouldCreateUser: true,
    },
  });
  if (error) throw new Error('email_sign_in_request_failed');
  return { accepted: true as const };
}
```

- [ ] **Step 4: Run tests and type checking**

```bash
pnpm vitest run tests/integration/auth-actions.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/authentication/auth-actions.ts tests/integration/auth-actions.test.ts
git commit -m "feat: add google and email sign in actions"
```

---

## Task 7: Build Accessible Sign-In, Email Verification, and Auth Error Screens

**Files:**

- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/app/(auth)/verify-email/page.tsx`
- Create: `src/app/(auth)/auth-error/page.tsx`
- Create: `src/features/authentication/components/sign-in-form.tsx`
- Create: `tests/component/sign-in-form.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create `tests/component/sign-in-form.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SignInForm } from '@/features/authentication/components/sign-in-form';

describe('SignInForm', () => {
  it('offers Google and email without implying Guest data is already backed up', async () => {
    render(
      <SignInForm
        reason="cloud_backup"
        returnPath="/app/today"
        onGoogle={vi.fn()}
        onEmail={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeVisible();
    expect(screen.getByLabelText(/email address/i)).toBeVisible();
    expect(screen.getByText(/stored in this browser/i)).toBeVisible();
    expect(screen.queryByText(/already backed up/i)).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/email address/i), 'person@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send sign-in link/i }));
  });
});
```

- [ ] **Step 2: Verify the component test fails**

```bash
pnpm vitest run tests/component/sign-in-form.test.tsx
```

Expected: FAIL because `SignInForm` does not exist.

- [ ] **Step 3: Implement the reusable form**

Create `src/features/authentication/components/sign-in-form.tsx`:

```tsx
'use client';

import { useState } from 'react';

type Props = {
  reason: string;
  returnPath: string;
  onGoogle: () => Promise<void> | void;
  onEmail: (email: string) => Promise<void>;
};

export function SignInForm({ reason, onGoogle, onEmail }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  return (
    <section aria-labelledby="sign-in-heading" className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 id="sign-in-heading" className="text-2xl font-semibold">Sign in</h1>
        <p className="text-muted-foreground">
          {reason === 'cloud_backup'
            ? 'Create an account to back up and synchronize your progress.'
            : 'Continue securely to your account.'}
        </p>
        <p className="text-sm text-muted-foreground">
          Guest progress is currently stored in this browser until transfer succeeds.
        </p>
      </header>

      <button type="button" className="button button-secondary w-full" onClick={() => void onGoogle()}>
        Continue with Google
      </button>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus('sending');
          void onEmail(email).then(() => setStatus('sent')).catch(() => setStatus('error'));
        }}
      >
        <label className="block space-y-1">
          <span>Email address</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input w-full"
          />
        </label>
        <button type="submit" className="button button-primary w-full" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
        </button>
        <p aria-live="polite" className="text-sm">
          {status === 'sent' ? 'Check your email for a secure sign-in link or code.' : null}
          {status === 'error' ? 'The sign-in message could not be sent. Try again.' : null}
        </p>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: Implement route pages using existing shell components**

`src/app/(auth)/sign-in/page.tsx` must parse `reason` and `returnTo`, render `SignInForm`, call the actions from Task 6, and redirect the browser only to the provider URL returned by the server action. `verify-email/page.tsx` displays a neutral message that does not reveal whether the address previously existed. `auth-error/page.tsx` accepts a safe error code and offers Retry plus Return to app.

Use these user-facing messages:

```ts
export const authMessages = {
  invalid_callback: 'This sign-in link is invalid or has expired.',
  provider_cancelled: 'Sign-in was cancelled. Your browser-local progress is unchanged.',
  authentication_failed: 'Sign-in could not be completed. Try again.',
} as const;
```

- [ ] **Step 5: Run component and accessibility tests**

```bash
pnpm vitest run tests/component/sign-in-form.test.tsx
pnpm test:a11y
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(auth)' src/features/authentication/components tests/component/sign-in-form.test.tsx
git commit -m "feat: build accessible authentication screens"
```

---

## Task 8: Implement Callback Validation and Account Bootstrap

**Files:**

- Create: `src/app/auth/callback/route.ts`
- Create: `src/features/authentication/auth-bootstrap-service.ts`
- Create: `tests/integration/auth-bootstrap-service.test.ts`

- [ ] **Step 1: Write failing bootstrap tests**

Create `tests/integration/auth-bootstrap-service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { bootstrapAuthenticatedAccount } from '@/features/authentication/auth-bootstrap-service';

describe('bootstrapAuthenticatedAccount', () => {
  it('ensures profile and installation exactly once', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { user_id: 'user-1' }, error: null });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const client = {
      rpc,
      from: () => ({ upsert }),
    } as never;

    await bootstrapAuthenticatedAccount(client, {
      userId: 'user-1',
      installationId: '11111111-1111-4111-8111-111111111111',
      now: '2026-07-29T15:00:00.000Z',
    });

    expect(rpc).toHaveBeenCalledWith('ensure_account_profile');
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Verify the tests fail**

```bash
pnpm vitest run tests/integration/auth-bootstrap-service.test.ts
```

Expected: FAIL because the bootstrap service does not exist.

- [ ] **Step 3: Implement account bootstrap**

Create `src/features/authentication/auth-bootstrap-service.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export async function bootstrapAuthenticatedAccount(
  client: SupabaseClient<Database>,
  input: { userId: string; installationId: string; now: string },
) {
  const profile = await client.rpc('ensure_account_profile');
  if (profile.error) throw new Error('profile_bootstrap_failed');

  const installation = await client.from('account_installations').upsert(
    {
      user_id: input.userId,
      installation_id: input.installationId,
      last_seen_at: input.now,
    },
    { onConflict: 'user_id,installation_id' },
  );
  if (installation.error) throw new Error('installation_registration_failed');

  return { profile: profile.data };
}
```

- [ ] **Step 4: Implement the callback route**

Create `src/app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { parseSafeReturnPath } from '@/domain/authentication/return-path';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const returnTo = parseSafeReturnPath(request.nextUrl.searchParams.get('returnTo'));
  const errorTarget = new URL('/auth-error', request.url);

  if (!code) {
    errorTarget.searchParams.set('code', 'invalid_callback');
    return NextResponse.redirect(errorTarget);
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    errorTarget.searchParams.set('code', 'invalid_callback');
    return NextResponse.redirect(errorTarget);
  }

  const destination = new URL(returnTo, request.url);
  destination.searchParams.set('auth', 'complete');
  return NextResponse.redirect(destination);
}
```

The account bootstrap client component must run after the callback, read or create the stable browser installation ID from Dexie, call `bootstrapAuthenticatedAccount`, then route to account-transfer review only when Guest data exists.

- [ ] **Step 5: Run tests**

```bash
pnpm vitest run tests/integration/auth-bootstrap-service.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/auth/callback src/features/authentication/auth-bootstrap-service.ts tests/integration/auth-bootstrap-service.test.ts
git commit -m "feat: validate auth callback and bootstrap account"
```

---

## Task 9: Implement Session Expiry and Queue Owner Protection

**Files:**

- Create: `src/domain/authentication/session-state.ts`
- Create: `src/features/synchronization/sync-owner-guard.ts`
- Create: `src/features/authentication/components/session-expired-banner.tsx`
- Create: `tests/unit/sync-owner-guard.test.ts`
- Create: `tests/component/session-expired-banner.test.tsx`

- [ ] **Step 1: Write failing owner-guard tests**

Create `tests/unit/sync-owner-guard.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { assertQueueOwner } from '@/features/synchronization/sync-owner-guard';

describe('assertQueueOwner', () => {
  it('allows the same authenticated account', () => {
    expect(() => assertQueueOwner('account-a', 'account-a')).not.toThrow();
  });

  it('blocks queue replay into another account', () => {
    expect(() => assertQueueOwner('account-a', 'account-b')).toThrow('queue_owner_mismatch');
  });

  it('blocks replay while no session is established', () => {
    expect(() => assertQueueOwner('account-a', null)).toThrow('authentication_required');
  });
});
```

- [ ] **Step 2: Implement the owner guard and session state**

Create `src/features/synchronization/sync-owner-guard.ts`:

```ts
export function assertQueueOwner(queueOwnerId: string, authenticatedUserId: string | null) {
  if (!authenticatedUserId) throw new Error('authentication_required');
  if (queueOwnerId !== authenticatedUserId) throw new Error('queue_owner_mismatch');
}
```

Create `src/domain/authentication/session-state.ts`:

```ts
export type SessionState =
  | { status: 'guest' }
  | { status: 'authenticated'; userId: string }
  | { status: 'expired'; previousUserId: string; returnPath: string }
  | { status: 'identity_mismatch'; queueOwnerId: string; authenticatedUserId: string };
```

- [ ] **Step 3: Write and implement the expired-session banner**

The component test must assert that the banner:

- says local work is preserved;
- offers `Sign in again`;
- does not claim synchronization succeeded;
- exposes an `aria-live="polite"` status region.

Implement `SessionExpiredBanner` with a safe `returnPath` and a link to `/sign-in?reason=session_expired`.

- [ ] **Step 4: Integrate the guard into the Plan 05 queue worker**

Before processing any account operation, load the current authenticated user ID and call:

```ts
assertQueueOwner(operation.ownerId, authenticatedUserId);
```

Map `authentication_required` to a blocked queue state with reason `session_expired`. Map `queue_owner_mismatch` to a permanent blocked state requiring explicit account switch or local cache removal.

- [ ] **Step 5: Run tests**

```bash
pnpm vitest run tests/unit/sync-owner-guard.test.ts tests/component/session-expired-banner.test.tsx
pnpm test:account-sync
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/authentication src/features/synchronization src/features/authentication/components tests/unit/sync-owner-guard.test.ts tests/component/session-expired-banner.test.tsx
git commit -m "feat: preserve local work across session expiry"
```

---

## Task 10: Add Dexie Version 6 for Account Identity and Conversion Snapshots

**Files:**

- Create: `src/lib/indexed-db/authentication-migrations.ts`
- Create: `src/lib/indexed-db/conversion-snapshot.ts`
- Modify: the existing Dexie database definition from Plans 03–06
- Create: `tests/integration/indexed-db-authentication-migration.test.ts`

- [ ] **Step 1: Write a failing migration test**

The test must seed schema version 5 with Guest habits, check-ins, pending operations, Recovery data, and reviews, reopen the database at version 6, then assert every previous record remains and the new stores are available.

Use these version 6 records:

```ts
export type LocalAccountIdentityRecord = {
  userId: string;
  installationId: string;
  lastAuthenticatedAt: string;
};

export type ConversionSnapshotRecord = {
  conversionId: string;
  guestProfileId: string;
  userId: string;
  manifestHash: string;
  encryptedPayload: string;
  status: 'prepared' | 'submitted' | 'committed' | 'verified' | 'retired';
  createdAt: string;
  updatedAt: string;
};

export type SourceIdMappingRecord = {
  conversionId: string;
  entityType: string;
  sourceId: string;
  targetId: string;
};
```

- [ ] **Step 2: Register schema version 6**

Add stores with indexes equivalent to:

```ts
{
  local_account_identities: '&userId, installationId, lastAuthenticatedAt',
  conversion_snapshots: '&conversionId, guestProfileId, userId, manifestHash, status, updatedAt',
  source_id_mappings: '[conversionId+entityType+sourceId], conversionId, targetId',
}
```

The upgrade callback must not delete or rewrite version 5 domain records.

- [ ] **Step 3: Implement conversion snapshot helpers**

Create `src/lib/indexed-db/conversion-snapshot.ts` with transactional functions:

```ts
export async function savePreparedSnapshot(db: AppDatabase, record: ConversionSnapshotRecord) {
  await db.transaction('rw', db.conversionSnapshots, async () => {
    await db.conversionSnapshots.put(record);
  });
}

export async function markSnapshotVerified(
  db: AppDatabase,
  conversionId: string,
  updatedAt: string,
) {
  await db.conversionSnapshots.update(conversionId, { status: 'verified', updatedAt });
}
```

Use the existing application crypto service to encrypt the payload before persistence. Do not store Auth tokens in Dexie.

- [ ] **Step 4: Run migration tests**

```bash
pnpm vitest run tests/integration/indexed-db-authentication-migration.test.ts
pnpm typecheck
```

Expected: PASS with all version 5 records preserved.

- [ ] **Step 5: Commit**

```bash
git add src/lib/indexed-db tests/integration/indexed-db-authentication-migration.test.ts
git commit -m "feat: add account and conversion local schema"
```

---

## Task 11: Build and Hash a Bounded Guest Conversion Manifest

**Files:**

- Create: `src/domain/conversion/conversion-manifest.ts`
- Create: `src/domain/conversion/manifest-hash.ts`
- Create: `src/features/guest-conversion/conversion-package-builder.ts`
- Create: `tests/unit/conversion-manifest.test.ts`

- [ ] **Step 1: Write failing manifest tests**

Create `tests/unit/conversion-manifest.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { conversionManifestSchema } from '@/domain/conversion/conversion-manifest';

const base = {
  version: 1,
  conversionId: '11111111-1111-4111-8111-111111111111',
  guestProfileId: '22222222-2222-4222-8222-222222222222',
  installationId: '33333333-3333-4333-8333-333333333333',
  createdAt: '2026-07-29T15:00:00.000Z',
  entities: {
    habits: [], habitVersions: [], sessions: [], checkIns: [], recommendations: [],
    recoveryPlans: [], reviewCycles: [], reviewItems: [], reminderConfigs: [], settings: [],
  },
};

describe('conversionManifestSchema', () => {
  it('accepts a bounded manifest with stable source IDs', () => {
    expect(conversionManifestSchema.parse(base).version).toBe(1);
  });

  it('rejects a package above the entity limit', () => {
    const habits = Array.from({ length: 501 }, (_, index) => ({
      sourceId: crypto.randomUUID(),
      name: `Habit ${index}`,
    }));
    expect(() => conversionManifestSchema.parse({ ...base, entities: { ...base.entities, habits } })).toThrow();
  });
});
```

- [ ] **Step 2: Implement schemas and limits**

Create `src/domain/conversion/conversion-manifest.ts` with:

```ts
import { z } from 'zod';

const sourceEntitySchema = z.object({
  sourceId: z.string().uuid(),
}).passthrough();

const boundedEntities = z.array(sourceEntitySchema).max(500);

export const conversionManifestSchema = z.object({
  version: z.literal(1),
  conversionId: z.string().uuid(),
  guestProfileId: z.string().uuid(),
  installationId: z.string().uuid(),
  createdAt: z.string().datetime(),
  entities: z.object({
    habits: boundedEntities,
    habitVersions: boundedEntities,
    sessions: boundedEntities,
    checkIns: boundedEntities,
    recommendations: boundedEntities,
    recoveryPlans: boundedEntities,
    reviewCycles: boundedEntities,
    reviewItems: boundedEntities,
    reminderConfigs: boundedEntities,
    settings: boundedEntities,
  }),
});

export type ConversionManifest = z.infer<typeof conversionManifestSchema>;
```

Also enforce a serialized package limit of 5 MiB in `conversion-package-builder.ts` before hashing or submission.

- [ ] **Step 3: Implement canonical hashing**

Create `src/domain/conversion/manifest-hash.ts`:

```ts
import type { ConversionManifest } from './conversion-manifest';

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function hashConversionManifest(manifest: ConversionManifest) {
  const bytes = new TextEncoder().encode(stable(manifest));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 4: Implement the package builder**

The builder must read one consistent Dexie snapshot, exclude ephemeral query cache and Auth material, validate through `conversionManifestSchema`, calculate the hash, encrypt and save the prepared snapshot, then return:

```ts
export type PreparedConversionPackage = {
  manifest: ConversionManifest;
  manifestHash: string;
  counts: Record<keyof ConversionManifest['entities'], number>;
  serializedBytes: number;
};
```

- [ ] **Step 5: Run tests**

```bash
pnpm vitest run tests/unit/conversion-manifest.test.ts
pnpm test:conversion
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/conversion src/features/guest-conversion/conversion-package-builder.ts tests/unit/conversion-manifest.test.ts
git commit -m "feat: build bounded guest conversion package"
```

---

## Task 12: Compute Conversion Preview and Free Active-Limit Resolution

**Files:**

- Create: `src/domain/conversion/conversion-preview.ts`
- Create: `src/domain/conversion/conversion-resolution.ts`
- Create: `tests/unit/conversion-resolution.test.ts`

- [ ] **Step 1: Write failing resolution tests**

Create `tests/unit/conversion-resolution.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveActiveHabits } from '@/domain/conversion/conversion-resolution';

const cloud = ['cloud-1', 'cloud-2', 'cloud-3', 'cloud-4'];
const guest = ['guest-1', 'guest-2', 'guest-3'];

describe('resolveActiveHabits', () => {
  it('requires an explicit selection when merged active habits exceed five', () => {
    expect(() => resolveActiveHabits({ cloudActiveIds: cloud, guestActiveIds: guest })).toThrow(
      'active_selection_required',
    );
  });

  it('keeps five selected active and imports the remainder paused', () => {
    const result = resolveActiveHabits({
      cloudActiveIds: cloud,
      guestActiveIds: guest,
      selectedActiveIds: ['cloud-1', 'cloud-2', 'cloud-3', 'guest-1', 'guest-2'],
    });
    expect(result.activeIds).toHaveLength(5);
    expect(result.pausedIds).toEqual(['cloud-4', 'guest-3']);
  });
});
```

- [ ] **Step 2: Implement the resolution policy**

Create `src/domain/conversion/conversion-resolution.ts`:

```ts
const FREE_ACTIVE_LIMIT = 5;

export function resolveActiveHabits(input: {
  cloudActiveIds: string[];
  guestActiveIds: string[];
  selectedActiveIds?: string[];
}) {
  const all = [...new Set([...input.cloudActiveIds, ...input.guestActiveIds])];
  if (all.length <= FREE_ACTIVE_LIMIT) return { activeIds: all, pausedIds: [] };

  if (!input.selectedActiveIds) throw new Error('active_selection_required');
  const selected = [...new Set(input.selectedActiveIds)];
  if (selected.length !== FREE_ACTIVE_LIMIT || selected.some((id) => !all.includes(id))) {
    throw new Error('invalid_active_selection');
  }

  return {
    activeIds: selected,
    pausedIds: all.filter((id) => !selected.includes(id)),
  };
}
```

- [ ] **Step 3: Implement preview contracts**

`conversion-preview.ts` must return:

```ts
export type ConversionPreview = {
  guestCounts: Record<string, number>;
  cloudCounts: Record<string, number>;
  exactSourceDuplicates: Array<{ entityType: string; sourceId: string }>;
  nameMatchesForInformationOnly: Array<{ guestHabitId: string; cloudHabitId: string; name: string }>;
  activeLimit: { limit: 5; combinedActiveCount: number; selectionRequired: boolean };
  conflicts: Array<{ type: 'concurrent_version' | 'deleted_remote' | 'invalid_reference'; entityId: string }>;
};
```

Name matches are informational only and must never trigger automatic merging.

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/unit/conversion-resolution.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/conversion tests/unit/conversion-resolution.test.ts
git commit -m "feat: preview conversion and resolve active limits"
```

---

## Task 13: Add Transactional and Idempotent Conversion Storage

**Files:**

- Create: `supabase/migrations/20260729041000_guest_conversion_tables.sql`
- Create: `supabase/migrations/20260729042000_guest_conversion_function.sql`
- Create: `supabase/tests/00100_guest_conversion.test.sql`
- Regenerate: `src/types/supabase.ts`

- [ ] **Step 1: Write pgTAP conversion cases**

Cover these cases in `00100_guest_conversion.test.sql`:

- unauthenticated conversion is rejected;
- a valid conversion creates one conversion row and source mappings;
- replaying the same `conversion_id` and hash returns the original result;
- replaying the same ID with a different hash is rejected;
- one user cannot read another user’s conversion record;
- name equality does not overwrite an existing habit;
- selected active habits are capped at five;
- non-selected imported active habits are paused without deleting history;
- invalid parent references roll back the whole transaction.

- [ ] **Step 2: Create conversion tables and RLS**

The table migration must define:

```sql
create table public.guest_conversions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_profile_id uuid not null,
  installation_id uuid not null,
  manifest_hash text not null check (manifest_hash ~ '^[0-9a-f]{64}$'),
  status text not null check (status in ('committed', 'verified')),
  result jsonb not null,
  committed_at timestamptz not null default now(),
  verified_at timestamptz,
  unique (user_id, guest_profile_id, manifest_hash)
);

create table public.guest_conversion_mappings (
  conversion_id uuid not null references public.guest_conversions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  source_id uuid not null,
  target_id uuid not null,
  primary key (conversion_id, entity_type, source_id)
);
```

Enable RLS and permit users to read only their own rows. Inserts occur through the conversion function, not direct browser writes.

- [ ] **Step 3: Implement the conversion function**

Create `public.commit_guest_conversion` as `security invoker`, require `auth.uid()`, validate manifest version/hash/size/counts, lock the conversion ID, return the stored result for an identical replay, reject hash mismatch, insert records in dependency order, preserve stable source mappings, apply the explicit active selection, and write the result in the same transaction.

The result JSON must contain:

```json
{
  "conversionId": "uuid",
  "manifestHash": "64-character-hex",
  "mappingCount": 0,
  "activeHabitIds": [],
  "pausedHabitIds": [],
  "committedAt": "ISO-8601"
}
```

All imported domain rows must use the authenticated user ID regardless of any owner value supplied in the browser manifest.

- [ ] **Step 4: Run database tests and regenerate types**

```bash
pnpm supabase db reset
pnpm test:db -- 00100_guest_conversion.test.sql
pnpm supabase gen types typescript --local > src/types/supabase.ts
pnpm typecheck
```

Expected: PASS with transaction rollback and idempotent replay proven.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260729041000_guest_conversion_tables.sql supabase/migrations/20260729042000_guest_conversion_function.sql supabase/tests/00100_guest_conversion.test.sql src/types/supabase.ts
git commit -m "feat: commit guest conversion transactionally"
```

---

## Task 14: Implement Conversion Preview and Commit APIs

**Files:**

- Create: `src/app/api/conversion/preview/route.ts`
- Create: `src/app/api/conversion/commit/route.ts`
- Create: `src/features/guest-conversion/conversion-command-service.ts`
- Create: `tests/integration/conversion-command-service.test.ts`

- [ ] **Step 1: Write failing command-service tests**

Test that the service:

- requires an authenticated user;
- validates the manifest and hash;
- rejects a server-recomputed hash mismatch;
- returns `active_selection_required` before commit;
- maps an identical retry to the original conversion result;
- never deletes or marks the local source retired during the HTTP request.

- [ ] **Step 2: Implement the command service**

Create an input schema:

```ts
export const conversionCommitInputSchema = z.object({
  manifest: conversionManifestSchema,
  manifestHash: z.string().regex(/^[0-9a-f]{64}$/),
  selectedActiveIds: z.array(z.string().uuid()).max(5),
});
```

The service must recompute the hash, call `commit_guest_conversion`, normalize PostgreSQL errors to stable codes, and return the server result without changing IndexedDB.

- [ ] **Step 3: Implement authenticated route handlers**

Both routes must:

1. obtain the server Supabase client;
2. call `auth.getUser()`;
3. return `401` when no account is established;
4. cap request body size before JSON parsing;
5. return structured safe errors;
6. set `Cache-Control: no-store`.

Use this error shape:

```ts
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};
```

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/integration/conversion-command-service.test.ts
pnpm test:conversion
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/conversion src/features/guest-conversion/conversion-command-service.ts tests/integration/conversion-command-service.test.ts
git commit -m "feat: expose authenticated conversion commands"
```

---

## Task 15: Build the Guest Transfer Review and Durable Acknowledgement Flow

**Files:**

- Create: `src/app/(application)/account-transfer/page.tsx`
- Create: `src/features/guest-conversion/components/conversion-review.tsx`
- Create: `src/features/guest-conversion/components/active-limit-resolution.tsx`
- Create: `src/features/guest-conversion/conversion-verification.ts`
- Create: `tests/component/conversion-review.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Create tests asserting that the review:

- lists Guest and cloud counts;
- explains that local source data remains until verification;
- shows name matches as non-destructive information;
- requires selecting exactly five active habits when needed;
- offers `Transfer`, `Continue without transfer`, and `Retry` in appropriate states;
- does not display cloud-backup success before verification.

- [ ] **Step 2: Implement state model**

```ts
export type ConversionUiState =
  | { status: 'preparing' }
  | { status: 'review'; preview: ConversionPreview }
  | { status: 'submitting'; preview: ConversionPreview }
  | { status: 'committed'; conversionId: string }
  | { status: 'verifying'; conversionId: string }
  | { status: 'verified'; conversionId: string }
  | { status: 'failed'; stage: 'prepare' | 'preview' | 'commit' | 'verify'; code: string };
```

- [ ] **Step 3: Implement local verification**

`conversion-verification.ts` must:

1. pull all target IDs returned by the server mapping;
2. validate entity counts and ownership in the local account cache;
3. persist source mappings in one Dexie transaction;
4. change the snapshot from `committed` to `verified`;
5. rebind cached account-compatible rows to the account owner where required;
6. retain the encrypted Guest snapshot for a seven-day recovery window;
7. mark the live Guest profile retired only after successful verification.

If verification fails, preserve the Guest profile and show Retry. Never resubmit with a new conversion ID unless the manifest itself changed.

- [ ] **Step 4: Implement the page and responsive components**

Use the Plan 02 design system and the UI-SPEC operational states. Desktop uses the application content column and a sticky summary panel. Mobile uses one linear flow with a bottom action bar. Do not use red for ordinary merge conflicts or paused imported habits.

- [ ] **Step 5: Run component tests**

```bash
pnpm vitest run tests/component/conversion-review.test.tsx
pnpm test:a11y
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(application)/account-transfer' src/features/guest-conversion tests/component/conversion-review.test.tsx
git commit -m "feat: review and verify guest data transfer"
```

---

## Task 16: Implement Incremental Pull Synchronization and Account Cache Bootstrap

**Files:**

- Create: `supabase/migrations/20260729043000_incremental_sync_function.sql`
- Create: `supabase/tests/00110_incremental_sync.test.sql`
- Create: `src/app/api/sync/pull/route.ts`
- Create: `src/features/synchronization/account-cache-bootstrap.ts`
- Create: `src/features/synchronization/pull-sync-service.ts`
- Create: `tests/integration/pull-sync-service.test.ts`

- [ ] **Step 1: Write database synchronization tests**

The pgTAP test must prove:

- only the authenticated user’s changed rows are returned;
- the first request from a null cursor returns the initial authorized snapshot;
- a later cursor returns only newer revisions and tombstones;
- the cursor advances monotonically;
- another user cannot use a cursor to read the first user’s rows.

- [ ] **Step 2: Implement the incremental sync function**

Create `public.pull_account_changes(p_cursor bigint, p_limit integer)` returning:

```sql
returns table (
  next_cursor bigint,
  has_more boolean,
  changes jsonb
)
```

Limit `p_limit` to 1–500. Include owner-scoped habits, versions, sessions, check-ins, lifecycle events, Recovery plans, review records, reminder configurations, and tombstones. Order by the shared monotonic change sequence and stable row identity.

- [ ] **Step 3: Implement the authenticated pull route**

The route validates cursor and limit, requires `auth.getUser()`, calls the function, returns `Cache-Control: no-store`, and never accepts an owner ID from the browser.

- [ ] **Step 4: Implement transactional cache application**

`pull-sync-service.ts` must:

```ts
export type PullPage = {
  nextCursor: number;
  hasMore: boolean;
  changes: Array<{
    entityType: string;
    entityId: string;
    revision: number;
    deletedAt: string | null;
    payload: unknown;
  }>;
};
```

For each page, validate records, apply them in one Dexie transaction, retain blocked local operations as conflicts instead of overwriting them, and advance `sync_metadata.cursor` only after the transaction commits.

- [ ] **Step 5: Implement account cache bootstrap**

On authenticated startup:

1. verify queue ownership;
2. initialize the account cache identity;
3. load cached Today immediately;
4. start pull synchronization;
5. process acknowledged pending operations;
6. invalidate affected TanStack Query keys;
7. publish a BroadcastChannel account-cache update.

- [ ] **Step 6: Run tests**

```bash
pnpm supabase db reset
pnpm test:db -- 00110_incremental_sync.test.sql
pnpm vitest run tests/integration/pull-sync-service.test.ts
pnpm test:account-sync
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260729043000_incremental_sync_function.sql supabase/tests/00110_incremental_sync.test.sql src/app/api/sync src/features/synchronization tests/integration/pull-sync-service.test.ts
git commit -m "feat: synchronize account cache incrementally"
```

---

## Task 17: Implement Safe Sign-Out and Local Cache Policy

**Files:**

- Create: `src/features/authentication/sign-out-service.ts`
- Create: `src/features/authentication/components/sign-out-dialog.tsx`
- Create: `tests/integration/sign-out-cache-policy.test.ts`

- [ ] **Step 1: Write failing sign-out tests**

Test these guarantees:

- `auth.signOut()` is called;
- access and refresh cookies are removed by Supabase;
- pending account operations are blocked, not reassigned;
- cached account product rows remain encrypted and owner-scoped;
- Auth tokens are absent from Dexie and localStorage;
- another account cannot open the prior account cache as its own;
- explicit `Remove local account data` requires a destructive confirmation and does not affect cloud records.

- [ ] **Step 2: Implement the sign-out service**

```ts
export async function signOutSafely(input: {
  supabase: Pick<SupabaseClient, 'auth'>;
  database: AppDatabase;
  userId: string;
  now: string;
}) {
  await input.database.transaction('rw', input.database.pendingOperations, input.database.localAccountIdentities, async () => {
    await input.database.pendingOperations
      .where('ownerId')
      .equals(input.userId)
      .modify({ status: 'blocked', lastErrorCode: 'signed_out' });
    await input.database.localAccountIdentities.update(input.userId, { lastAuthenticatedAt: input.now });
  });

  const { error } = await input.supabase.auth.signOut();
  if (error) throw new Error('sign_out_failed');
}
```

Do not clear the whole database in this function.

- [ ] **Step 3: Implement explicit local-data removal**

The destructive action must delete only rows belonging to the selected local account identity, its query cache, source mappings, conversion snapshots after the recovery window, and blocked pending operations. It must never call a cloud delete endpoint.

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run tests/integration/sign-out-cache-policy.test.ts
pnpm test:account-sync
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/authentication tests/integration/sign-out-cache-policy.test.ts
git commit -m "feat: sign out without losing cached progress"
```

---

## Task 18: Add End-to-End Authentication, Conversion, and Cross-Device Coverage

**Files:**

- Create: `tests/e2e/authentication.spec.ts`
- Create: `tests/e2e/account-conversion.spec.ts`
- Create: `tests/e2e/cross-device-sync.spec.ts`
- Modify: existing test-only Supabase and browser helpers

- [ ] **Step 1: Add deterministic authentication fixtures**

Create test-only helpers that:

- create a local Supabase user through server-side test setup;
- generate a valid email OTP or callback session without exposing service-role credentials to the page;
- emulate Google success, cancellation, and invalid callback in test mode;
- seed a browser installation ID;
- seed Guest IndexedDB data through the application’s public database helpers;
- delete all test data after each run.

- [ ] **Step 2: Cover authentication paths**

`authentication.spec.ts` must verify:

- explicit Google sign-in returns to the initiating route;
- email sign-in shows neutral sent confirmation;
- an expired/reused callback reaches the stable auth-error screen;
- an external `returnTo` is replaced with `/app/today`;
- account-only routes redirect while Guest-capable routes remain accessible;
- session expiry preserves a pending local check-in and resumes only for the same account.

- [ ] **Step 3: Cover Guest conversion paths**

`account-conversion.spec.ts` must verify:

- conversion into an empty account;
- conversion into an account with existing data;
- same-name habits remain separate;
- seven combined active habits require selecting five;
- the remaining two import paused with complete histories;
- simulated network failure preserves Guest data;
- retry uses the same conversion ID and does not duplicate records;
- local success is shown only after mapping verification.

- [ ] **Step 4: Cover cross-device synchronization**

`cross-device-sync.spec.ts` must use two isolated browser contexts for one account and prove:

1. browser A records a Full check-in;
2. the server acknowledges it once;
3. browser B pull-syncs the new check-in;
4. browser B edits an eligible record;
5. browser A receives the change after pull synchronization;
6. a stale conflicting edit opens the explicit conflict UI;
7. a second account cannot read either browser’s records.

- [ ] **Step 5: Run focused E2E tests**

```bash
pnpm test:e2e:auth
pnpm test:e2e:conversion
```

Expected: PASS on desktop Chromium and configured mobile-web viewport.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e tests/helpers
git commit -m "test: cover authentication conversion and account sync"
```

---

## Task 19: Run the Plan 07 Quality Gate and Record Handoff

**Files:**

- Create: `docs/implementation/verification/07-authentication-guest-conversion.md`
- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [ ] **Step 1: Run the complete focused verification set**

```bash
pnpm test:auth
pnpm test:conversion
pnpm test:account-sync
pnpm test:db
pnpm test:e2e:auth
pnpm test:e2e:conversion
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: every command exits with status 0.

- [ ] **Step 2: Run secret and client-boundary checks**

```bash
grep -R "SUPABASE_SERVICE_ROLE_KEY" src --exclude='admin.ts'
grep -R "access_token\|refresh_token" src/lib/indexed-db src/features --exclude-dir='__tests__'
```

Expected: both commands return no browser-reachable secret persistence.

- [ ] **Step 3: Run conversion safety checks**

Use the E2E and database fixtures to repeat one manifest three times. Confirm one conversion row, one mapping per source entity, and no duplicate domain history. Force a local verification failure after server commit, reload, and confirm the same snapshot resumes verification without creating a new conversion.

- [ ] **Step 4: Record verification evidence**

Create `docs/implementation/verification/07-authentication-guest-conversion.md` containing:

```markdown
# Plan 07 Verification

## Scope

Authentication, secure SSR sessions, account bootstrap, Guest conversion, account cache synchronization, session-expiry recovery, and sign-out cache policy.

## Required evidence

- focused Vitest commands and outputs;
- pgTAP command and passed test count;
- authentication, conversion, and cross-device Playwright results;
- lint, typecheck, full test, and production build results;
- open-redirect rejection evidence;
- cross-user RLS denial evidence;
- idempotent conversion replay evidence;
- Guest source preservation after forced failure;
- account queue owner-mismatch evidence.

## Result

Record the exact command outputs and commit hash produced during execution.
```

- [ ] **Step 5: Update master-plan status only after evidence exists**

Mark Plan 07 verified in `docs/implementation/IMPLEMENTATION-PLAN.md` and set Plan 08 as the next executable plan.

- [ ] **Step 6: Commit the verification record**

```bash
git add docs/implementation/verification/07-authentication-guest-conversion.md docs/implementation/IMPLEMENTATION-PLAN.md
git commit -m "docs: verify authentication and guest conversion"
```

---

# 4. Plan 07 Definition of Done

Plan 07 is complete only when all statements below are supported by fresh command output:

- [ ] Google authentication completes through a validated callback and safe return path.
- [ ] Email OTP or magic-link authentication uses neutral account-existence messaging.
- [ ] External, malformed, callback, and API return paths are rejected.
- [ ] Browser, server, and privileged Supabase clients are separated.
- [ ] `proxy.ts` refreshes sessions and performs only lightweight request gating.
- [ ] Guest-capable routes remain available without an account.
- [ ] Account-only routes require authentication.
- [ ] Every account profile and installation is owner-scoped by RLS.
- [ ] Session expiry preserves unsynchronized local work.
- [ ] Pending operations synchronize only when the authenticated user matches the queue owner.
- [ ] Dexie version 6 upgrades without losing version 5 records.
- [ ] Guest conversion manifests are bounded, validated, canonicalized, and hashed.
- [ ] A conversion retry with the same ID and hash creates no duplicates.
- [ ] A conversion ID replay with a different hash is rejected.
- [ ] Existing cloud data is never overwritten merely because names match.
- [ ] Check-in and lifecycle histories are not silently discarded.
- [ ] Free accounts never exceed five active habits.
- [ ] Excess active habits require explicit selection and import non-selected histories paused.
- [ ] Guest source data remains intact through preparation, preview, commit failure, and local verification failure.
- [ ] The UI claims cloud backup only after server commit and local verification.
- [ ] Pull synchronization applies account changes transactionally and advances the cursor only after success.
- [ ] Two browsers for one account synchronize acknowledged changes.
- [ ] Cross-user reads and writes fail under RLS.
- [ ] Sign-out removes the session without destructive cache erasure.
- [ ] No Auth token or service-role secret is persisted in browser storage.
- [ ] Desktop and mobile authentication and conversion flows pass accessibility checks.
- [ ] Lint, type checking, full tests, database tests, E2E tests, and production build pass.

---

# 5. Handoff to Plan 08

Plan 08 may assume the following verified contracts:

- authenticated account identity and SSR session handling;
- account profile and installation registration;
- contextual sign-in entry points;
- idempotent Guest-to-account conversion;
- Free active-habit limit of five;
- signed-in account repositories and durable local cache;
- owner-bound pending operations and session-expiry recovery;
- incremental cross-browser synchronization;
- cross-user RLS denial;
- safe sign-out behavior.

Plan 08 must build Premium Programs and Insights on server-authoritative capability checks. It must not infer Premium access from authentication state, browser storage, URL parameters, conversion status, or client-only flags.
