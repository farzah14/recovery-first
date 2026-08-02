# Web Design System and Navigation Implementation Plan

> **Execution mode:** Single-agent sequential execution.
> Use the `executing-plans` workflow. Do not create, delegate to, or dispatch subagents.
> Complete and verify one task before beginning the next task. Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** Implement the responsive website visual foundation, reusable component library, typed route model, public shell, and application navigation shell defined by the approved UI and UX specifications.

**Architecture:** The implementation uses semantic CSS custom properties as the visual source of truth, server components by default, and small client boundaries only for interactive controls and responsive navigation. Route metadata is centralized and consumed by both desktop and mobile navigation so both layouts expose the same information architecture without duplicating labels or paths.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, class-variance-authority, Radix UI primitives, Lucide React, Sonner, Vitest, React Testing Library, jest-dom, Playwright, and axe-core.

---

# 1. Execution Contract

## 1.1 Source documents

Read these repository files before editing:

1. `AGENTS.md`
2. `docs/specs/PRD.md`
3. `docs/specs/UX-FLOWS.md`
4. `docs/specs/UI-SPEC.md`
5. `docs/specs/TECHNICAL-DESIGN.md`
6. `docs/implementation/IMPLEMENTATION-PLAN.md`
7. `docs/implementation/01-web-project-foundation.md`
8. `docs/implementation/02-web-design-system-navigation.md`

Use this authority order for Plan 02 conflicts:

1. `AGENTS.md` for permanent repository execution rules.
2. `docs/specs/PRD.md` for product requirements.
3. `docs/specs/UX-FLOWS.md` for routes and interaction outcomes.
4. `docs/specs/UI-SPEC.md` for visual, responsive, and accessibility requirements.
5. `docs/specs/TECHNICAL-DESIGN.md` for runtime boundaries.
6. `docs/implementation/IMPLEMENTATION-PLAN.md` for phase scope.
7. This file for task-level execution.

Do not silently resolve conflicting instructions. Stop the affected task and report both instructions, their impact, and the smallest safe correction.

## 1.2 Fixed identifiers

| Item | Value |
|---|---|
| Product name | `Recovery First` |
| Public home | `/` |
| Application root | `/app` |
| Default application route | `/app/today` |
| Desktop navigation breakpoint | `1024px` |
| Primary mobile reference frame | `390 × 844` |
| Primary tablet reference frame | `834 × 1112` |
| Primary laptop reference frame | `1280 × 800` |
| Primary desktop reference frame | `1440 × 1024` |
| Primary wide reference frame | `1728 × 1117` |
| Default locale | `en-US` |
| Package manager | `pnpm` |

## 1.3 Scope boundary

This plan implements visual and navigation infrastructure only. It does **not** implement:

- habit, check-in, Recovery, Weekly Review, or Insights business behavior;
- Guest IndexedDB persistence;
- Supabase product tables or RLS policies;
- authentication sessions or OAuth callbacks;
- real reminders or notification permission requests;
- billing checkout or entitlement verification;
- production analytics or error-provider initialization;
- production deployment.

Placeholder pages must state that their feature content is not connected. They must not include fabricated user history, generated streaks, fake subscription status, or mock records that could be mistaken for implemented behavior.

## 1.4 Plan 01 prerequisite gate

Before Task 1, run:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm test:e2e
pnpm check:repository
git status --short
```

Expected:

- every command exits with status `0`;
- the existing Foundation unit, component, route, and browser tests pass;
- production build passes;
- repository checks pass;
- `git status --short` is empty.

If this gate fails, repair Plan 01 under its scope before beginning Plan 02.

---

# 2. Planned Repository Structure

Plan 02 adds or completes this structure:

```text
src/
|-- app/
|   |-- (app)/
|   |   `-- app/
|   |       |-- error.tsx
|   |       |-- habits/page.tsx
|   |       |-- insights/page.tsx
|   |       |-- layout.tsx
|   |       |-- loading.tsx
|   |       |-- page.tsx
|   |       |-- reminders/page.tsx
|   |       |-- review/page.tsx
|   |       |-- settings/page.tsx
|   |       `-- today/page.tsx
|   |-- (public)/
|   |   |-- features/page.tsx
|   |   |-- help/page.tsx
|   |   |-- how-it-works/page.tsx
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   |-- pricing/page.tsx
|   |   |-- privacy/page.tsx
|   |   |-- status/page.tsx
|   |   `-- terms/page.tsx
|   |-- auth/
|   |   `-- sign-in/page.tsx
|   |-- globals.css
|   |-- layout.tsx
|   |-- not-found.tsx
|   `-- error.tsx
|-- components/
|   |-- data-display/
|   |   |-- status-badge.tsx
|   |   `-- progress-ring.tsx
|   |-- feedback/
|   |   |-- app-banner.tsx
|   |   |-- empty-state.tsx
|   |   |-- locked-state.tsx
|   |   |-- offline-state.tsx
|   |   |-- permission-state.tsx
|   |   |-- system-error-state.tsx
|   |   `-- decision-required-state.tsx
|   |-- forms/
|   |   |-- checkbox-field.tsx
|   |   |-- input-field.tsx
|   |   |-- radio-group-field.tsx
|   |   |-- select-field.tsx
|   |   |-- switch-field.tsx
|   |   `-- textarea-field.tsx
|   |-- layout/
|   |   |-- app-shell.tsx
|   |   |-- content-container.tsx
|   |   |-- page-header.tsx
|   |   |-- public-footer.tsx
|   |   |-- public-header.tsx
|   |   `-- section.tsx
|   |-- navigation/
|   |   |-- app-sidebar.tsx
|   |   |-- mobile-bottom-navigation.tsx
|   |   |-- mobile-more-drawer.tsx
|   |   |-- profile-menu-placeholder.tsx
|   |   `-- top-bar.tsx
|   `-- ui/
|       |-- alert.tsx
|       |-- badge.tsx
|       |-- button.tsx
|       |-- card.tsx
|       |-- checkbox.tsx
|       |-- dialog.tsx
|       |-- dropdown-menu.tsx
|       |-- icon-button.tsx
|       |-- input.tsx
|       |-- progress.tsx
|       |-- radio-group.tsx
|       |-- select.tsx
|       |-- sheet.tsx
|       |-- skeleton.tsx
|       |-- switch.tsx
|       |-- textarea.tsx
|       |-- toast.tsx
|       `-- tooltip.tsx
|-- lib/
|   |-- cn.ts
|   `-- navigation/
|       |-- route-definitions.ts
|       `-- route-metadata.ts
|-- styles/
|   `-- design-tokens.ts
`-- test-support/
    `-- render-with-providers.tsx

tests/
|-- accessibility/
|   |-- app-shell.accessibility.test.tsx
|   `-- primitives.accessibility.test.tsx
|-- component/
|   |-- button.test.tsx
|   |-- form-controls.test.tsx
|   |-- navigation.test.tsx
|   `-- system-states.test.tsx
|-- e2e/
|   |-- responsive-navigation.spec.ts
|   |-- route-placeholders.spec.ts
|   `-- visual-baselines.spec.ts
`-- unit/
    |-- design-tokens.test.ts
    `-- route-definitions.test.ts
```

---

# 3. Task Dependency Order

Execute tasks strictly in this order:

```text
Task 1  Install design-system dependencies and shared class utility
Task 2  Encode design tokens and global visual foundation
Task 3  Implement layout, typography, and utility primitives
Task 4  Implement action and navigation primitives
Task 5  Implement form-control primitives and field wrappers
Task 6  Implement data-display, feedback, overlay, and toast primitives
Task 7  Define typed route inventory and route metadata
Task 8  Implement the public website shell and public placeholder routes
Task 9  Implement the desktop and laptop application shell
Task 10 Implement mobile bottom navigation and More drawer
Task 11 Implement application placeholder routes and system-state gallery
Task 12 Add accessibility, responsive, visual-regression, and final quality gates
```

---

### Task 1: Install design-system dependencies and create the shared class utility

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `components.json`
- Create: `src/lib/cn.ts`
- Create: `tests/unit/cn.test.ts`

- [x] **Step 1: Install runtime and test dependencies**

Run:

```bash
pnpm add class-variance-authority clsx tailwind-merge lucide-react sonner @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tooltip
pnpm add -D @axe-core/playwright axe-core
```

Expected: `package.json` and `pnpm-lock.yaml` change, and pnpm exits with status `0`.

- [x] **Step 2: Create project-owned component configuration**

Create `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [x] **Step 3: Write the failing class-composition test**

Create `tests/unit/cn.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/cn';

describe('cn', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('px-2', false && 'hidden', 'px-4', ['font-medium'])).toBe(
      'px-4 font-medium',
    );
  });
});
```

- [x] **Step 4: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:unit -- tests/unit/cn.test.ts
```

Expected: FAIL because `@/lib/cn` does not exist.

- [x] **Step 5: Implement the shared class utility**

Create `src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [x] **Step 6: Verify and commit**

Run:

```bash
pnpm test:unit -- tests/unit/cn.test.ts
pnpm typecheck
pnpm lint
git add package.json pnpm-lock.yaml components.json src/lib/cn.ts tests/unit/cn.test.ts
git commit -m "build: add web design system dependencies"
```

Expected: focused test, typecheck, and lint pass before the commit is created.

---

### Task 2: Encode design tokens and the global visual foundation

**Files:**

- Create: `src/styles/design-tokens.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `tests/unit/design-tokens.test.ts`

- [x] **Step 1: Write the failing token-contract test**

Create `tests/unit/design-tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { designTokens } from '@/styles/design-tokens';

