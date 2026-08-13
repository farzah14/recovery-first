# Recovery-First Habit Tracker

[![CI](https://github.com/farzah14/recovery-first/actions/workflows/quality.yml/badge.svg)](https://github.com/farzah14/recovery-first/actions/workflows/quality.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-330%2B%20Tests-729B1B?style=flat&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Smoke-2EAD33?style=flat&logo=playwright)](https://playwright.dev/)

A modern, responsive web application built on an intentional, non-punitive **Recovery-First** behavioral philosophy. Designed to help users build sustainable habits through distinct **Full**, **Minimum**, and **Skipped** check-in outcomes—protecting consistency without streak-loss punishment, burnout, or shame.

---

## 🌟 Core Philosophy & Features

### 1. The Recovery-First Behavioral Model

- **Beyond Fragile Streaks**: Traditional habit trackers punish missed days with streak resets. Recovery-First prioritizes continuous momentum and gradual recovery.
- **Three Flexible Check-In Outcomes**:
  - 🟢 **Full**: Target habit goal achieved in full.
  - 🟡 **Minimum**: A lightweight fallback version that preserves continuity on demanding or low-energy days.
  - ⚪ **Skipped**: Explicitly recorded skips with structured friction capture (e.g., fatigue, busy schedule, illness) to prevent ghosting.
- **Adaptive Recovery Engine**: Detects consecutive skips and proposes structured, low-friction recovery plans.

### 2. Onboarding, Consent & Authentication

- **Terms & Privacy Consent**: Explicit, mandatory legal consent before entering private account surfaces.
- **One-Time Onboarding Wizard**: A 3-step guided flow (`/onboarding`) covering legal consent, user localization preferences (display name, timezone, week-start day, quiet hours), and first habit creation.
- **Comprehensive Auth Flow**: Google SSO and email/password authentication powered by Supabase Auth with PKCE and SSR cookie sessions.
- **Password Recovery**: Secure password reset flow (`/auth/forgot-password` and `/auth/update-password`).

### 3. Tiered Account & Entitlement System

- 🆓 **Free Tier ($0)**: Up to 5 active habits, basic recovery suggestions, local cache.
- ⚡ **Lite Tier ($5/mo or $48/yr)**: Up to 10 active habits, weekly capacity analysis, enhanced recovery structures.
- 👑 **Premium Tier ($10/mo or $96/yr)**: Up to 30 active habits, advanced friction analytics, data export, email reminders.
- **Multi-Provider Billing Architecture**: Server-authoritative checkout and webhook ingestion supporting Paddle and DOKU billing integrations.

### 4. Hybrid Cloud & Local Data Engine

- **Cloud-Authoritative PostgreSQL**: Managed with Supabase, safeguarded by fine-grained PostgreSQL Row-Level Security (RLS) policies.
- **Client-Side Cache**: Dexie (IndexedDB) local cache for snappy interactions, draft recovery, and offline resilience.
- **Zero Client Data Leakage**: Sensitive provider tokens and entitlement authorities remain strictly isolated in server-side boundaries.

---

## 🛠️ Technology Stack

| Layer                    | Technologies & Libraries                                                                                                                                                                         |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**            | [Next.js](https://nextjs.org/) (App Router, Server Actions, Route Handlers)                                                                                                                      |
| **Runtime & Language**   | [Node.js](https://nodejs.org/) (v24 LTS), [TypeScript](https://www.typescriptlang.org/) (Strict Mode)                                                                                            |
| **UI & Styling**         | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) |
| **Form Management**      | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) Schema Validation                                                                                                       |
| **State & Data Caching** | [TanStack Query](https://tanstack.com/query), [Dexie.js](https://dexie.org/) (IndexedDB)                                                                                                         |
| **Database & Auth**      | [Supabase](https://supabase.com/) PostgreSQL, RLS Policies, `@supabase/ssr` Auth                                                                                                                 |
| **Payments & Billing**   | [Paddle](https://www.paddle.com/) & [DOKU](https://doku.promo/) integration with idempotent webhook processing                                                                                   |
| **Testing Suite**        | [Vitest](https://vitest.dev/) (330+ unit & component tests), [Playwright](https://playwright.dev/) (E2E smoke tests), [pgTAP](https://pgtap.org/) (Database tests)                               |

---

## 📂 Repository Structure

```text
├── docs/                           # Official Architecture & Implementation Documentation
│   ├── specs/                      # PRD, UX Flows, UI Spec, and Technical Design
│   │   ├── PRD.md                  # Product Requirements Document
│   │   ├── UX-FLOWS.md             # Complete User Journeys & Interaction Rules
│   │   ├── UI-SPEC.md              # Design System, Tokens, & Responsive Specs
│   │   └── TECHNICAL-DESIGN.md     # Data Architecture, Security Model & API Specs
│   └── implementation/             # Sequential Feature Execution Plans (01 – 12)
├── src/                            # Application Source Code
│   ├── app/                        # Next.js App Router Pages & Layouts
│   │   ├── (app)/app/              # Authenticated App Routes (Today, Habits, Review, Settings)
│   │   ├── (app)/onboarding/       # 3-Step Required Onboarding Wizard
│   │   ├── (public)/               # Marketing Surfaces (Landing, Pricing, Features, About)
│   │   ├── auth/                   # Authentication Pages (Sign-In, Sign-Up, Password Reset)
│   │   └── api/                    # API Endpoints (Billing, Webhooks, Health)
│   ├── components/                 # UI Primitives, Shell Layouts & Modals
│   ├── domain/                     # Pure Business Logic, Invariants & Entitlements
│   ├── features/                   # Domain-Specific Feature Modules (Habits, Check-Ins, Billing)
│   ├── lib/                        # Supabase Clients, Database Types, IndexedDB & Utilities
│   └── server/                     # Server-Side Billing Services & Entitlement Authority
├── supabase/                       # Database Configurations & Migrations
│   ├── migrations/                 # Sequential SQL Migrations with RLS
│   ├── tests/                      # pgTAP Database Test Suites
│   └── seed.sql                    # Synthetic Local Seed Data
└── tests/                          # Automated Test Suites
    ├── unit/                       # Pure Domain, Architecture, & Utility Tests
    ├── component/                  # React Testing Library Component Tests
    ├── integration/                # API Route & Service Integration Tests
    ├── accessibility/              # Axe Accessibility Tests
    └── e2e/                        # Playwright Browser Smoke & Visual Tests
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following runtimes are installed:

- **Node.js**: `v24.x` (enforced via `.nvmrc` and `package.json engines`)
- **pnpm**: `v11.x` (`corepack enable pnpm`)
- **Docker Desktop**: Required to run Supabase local stack

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/farzah14/recovery-first.git
   cd recovery-first
   ```

2. **Install Dependencies**:

   ```bash
   pnpm install --frozen-lockfile
   ```

3. **Configure Environment Variables**:

   ```bash
   cp .env.example .env.local
   ```

   Configure your local Supabase credentials and API keys inside `.env.local`.

4. **Start & Migrate Local Database**:

   ```bash
   pnpm db:start
   pnpm db:reset
   ```

5. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   Navigate to [http://127.0.0.1:3000](http://127.0.0.1:3000) to view the application.

---

## 🧪 Quality & Verification Suite

The repository maintains strict quality gates across static analysis, unit tests, database constraints, and end-to-end browser journeys.

```bash
# 1. Run unit, domain, and component tests (Vitest: 330+ tests)
pnpm test

# 2. Run TypeScript strict type-checking
pnpm typecheck

# 3. Run ESLint code quality checks
pnpm lint

# 4. Check formatting with Prettier
pnpm format:check

# 5. Run pgTAP database migration and RLS policy tests
pnpm db:test

# 6. Run Playwright end-to-end browser smoke tests
pnpm test:e2e

# 7. Run standard repository verification pipeline
pnpm verify

# 8. Full local CI simulation
pnpm verify:full
```

---

## 📜 Available NPM Scripts

| Command                             | Purpose                                                   |
| :---------------------------------- | :-------------------------------------------------------- |
| `pnpm dev`                          | Launch Next.js local development server                   |
| `pnpm build`                        | Create optimized production bundle                        |
| `pnpm start`                        | Serve production build locally                            |
| `pnpm lint` / `pnpm lint:fix`       | Check / auto-fix ESLint issues                            |
| `pnpm typecheck`                    | Run `tsc --noEmit` across all TypeScript modules          |
| `pnpm format` / `pnpm format:check` | Format files / verify code formatting                     |
| `pnpm test`                         | Run entire Vitest unit, component, and integration suite  |
| `pnpm test:unit`                    | Run focused domain & unit tests                           |
| `pnpm test:component`               | Run React component tests with Testing Library            |
| `pnpm test:e2e`                     | Run Playwright browser smoke tests                        |
| `pnpm db:start` / `pnpm db:stop`    | Start / stop local Supabase Docker containers             |
| `pnpm db:reset`                     | Reset local database, apply migrations, and run seed data |
| `pnpm db:test`                      | Run pgTAP database assertions on PostgreSQL               |
| `pnpm db:types`                     | Regenerate TypeScript database types from local schema    |
| `pnpm verify`                       | Run formatting, lint, typecheck, tests, and build check   |

---

## 📚 Technical Documentation & Specs

For in-depth architectural details, refer to the authoritative specification documents:

1. [**Product Requirements Document (PRD)**](file:///D:/tracker-habits/docs/specs/PRD.md) — Comprehensive functional requirements, user personas, and habit mechanics.
2. [**UX Flows & Journeys**](file:///D:/tracker-habits/docs/specs/UX-FLOWS.md) — Step-by-step state diagrams, onboarding wizard flows, and error handling.
3. [**UI & Design System Specifications**](file:///D:/tracker-habits/docs/specs/UI-SPEC.md) — Visual tokens, accessibility standards, colors, and responsive layouts.
4. [**Technical Architecture & Design**](file:///D:/tracker-habits/docs/specs/TECHNICAL-DESIGN.md) — Data contracts, database schema, RLS policies, and billing services.
5. [**Master Implementation Plan**](file:///D:/tracker-habits/docs/implementation/IMPLEMENTATION-PLAN.md) — Execution blueprint across all development phases.

---

## ⚖️ License

This project is licensed under private proprietary terms. All rights reserved.
