# Recovery-First Habit Tracker

A modern, responsive web application built around a non-punitive, **Recovery-First** behavioral model. Designed to help users build sustainable habits through distinct **Full**, **Minimum**, and **Skipped** check-in outcomes without shame or streak-loss punishment.

---

## 🌟 Key Features & Philosophy

- **Recovery-First Model**: Focuses on momentum rather than fragile streaks. Check-ins acknowledge partial effort (**Minimum**) as a true win.
- **Three Outcome Types**:
  - **Full**: The target habit goal achieved in full.
  - **Minimum**: A lightweight fallback version that preserves continuity on low-energy days.
  - **Skipped**: Explicitly recorded skips with optional friction capture (e.g., low energy, scheduling conflict).
- **Tiered Account System**:
  - 🆓 **Free Tier ($0)**: 5 active habits, basic recovery guidance.
  - ⚡ **Lite Tier ($5/mo or $48/yr)**: 10 active habits, enhanced recovery options, weekly capacity analysis.
  - 👑 **Premium Tier ($10/mo or $96/yr)**: 30 active habits, advanced friction analysis, insights/export, email reminders.
- **Responsive Stitch Web UI**: Modern, accessible light-theme interface built with an custom Emerald color palette, shadcn/ui primitives, and desktop/mobile viewports.
- **Hybrid Storage Architecture**: Cloud-authoritative Supabase PostgreSQL database combined with browser-local IndexedDB (Dexie) caching.

---

## 🛠️ Technology Stack

| Layer                    | Technology                                                                     |
| :----------------------- | :----------------------------------------------------------------------------- |
| **Framework**            | Next.js App Router (React 19, Strict TypeScript)                               |
| **Styling & Components** | Tailwind CSS, shadcn/ui primitives, Lucide Icons                               |
| **State & Forms**        | TanStack Query, React Hook Form, Zod schema validation                         |
| **Database & Auth**      | Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth (`@supabase/ssr`) |
| **Local Cache**          | Dexie (IndexedDB) for client storage and draft persistence                     |
| **Payments**             | Integrated DOKU / Paddle billing adapter & entitlement projection              |
| **Testing**              | Vitest (290+ unit/component tests), React Testing Library, Playwright E2E      |

---

## 📂 Repository Structure

```text
D:/tracker-habits/
├── docs/                       # Official Specifications & Implementation Plans
│   ├── specs/                  # PRD, UX Flows, UI Spec, Technical Design
│   ├── implementation/         # Sequential Implementation Plans (01 - 11)
│   └── architecture/           # Architecture Decision Records (ADRs)
├── src/                        # Application Source Code
│   ├── app/                    # Next.js App Router (Routes, API Endpoints, Layouts)
│   │   ├── (app)/app/          # Authenticated App Routes (Today, Habits, Review, Insights, Settings)
│   │   ├── (public)/           # Public Marketing Routes (Landing, About, Features, Pricing, How It Works)
│   │   └── api/                # Billing, Auth Callback, and Health Endpoints
│   ├── components/             # Reusable UI Primitives, Layouts, & App Shell
│   ├── domain/                 # Framework-Independent Business Logic & Invariants
│   ├── features/               # Feature-Specific UI & Application Logic (Habits, Today, Subscriptions)
│   ├── lib/                    # Supabase Clients, Payments, IndexedDB & Utilities
│   └── server/                 # Server-Authoritative Services (Billing, Entitlements)
├── supabase/                   # Database Migrations, RLS Policies, & Seeds
└── tests/                      # Unit, Component, Integration, & E2E Test Suites
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed locally:

- **Node.js**: v24 LTS (see `.node-version`)
- **pnpm**: v9+ (`corepack enable pnpm`)
- **Docker Desktop**: Required for running Supabase locally via Docker

### Installation & Setup

1. **Clone the Repository & Install Dependencies**:

   ```bash
   git clone <repository-url>
   cd tracker-habits
   pnpm install --frozen-lockfile
   ```

2. **Configure Environment Variables**:

   ```bash
   cp .env.example .env.local
   ```

   Ensure `.env.local` contains valid local Supabase URL and Publishable keys.

3. **Start & Provision Supabase Database**:

   ```bash
   pnpm db:start
   pnpm db:reset
   ```

4. **Run the Development Server**:
   ```bash
   pnpm dev
   ```
   Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

---

## 🧪 Verification & Testing Commands

Run the full suite of quality gates before committing:

```bash
# Run unit and component tests with Vitest (294 passing tests)
pnpm test

# Run static analysis and formatting checks
pnpm lint
pnpm typecheck
pnpm format:check

# Database migrations and RLS security tests
pnpm db:test

# Run end-to-end Playwright browser tests
pnpm test:e2e

# Run standard repository verification gate
pnpm verify

# Build production distribution bundle
pnpm build
```

---

## 📖 Specifications & Source of Truth

Before extending features or modifying architecture, refer to the authoritative specification documents:

1. [`AGENTS.md`](file:///D:/tracker-habits/AGENTS.md) — Engineering guidelines & execution rules
2. [`docs/specs/PRD.md`](file:///D:/tracker-habits/docs/specs/PRD.md) — Product requirements & business rules
3. [`docs/specs/UX-FLOWS.md`](file:///D:/tracker-habits/docs/specs/UX-FLOWS.md) — User journeys & interaction decisions
4. [`docs/specs/UI-SPEC.md`](file:///D:/tracker-habits/docs/specs/UI-SPEC.md) — Visual tokens & responsive component specification
5. [`docs/specs/TECHNICAL-DESIGN.md`](file:///D:/tracker-habits/docs/specs/TECHNICAL-DESIGN.md) — System architecture, security & RLS model
6. [`docs/implementation/IMPLEMENTATION-PLAN.md`](file:///D:/tracker-habits/docs/implementation/IMPLEMENTATION-PLAN.md) — Sequential master implementation roadmap