describe('design tokens', () => {
  it('locks the approved emerald and semantic status colors', () => {
    expect(designTokens.colors.emerald[500]).toBe('#288848');
    expect(designTokens.colors.neutral[50]).toBe('#F8F9F9');
    expect(designTokens.semantic.primary).toBe('#288848');
    expect(designTokens.semantic.minimum).toBe('#F59E0B');
    expect(designTokens.semantic.recovery).toBe('#8B5CF6');
    expect(designTokens.semantic.danger).toBe('#EF4444');
  });

  it('locks responsive breakpoints and accessible target sizes', () => {
    expect(designTokens.breakpoints.desktopNavigation).toBe(1024);
    expect(designTokens.sizing.pointerTarget).toBe(40);
    expect(designTokens.sizing.touchTarget).toBe(44);
    expect(designTokens.sizing.mobilePrimaryAction).toBe(48);
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:unit -- tests/unit/design-tokens.test.ts
```

Expected: FAIL because `@/styles/design-tokens` does not exist.

- [x] **Step 3: Create the TypeScript token contract**

Create `src/styles/design-tokens.ts`:

```ts
export const designTokens = {
  colors: {
    emerald: {
      50: '#F0F7F3',
      100: '#DDEFE4',
      200: '#A0C8B0',
      300: '#629176',
      400: '#309050',
      500: '#288848',
      600: '#187040',
      700: '#106838',
      800: '#106038',
      900: '#0D522F',
      950: '#0A3D24',
    },
    neutral: {
      50: '#F8F9F9',
      100: '#F0F4F3',
      150: '#EBEFEF',
      200: '#DDE5E1',
      300: '#C4CFCD',
      400: '#9FA9A4',
      500: '#7F8A84',
      600: '#68736D',
      700: '#4E5B54',
      800: '#355749',
      900: '#242A26',
      950: '#161A17',
    },
    amber: '#F59E0B',
    coral: '#EF4444',
    purple: '#8B5CF6',
    blue: '#3B82F6',
    cyan: '#38AFC7',
    gold: '#EAB308',
    brown: '#6B4937',
    white: '#FFFFFF',
  },
  semantic: {
    page: '#F8F9F9',
    surface: '#FFFFFF',
    surfaceSubtle: '#F0F4F3',
    surfaceSelected: '#F0F7F3',
    textPrimary: '#161A17',
    textSecondary: '#4E5B54',
    textMuted: '#68736D',
    textDisabled: '#9FA9A4',
    border: '#DDE5E1',
    borderStrong: '#C4CFCD',
    focus: '#106838',
    primary: '#288848',
    primaryHover: '#187040',
    primaryPressed: '#106838',
    primaryDisabled: '#A0C8B0',
    success: '#288848',
    minimum: '#F59E0B',
    skipped: '#68736D',
    unrecorded: '#7F8A84',
    recovery: '#8B5CF6',
    warning: '#B86B00',
    danger: '#EF4444',
    info: '#3B82F6',
    premium: '#EAB308',
  },
  breakpoints: {
    mobileMin: 320,
    tablet: 768,
    desktopNavigation: 1024,
    desktop: 1440,
  },
  sizing: {
    pointerTarget: 40,
    touchTarget: 44,
    mobilePrimaryAction: 48,
    sidebarExpanded: 256,
    sidebarCollapsed: 80,
    contentMaximum: 1440,
  },
  radius: {
    small: 8,
    medium: 12,
    large: 16,
    pill: 999,
  },
  motion: {
    fast: 120,
    standard: 180,
    slow: 240,
  },
} as const;
```

- [x] **Step 4: Replace the global stylesheet with semantic CSS variables and accessible base rules**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --color-emerald-50: #f0f7f3;
  --color-emerald-100: #ddefe4;
  --color-emerald-200: #a0c8b0;
  --color-emerald-300: #629176;
  --color-emerald-400: #309050;
  --color-emerald-500: #288848;
  --color-emerald-600: #187040;
  --color-emerald-700: #106838;
  --color-emerald-800: #106038;
  --color-emerald-900: #0d522f;
  --color-emerald-950: #0a3d24;
  --color-neutral-50: #f8f9f9;
  --color-neutral-100: #f0f4f3;
  --color-neutral-150: #ebefef;
  --color-neutral-200: #dde5e1;
  --color-neutral-300: #c4cfcd;
  --color-neutral-400: #9fa9a4;
  --color-neutral-500: #7f8a84;
  --color-neutral-600: #68736d;
  --color-neutral-700: #4e5b54;
  --color-neutral-800: #355749;
  --color-neutral-900: #242a26;
  --color-neutral-950: #161a17;
  --color-white: #ffffff;
  --color-amber: #f59e0b;
  --color-coral: #ef4444;
  --color-purple: #8b5cf6;
  --color-blue: #3b82f6;
  --color-cyan: #38afc7;
  --color-gold: #eab308;
  --color-brown: #6b4937;
  --color-page: var(--color-neutral-50);
  --color-surface: var(--color-white);
  --color-surface-subtle: var(--color-neutral-100);
  --color-surface-selected: var(--color-emerald-50);
  --color-text-primary: var(--color-neutral-950);
  --color-text-secondary: var(--color-neutral-700);
  --color-text-muted: var(--color-neutral-600);
  --color-text-disabled: var(--color-neutral-400);
  --color-border: var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-300);
  --color-focus: var(--color-emerald-700);
  --color-primary: var(--color-emerald-500);
  --color-primary-hover: var(--color-emerald-600);
  --color-primary-pressed: var(--color-emerald-700);
  --color-primary-disabled: var(--color-emerald-200);
  --color-success: var(--color-emerald-500);
  --color-minimum: var(--color-amber);
  --color-skipped: var(--color-neutral-600);
  --color-unrecorded: var(--color-neutral-500);
  --color-recovery: var(--color-purple);
  --color-warning: #b86b00;
  --color-danger: var(--color-coral);
  --color-info: var(--color-blue);
  --color-premium: var(--color-gold);
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --shadow-card: 0 1px 2px rgb(22 26 23 / 6%);
  --shadow-overlay: 0 16px 48px rgb(22 26 23 / 18%);
  --motion-fast: 120ms;
  --motion-standard: 180ms;
  --motion-slow: 240ms;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: var(--color-page);
  color: var(--color-text-primary);
  scroll-behavior: smooth;
}

body {
  min-height: 100dvh;
  margin: 0;
  background: var(--color-page);
  color: var(--color-text-primary);
  font-family: var(--font-sans), system-ui, sans-serif;
  text-rendering: optimizeLegibility;
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: inherit;
}

:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-focus) 70%, white);
  outline-offset: 3px;
}

::selection {
  background: var(--color-emerald-100);
  color: var(--color-emerald-950);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [x] **Step 5: Configure the application font and metadata**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Recovery First',
    template: '%s | Recovery First',
  },
  description: 'A recovery-first habit system for building sustainable routines.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [x] **Step 6: Verify tokens and commit**

Run:

```bash
pnpm test:unit -- tests/unit/design-tokens.test.ts
pnpm typecheck
pnpm lint
pnpm build
git add src/styles/design-tokens.ts src/app/globals.css src/app/layout.tsx tests/unit/design-tokens.test.ts
git commit -m "feat: encode website design tokens"
```

Expected: focused test, typecheck, lint, and production build pass.

---

### Task 3: Implement layout, typography, and utility primitives

**Files:**

- Create: `src/components/layout/content-container.tsx`
- Create: `src/components/layout/section.tsx`
- Create: `src/components/layout/page-header.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `tests/component/layout-primitives.test.tsx`

- [x] **Step 1: Write the failing component tests**

Create `tests/component/layout-primitives.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

describe('layout primitives', () => {
  it('renders a labelled page header with optional supporting text', () => {
    render(<PageHeader title="Today" description="Your scheduled habits." />);

    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
    expect(screen.getByText('Your scheduled habits.')).toBeVisible();
  });

  it('renders a card with semantic heading content', () => {
    render(
      <ContentContainer>
        <Card>
          <CardHeader>
            <CardTitle>Daily progress</CardTitle>
          </CardHeader>
          <CardContent>Not connected</CardContent>
        </Card>
      </ContentContainer>,
    );

    expect(screen.getByRole('heading', { name: 'Daily progress' })).toBeVisible();
    expect(screen.getByText('Not connected')).toBeVisible();
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:component -- tests/component/layout-primitives.test.tsx
```

Expected: FAIL because the layout and card modules do not exist.

- [x] **Step 3: Implement the content container and section primitives**

Create `src/components/layout/content-container.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function ContentContainer({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>): React.JSX.Element {
  return (
    <div className={cn('mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
```

Create `src/components/layout/section.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function Section({
  children,
  className,
  labelledBy,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
}>): React.JSX.Element {
  return (
    <section aria-labelledby={labelledBy} className={cn('py-6 sm:py-8', className)}>
      {children}
    </section>
  );
}
```

- [x] **Step 4: Implement the page header**

Create `src/components/layout/page-header.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: Readonly<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}>): React.JSX.Element {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-sm font-semibold text-[var(--color-primary)]">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
```

- [x] **Step 5: Implement card and skeleton primitives**

Create `src/components/ui/card.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('flex flex-col gap-1.5 p-5 sm:p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<'h2'>): React.JSX.Element {
  return <h2 className={cn('text-lg font-semibold text-[var(--color-text-primary)]', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<'p'>): React.JSX.Element {
  return <p className={cn('text-sm leading-6 text-[var(--color-text-secondary)]', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('flex items-center gap-3 px-5 pb-5 sm:px-6 sm:pb-6', className)} {...props} />;
}
```

Create `src/components/ui/skeleton.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-[var(--color-neutral-150)]', className)}
      {...props}
    />
  );
}
```

- [x] **Step 6: Verify and commit**

Run:

```bash
pnpm test:component -- tests/component/layout-primitives.test.tsx
pnpm typecheck
pnpm lint
git add src/components/layout src/components/ui/card.tsx src/components/ui/skeleton.tsx tests/component/layout-primitives.test.tsx
git commit -m "feat: add website layout primitives"
```

Expected: focused tests, typecheck, and lint pass.

---

### Task 4: Implement action and navigation primitives

**Files:**

- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/icon-button.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `tests/component/button.test.tsx`

- [x] **Step 1: Write the failing action-primitive tests**

Create `tests/component/button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';

describe('action primitives', () => {
  it('invokes an enabled primary button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Continue</Button>);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('requires an accessible label for an icon-only button', () => {
    render(<IconButton label="Open menu">M</IconButton>);

    expect(screen.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:component -- tests/component/button.test.tsx
```

Expected: FAIL because the button modules do not exist.

- [x] **Step 3: Implement the variant-driven button**

Create `src/components/ui/button.tsx`:

```tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition-colors duration-[var(--motion-fast)] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--color-focus)_24%,transparent)]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-pressed)]',
        secondary:
          'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]',
        ghost:
          'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]',
        danger:
          'bg-[var(--color-danger)] text-white hover:bg-[#D93636] active:bg-[#C52E2E]',
        recovery:
          'bg-[var(--color-recovery)] text-white hover:bg-[#7848E7] active:bg-[#6739D5]',
      },
      size: {
        default: 'h-10',
        touch: 'min-h-11',
        large: 'min-h-12 px-5 text-base',
        compact: 'h-9 min-h-9 px-3',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  asChild = false,
  className,
  variant,
  size,
  fullWidth,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...(!asChild ? { type } : {})}
      {...props}
    />
  );
}
```

- [x] **Step 4: Implement icon button and badge**

Create `src/components/ui/icon-button.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function IconButton({
  label,
  className,
  children,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & { label: string }): React.JSX.Element {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)] disabled:pointer-events-none disabled:opacity-55',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
```

Create `src/components/ui/badge.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      tone: {
        neutral: 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]',
        success: 'border-[var(--color-emerald-200)] bg-[var(--color-emerald-50)] text-[var(--color-emerald-800)]',
        minimum: 'border-[#F6D38A] bg-[#FFF7E6] text-[#8A5700]',
        recovery: 'border-[#D9C8FA] bg-[#F5F0FF] text-[#6840B8]',
        info: 'border-[#BED5FA] bg-[#EEF5FF] text-[#245DAF]',
        danger: 'border-[#F3B6B6] bg-[#FFF1F1] text-[#B62E2E]',
        premium: 'border-[#F0D86C] bg-[#FFF9DB] text-[#7A6200]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>): React.JSX.Element {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
```

- [x] **Step 5: Verify and commit**

Run:

```bash
pnpm test:component -- tests/component/button.test.tsx
pnpm typecheck
pnpm lint
git add src/components/ui/button.tsx src/components/ui/icon-button.tsx src/components/ui/badge.tsx tests/component/button.test.tsx
git commit -m "feat: add action primitives"
```

Expected: focused tests, typecheck, and lint pass.

---

### Task 5: Implement form-control primitives and field wrappers

**Files:**

- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/radio-group.tsx`
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/forms/input-field.tsx`
- Create: `src/components/forms/textarea-field.tsx`
- Create: `src/components/forms/checkbox-field.tsx`
- Create: `src/components/forms/radio-group-field.tsx`
- Create: `src/components/forms/switch-field.tsx`
- Create: `src/components/forms/select-field.tsx`
- Create: `tests/component/form-controls.test.tsx`

- [x] **Step 1: Write the failing form-control tests**

Create `tests/component/form-controls.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CheckboxField } from '@/components/forms/checkbox-field';
import { InputField } from '@/components/forms/input-field';
import { SwitchField } from '@/components/forms/switch-field';

describe('form controls', () => {
  it('associates an input with label, description, and error text', () => {
    render(
      <InputField
        id="habit-name"
        label="Habit name"
        description="Use a specific action."
        error="Habit name is required."
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Habit name' })).toHaveAccessibleDescription(
      'Use a specific action. Habit name is required.',
    );
    expect(screen.getByText('Habit name is required.')).toBeVisible();
  });

  it('supports keyboard-operable checkbox and switch labels', async () => {
    const user = userEvent.setup();
    render(
      <>
        <CheckboxField id="email-reminder" label="Email reminder" />
        <SwitchField id="browser-reminder" label="Browser reminder" />
      </>,
    );

    await user.click(screen.getByText('Email reminder'));
    await user.click(screen.getByText('Browser reminder'));

    expect(screen.getByRole('checkbox', { name: 'Email reminder' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Browser reminder' })).toBeChecked();
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:component -- tests/component/form-controls.test.tsx
```

Expected: FAIL because the form modules do not exist.

- [x] **Step 3: Implement the native text controls**

Create `src/components/ui/input.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>): React.JSX.Element {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] disabled:text-[var(--color-text-disabled)] aria-invalid:border-[var(--color-danger)]',
        className,
      )}
      type={type}
      {...props}
    />
  );
}
```

Create `src/components/ui/textarea.tsx`:

```tsx
import { cn } from '@/lib/cn';

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>): React.JSX.Element {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-sm leading-6 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)] aria-invalid:border-[var(--color-danger)]',
        className,
      )}
      {...props}
    />
  );
}
```

- [x] **Step 4: Implement checkbox and switch primitives**

Create `src/components/ui/checkbox.tsx`:

```tsx
'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>): React.JSX.Element {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-white data-[state=checked]:border-[var(--color-primary)] data-[state=checked]:bg-[var(--color-primary)] disabled:opacity-55',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check aria-hidden="true" className="size-4" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
```

Create `src/components/ui/switch.tsx`:

```tsx
'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/cn';

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>): React.JSX.Element {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-[var(--color-neutral-300)] p-0.5 transition-colors data-[state=checked]:bg-[var(--color-primary)] disabled:opacity-55',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
}
```

- [x] **Step 5: Implement radio group and select primitives**

Create `src/components/ui/radio-group.tsx`:

```tsx
'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/cn';

export const RadioGroup = RadioGroupPrimitive.Root;

export function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>): React.JSX.Element {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'flex size-5 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] data-[state=checked]:border-[var(--color-primary)] disabled:opacity-55',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-[var(--color-primary)]" />
    </RadioGroupPrimitive.Item>
  );
}
```

Create `src/components/ui/select.tsx`:

```tsx
'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/cn';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>): React.JSX.Element {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex min-h-11 w-full items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] disabled:opacity-55',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown aria-hidden="true" className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>): React.JSX.Element {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'z-50 min-w-[var(--radix-select-trigger-width)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-overlay)]',
          className,
        )}
        position="popper"
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>): React.JSX.Element {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex min-h-10 cursor-default items-center rounded-md py-2 pr-8 pl-3 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-selected)]',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check aria-hidden="true" className="size-4 text-[var(--color-primary)]" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
```

- [x] **Step 6: Implement accessible field wrappers**

Create `src/components/forms/input-field.tsx`:

```tsx
import { Input } from '@/components/ui/input';

export function InputField({
  id,
  label,
  description,
  error,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'id' | 'aria-describedby' | 'aria-invalid'> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
}): React.JSX.Element {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={id}>{label}</label>
      {description ? <p className="text-sm text-[var(--color-text-secondary)]" id={descriptionId}>{description}</p> : null}
      <Input aria-describedby={describedBy} aria-invalid={Boolean(error)} id={id} {...props} />
      {error ? <p className="text-sm font-medium text-[var(--color-danger)]" id={errorId}>{error}</p> : null}
    </div>
  );
}
```

Create `src/components/forms/textarea-field.tsx`:

```tsx
import { Textarea } from '@/components/ui/textarea';

export function TextareaField({
  id,
  label,
  description,
  error,
  ...props
}: Omit<React.ComponentProps<typeof Textarea>, 'id' | 'aria-describedby' | 'aria-invalid'> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
}): React.JSX.Element {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={id}>{label}</label>
      {description ? <p className="text-sm text-[var(--color-text-secondary)]" id={descriptionId}>{description}</p> : null}
      <Textarea aria-describedby={describedBy} aria-invalid={Boolean(error)} id={id} {...props} />
      {error ? <p className="text-sm font-medium text-[var(--color-danger)]" id={errorId}>{error}</p> : null}
    </div>
  );
}
```

Create `src/components/forms/checkbox-field.tsx`:

```tsx
'use client';

import { Checkbox } from '@/components/ui/checkbox';

export function CheckboxField({
  id,
  label,
  description,
}: Readonly<{ id: string; label: string; description?: string }>): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Checkbox aria-describedby={description ? `${id}-description` : undefined} id={id} />
      <div className="grid gap-1">
        <label className="cursor-pointer text-sm font-semibold" htmlFor={id}>{label}</label>
        {description ? <p className="text-sm text-[var(--color-text-secondary)]" id={`${id}-description`}>{description}</p> : null}
      </div>
    </div>
  );
}
```

Create `src/components/forms/switch-field.tsx`:

```tsx
'use client';

import { Switch } from '@/components/ui/switch';

export function SwitchField({
  id,
  label,
  description,
}: Readonly<{ id: string; label: string; description?: string }>): React.JSX.Element {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4">
      <div className="grid gap-1">
        <label className="cursor-pointer text-sm font-semibold" htmlFor={id}>{label}</label>
        {description ? <p className="text-sm text-[var(--color-text-secondary)]" id={`${id}-description`}>{description}</p> : null}
      </div>
      <Switch aria-describedby={description ? `${id}-description` : undefined} id={id} />
    </div>
  );
}
```

Create `src/components/forms/radio-group-field.tsx`:

```tsx
'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function RadioGroupField({
  label,
  name,
  options,
}: Readonly<{
  label: string;
  name: string;
  options: ReadonlyArray<{ label: string; value: string; description?: string }>;
}>): React.JSX.Element {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-semibold">{label}</legend>
      <RadioGroup aria-label={label} name={name} className="grid gap-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3" key={option.value}>
              <RadioGroupItem id={id} value={option.value} />
              <div className="grid gap-1">
                <label className="cursor-pointer text-sm font-semibold" htmlFor={id}>{option.label}</label>
                {option.description ? <p className="text-sm text-[var(--color-text-secondary)]">{option.description}</p> : null}
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
```

Create `src/components/forms/select-field.tsx`:

```tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SelectField({
  id,
  label,
  placeholder,
  options,
}: Readonly<{
  id: string;
  label: string;
  placeholder: string;
  options: ReadonlyArray<{ label: string; value: string }>;
}>): React.JSX.Element {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={id}>{label}</label>
      <Select>
        <SelectTrigger aria-label={label} id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [x] **Step 7: Verify and commit**

Run:

```bash
pnpm test:component -- tests/component/form-controls.test.tsx
pnpm typecheck
pnpm lint
git add src/components/ui src/components/forms tests/component/form-controls.test.tsx
git commit -m "feat: add accessible form controls"
```

Expected: focused tests, typecheck, and lint pass.

---

### Task 6: Implement data-display, feedback, overlay, and toast primitives

**Files:**

- Create: `src/components/ui/alert.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/toast.tsx`
- Create: `src/components/data-display/status-badge.tsx`
- Create: `src/components/data-display/progress-ring.tsx`
- Create: `src/components/feedback/app-banner.tsx`
- Create: `src/components/feedback/empty-state.tsx`
- Create: `src/components/feedback/offline-state.tsx`
- Create: `src/components/feedback/permission-state.tsx`
- Create: `src/components/feedback/system-error-state.tsx`
- Create: `src/components/feedback/locked-state.tsx`
- Create: `src/components/feedback/decision-required-state.tsx`
- Create: `tests/component/system-states.test.tsx`

- [x] **Step 1: Write the failing system-state test**

Create `tests/component/system-states.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/feedback/empty-state';
import { OfflineState } from '@/components/feedback/offline-state';
import { StatusBadge } from '@/components/data-display/status-badge';

describe('system states', () => {
  it('uses explicit text for status meaning', () => {
    render(<StatusBadge status="minimum" />);
    expect(screen.getByText('Minimum')).toBeVisible();
  });

  it('renders actionable empty and offline states', () => {
    render(
      <>
        <EmptyState actionLabel="Add a habit" description="Create your first habit." title="No habits yet" />
        <OfflineState />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Add a habit' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'You are offline' })).toBeVisible();
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:component -- tests/component/system-states.test.tsx
```

Expected: FAIL because the state components do not exist.

- [x] **Step 3: Implement status and progress primitives**

Create `src/components/data-display/status-badge.tsx`:

```tsx
import { Badge } from '@/components/ui/badge';

const statusConfiguration = {
  full: { label: 'Full', tone: 'success' },
  minimum: { label: 'Minimum', tone: 'minimum' },
  skipped: { label: 'Skipped', tone: 'neutral' },
  unrecorded: { label: 'Unrecorded', tone: 'neutral' },
  pendingSync: { label: 'Pending sync', tone: 'info' },
  syncFailed: { label: 'Retry needed', tone: 'danger' },
  recovery: { label: 'Recovery', tone: 'recovery' },
  premium: { label: 'Premium', tone: 'premium' },
} as const;

export type StatusBadgeStatus = keyof typeof statusConfiguration;

export function StatusBadge({ status }: Readonly<{ status: StatusBadgeStatus }>): React.JSX.Element {
  const configuration = statusConfiguration[status];
  return <Badge tone={configuration.tone}>{configuration.label}</Badge>;
}
```

Create `src/components/ui/progress.tsx`:

```tsx
'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/cn';

export function Progress({
  className,
  value = 0,
  label,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { label: string }): React.JSX.Element {
  const boundedValue = Math.min(100, Math.max(0, value));
  return (
    <ProgressPrimitive.Root
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-150)]', className)}
      value={boundedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-[var(--color-primary)] transition-transform duration-[var(--motion-standard)]"
        style={{ transform: `translateX(-${100 - boundedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
```

Create `src/components/data-display/progress-ring.tsx`:

```tsx
export function ProgressRing({
  value,
  label,
  size = 72,
}: Readonly<{ value: number; label: string; size?: number }>): React.JSX.Element {
  const boundedValue = Math.min(100, Math.max(0, value));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (boundedValue / 100) * circumference;

  return (
    <div className="relative inline-grid place-items-center" style={{ height: size, width: size }}>
      <svg aria-hidden="true" className="-rotate-90" height={size} viewBox="0 0 64 64" width={size}>
        <circle cx="32" cy="32" fill="none" r={radius} stroke="var(--color-neutral-150)" strokeWidth="6" />
        <circle cx="32" cy="32" fill="none" r={radius} stroke="var(--color-primary)" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="6" />
      </svg>
      <span aria-label={`${label}: ${boundedValue}%`} className="absolute text-sm font-semibold">{boundedValue}%</span>
    </div>
  );
}
```

- [x] **Step 4: Implement alert and state components**

Create `src/components/ui/alert.tsx`:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const alertVariants = cva('rounded-[var(--radius-md)] border p-4', {
  variants: {
    tone: {
      neutral: 'border-[var(--color-border)] bg-[var(--color-surface)]',
      info: 'border-[#BED5FA] bg-[#EEF5FF]',
      success: 'border-[var(--color-emerald-200)] bg-[var(--color-emerald-50)]',
      warning: 'border-[#F6D38A] bg-[#FFF7E6]',
      danger: 'border-[#F3B6B6] bg-[#FFF1F1]',
      recovery: 'border-[#D9C8FA] bg-[#F5F0FF]',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Alert({
  className,
  tone,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>): React.JSX.Element {
  return <div className={cn(alertVariants({ tone }), className)} role="status" {...props} />;
}
```

Create `src/components/feedback/empty-state.tsx`:

```tsx
import { CirclePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({
  title,
  description,
  actionLabel,
}: Readonly<{ title: string; description: string; actionLabel: string }>): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid justify-items-center gap-3 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--color-emerald-50)] text-[var(--color-primary)]">
          <CirclePlus aria-hidden="true" className="size-6" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
        <Button className="mt-2">{actionLabel}</Button>
      </CardContent>
    </Card>
  );
}
```

Create `src/components/feedback/offline-state.tsx`:

```tsx
import { CloudOff } from 'lucide-react';

import { Alert } from '@/components/ui/alert';

export function OfflineState(): React.JSX.Element {
  return (
    <Alert tone="warning">
      <div className="flex gap-3">
        <CloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">You are offline</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">Cached pages remain available. Changes that support offline entry will show a pending-sync label.</p>
        </div>
      </div>
    </Alert>
  );
}
```

Create `src/components/feedback/permission-state.tsx`:

```tsx
import { BellOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PermissionState(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid gap-3 py-6">
        <BellOff aria-hidden="true" className="size-6 text-[var(--color-warning)]" />
        <h2 className="text-lg font-semibold">Browser reminders are not enabled</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Habit tracking remains available. Enable reminders only when you are ready.</p>
        <Button className="w-fit" variant="secondary">Review reminder options</Button>
      </CardContent>
    </Card>
  );
}
```

Create `src/components/feedback/system-error-state.tsx`:

```tsx
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function SystemErrorState(): React.JSX.Element {
  return (
    <div className="grid min-h-64 place-items-center rounded-[var(--radius-lg)] border border-[#F3B6B6] bg-[#FFF1F1] p-6 text-center">
      <div className="grid max-w-md justify-items-center gap-3">
        <TriangleAlert aria-hidden="true" className="size-7 text-[var(--color-danger)]" />
        <h2 className="text-lg font-semibold">This section could not load</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Your existing data has not been changed. Retry the request or return to Today.</p>
        <Button variant="secondary">Retry</Button>
      </div>
    </div>
  );
}
```

Create `src/components/feedback/locked-state.tsx`:

```tsx
import { LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function LockedState(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid justify-items-start gap-3 py-6">
        <LockKeyhole aria-hidden="true" className="size-6 text-[var(--color-premium)]" />
        <h2 className="text-lg font-semibold">Premium feature</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Review the plan details before choosing whether to upgrade.</p>
        <Button variant="secondary">Compare plans</Button>
      </CardContent>
    </Card>
  );
}
```

Create `src/components/feedback/decision-required-state.tsx`:

```tsx
import { CircleHelp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function DecisionRequiredState(): React.JSX.Element {
  return (
    <Card>
      <CardContent className="grid gap-3 py-6">
        <CircleHelp aria-hidden="true" className="size-6 text-[var(--color-recovery)]" />
        <h2 className="text-lg font-semibold">Your decision is needed</h2>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">No recommendation will be applied until you review and approve it.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="recovery">Review recommendation</Button>
          <Button variant="ghost">Not now</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

Create `src/components/feedback/app-banner.tsx`:

```tsx
import { Alert } from '@/components/ui/alert';

export function AppBanner({
  title,
  description,
  tone = 'info',
}: Readonly<{
  title: string;
  description: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'recovery';
}>): React.JSX.Element {
  return (
    <Alert tone={tone}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
    </Alert>
  );
}
```

- [x] **Step 5: Implement overlay, menu, tooltip, and toast wrappers**

Create `src/components/ui/dialog.tsx`:

```tsx
'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>): React.JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content
        className={cn('fixed top-1/2 left-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-overlay)]', className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close aria-label="Close dialog" className="absolute top-3 right-3 grid size-10 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-subtle)]">
          <X aria-hidden="true" className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

Create `src/components/ui/sheet.tsx`:

```tsx
'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: 'right' | 'bottom' }): React.JSX.Element {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-overlay)]',
          side === 'right' && 'inset-y-0 right-0 w-[min(92vw,24rem)]',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[var(--radius-lg)]',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close aria-label="Close drawer" className="absolute top-3 right-3 grid size-10 place-items-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-subtle)]">
          <X aria-hidden="true" className="size-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

Create `src/components/ui/dropdown-menu.tsx`:

```tsx
'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { cn } from '@/lib/cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>): React.JSX.Element {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn('z-50 min-w-52 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-overlay)]', className)}
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>): React.JSX.Element {
  return <DropdownMenuPrimitive.Item className={cn('flex min-h-10 cursor-default items-center rounded-md px-3 text-sm outline-none data-[highlighted]:bg-[var(--color-surface-selected)]', className)} {...props} />;
}
```

Create `src/components/ui/tooltip.tsx`:

```tsx
'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>): React.JSX.Element {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content className="z-50 rounded-md bg-[var(--color-neutral-950)] px-2.5 py-1.5 text-xs text-white shadow-md" sideOffset={6} {...props}>
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
```

Create `src/components/ui/toast.tsx`:

```tsx
'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster(): React.JSX.Element {
  return <SonnerToaster closeButton position="bottom-right" richColors />;
}
```

- [x] **Step 6: Verify and commit**

Run:

```bash
pnpm test:component -- tests/component/system-states.test.tsx
pnpm typecheck
pnpm lint
git add src/components/data-display src/components/feedback src/components/ui tests/component/system-states.test.tsx
git commit -m "feat: add system feedback and overlay primitives"
```

Expected: focused tests, typecheck, and lint pass.

---

### Task 7: Define the typed route inventory and metadata

**Files:**

- Create: `src/lib/navigation/route-definitions.ts`
- Create: `src/lib/navigation/route-metadata.ts`
- Create: `tests/unit/route-definitions.test.ts`

- [x] **Step 1: Write the failing route-contract tests**

Create `tests/unit/route-definitions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { applicationNavigation, publicNavigation, routes } from '@/lib/navigation/route-definitions';

const unique = <T,>(values: readonly T[]): boolean => new Set(values).size === values.length;

describe('route definitions', () => {
  it('defines unique public and application paths', () => {
    const paths = Object.values(routes);
    expect(unique(paths)).toBe(true);
  });

  it('exposes the required public navigation model', () => {
    expect(publicNavigation.map((item) => item.label)).toEqual([
      'Features',
      'How It Works',
      'Pricing',
      'Help',
    ]);
  });

  it('keeps desktop and mobile application destinations in one model', () => {
    expect(applicationNavigation.map((item) => item.label)).toEqual([
      'Today',
      'Habits',
      'Review',
      'Insights',
      'Reminders',
      'Settings',
    ]);
    expect(applicationNavigation.filter((item) => item.mobilePrimary).map((item) => item.label)).toEqual([
      'Today',
      'Habits',
      'Review',
      'Insights',
    ]);
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:unit -- tests/unit/route-definitions.test.ts
```

Expected: FAIL because the navigation modules do not exist.

- [x] **Step 3: Implement typed route definitions**

Create `src/lib/navigation/route-definitions.ts`:

```ts
import {
  Bell,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardCheck,
  House,
  ListChecks,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export const routes = {
  home: '/',
  features: '/features',
  howItWorks: '/how-it-works',
  pricing: '/pricing',
  help: '/help',
  status: '/status',
  privacy: '/privacy',
  terms: '/terms',
  signIn: '/auth/sign-in',
  app: '/app',
  today: '/app/today',
  habits: '/app/habits',
  review: '/app/review',
  insights: '/app/insights',
  reminders: '/app/reminders',
  settings: '/app/settings',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export type NavigationItem = Readonly<{
  label: string;
  href: AppRoute;
  icon: LucideIcon;
  mobilePrimary: boolean;
}>;

export const publicNavigation = [
  { label: 'Features', href: routes.features },
  { label: 'How It Works', href: routes.howItWorks },
  { label: 'Pricing', href: routes.pricing },
  { label: 'Help', href: routes.help },
] as const;

export const applicationNavigation: readonly NavigationItem[] = [
  { label: 'Today', href: routes.today, icon: House, mobilePrimary: true },
  { label: 'Habits', href: routes.habits, icon: ListChecks, mobilePrimary: true },
  { label: 'Review', href: routes.review, icon: ClipboardCheck, mobilePrimary: true },
  { label: 'Insights', href: routes.insights, icon: ChartNoAxesCombined, mobilePrimary: true },
  { label: 'Reminders', href: routes.reminders, icon: Bell, mobilePrimary: false },
  { label: 'Settings', href: routes.settings, icon: Settings, mobilePrimary: false },
];

export const moreNavigation = [
  ...applicationNavigation.filter((item) => !item.mobilePrimary),
  { label: 'Help', href: routes.help, icon: CircleHelp, mobilePrimary: false },
] as const;
```

- [x] **Step 4: Implement route metadata**

Create `src/lib/navigation/route-metadata.ts`:

```ts
import type { Metadata } from 'next';

import { routes, type AppRoute } from '@/lib/navigation/route-definitions';

const metadataByRoute: Partial<Record<AppRoute, Metadata>> = {
  [routes.home]: { title: 'Recovery First' },
  [routes.features]: { title: 'Features' },
  [routes.howItWorks]: { title: 'How It Works' },
  [routes.pricing]: { title: 'Pricing' },
  [routes.help]: { title: 'Help' },
  [routes.status]: { title: 'Status' },
  [routes.privacy]: { title: 'Privacy' },
  [routes.terms]: { title: 'Terms' },
  [routes.signIn]: { title: 'Sign In' },
  [routes.today]: { title: 'Today' },
  [routes.habits]: { title: 'Habits' },
  [routes.review]: { title: 'Review' },
  [routes.insights]: { title: 'Insights' },
  [routes.reminders]: { title: 'Reminders' },
  [routes.settings]: { title: 'Settings' },
};

export function metadataFor(route: AppRoute): Metadata {
  return metadataByRoute[route] ?? { title: 'Recovery First' };
}
```

- [x] **Step 5: Verify and commit**

Run:

```bash
pnpm test:unit -- tests/unit/route-definitions.test.ts
pnpm typecheck
pnpm lint
git add src/lib/navigation tests/unit/route-definitions.test.ts
git commit -m "feat: define typed website routes"
```

Expected: focused tests, typecheck, and lint pass.

---

### Task 8: Implement the public website shell and public placeholder routes

**Files:**

- Create: `src/components/layout/public-header.tsx`
- Create: `src/components/layout/public-footer.tsx`
- Create: `src/app/(public)/layout.tsx`
- Replace: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/features/page.tsx`
- Create: `src/app/(public)/how-it-works/page.tsx`
- Create: `src/app/(public)/pricing/page.tsx`
- Create: `src/app/(public)/help/page.tsx`
- Create: `src/app/(public)/status/page.tsx`
- Create: `src/app/(public)/privacy/page.tsx`
- Create: `src/app/(public)/terms/page.tsx`
- Create: `src/app/auth/sign-in/page.tsx`
- Create: `tests/component/public-shell.test.tsx`

- [x] **Step 1: Write the failing public-shell test**

Create `tests/component/public-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicFooter } from '@/components/layout/public-footer';
import { PublicHeader } from '@/components/layout/public-header';

describe('public shell', () => {
  it('exposes public navigation and entry actions', () => {
    render(
      <>
        <PublicHeader />
        <PublicFooter />
      </>,
    );

    expect(screen.getByRole('link', { name: 'Recovery First' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '/features');
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/auth/sign-in');
    expect(screen.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/app/today');
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:component -- tests/component/public-shell.test.tsx
```

Expected: FAIL because the public shell modules do not exist.

- [x] **Step 3: Implement public header and footer**

Create `src/components/layout/public-header.tsx`:

```tsx
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ContentContainer } from '@/components/layout/content-container';
import { publicNavigation, routes } from '@/lib/navigation/route-definitions';

export function PublicHeader(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] backdrop-blur">
      <ContentContainer className="flex min-h-16 items-center justify-between gap-4">
        <Link className="font-semibold text-[var(--color-emerald-800)]" href={routes.home}>Recovery First</Link>
        <nav aria-label="Public navigation" className="hidden items-center gap-1 md:flex">
          {publicNavigation.map((item) => (
            <Button asChild key={item.href} variant="ghost"><Link href={item.href}>{item.label}</Link></Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex" variant="ghost"><Link href={routes.signIn}>Sign In</Link></Button>
          <Button asChild size="compact"><Link href={routes.today}>Start Free</Link></Button>
        </div>
      </ContentContainer>
    </header>
  );
}
```

Create `src/components/layout/public-footer.tsx`:

```tsx
import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { routes } from '@/lib/navigation/route-definitions';

export function PublicFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <ContentContainer className="grid gap-6 py-8 sm:grid-cols-2 sm:items-center">
        <div>
          <p className="font-semibold text-[var(--color-emerald-800)]">Recovery First</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Sustainable habits without punishment-first design.</p>
        </div>
        <nav aria-label="Legal and support" className="flex flex-wrap gap-x-5 gap-y-3 text-sm sm:justify-end">
          <Link href={routes.help}>Help</Link>
          <Link href={routes.status}>Status</Link>
          <Link href={routes.privacy}>Privacy</Link>
          <Link href={routes.terms}>Terms</Link>
        </nav>
      </ContentContainer>
    </footer>
  );
}
```

- [x] **Step 4: Implement public layout and reusable placeholder content**

Create `src/app/(public)/layout.tsx`:

```tsx
import { PublicFooter } from '@/components/layout/public-footer';
import { PublicHeader } from '@/components/layout/public-header';

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
```

Create `src/components/layout/public-placeholder.tsx`:

```tsx
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export function PublicPlaceholder({ title, description }: Readonly<{ title: string; description: string }>): React.JSX.Element {
  return (
    <ContentContainer className="py-12 sm:py-16">
      <PageHeader description={description} title={title} />
      <Card className="mt-8">
        <CardContent className="py-8 text-sm leading-6 text-[var(--color-text-secondary)]">
          This page establishes the approved route and responsive shell. Product content is not connected in Plan 02.
        </CardContent>
      </Card>
    </ContentContainer>
  );
}
```

- [x] **Step 5: Implement the landing page**

Replace `src/app/(public)/page.tsx` with:

```tsx
import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { routes } from '@/lib/navigation/route-definitions';

export default function HomePage(): React.JSX.Element {
  return (
    <>
      <section className="border-b border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-emerald-50),var(--color-page))]">
        <ContentContainer className="grid gap-8 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">Recovery-first habit building</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Build habits that can recover when life changes.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">Plan a full action, define a realistic minimum, and continue without punishment-first streak pressure.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="large"><Link href={routes.today}>Start Free</Link></Button>
              <Button asChild size="large" variant="secondary"><Link href={routes.howItWorks}>How It Works</Link></Button>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Website foundation preview</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm text-[var(--color-text-secondary)]">
              <p>Responsive public and application shells are available.</p>
              <p>Habit data and check-in behavior begin in subsequent implementation plans.</p>
            </CardContent>
          </Card>
        </ContentContainer>
      </section>
    </>
  );
}
```

- [x] **Step 6: Create public route pages**

Create each page with the exact content shown:

`src/app/(public)/features/page.tsx`

```tsx
import { PublicPlaceholder } from '@/components/layout/public-placeholder';
export default function FeaturesPage(): React.JSX.Element { return <PublicPlaceholder description="Explore the product capabilities defined in the approved PRD." title="Features" />; }
```

`src/app/(public)/how-it-works/page.tsx`

```tsx
import { PublicPlaceholder } from '@/components/layout/public-placeholder';
export default function HowItWorksPage(): React.JSX.Element { return <PublicPlaceholder description="Understand the Design, Do, Check-in, Adapt, and Recover loop." title="How It Works" />; }
```

`src/app/(public)/pricing/page.tsx`

```tsx
import { PublicPlaceholder } from '@/components/layout/public-placeholder';
export default function PricingPage(): React.JSX.Element { return <PublicPlaceholder description="Review Guest, Free, and Premium plan boundaries before choosing." title="Pricing" />; }
```

`src/app/(public)/help/page.tsx`

```tsx
import { PublicPlaceholder } from '@/components/layout/public-placeholder';
export default function HelpPage(): React.JSX.Element { return <PublicPlaceholder description="Find product guidance and account support entry points." title="Help" />; }
```

`src/app/(public)/status/page.tsx`

```tsx
import { PublicPlaceholder } from '@/components/layout/public-placeholder';
export default function StatusPage(): React.JSX.Element { return <PublicPlaceholder description="View service availability and incident communication." title="Status" />; }
```

`src/app/(public)/privacy/page.tsx`

```tsx
import { PublicPlaceholder } from '@/components/layout/public-placeholder';
export default function PrivacyPage(): React.JSX.Element { return <PublicPlaceholder description="Review how personal and browser-local data is handled." title="Privacy" />; }
```

`src/app/(public)/terms/page.tsx`

```tsx
import { PublicPlaceholder } from '@/components/layout/public-placeholder';
export default function TermsPage(): React.JSX.Element { return <PublicPlaceholder description="Review the terms that govern use of Recovery First." title="Terms" />; }
```

`src/app/auth/sign-in/page.tsx`

```tsx
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function SignInPage(): React.JSX.Element {
  return (
    <ContentContainer className="max-w-xl py-12">
      <PageHeader description="Authentication is introduced in Plan 07. This route currently validates the approved entry layout." title="Sign In" />
      <Card className="mt-8"><CardContent className="py-8 text-sm text-[var(--color-text-secondary)]">No authentication provider is connected in Plan 02.</CardContent></Card>
    </ContentContainer>
  );
}
```

- [x] **Step 7: Verify and commit**

Run:

```bash
pnpm test:component -- tests/component/public-shell.test.tsx
pnpm typecheck
pnpm lint
pnpm build
git add src/app src/components/layout tests/component/public-shell.test.tsx
git commit -m "feat: add public website shell"
```

Expected: focused tests, typecheck, lint, and production build pass.

---

### Task 9: Implement the desktop and laptop application shell

**Files:**

- Create: `src/components/navigation/app-sidebar.tsx`
- Create: `src/components/navigation/top-bar.tsx`
- Create: `src/components/navigation/profile-menu-placeholder.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Replace: `src/app/(app)/app/layout.tsx`
- Replace: `src/app/(app)/app/page.tsx`
- Create: `tests/component/navigation.test.tsx`

- [x] **Step 1: Write the failing desktop navigation test**

Create `tests/component/navigation.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppSidebar } from '@/components/navigation/app-sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/app/today' }));

describe('application navigation', () => {
  it('exposes labelled destinations and current-page state', () => {
    render(<AppSidebar />);

    expect(screen.getByRole('navigation', { name: 'Application navigation' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Habits' })).toHaveAttribute('href', '/app/habits');
    expect(screen.getByText('Stored only in this browser')).toBeVisible();
  });
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:component -- tests/component/navigation.test.tsx
```

Expected: FAIL because the application navigation modules do not exist.

- [x] **Step 3: Implement the desktop sidebar**

Create `src/components/navigation/app-sidebar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { applicationNavigation, routes } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

export function AppSidebar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex lg:flex-col">
      <div className="flex min-h-16 items-center border-b border-[var(--color-border)] px-5">
        <Link className="font-semibold text-[var(--color-emerald-800)]" href={routes.today}>Recovery First</Link>
      </div>
      <nav aria-label="Application navigation" className="flex-1 space-y-1 p-3">
        {applicationNavigation.map((item) => {
          const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-subtle)]',
                selected && 'bg-[var(--color-surface-selected)] text-[var(--color-emerald-800)]',
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] p-3">
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3">
          <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">Guest</p><Badge>Guest</Badge></div>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">Stored only in this browser</p>
        </div>
      </div>
    </aside>
  );
}
```

- [x] **Step 4: Implement top bar and profile placeholder**

Create `src/components/navigation/profile-menu-placeholder.tsx`:

```tsx
'use client';

import { UserRound } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';

export function ProfileMenuPlaceholder(): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><IconButton label="Open profile menu"><UserRound aria-hidden="true" className="size-5" /></IconButton></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Guest profile</DropdownMenuItem>
        <DropdownMenuItem>Sign In</DropdownMenuItem>
        <DropdownMenuItem>Help</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Create `src/components/navigation/top-bar.tsx`:

```tsx
import { Cloud } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ProfileMenuPlaceholder } from '@/components/navigation/profile-menu-placeholder';

export function TopBar(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_94%,transparent)] px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="lg:hidden"><span className="font-semibold text-[var(--color-emerald-800)]">Recovery First</span></div>
      <div className="hidden items-center gap-2 lg:flex"><Cloud aria-hidden="true" className="size-4 text-[var(--color-info)]" /><Badge tone="info">Browser-local preview</Badge></div>
      <ProfileMenuPlaceholder />
    </header>
  );
}
```

- [x] **Step 5: Implement app shell and route redirect**

Create `src/components/layout/app-shell.tsx`:

```tsx
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { MobileBottomNavigation } from '@/components/navigation/mobile-bottom-navigation';
import { TopBar } from '@/components/navigation/top-bar';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-[var(--color-page)]">
      <AppSidebar />
      <div className="min-h-dvh lg:pl-64">
        <TopBar />
        <main className="pb-24 lg:pb-8">{children}</main>
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
```

Replace `src/app/(app)/app/layout.tsx` with:

```tsx
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/toast';

export default function ApplicationLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <AppShell>{children}<Toaster /></AppShell>;
}
```

Replace `src/app/(app)/app/page.tsx` with:

```tsx
import { redirect } from 'next/navigation';

import { routes } from '@/lib/navigation/route-definitions';

export default function ApplicationIndexPage(): never {
  redirect(routes.today);
}
```

- [x] **Step 6: Temporarily add a compile-safe mobile navigation stub**

Create `src/components/navigation/mobile-bottom-navigation.tsx`:

```tsx
export function MobileBottomNavigation(): React.JSX.Element {
  return <div aria-hidden="true" className="lg:hidden" />;
}
```

- [x] **Step 7: Verify and commit**

Run:

```bash
pnpm test:component -- tests/component/navigation.test.tsx
pnpm typecheck
pnpm lint
pnpm build
git add src/components/navigation src/components/layout/app-shell.tsx src/app/\(app\)/app tests/component/navigation.test.tsx
git commit -m "feat: add desktop application shell"
```

Expected: focused tests, typecheck, lint, and production build pass.

---

### Task 10: Implement mobile bottom navigation and the More drawer

**Files:**

- Replace: `src/components/navigation/mobile-bottom-navigation.tsx`
- Create: `src/components/navigation/mobile-more-drawer.tsx`
- Modify: `tests/component/navigation.test.tsx`

- [x] **Step 1: Extend the failing navigation test for mobile destinations**

Append to `tests/component/navigation.test.tsx`:

```tsx
import { MobileBottomNavigation } from '@/components/navigation/mobile-bottom-navigation';

it('renders four primary mobile destinations and a labelled More control', () => {
  render(<MobileBottomNavigation />);

  expect(screen.getByRole('navigation', { name: 'Mobile application navigation' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Today' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Insights' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'More' })).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Reminders' })).not.toBeInTheDocument();
});
```

- [x] **Step 2: Run the focused test and confirm the expected failure**

Run:

```bash
pnpm test:component -- tests/component/navigation.test.tsx
```

Expected: FAIL because the compile-safe stub does not render mobile controls.

- [x] **Step 3: Implement the More drawer**

Create `src/components/navigation/mobile-more-drawer.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { moreNavigation } from '@/lib/navigation/route-definitions';

export function MobileMoreDrawer(): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--color-text-secondary)]" type="button">
          <Menu aria-hidden="true" className="size-5" />
          <span>More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetTitle className="pr-10 text-lg font-semibold">More</SheetTitle>
        <SheetDescription className="mt-1 text-sm text-[var(--color-text-secondary)]">Additional application destinations</SheetDescription>
        <nav aria-label="More navigation" className="mt-5 grid gap-2">
          {moreNavigation.map((item) => {
            const Icon = item.icon;
            return <Link className="flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] px-3 hover:bg-[var(--color-surface-subtle)]" href={item.href} key={`${item.label}-${item.href}`}><Icon aria-hidden="true" className="size-5" /><span className="font-semibold">{item.label}</span></Link>;
          })}
        </nav>
        <div className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-secondary)]">Guest · Stored only in this browser</div>
      </SheetContent>
    </Sheet>
  );
}
```

- [x] **Step 4: Replace the mobile navigation stub**

Replace `src/components/navigation/mobile-bottom-navigation.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MobileMoreDrawer } from '@/components/navigation/mobile-more-drawer';
import { applicationNavigation } from '@/lib/navigation/route-definitions';
import { cn } from '@/lib/cn';

export function MobileBottomNavigation(): React.JSX.Element {
  const pathname = usePathname();
  const primaryItems = applicationNavigation.filter((item) => item.mobilePrimary);

  return (
    <nav aria-label="Mobile application navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-[max(0.5rem,env(safe-area-inset-left))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
      {primaryItems.map((item) => {
        const selected = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link aria-current={selected ? 'page' : undefined} className={cn('flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold text-[var(--color-text-secondary)]', selected && 'text-[var(--color-emerald-800)]')} href={item.href} key={item.href}>
            <span className={cn('grid size-8 place-items-center rounded-full', selected && 'bg-[var(--color-surface-selected)]')}><Icon aria-hidden="true" className="size-5" /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
      <MobileMoreDrawer />
    </nav>
  );
}
```

- [x] **Step 5: Verify and commit**

Run:

```bash
pnpm test:component -- tests/component/navigation.test.tsx
pnpm typecheck
pnpm lint
git add src/components/navigation tests/component/navigation.test.tsx
git commit -m "feat: add mobile application navigation"
```

Expected: navigation tests, typecheck, and lint pass.

---

### Task 11: Implement application placeholder routes and the system-state gallery

**Files:**

- Create: `src/components/layout/application-placeholder.tsx`
- Create: `src/app/(app)/app/today/page.tsx`
- Create: `src/app/(app)/app/habits/page.tsx`
- Create: `src/app/(app)/app/review/page.tsx`
- Create: `src/app/(app)/app/insights/page.tsx`
- Create: `src/app/(app)/app/reminders/page.tsx`
- Create: `src/app/(app)/app/settings/page.tsx`
- Create: `src/app/(app)/app/loading.tsx`
- Create: `src/app/(app)/app/error.tsx`
- Replace: `src/app/not-found.tsx`
- Create: `tests/e2e/route-placeholders.spec.ts`

- [x] **Step 1: Write the failing browser route test**

Create `tests/e2e/route-placeholders.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const routes = [
  ['/app/today', 'Today'],
  ['/app/habits', 'Habits'],
  ['/app/review', 'Review'],
  ['/app/insights', 'Insights'],
  ['/app/reminders', 'Reminders'],
  ['/app/settings', 'Settings'],
] as const;

for (const [path, heading] of routes) {
  test(`${path} renders inside the application shell`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await expect(page.getByText('Product data is not connected in Plan 02.')).toBeVisible();
  });
}
```

- [x] **Step 2: Run the focused browser test and confirm the expected failure**

Run:

```bash
pnpm test:e2e -- tests/e2e/route-placeholders.spec.ts
```

Expected: FAIL because the application route pages do not exist.

- [x] **Step 3: Implement the shared application placeholder**

Create `src/components/layout/application-placeholder.tsx`:

```tsx
import { ContentContainer } from '@/components/layout/content-container';
import { PageHeader } from '@/components/layout/page-header';
import { AppBanner } from '@/components/feedback/app-banner';
import { Card, CardContent } from '@/components/ui/card';

export function ApplicationPlaceholder({
  title,
  description,
  accent = 'info',
}: Readonly<{
  title: string;
  description: string;
  accent?: 'info' | 'success' | 'warning' | 'recovery';
}>): React.JSX.Element {
  return (
    <ContentContainer className="py-6 sm:py-8">
      <PageHeader description={description} title={title} />
      <div className="mt-6 grid gap-5">
        <AppBanner description="Product data is not connected in Plan 02." title="Interface foundation" tone={accent} />
        <Card><CardContent className="py-8 text-sm leading-6 text-[var(--color-text-secondary)]">This route validates navigation, layout, responsive behavior, loading, and accessibility contracts without simulating completed product features.</CardContent></Card>
      </div>
    </ContentContainer>
  );
}
```

- [x] **Step 4: Create each application route page**

`src/app/(app)/app/today/page.tsx`

```tsx
import { ApplicationPlaceholder } from '@/components/layout/application-placeholder';
export default function TodayPage(): React.JSX.Element { return <ApplicationPlaceholder accent="success" description="Your daily habit actions will appear here after the habit workflow is implemented." title="Today" />; }
```

`src/app/(app)/app/habits/page.tsx`

```tsx
import { ApplicationPlaceholder } from '@/components/layout/application-placeholder';
export default function HabitsPage(): React.JSX.Element { return <ApplicationPlaceholder description="Create, organize, and review habit definitions from this route." title="Habits" />; }
```

`src/app/(app)/app/review/page.tsx`

```tsx
import { ApplicationPlaceholder } from '@/components/layout/application-placeholder';
export default function ReviewPage(): React.JSX.Element { return <ApplicationPlaceholder accent="recovery" description="Weekly Review and recovery decisions will be presented here." title="Review" />; }
```

`src/app/(app)/app/insights/page.tsx`

```tsx
import { ApplicationPlaceholder } from '@/components/layout/application-placeholder';
export default function InsightsPage(): React.JSX.Element { return <ApplicationPlaceholder description="Accessible progress summaries and charts will appear here." title="Insights" />; }
```

`src/app/(app)/app/reminders/page.tsx`

```tsx
import { ApplicationPlaceholder } from '@/components/layout/application-placeholder';
export default function RemindersPage(): React.JSX.Element { return <ApplicationPlaceholder accent="warning" description="Browser and email reminder preferences will be managed here." title="Reminders" />; }
```

`src/app/(app)/app/settings/page.tsx`

```tsx
import { ApplicationPlaceholder } from '@/components/layout/application-placeholder';
export default function SettingsPage(): React.JSX.Element { return <ApplicationPlaceholder description="Profile, browser data, accessibility, export, and account settings will appear here." title="Settings" />; }
```

- [x] **Step 5: Implement route loading, error, and not-found states**

Create `src/app/(app)/app/loading.tsx`:

```tsx
import { ContentContainer } from '@/components/layout/content-container';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicationLoading(): React.JSX.Element {
  return <ContentContainer className="grid gap-5 py-8"><Skeleton className="h-9 w-48" /><Skeleton className="h-24 w-full" /><Skeleton className="h-52 w-full" /></ContentContainer>;
}
```

Create `src/app/(app)/app/error.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

import { ContentContainer } from '@/components/layout/content-container';
import { SystemErrorState } from '@/components/feedback/system-error-state';

export default function ApplicationError({ error }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>): React.JSX.Element {
  useEffect(() => { console.error('Application route error', { name: error.name, digest: error.digest }); }, [error]);
  return <ContentContainer className="py-8"><SystemErrorState /></ContentContainer>;
}
```

Replace `src/app/not-found.tsx` with:

```tsx
import Link from 'next/link';

import { ContentContainer } from '@/components/layout/content-container';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/navigation/route-definitions';

export default function NotFound(): React.JSX.Element {
  return (
    <ContentContainer className="grid min-h-dvh place-items-center py-12 text-center">
      <div className="grid max-w-lg justify-items-center gap-4">
        <p className="text-sm font-semibold text-[var(--color-primary)]">404</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-[var(--color-text-secondary)]">The requested page does not exist or is no longer available.</p>
        <Button asChild><Link href={routes.home}>Return home</Link></Button>
      </div>
    </ContentContainer>
  );
}
```

- [x] **Step 6: Verify and commit**

Run:

```bash
pnpm test:e2e -- tests/e2e/route-placeholders.spec.ts
pnpm typecheck
pnpm lint
pnpm build
git add src/app src/components/layout/application-placeholder.tsx tests/e2e/route-placeholders.spec.ts
git commit -m "feat: add application route placeholders"
```

Expected: route browser tests, typecheck, lint, and production build pass.

---

### Task 12: Add accessibility, responsive, visual-regression, and final quality gates

**Files:**

- Create: `tests/accessibility/primitives.accessibility.test.tsx`
- Create: `tests/accessibility/app-shell.accessibility.test.tsx`
- Create: `tests/e2e/responsive-navigation.spec.ts`
- Create: `tests/e2e/visual-baselines.spec.ts`
- Modify: `package.json`
- Create: `docs/operations/VISUAL-REGRESSION.md`
- Modify: `docs/implementation/IMPLEMENTATION-PLAN.md`

- [x] **Step 1: Add axe-based primitive accessibility tests**

Create `tests/accessibility/primitives.accessibility.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { InputField } from '@/components/forms/input-field';
import { Button } from '@/components/ui/button';

function runAxe(container: HTMLElement): Promise<axe.AxeResults> {
  return axe.run(container);
}

describe('primitive accessibility', () => {
  it('has no automatically detectable violations', async () => {
    const { container } = render(
      <main>
        <h1>Component sample</h1>
        <InputField id="sample" label="Sample input" />
        <Button>Continue</Button>
      </main>,
    );

    const results = await runAxe(container);
    expect(results.violations).toEqual([]);
  });
});
```

- [x] **Step 2: Add application-shell accessibility tests**

Create `tests/accessibility/app-shell.accessibility.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import { AppShell } from '@/components/layout/app-shell';

vi.mock('next/navigation', () => ({ usePathname: () => '/app/today' }));

describe('application shell accessibility', () => {
  it('has no automatically detectable violations', async () => {
    const { container } = render(<AppShell><h1>Today</h1></AppShell>);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
```

- [x] **Step 3: Run accessibility tests and fix any reported violation**

Run:

```bash
pnpm vitest run tests/accessibility
```

Expected: all accessibility tests pass with zero axe violations.

- [x] **Step 4: Add responsive navigation browser tests**

Create `tests/e2e/responsive-navigation.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 1024 },
  { name: 'wide', width: 1728, height: 1117 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name} exposes the correct application navigation`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/app/today');

    if (viewport.width >= 1024) {
      await expect(page.getByRole('navigation', { name: 'Application navigation' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Mobile application navigation' })).toBeHidden();
    } else {
      await expect(page.getByRole('navigation', { name: 'Mobile application navigation' })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Application navigation' })).toBeHidden();
    }

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  });
}

test('mobile More drawer exposes secondary destinations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/today');
  await page.getByRole('button', { name: 'More' }).click();
  await expect(page.getByRole('navigation', { name: 'More navigation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reminders' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
});
```

- [x] **Step 5: Add visual-regression tests for high-value surfaces**

Create `tests/e2e/visual-baselines.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('desktop Today shell visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/app/today');
  await expect(page).toHaveScreenshot('desktop-today-shell.png', { fullPage: true });
});

test('mobile Today shell visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/app/today');
  await expect(page).toHaveScreenshot('mobile-today-shell.png', { fullPage: true });
});

test('public landing visual baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/');
  await expect(page).toHaveScreenshot('public-landing.png', { fullPage: true });
});
```

- [x] **Step 6: Add visual scripts to package.json**

Add these scripts without removing existing Plan 01 scripts:

```json
{
  "scripts": {
    "test:accessibility": "vitest run tests/accessibility",
    "test:visual": "playwright test tests/e2e/visual-baselines.spec.ts",
    "test:visual:update": "playwright test tests/e2e/visual-baselines.spec.ts --update-snapshots"
  }
}
```

Run:

```bash
pnpm test:visual:update
pnpm test:visual
```

Expected: baseline images are created under Playwright's snapshot directory and the second command passes without updating files.

- [x] **Step 7: Document visual-regression policy**

Create `docs/operations/VISUAL-REGRESSION.md`:

```markdown
# Visual Regression Policy

## Protected surfaces

- Public landing page at 1440 × 1024.
- Application Today shell at 1440 × 1024.
- Application Today shell at 390 × 844.

## Review rule

A changed screenshot is not accepted solely because implementation changed. Review the pixel diff against `docs/specs/UI-SPEC.md`, confirm the change is intentional, then regenerate the baseline with `pnpm test:visual:update`.

## Stability rules

- Use static placeholder content in Plan 02 screenshots.
- Disable external network dependencies.
- Do not include current dates, random identifiers, animation frames, or remote images.
- Run screenshots with the Playwright browser version pinned by `pnpm-lock.yaml`.
```

- [x] **Step 8: Update the master plan status**

In `docs/implementation/IMPLEMENTATION-PLAN.md`, change the Plan 02 status entry from `Not created` to `Detailed plan created`, and do not mark implementation complete.

- [x] **Step 9: Run the complete Plan 02 quality gate**

Run:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:component
pnpm test:accessibility
pnpm test:e2e
pnpm test:visual
pnpm build
pnpm check:repository
git status --short
```

Expected:

- formatting check passes;
- ESLint reports zero errors;
- strict typecheck reports zero errors;
- all unit, component, accessibility, responsive, route, and visual tests pass;
- production build succeeds;
- repository policy check passes;
- only Task 12 files are uncommitted before the commit.

- [x] **Step 10: Commit Plan 02 verification assets and status**

Run:

```bash
git add package.json pnpm-lock.yaml tests/accessibility tests/e2e docs/operations/VISUAL-REGRESSION.md docs/implementation/IMPLEMENTATION-PLAN.md
find tests -type d -name '*-snapshots' -print0 | xargs -0 git add
git commit -m "test: verify responsive web design system"
```

- [x] **Step 11: Verify from a clean checkout**

Run:

```bash
temporary_directory="$(mktemp -d)"
git clone . "$temporary_directory/recovery-first-habit-tracker"
cd "$temporary_directory/recovery-first-habit-tracker"
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm exec playwright install chromium
pnpm verify
pnpm test:accessibility
pnpm test:e2e
pnpm test:visual
pnpm check:repository
```

Expected: every command exits with status `0` using only tracked repository files and generated local dependencies.

- [x] **Step 12: Capture final evidence**

Run:

```bash
cd -
git log --oneline --decorate -12
git status --short
```

Expected:

- Plan 02 task commits appear in order;
- the working tree is clean.

Evidence captured on 2026-08-02 from `C:\Users\korba\AppData\Local\Temp\tracker-habits-clean-095b5a8\recovery-first-habit-tracker` at commit `095b5a8`: `pnpm verify`, `pnpm test:accessibility`, `CI=1 pnpm test:e2e`, `pnpm test:visual`, and `pnpm check:repository` passed. The generated `next-env.d.ts` route import was restored after Next.js checks before confirming an empty `git status --short`.

---

# 4. Final Acceptance Checklist

Plan 02 is complete only when fresh command output proves every item:

- [x] All approved emerald, neutral, accent, semantic, and status tokens are encoded without scattered replacement colors in Plan 02 components.
- [x] Global typography, focus, reduced-motion, selection, background, border, radius, and elevation rules are active.
- [x] Primary pointer and touch controls meet the minimum sizes defined in `UI-SPEC.md`.
- [x] Button, badge, card, skeleton, input, textarea, checkbox, radio, switch, select, alert, progress, dialog, sheet, dropdown, tooltip, and toast primitives compile and are covered by focused tests.
- [x] Status components always include textual labels rather than color-only meaning.
- [x] Public header and footer expose Features, How It Works, Pricing, Help, Sign In, Start Free, Status, Privacy, and Terms routes.
- [x] Desktop application navigation exposes Today, Habits, Review, Insights, Reminders, and Settings.
- [x] Mobile application navigation exposes Today, Habits, Review, Insights, and More.
- [x] Mobile More exposes Reminders, Settings, Help, and Guest identity context.
- [x] Selected navigation uses `aria-current="page"`.
- [x] Every primary navigation item includes a visible text label.
- [x] `/app` redirects to `/app/today`.
- [x] Public and application placeholder routes render without fabricated product records.
- [x] Loading, error, not-found, empty, offline, permission, locked, and decision-required components exist.
- [x] Keyboard focus remains visible on all tested controls.
- [x] Axe reports zero automatically detectable violations in the tested primitive and application-shell samples.
- [x] Responsive navigation tests pass at 390, 834, 1280, 1440, and 1728 pixel widths.
- [x] Visual baselines pass for public desktop, application desktop, and application mobile surfaces.
- [x] Unit, component, accessibility, browser, and visual tests pass.
- [x] Strict typecheck, lint, formatting, repository checks, and production build pass.
- [x] Clean-checkout verification passes.
- [x] Working tree is clean.

---

# 5. Plan 03 Handoff Contract

Plan 03 may begin only after every Final Acceptance Checklist item passes.

Plan 02 supplies these verified contracts:

- semantic CSS and TypeScript design tokens;
- project-owned reusable action, form, display, feedback, overlay, and navigation primitives;
- accessible public and application shells;
- centralized typed route inventory and metadata;
- desktop sidebar and mobile bottom-navigation mental-model parity;
- static public and application route placeholders;
- loading, error, not-found, empty, offline, permission, locked, and decision-required presentation states;
- accessibility test infrastructure;
- responsive reference-frame tests;
- visual-regression baselines;
- production-build compatibility.

Plan 03 must preserve these contracts while introducing domain types, PostgreSQL schema, RLS, generated database types, and browser-local data schemas. It must not move business rules into visual components or bypass centralized route definitions.
