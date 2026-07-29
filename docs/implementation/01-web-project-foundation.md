# Web Project Foundation Implementation Plan

> **Execution mode:** Single-agent sequential execution.
> Use the `executing-plans` workflow. Do not create, delegate to, or dispatch subagents.
> Complete and verify one task before beginning the next task. Steps use checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** Create a reproducible, strictly typed, testable, and deployable Next.js and Supabase foundation for the Recovery-First Habit Tracker website.

**Architecture:** The repository uses Next.js App Router with React Server Components by default, narrow Client Component boundaries, strict TypeScript, pnpm-managed dependencies, and Supabase Local for database development. This phase establishes deterministic cross-cutting contracts, environment validation, health endpoints, testing infrastructure, CI, and documentation without implementing product-domain behavior.

**Tech Stack:** Node.js 24 LTS, pnpm, Next.js App Router, React, TypeScript, Tailwind CSS, Zod, Vitest, React Testing Library, Playwright, Supabase CLI, PostgreSQL, pgTAP, GitHub Actions, and Vercel-compatible builds.

---

# 1. Execution Contract

## 1.1 Source documents

Before executing this plan, place the approved documents at these exact repository paths:

- `AGENTS.md`
- `docs/specs/PRD.md`
- `docs/specs/UX-FLOWS.md`
- `docs/specs/UI-SPEC.md`
- `docs/specs/TECHNICAL-DESIGN.md`
- `docs/implementation/IMPLEMENTATION-PLAN.md`
- `docs/implementation/01-web-project-foundation.md`

Use this authority order when instructions conflict:

1. `AGENTS.md` for permanent repository execution rules.
2. `docs/specs/PRD.md` for product behavior.
3. `docs/specs/UX-FLOWS.md` for navigation and interaction outcomes.
4. `docs/specs/UI-SPEC.md` for responsive visual and accessibility contracts.
5. `docs/specs/TECHNICAL-DESIGN.md` for architecture and runtime behavior.
6. `docs/implementation/IMPLEMENTATION-PLAN.md` for phase scope and order.
7. This plan for Foundation execution details.

Do not resolve a conflict silently. Stop the affected task and report the two conflicting instructions, their impact, and the smallest safe correction.

## 1.2 Fixed identifiers

Use these identifiers consistently:

| Item | Value |
|---|---|
| Repository name | `recovery-first-habit-tracker` |
| Package name | `recovery-first-habit-tracker` |
| Product name | `Recovery First` |
| Application route prefix | `/app` |
| Health liveness route | `/api/health/live` |
| Health readiness route | `/api/health/ready` |
| Default locale | `en-US` |
| Default timezone for deterministic tests | `UTC` |
| Supabase local project ID | `recovery-first-habit-tracker` |
| Node.js major version | `24` |
| Package manager | `pnpm` |

A change to these identifiers requires an explicit architecture decision and corresponding updates to specifications, tests, CI, and documentation.

## 1.3 Scope boundaries

This plan creates foundation infrastructure only. It does **not** implement:

- final visual tokens or reusable product components;
- complete public navigation or application navigation;
- Guest IndexedDB data;
- product PostgreSQL tables;
- authentication or authorization flows;
- habits, sessions, check-ins, Recovery, Review, or Insights behavior;
- offline mutation processing;
- reminder delivery;
- subscription checkout or entitlement behavior;
- production provider credentials;
- production deployment.

Those responsibilities belong to Plans 02 through 11.

## 1.4 Required local tools

The implementing machine must have:

- Git;
- Node.js 24 LTS;
- pnpm;
- Docker Desktop or another Docker-compatible runtime;
- a modern Chromium browser;
- access to the repository specifications listed above.

Run every command from the repository root unless a step explicitly provides another working directory.

---

# 2. Planned Repository Structure

The completed Foundation phase must produce this structure:

```text
recovery-first-habit-tracker/
|-- .editorconfig
|-- .gitattributes
|-- .gitignore
|-- .node-version
|-- .npmrc
|-- .nvmrc
|-- .prettierignore
|-- .prettierrc.json
|-- AGENTS.md
|-- README.md
|-- CONTRIBUTING.md
|-- eslint.config.mjs
|-- next-env.d.ts
|-- next.config.ts
|-- package.json
|-- playwright.config.ts
|-- pnpm-lock.yaml
|-- postcss.config.mjs
|-- tsconfig.json
|-- vitest.config.ts
|-- public/
|-- src/
|   |-- app/
|   |   |-- (app)/
|   |   |   `-- app/
|   |   |       `-- page.tsx
|   |   |-- (public)/
|   |   |   `-- page.tsx
|   |   |-- api/
|   |   |   `-- health/
|   |   |       |-- live/
|   |   |       |   `-- route.ts
|   |   |       `-- ready/
|   |   |           `-- route.ts
|   |   |-- error.tsx
|   |   |-- global-error.tsx
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- not-found.tsx
|   |-- components/
|   |   |-- data-display/
|   |   |-- feedback/
|   |   |-- forms/
|   |   |-- layout/
|   |   |-- navigation/
|   |   `-- ui/
|   |-- domain/
|   |   `-- shared/
|   |       |-- app-error.ts
|   |       |-- clock.ts
|   |       |-- id-generator.ts
|   |       `-- result.ts
|   |-- features/
|   |-- hooks/
|   |-- lib/
|   |   |-- env/
|   |   |-- health/
|   |   |-- observability/
|   |   |-- security/
|   |   `-- server/
|   |-- providers/
|   |-- test-support/
|   `-- types/
|-- supabase/
|   |-- config.toml
|   |-- migrations/
|   |   `-- 20260728000000_foundation.sql
|   |-- seed.sql
|   `-- tests/
|       `-- 00001_foundation.test.sql
|-- tests/
|   |-- component/
|   |-- e2e/
|   |-- integration/
|   `-- unit/
|-- tool/
|   |-- check-environment-example.mjs
|   |-- check-repository.mjs
|   `-- verify.mjs
|-- docs/
|   |-- architecture/
|   |-- implementation/
|   |-- operations/
|   `-- specs/
`-- .github/
    `-- workflows/
        `-- quality.yml
```

Empty architectural directories must contain a `.gitkeep` file until a later plan adds tracked content.

---

# 3. Task Dependency Order

Execute tasks strictly in this order:

```text
Task 1  Repository initialization and Node/pnpm policy
Task 2  Next.js application and dependency scaffold
Task 3  Strict TypeScript, formatting, linting, and module boundaries
Task 4  Repository architecture and minimal route shell
Task 5  Vitest and React Testing Library foundation
Task 6  Playwright browser smoke foundation
Task 7  Deterministic domain and observability contracts
Task 8  Environment validation and configuration contracts
Task 9  Health endpoints and server-only boundary
Task 10 Supabase Local, baseline migration, seed, and database test
Task 11 Cross-platform verification scripts and repository checks
Task 12 GitHub Actions quality workflow
Task 13 Documentation, ADRs, clean-checkout verification, and handoff
```

---

### Task 1: Initialize the repository and pin Node.js and pnpm

**Files:**

- Create: `.editorconfig`
- Create: `.gitattributes`
- Create: `.gitignore`
- Create: `.node-version`
- Create: `.nvmrc`
- Create: `.npmrc`
- Create: `package.json`
- Create: `docs/architecture/`
- Create: `docs/operations/`
- Create: `tool/`
- Create: `.github/workflows/`

- [x] **Step 1: Verify required tools**

Run:

```bash
git --version
node --version
pnpm --version
docker version
git config user.name
git config user.email
```

Expected:

- every command exits with status `0`;
- `node --version` begins with `v24.`;
- Docker reports a reachable client and server;
- Git user name and email are non-empty.

- [x] **Step 2: Initialize Git when the directory is not already a repository**

Run:

```bash
test -d .git || git init
```

Expected: `.git/` exists and the command exits with status `0`.

- [x] **Step 3: Create foundational directories**

Run:

```bash
mkdir -p docs/architecture docs/operations tool .github/workflows public src tests
touch public/.gitkeep
```

Expected: every listed directory exists.

- [x] **Step 4: Create Node version files**

Create `.nvmrc`:

```text
24
```

Create `.node-version`:

```text
24
```

Verify:

```bash
test "$(cat .nvmrc)" = "24"
test "$(cat .node-version)" = "24"
```

Expected: both commands exit with status `0`.

- [x] **Step 5: Create repository editor and line-ending policy**

Create `.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2
```

Create `.gitattributes`:

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf
*.png binary
*.jpg binary
*.jpeg binary
*.webp binary
*.ico binary
```

- [x] **Step 6: Create the initial Git ignore policy**

Create `.gitignore`:

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/

# Testing
coverage/
playwright-report/
test-results/
blob-report/

# Environment files
.env
.env.local
.env.*.local
!.env.example

# Supabase local state
supabase/.branches/
supabase/.temp/

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Operating systems
.DS_Store
Thumbs.db
Desktop.ini

# Editors
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json

# Local certificates and credentials
*.pem
*.key
*.p12
*.pfx
service-account*.json

# Build and temporary output
.tmp/
tmp/
.vercel/
```

- [x] **Step 7: Create pnpm policy**

Create `.npmrc`:

```ini
engine-strict=true
save-exact=true
strict-peer-dependencies=true
prefer-frozen-lockfile=true
```

- [x] **Step 8: Initialize package metadata and pin the active pnpm version**

Run:

```bash
pnpm init
node <<'NODE'
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const pnpmVersion = execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim();
const nextPackageJson = {
  ...packageJson,
  name: 'recovery-first-habit-tracker',
  version: '0.1.0',
  private: true,
  description: 'Recovery-First Habit Tracker responsive website',
  license: 'UNLICENSED',
  packageManager: `pnpm@${pnpmVersion}`,
  engines: {
    node: '>=24.0.0 <25',
    pnpm: `>=${pnpmVersion} <${Number(pnpmVersion.split('.')[0]) + 1}`,
  },
};
fs.writeFileSync('package.json', `${JSON.stringify(nextPackageJson, null, 2)}\n`);
NODE
```

Verify:

```bash
node -e "const p=require('./package.json'); if(!p.private || p.name!=='recovery-first-habit-tracker' || !p.packageManager.startsWith('pnpm@')) process.exit(1)"
```

Expected: command exits with status `0`.

- [x] **Step 9: Create the initial lockfile**

Run:

```bash
pnpm install --lockfile-only
```

Expected: `pnpm-lock.yaml` exists.

- [x] **Step 10: Commit repository initialization**

Run:

```bash
git add .editorconfig .gitattributes .gitignore .node-version .nvmrc .npmrc package.json pnpm-lock.yaml public/.gitkeep docs/architecture docs/operations tool .github/workflows
git commit -m "chore: initialize web repository"
```

Expected: one commit is created with only repository-policy and package metadata files.

---

### Task 2: Install Next.js and create the application dependency scaffold

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `next-env.d.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`

- [x] **Step 1: Install runtime dependencies**

Run:

```bash
pnpm add next@latest react@latest react-dom@latest zod@latest server-only@latest
```

Expected: dependencies are written with exact versions and `pnpm-lock.yaml` changes.

- [x] **Step 2: Install TypeScript, Tailwind, and framework development dependencies**

Run:

```bash
pnpm add -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest tailwindcss@latest @tailwindcss/postcss@latest postcss@latest eslint@latest eslint-config-next@latest
```

Expected: every package appears in `devDependencies` with an exact version.

- [x] **Step 3: Add application scripts without replacing installed dependency versions**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  dev: 'next dev',
  build: 'next build',
  start: 'next start',
  lint: 'eslint .',
  'lint:fix': 'eslint . --fix',
  typecheck: 'tsc --noEmit',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

Verify:

```bash
pnpm exec next --version
pnpm exec tsc --version
```

Expected: both commands print installed versions and exit with status `0`.

- [x] **Step 4: Create Next.js TypeScript declarations**

Create `next-env.d.ts`:

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file is generated by Next.js conventions and must remain tracked.
```

- [x] **Step 5: Create the Tailwind PostCSS configuration**

Create `postcss.config.mjs`:

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [x] **Step 6: Create minimal global CSS**

Create `src/app/globals.css`:

```css
@import 'tailwindcss';

:root {
  color-scheme: light;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  background: #ffffff;
}

body {
  min-height: 100vh;
  margin: 0;
  background: #ffffff;
  color: #161a17;
  font-family: Arial, Helvetica, sans-serif;
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
```

This is a temporary structural stylesheet. Plan 02 replaces visual values with the approved semantic design tokens.

- [x] **Step 7: Verify dependency installation**

Run:

```bash
pnpm install --frozen-lockfile
pnpm list --depth 0
```

Expected:

- frozen installation exits with status `0`;
- Next.js, React, TypeScript, Tailwind, Zod, and `server-only` are present;
- no peer-dependency error is reported.

- [x] **Step 8: Commit the application dependency scaffold**

Run:

```bash
git add package.json pnpm-lock.yaml next-env.d.ts postcss.config.mjs src/app/globals.css
git commit -m "chore: add nextjs application dependencies"
```

---

### Task 3: Configure strict TypeScript, formatting, linting, and module boundaries

**Files:**

- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Test: `tests/unit/architecture/domain-boundary.test.ts`

- [x] **Step 1: Install formatting and architecture-test dependencies**

Run:

```bash
pnpm add -D prettier@latest prettier-plugin-tailwindcss@latest fast-glob@latest vitest@latest
```

- [x] **Step 2: Create strict TypeScript configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["node", "vitest/globals"]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.mts",
    "**/*.cts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "playwright-report", "test-results"]
}
```

- [x] **Step 3: Create ESLint flat configuration**

Create `eslint.config.mjs`:

```javascript
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const domainRestrictedImports = [
  'next',
  'next/*',
  'react',
  'react/*',
  'react-dom',
  'react-dom/*',
  '@/app/*',
  '@/components/*',
  '@/features/*',
  '@/hooks/*',
  '@/lib/*',
  '@/providers/*',
];

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: domainRestrictedImports.map((group) => ({
            group: [group],
            message: 'Domain code must remain framework and infrastructure independent.',
          })),
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'coverage/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
    'supabase/.temp/**',
  ]),
]);
```

- [x] **Step 4: Create Prettier configuration**

Create `.prettierrc.json`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

Create `.prettierignore`:

```text
.next
AGENTS.md
docs
coverage
node_modules
playwright-report
pnpm-lock.yaml
supabase/.temp
test-results
```

- [x] **Step 5: Add formatting and architecture scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  format: 'prettier --write .',
  'format:check': 'prettier --check .',
  'test:architecture': 'vitest run tests/unit/architecture',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

Vitest is installed in this task, so the architecture guard is executable immediately.

- [x] **Step 6: Create the failing domain-boundary source scan test**

Create `tests/unit/architecture/domain-boundary.test.ts`:

```typescript
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { describe, expect, it } from 'vitest';

const forbiddenPatterns = [
  /from ['"]next(?:\/[^'"]*)?['"]/,
  /from ['"]react(?:\/[^'"]*)?['"]/,
  /from ['"]react-dom(?:\/[^'"]*)?['"]/,
  /from ['"]@\/(?:app|components|features|hooks|lib|providers)\//,
];

describe('domain module boundary', () => {
  it('keeps domain modules independent from frameworks and infrastructure', async () => {
    const files = await fg('src/domain/**/*.{ts,tsx}', { dot: false });
    const violations: string[] = [];

    for (const file of files) {
      const source = await readFile(path.resolve(file), 'utf8');

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(source)) {
          violations.push(`${file}: ${pattern.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
```

- [x] **Step 7: Run the currently available static checks**

Run:

```bash
pnpm exec prettier --check .
pnpm exec eslint .
pnpm exec tsc --noEmit
```

Expected before application files exist:

- Prettier may report files requiring formatting;
- ESLint and TypeScript must not report configuration-loading failures.

Run formatting, then repeat:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:architecture
```

Expected: all five commands exit with status `0`.

- [x] **Step 8: Commit strict engineering configuration**

Run:

```bash
git add tsconfig.json eslint.config.mjs .prettierrc.json .prettierignore package.json pnpm-lock.yaml tests/unit/architecture/domain-boundary.test.ts
git commit -m "chore: enforce strict web engineering rules"
```

---

### Task 4: Create repository architecture and the minimal route shell

**Files:**

- Create: `next.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/(app)/app/page.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/global-error.tsx`
- Create: `src/app/not-found.tsx`
- Create: architectural `.gitkeep` files listed below
- Test: `tests/unit/routes/route-inventory.test.ts`

- [x] **Step 1: Create architectural directories**

Run:

```bash
mkdir -p \
  'src/app/(public)' \
  'src/app/(app)/app' \
  src/components/ui \
  src/components/layout \
  src/components/navigation \
  src/components/forms \
  src/components/feedback \
  src/components/data-display \
  src/domain/shared \
  src/features \
  src/hooks \
  src/lib/env \
  src/lib/health \
  src/lib/observability \
  src/lib/security \
  src/lib/server \
  src/providers \
  src/test-support \
  src/types \
  tests/component \
  tests/e2e \
  tests/integration \
  tests/unit/routes
```

- [x] **Step 2: Track empty architectural directories**

Run:

```bash
for directory in \
  src/components/ui \
  src/components/layout \
  src/components/navigation \
  src/components/forms \
  src/components/feedback \
  src/components/data-display \
  src/features \
  src/hooks \
  src/lib/security \
  src/providers \
  src/types; do
  touch "$directory/.gitkeep"
done
```

- [x] **Step 3: Write the failing route-inventory test**

Create `tests/unit/routes/route-inventory.test.ts`:

```typescript
import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const requiredRouteFiles = [
  'next.config.ts',
  'src/app/layout.tsx',
  'src/app/(public)/page.tsx',
  'src/app/(app)/app/page.tsx',
  'src/app/error.tsx',
  'src/app/global-error.tsx',
  'src/app/not-found.tsx',
] as const;

describe('foundation route inventory', () => {
  it.each(requiredRouteFiles)('contains %s', async (file) => {
    await expect(access(file)).resolves.toBeUndefined();
  });
});
```

Run:

```bash
pnpm exec vitest run tests/unit/routes/route-inventory.test.ts
```

Expected: command fails because the required route files do not yet exist. Record the failure output. Do not mark this step complete without evidence of failure.

- [x] **Step 4: Create baseline Next.js runtime configuration**

Create `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const baselineSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=()',
  },
] as const;

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...baselineSecurityHeaders],
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
```

- [x] **Step 5: Create the root layout**

Create `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Recovery First',
    template: '%s | Recovery First',
  },
  description: 'A recovery-first habit system for sustainable progress.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [x] **Step 6: Create the minimal public route**

Create `src/app/(public)/page.tsx`:

```tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Recovery First</h1>
      <p>Build habits that can recover when life changes.</p>
      <Link href="/app">Open application shell</Link>
    </main>
  );
}
```

- [x] **Step 7: Create the minimal application route**

Create `src/app/(app)/app/page.tsx`:

```tsx
import Link from 'next/link';

export const metadata = {
  title: 'Application',
};

export default function ApplicationPage() {
  return (
    <main>
      <h1>Application foundation</h1>
      <p>Your habit workspace starts here.</p>
      <Link href="/">Return to public site</Link>
    </main>
  );
}
```

- [x] **Step 8: Create route-level error and missing-page surfaces**

Create `src/app/error.tsx`:

```tsx
'use client';

export default function RouteError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <main role="alert">
      <h1>Something went wrong</h1>
      <p>The page could not be displayed.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
```

Create `src/app/global-error.tsx`:

```tsx
'use client';

export default function GlobalError({ reset }: Readonly<{ reset: () => void }>) {
  return (
    <html lang="en">
      <body>
        <main role="alert">
          <h1>Recovery First is temporarily unavailable</h1>
          <button type="button" onClick={reset}>
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
```

Create `src/app/not-found.tsx`:

```tsx
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The requested page does not exist.</p>
      <Link href="/">Return home</Link>
    </main>
  );
}
```

- [x] **Step 9: Run the route test and static checks**

Run:

```bash
pnpm exec vitest run tests/unit/routes/route-inventory.test.ts
pnpm format
pnpm lint
pnpm typecheck
pnpm build
```

Expected: the route test passes, all commands exit with status `0`, and the build output contains routes for `/` and `/app`.

- [x] **Step 10: Commit repository architecture and route shell**

Run:

```bash
git add next.config.ts src tests/unit/routes
git commit -m "feat: add minimal web application shell"
```

---

### Task 5: Add Vitest and React Testing Library foundations

**Files:**

- Create: `vitest.config.ts`
- Create: `src/test-support/setup.ts`
- Create: `src/test-support/render.tsx`
- Create: `tests/component/home-page.test.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Install test dependencies**

Run:

```bash
pnpm add -D @vitejs/plugin-react@latest vite-tsconfig-paths@latest jsdom@latest @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest
```

- [x] **Step 2: Create Vitest configuration**

Create `vitest.config.ts`:

```typescript
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-support/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/component/**/*.test.ts',
      'tests/component/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/integration/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
```

- [x] **Step 3: Install the Vitest coverage provider**

Run:

```bash
pnpm add -D @vitest/coverage-v8@latest
```

- [x] **Step 4: Create test setup**

Create `src/test-support/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

- [x] **Step 5: Create the shared render helper**

Create `src/test-support/render.tsx`:

```tsx
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, options);
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
```

- [x] **Step 6: Create the public-page component test**

Create `tests/component/home-page.test.tsx`:

```tsx
import HomePage from '@/app/(public)/page';
import { renderWithProviders, screen } from '@/test-support/render';

describe('HomePage', () => {
  it('presents the product name and application entry link', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Recovery First' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open application shell' })).toHaveAttribute(
      'href',
      '/app',
    );
  });
});
```

- [x] **Step 7: Add unit, component, integration, coverage, and aggregate test scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  test: 'vitest run',
  'test:watch': 'vitest',
  'test:unit': 'vitest run tests/unit',
  'test:component': 'vitest run tests/component',
  'test:integration': 'vitest run tests/integration',
  'test:coverage': 'vitest run --coverage',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

- [x] **Step 8: Run the complete test baseline**

Run:

```bash
pnpm test
pnpm test:coverage
```

Expected:

- the route-inventory test passes;
- the domain-boundary test passes;
- the home-page component test passes;
- coverage output is created under `coverage/`;
- commands exit with status `0`.

- [x] **Step 9: Commit the Vitest and component-test foundation**

Run:

```bash
git add vitest.config.ts src/test-support tests package.json pnpm-lock.yaml
git commit -m "test: add web unit and component test foundation"
```

---

### Task 6: Add Playwright browser smoke testing

**Files:**

- Create: `playwright.config.ts`
- Create: `tests/e2e/foundation.spec.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Install Playwright**

Run:

```bash
pnpm add -D @playwright/test@latest
pnpm exec playwright install chromium
```

Expected: the Chromium browser binary installs successfully.

- [x] **Step 2: Create Playwright configuration**

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [x] **Step 3: Create browser smoke tests**

Create `tests/e2e/foundation.spec.ts`:

```typescript
import { expect, test } from '@playwright/test';

test('public route links to the application shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Recovery First/);
  await expect(page.getByRole('heading', { name: 'Recovery First' })).toBeVisible();

  await page.getByRole('link', { name: 'Open application shell' }).click();

  await expect(page).toHaveURL('/app');
  await expect(page.getByRole('heading', { name: 'Application foundation' })).toBeVisible();
});

test('unknown route displays the missing-page surface', async ({ page }) => {
  await page.goto('/route-that-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
});
```

- [x] **Step 4: Add Playwright scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'test:e2e': 'playwright test',
  'test:e2e:headed': 'playwright test --headed',
  'test:e2e:report': 'playwright show-report',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

- [x] **Step 5: Run browser smoke tests**

Run:

```bash
pnpm test:e2e
```

Expected: both tests pass in desktop and mobile Chromium projects, producing four passed test executions.

- [x] **Step 6: Commit browser testing infrastructure**

Run:

```bash
git add playwright.config.ts tests/e2e package.json pnpm-lock.yaml
git commit -m "test: add browser smoke test foundation"
```

---

### Task 7: Implement deterministic domain and observability contracts

**Files:**

- Create: `src/domain/shared/clock.ts`
- Create: `src/domain/shared/id-generator.ts`
- Create: `src/domain/shared/result.ts`
- Create: `src/domain/shared/app-error.ts`
- Create: `src/lib/observability/logger.ts`
- Test: `tests/unit/domain/clock.test.ts`
- Test: `tests/unit/domain/id-generator.test.ts`
- Test: `tests/unit/domain/result.test.ts`
- Test: `tests/unit/observability/logger.test.ts`

- [x] **Step 1: Write failing deterministic clock tests**

Create `tests/unit/domain/clock.test.ts`:

```typescript
import { FixedClock, SystemClock } from '@/domain/shared/clock';

describe('Clock', () => {
  it('returns a defensive copy from FixedClock', () => {
    const instant = new Date('2026-07-28T00:00:00.000Z');
    const clock = new FixedClock(instant);

    const first = clock.now();
    first.setUTCFullYear(2030);

    expect(clock.now().toISOString()).toBe('2026-07-28T00:00:00.000Z');
  });

  it('returns the current instant from SystemClock', () => {
    const before = Date.now();
    const current = new SystemClock().now().getTime();
    const after = Date.now();

    expect(current).toBeGreaterThanOrEqual(before);
    expect(current).toBeLessThanOrEqual(after);
  });
});
```

Run:

```bash
pnpm exec vitest run tests/unit/domain/clock.test.ts
```

Expected: FAIL because `@/domain/shared/clock` does not exist.

- [x] **Step 2: Implement clock contracts**

Create `src/domain/shared/clock.ts`:

```typescript
export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FixedClock implements Clock {
  readonly #instant: Date;

  constructor(instant: Date) {
    this.#instant = new Date(instant.getTime());
  }

  now(): Date {
    return new Date(this.#instant.getTime());
  }
}
```

Run:

```bash
pnpm exec vitest run tests/unit/domain/clock.test.ts
```

Expected: two tests pass.

- [x] **Step 3: Write failing ID-generator tests**

Create `tests/unit/domain/id-generator.test.ts`:

```typescript
import { CryptoIdGenerator, SequenceIdGenerator } from '@/domain/shared/id-generator';

describe('IdGenerator', () => {
  it('returns sequence values in deterministic order', () => {
    const generator = new SequenceIdGenerator(['first-id', 'second-id']);

    expect(generator.next()).toBe('first-id');
    expect(generator.next()).toBe('second-id');
  });

  it('fails when a deterministic sequence is exhausted', () => {
    const generator = new SequenceIdGenerator([]);

    expect(() => generator.next()).toThrow('ID sequence is exhausted.');
  });

  it('creates a UUID with the browser-compatible crypto API', () => {
    expect(new CryptoIdGenerator().next()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
```

Run:

```bash
pnpm exec vitest run tests/unit/domain/id-generator.test.ts
```

Expected: FAIL because the module does not exist.

- [x] **Step 4: Implement ID-generator contracts**

Create `src/domain/shared/id-generator.ts`:

```typescript
export interface IdGenerator {
  next(): string;
}

export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}

export class SequenceIdGenerator implements IdGenerator {
  readonly #values: string[];

  constructor(values: readonly string[]) {
    this.#values = [...values];
  }

  next(): string {
    const value = this.#values.shift();

    if (value === undefined) {
      throw new Error('ID sequence is exhausted.');
    }

    return value;
  }
}
```

Run:

```bash
pnpm exec vitest run tests/unit/domain/id-generator.test.ts
```

Expected: three tests pass.

- [x] **Step 5: Write failing Result and AppError tests**

Create `tests/unit/domain/result.test.ts`:

```typescript
import { AppError } from '@/domain/shared/app-error';
import { failure, isFailure, isSuccess, success } from '@/domain/shared/result';

describe('Result', () => {
  it('represents a successful value', () => {
    const result = success({ value: 42 });

    expect(isSuccess(result)).toBe(true);
    expect(isFailure(result)).toBe(false);
    expect(result).toEqual({ ok: true, value: { value: 42 } });
  });

  it('represents an application failure', () => {
    const error = new AppError('validation_failed', 'Input is invalid.', {
      field: 'name',
    });
    const result = failure(error);

    expect(isFailure(result)).toBe(true);
    expect(result).toEqual({ ok: false, error });
  });
});
```

Run:

```bash
pnpm exec vitest run tests/unit/domain/result.test.ts
```

Expected: FAIL because both modules do not exist.

- [x] **Step 6: Implement Result and AppError contracts**

Create `src/domain/shared/app-error.ts`:

```typescript
export type AppErrorCode =
  | 'validation_failed'
  | 'not_found'
  | 'conflict'
  | 'unauthenticated'
  | 'forbidden'
  | 'rate_limited'
  | 'dependency_unavailable'
  | 'unexpected';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly details: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AppError';
  }
}
```

Create `src/domain/shared/result.ts`:

```typescript
export type Success<T> = Readonly<{
  ok: true;
  value: T;
 }>;

export type Failure<E> = Readonly<{
  ok: false;
  error: E;
 }>;

export type Result<T, E> = Success<T> | Failure<E>;

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure<E>(error: E): Failure<E> {
  return { ok: false, error };
}

export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}
```

Run:

```bash
pnpm exec vitest run tests/unit/domain/result.test.ts
```

Expected: two tests pass.

- [x] **Step 7: Write the failing structured logger test**

Create `tests/unit/observability/logger.test.ts`:

```typescript
import { createConsoleLogger } from '@/lib/observability/logger';

describe('structured logger', () => {
  it('redacts sensitive values before writing an event', () => {
    const write = vi.fn();
    const logger = createConsoleLogger({ write });

    logger.info('session_started', {
      requestId: 'req-1',
      accessToken: 'secret-token',
      email: 'person@example.com',
      safeCount: 3,
    });

    expect(write).toHaveBeenCalledWith({
      level: 'info',
      event: 'session_started',
      context: {
        requestId: 'req-1',
        accessToken: '[REDACTED]',
        email: '[REDACTED]',
        safeCount: 3,
      },
    });
  });
});
```

Run:

```bash
pnpm exec vitest run tests/unit/observability/logger.test.ts
```

Expected: FAIL because the logger module does not exist.

- [x] **Step 8: Implement the structured logger with key-based redaction**

Create `src/lib/observability/logger.ts`:

```typescript
export type LogLevel = 'info' | 'warn' | 'error';

export type LogEvent = Readonly<{
  level: LogLevel;
  event: string;
  context: Readonly<Record<string, unknown>>;
}>;

export interface Logger {
  info(event: string, context?: Readonly<Record<string, unknown>>): void;
  warn(event: string, context?: Readonly<Record<string, unknown>>): void;
  error(event: string, context?: Readonly<Record<string, unknown>>): void;
}

const sensitiveKeyPattern = /(authorization|cookie|email|habitName|note|password|secret|token)/i;

function redact(context: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : value,
    ]),
  );
}

export function createConsoleLogger({
  write = (event) => console.warn(JSON.stringify(event)),
}: Readonly<{
  write?: (event: LogEvent) => void;
}> = {}): Logger {
  const emit = (
    level: LogLevel,
    event: string,
    context: Readonly<Record<string, unknown>> = {},
  ) => {
    write({ level, event, context: redact(context) });
  };

  return {
    info: (event, context) => emit('info', event, context),
    warn: (event, context) => emit('warn', event, context),
    error: (event, context) => emit('error', event, context),
  };
}
```

Run:

```bash
pnpm exec vitest run tests/unit/observability/logger.test.ts
pnpm test:architecture
pnpm lint
pnpm typecheck
```

Expected: all commands pass.

- [x] **Step 9: Commit deterministic foundation contracts**

Run:

```bash
git add src/domain/shared src/lib/observability tests/unit/domain tests/unit/observability
git commit -m "feat: add deterministic foundation contracts"
```

---

### Task 8: Implement environment validation and configuration contracts

**Files:**

- Create: `.env.example`
- Create: `src/lib/env/schema.ts`
- Create: `src/lib/env/client-env.ts`
- Create: `src/lib/env/server-env.ts`
- Test: `tests/unit/env/environment.test.ts`

- [x] **Step 1: Write failing environment-schema tests**

Create `tests/unit/env/environment.test.ts`:

```typescript
import { createClientEnv, createServerEnv } from '@/lib/env/schema';

const publicValues = {
  NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'local-publishable-key',
};

describe('environment schema', () => {
  it('parses the required browser-safe configuration', () => {
    expect(createClientEnv(publicValues)).toEqual(publicValues);
  });

  it('rejects an invalid public application URL', () => {
    expect(() =>
      createClientEnv({ ...publicValues, NEXT_PUBLIC_APP_URL: 'not-a-url' }),
    ).toThrow();
  });

  it('parses shared server configuration', () => {
    expect(
      createServerEnv({
        ...publicValues,
        APP_ENVIRONMENT: 'local',
        APP_DEFAULT_LOCALE: 'en-US',
        APP_DEFAULT_TIMEZONE: 'UTC',
        FEATURE_ANALYTICS: 'false',
        FEATURE_PREMIUM: 'false',
        FEATURE_WEB_PUSH: 'false',
      }),
    ).toMatchObject({
      APP_ENVIRONMENT: 'local',
      APP_DEFAULT_LOCALE: 'en-US',
      APP_DEFAULT_TIMEZONE: 'UTC',
      FEATURE_ANALYTICS: false,
      FEATURE_PREMIUM: false,
      FEATURE_WEB_PUSH: false,
    });
  });

  it('treats blank optional values as absent', () => {
    expect(
      createServerEnv({
        ...publicValues,
        APP_ENVIRONMENT: 'local',
        APP_DEFAULT_LOCALE: 'en-US',
        APP_DEFAULT_TIMEZONE: 'UTC',
        PRODUCTION_APP_URL: '',
        NEXT_PUBLIC_SENTRY_DSN: '',
        NEXT_PUBLIC_ANALYTICS_KEY: '',
        NEXT_PUBLIC_ANALYTICS_HOST: '',
        FEATURE_ANALYTICS: 'false',
        FEATURE_PREMIUM: 'false',
        FEATURE_WEB_PUSH: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
      }),
    ).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('rejects a production application URL in preview', () => {
    expect(() =>
      createServerEnv({
        ...publicValues,
        APP_ENVIRONMENT: 'preview',
        NEXT_PUBLIC_APP_URL: 'https://recovery-first.example.com',
        PRODUCTION_APP_URL: 'https://recovery-first.example.com',
        APP_DEFAULT_LOCALE: 'en-US',
        APP_DEFAULT_TIMEZONE: 'UTC',
        FEATURE_ANALYTICS: 'false',
        FEATURE_PREMIUM: 'false',
        FEATURE_WEB_PUSH: 'false',
      }),
    ).toThrow('Preview and staging cannot use the production application URL.');
  });
});
```

Run:

```bash
pnpm exec vitest run tests/unit/env/environment.test.ts
```

Expected: FAIL because the schema module does not exist.

- [x] **Step 2: Implement environment schemas**

Create `src/lib/env/schema.ts`:

```typescript
import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const emptyStringToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalString = z.preprocess(emptyStringToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyStringToUndefined, z.url().optional());

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_ANALYTICS_KEY: optionalString,
  NEXT_PUBLIC_ANALYTICS_HOST: optionalUrl,
});

const serverSchema = clientSchema
  .extend({
    APP_ENVIRONMENT: z.enum(['local', 'preview', 'staging', 'production']),
    APP_DEFAULT_LOCALE: z.string().min(2),
    APP_DEFAULT_TIMEZONE: z.string().min(1),
    PRODUCTION_APP_URL: optionalUrl,
    FEATURE_ANALYTICS: booleanString,
    FEATURE_PREMIUM: booleanString,
    FEATURE_WEB_PUSH: booleanString,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    PAYMENT_PROVIDER_SECRET_KEY: optionalString,
    PAYMENT_WEBHOOK_SECRET: optionalString,
    EMAIL_PROVIDER_API_KEY: optionalString,
    WEB_PUSH_VAPID_PRIVATE_KEY: optionalString,
    WEB_PUSH_VAPID_SUBJECT: optionalString,
    SENTRY_AUTH_TOKEN: optionalString,
    CRON_SHARED_SECRET: optionalString,
    DATA_EXPORT_SIGNING_SECRET: optionalString,
  })
  .superRefine((value, context) => {
    if (
      (value.APP_ENVIRONMENT === 'preview' || value.APP_ENVIRONMENT === 'staging') &&
      value.PRODUCTION_APP_URL !== undefined &&
      value.NEXT_PUBLIC_APP_URL === value.PRODUCTION_APP_URL
    ) {
      context.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_APP_URL'],
        message: 'Preview and staging cannot use the production application URL.',
      });
    }
  });

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export function createClientEnv(source: Record<string, string | undefined>): ClientEnv {
  return clientSchema.parse(source);
}

export function createServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return serverSchema.parse(source);
}
```

- [x] **Step 3: Create explicit browser environment reader**

Create `src/lib/env/client-env.ts`:

```typescript
import { createClientEnv } from '@/lib/env/schema';

export const clientEnv = createClientEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_ANALYTICS_KEY: process.env.NEXT_PUBLIC_ANALYTICS_KEY,
  NEXT_PUBLIC_ANALYTICS_HOST: process.env.NEXT_PUBLIC_ANALYTICS_HOST,
});
```

- [x] **Step 4: Create protected server environment reader**

Create `src/lib/env/server-env.ts`:

```typescript
import 'server-only';
import { createServerEnv } from '@/lib/env/schema';

export const serverEnv = createServerEnv({
  APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
  APP_DEFAULT_LOCALE: process.env.APP_DEFAULT_LOCALE,
  APP_DEFAULT_TIMEZONE: process.env.APP_DEFAULT_TIMEZONE,
  PRODUCTION_APP_URL: process.env.PRODUCTION_APP_URL,
  FEATURE_ANALYTICS: process.env.FEATURE_ANALYTICS,
  FEATURE_PREMIUM: process.env.FEATURE_PREMIUM,
  FEATURE_WEB_PUSH: process.env.FEATURE_WEB_PUSH,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_ANALYTICS_KEY: process.env.NEXT_PUBLIC_ANALYTICS_KEY,
  NEXT_PUBLIC_ANALYTICS_HOST: process.env.NEXT_PUBLIC_ANALYTICS_HOST,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PAYMENT_PROVIDER_SECRET_KEY: process.env.PAYMENT_PROVIDER_SECRET_KEY,
  PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
  EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY,
  WEB_PUSH_VAPID_PRIVATE_KEY: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
  WEB_PUSH_VAPID_SUBJECT: process.env.WEB_PUSH_VAPID_SUBJECT,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  CRON_SHARED_SECRET: process.env.CRON_SHARED_SECRET,
  DATA_EXPORT_SIGNING_SECRET: process.env.DATA_EXPORT_SIGNING_SECRET,
});
```

- [x] **Step 5: Create environment example file**

Create `.env.example`:

```dotenv
APP_ENVIRONMENT=local
APP_DEFAULT_LOCALE=en-US
APP_DEFAULT_TIMEZONE=UTC
PRODUCTION_APP_URL=

NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-local-publishable-key
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_ANALYTICS_KEY=
NEXT_PUBLIC_ANALYTICS_HOST=

FEATURE_ANALYTICS=false
FEATURE_PREMIUM=false
FEATURE_WEB_PUSH=false

SUPABASE_SERVICE_ROLE_KEY=
PAYMENT_PROVIDER_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
EMAIL_PROVIDER_API_KEY=
WEB_PUSH_VAPID_PRIVATE_KEY=
WEB_PUSH_VAPID_SUBJECT=
SENTRY_AUTH_TOKEN=
CRON_SHARED_SECRET=
DATA_EXPORT_SIGNING_SECRET=
```

- [x] **Step 6: Run focused and regression checks**

Run:

```bash
pnpm exec vitest run tests/unit/env/environment.test.ts
pnpm lint
pnpm typecheck
```

Expected: all checks pass.

- [x] **Step 7: Verify that server-only variables are absent from browser modules**

Run:

```bash
if grep -R --line-number --include='*.ts' --include='*.tsx' \
  -E 'SUPABASE_SERVICE_ROLE_KEY|PAYMENT_PROVIDER_SECRET_KEY|PAYMENT_WEBHOOK_SECRET|EMAIL_PROVIDER_API_KEY|WEB_PUSH_VAPID_PRIVATE_KEY' \
  src/app src/components src/features src/hooks src/providers 2>/dev/null; then
  echo 'Server-only environment name found in a browser-facing directory.' >&2
  exit 1
fi
```

Expected: no matches and exit status `0`.

- [x] **Step 8: Commit environment contracts**

Run:

```bash
git add .env.example src/lib/env tests/unit/env
git commit -m "feat: validate web environment configuration"
```

---

### Task 9: Add health endpoints and server-only boundaries

**Files:**

- Create: `src/lib/server/assert-server-only.ts`
- Create: `src/lib/health/readiness.ts`
- Create: `src/app/api/health/live/route.ts`
- Create: `src/app/api/health/ready/route.ts`
- Test: `tests/unit/health/readiness.test.ts`
- Test: `tests/integration/health-routes.test.ts`

- [x] **Step 1: Write failing readiness tests**

Create `tests/unit/health/readiness.test.ts`:

```typescript
import { evaluateReadiness } from '@/lib/health/readiness';

describe('evaluateReadiness', () => {
  it('returns ready when required configuration is present', () => {
    expect(
      evaluateReadiness({
        appEnvironment: 'local',
        appUrl: 'http://127.0.0.1:3000',
        supabaseUrl: 'http://127.0.0.1:54321',
      }),
    ).toEqual({ status: 'ready' });
  });

  it('returns not_ready with non-sensitive missing keys', () => {
    expect(
      evaluateReadiness({
        appEnvironment: '',
        appUrl: 'http://127.0.0.1:3000',
        supabaseUrl: '',
      }),
    ).toEqual({
      status: 'not_ready',
      missing: ['APP_ENVIRONMENT', 'NEXT_PUBLIC_SUPABASE_URL'],
    });
  });
});
```

Run:

```bash
pnpm exec vitest run tests/unit/health/readiness.test.ts
```

Expected: FAIL because the readiness module does not exist.

- [x] **Step 2: Implement readiness evaluation**

Create `src/lib/health/readiness.ts`:

```typescript
export type ReadinessResult =
  | Readonly<{ status: 'ready' }>
  | Readonly<{ status: 'not_ready'; missing: readonly string[] }>;

export function evaluateReadiness({
  appEnvironment,
  appUrl,
  supabaseUrl,
}: Readonly<{
  appEnvironment: string;
  appUrl: string;
  supabaseUrl: string;
}>): ReadinessResult {
  const requiredValues: ReadonlyArray<readonly [string, string]> = [
    ['APP_ENVIRONMENT', appEnvironment],
    ['NEXT_PUBLIC_APP_URL', appUrl],
    ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
  ];
  const missing = requiredValues
    .filter(([, value]) => value.length === 0)
    .map(([key]) => key);

  return missing.length === 0 ? { status: 'ready' } : { status: 'not_ready', missing };
}
```

Run:

```bash
pnpm exec vitest run tests/unit/health/readiness.test.ts
```

Expected: two tests pass.

- [x] **Step 3: Create a reusable server-only assertion module**

Create `src/lib/server/assert-server-only.ts`:

```typescript
import 'server-only';

export function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error('This module can only execute on the server.');
  }
}
```

- [x] **Step 4: Create liveness route**

Create `src/app/api/health/live/route.ts`:

```typescript
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json(
    { status: 'ok' },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
```

- [x] **Step 5: Create readiness route**

Create `src/app/api/health/ready/route.ts`:

```typescript
import { evaluateReadiness } from '@/lib/health/readiness';
import { serverEnv } from '@/lib/env/server-env';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const readiness = evaluateReadiness({
    appEnvironment: serverEnv.APP_ENVIRONMENT,
    appUrl: serverEnv.NEXT_PUBLIC_APP_URL,
    supabaseUrl: serverEnv.NEXT_PUBLIC_SUPABASE_URL,
  });

  return Response.json(readiness, {
    status: readiness.status === 'ready' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
```

- [x] **Step 6: Create route integration tests**

Create `tests/integration/health-routes.test.ts`:

```typescript
import { GET as getLiveness } from '@/app/api/health/live/route';

vi.mock('@/lib/env/server-env', () => ({
  serverEnv: {
    APP_ENVIRONMENT: 'local',
    NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  },
}));

describe('health routes', () => {
  it('returns a no-store liveness response without sensitive details', async () => {
    const response = getLiveness();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('returns readiness when required configuration is present', async () => {
    const { GET: getReadiness } = await import('@/app/api/health/ready/route');
    const response = getReadiness();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ready' });
  });
});
```

- [x] **Step 7: Run focused tests and production build with explicit safe local values**

Run:

```bash
pnpm exec vitest run tests/unit/health/readiness.test.ts tests/integration/health-routes.test.ts
APP_ENVIRONMENT=local \
APP_DEFAULT_LOCALE=en-US \
APP_DEFAULT_TIMEZONE=UTC \
FEATURE_ANALYTICS=false \
FEATURE_PREMIUM=false \
FEATURE_WEB_PUSH=false \
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 \
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=local-build-key \
pnpm build
```

Expected: focused tests and production build pass.

- [x] **Step 8: Extend browser smoke coverage for liveness**

Append this test to `tests/e2e/foundation.spec.ts`:

```typescript
test('liveness endpoint returns only the public health contract', async ({ request }) => {
  const response = await request.get('/api/health/live');

  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.json()).toEqual({ status: 'ok' });
});
```

Run:

```bash
pnpm test:e2e
```

Expected: all desktop and mobile browser tests pass.

- [x] **Step 9: Commit health and server-boundary infrastructure**

Run:

```bash
git add src/lib/server src/lib/health src/app/api tests/unit/health tests/integration tests/e2e/foundation.spec.ts
git commit -m "feat: add non-sensitive health endpoints"
```

---

### Task 10: Initialize Supabase Local and add a database smoke test

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `supabase/config.toml` through Supabase CLI
- Create: `supabase/migrations/20260728000000_foundation.sql`
- Create: `supabase/seed.sql`
- Create: `supabase/tests/00001_foundation.test.sql`

- [x] **Step 1: Install the project-scoped Supabase CLI**

Run:

```bash
pnpm add -D supabase@latest
pnpm exec supabase --version
```

Expected: the CLI prints a stable version and exits with status `0`.

- [x] **Step 2: Initialize Supabase Local**

Run:

```bash
pnpm exec supabase init
```

Expected: `supabase/config.toml` exists.

- [x] **Step 3: Set the local project identifier**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const path = 'supabase/config.toml';
const source = fs.readFileSync(path, 'utf8');
const next = source.replace(/^project_id\s*=\s*"[^"]*"/m, 'project_id = "recovery-first-habit-tracker"');
if (next === source && !source.includes('project_id = "recovery-first-habit-tracker"')) {
  throw new Error('Unable to set Supabase project_id.');
}
fs.writeFileSync(path, next);
NODE
```

Verify:

```bash
grep -F 'project_id = "recovery-first-habit-tracker"' supabase/config.toml
```

Expected: exactly one matching line.

- [x] **Step 4: Create the baseline migration**

Create `supabase/migrations/20260728000000_foundation.sql`:

```sql
create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists private.foundation_metadata (
  key text primary key,
  value text not null,
  created_at timestamptz not null default timezone('utc', now())
);

revoke all on table private.foundation_metadata from public;
revoke all on table private.foundation_metadata from anon;
revoke all on table private.foundation_metadata from authenticated;

insert into private.foundation_metadata (key, value)
values ('schema_stage', 'foundation')
on conflict (key) do update set value = excluded.value;
```

- [x] **Step 5: Create deterministic seed data**

Create `supabase/seed.sql`:

```sql
insert into private.foundation_metadata (key, value)
values ('seed_stage', 'foundation')
on conflict (key) do update set value = excluded.value;
```

- [x] **Step 6: Create the pgTAP database smoke test**

Create `supabase/tests/00001_foundation.test.sql`:

```sql
begin;

select plan(4);

select has_schema('private', 'private schema exists');

select has_table(
  'private',
  'foundation_metadata',
  'foundation metadata table exists'
);

select results_eq(
  $$select value from private.foundation_metadata where key = 'schema_stage'$$,
  $$values ('foundation'::text)$$,
  'foundation migration marker exists'
);

select is_empty(
  $$
    select privilege_type
    from information_schema.role_table_grants
    where table_schema = 'private'
      and table_name = 'foundation_metadata'
      and grantee in ('anon', 'authenticated')
  $$,
  'browser roles have no direct table privileges'
);

select * from finish();
rollback;
```

- [x] **Step 7: Add database scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'db:start': 'supabase start',
  'db:stop': 'supabase stop',
  'db:status': 'supabase status',
  'db:reset': 'supabase db reset',
  'db:test': 'supabase test db',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

- [x] **Step 8: Start the local stack and verify the baseline migration**

Run:

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:status
```

Expected:

- Supabase services start successfully;
- migration and seed apply from an empty database;
- pgTAP reports four successful assertions and zero failures;
- status output lists local API and database services.

- [x] **Step 9: Stop Supabase while preserving local volumes**

Run:

```bash
pnpm db:stop
```

Expected: local services stop and command exits with status `0`.

- [x] **Step 10: Commit Supabase Local foundation**

Run:

```bash
git add package.json pnpm-lock.yaml supabase
git commit -m "feat: add supabase local database foundation"
```

---

### Task 11: Add cross-platform verification and repository checks

**Files:**

- Create: `tool/check-environment-example.mjs`
- Create: `tool/check-repository.mjs`
- Create: `tool/verify.mjs`
- Create: `tool/check-environment-example.d.mts`
- Create: `tool/check-repository.d.mts`
- Modify: `package.json`
- Test: `tests/unit/tooling/environment-example.test.ts`
- Test: `tests/unit/tooling/repository-policy.test.ts`

- [x] **Step 1: Create the environment-example checker**

Create `tool/check-environment-example.mjs`:

```javascript
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const requiredKeys = [
  'APP_ENVIRONMENT',
  'APP_DEFAULT_LOCALE',
  'APP_DEFAULT_TIMEZONE',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'FEATURE_ANALYTICS',
  'FEATURE_PREMIUM',
  'FEATURE_WEB_PUSH',
];

export async function checkEnvironmentExample(path = '.env.example') {
  const source = await readFile(path, 'utf8');
  const keys = new Set(
    source
      .split(/\r?\n/)
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.split('=', 1)[0]),
  );

  const missing = requiredKeys.filter((key) => !keys.has(key));

  if (missing.length > 0) {
    throw new Error(`Missing .env.example keys: ${missing.join(', ')}`);
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkEnvironmentExample(process.argv[2]);
  process.stdout.write('.env.example contains all required foundation keys.\n');
}
```

- [x] **Step 2: Create the repository-policy checker**

Create `tool/check-repository.mjs`:

```javascript
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const forbiddenPatterns = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\..*\.local$/,
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)playwright-report\//,
  /(^|\/)test-results\//,
  /(^|\/)supabase\/\.temp\//,
  /service-account.*\.json$/,
  /\.(?:pem|p12|pfx)$/,
];

export function findForbiddenTrackedFiles(files) {
  return files.filter((file) => forbiddenPatterns.some((pattern) => pattern.test(file)));
}

export function checkRepository() {
  const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
  const forbidden = findForbiddenTrackedFiles(trackedFiles);

  if (forbidden.length > 0) {
    throw new Error(`Forbidden tracked files:\n${forbidden.join('\n')}`);
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkRepository();
  process.stdout.write('Repository tracked-file policy passed.\n');
}
```

- [x] **Step 3: Create tests for both repository tools**

Create `tests/unit/tooling/environment-example.test.ts`:

```typescript
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkEnvironmentExample } from '../../../tool/check-environment-example.mjs';

describe('checkEnvironmentExample', () => {
  it('rejects an example missing a required key', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'recovery-first-env-'));
    const file = path.join(directory, '.env.example');
    await writeFile(file, 'APP_ENVIRONMENT=local\n');

    await expect(checkEnvironmentExample(file)).rejects.toThrow(
      'Missing .env.example keys',
    );
  });

  it('accepts the repository environment example', async () => {
    await expect(checkEnvironmentExample()).resolves.toBeUndefined();
  });
});
```

Create `tests/unit/tooling/repository-policy.test.ts`:

```typescript
import { findForbiddenTrackedFiles } from '../../../tool/check-repository.mjs';

describe('findForbiddenTrackedFiles', () => {
  it('identifies secrets and generated output', () => {
    expect(
      findForbiddenTrackedFiles([
        'src/app/page.tsx',
        '.env.local',
        '.next/server/app.js',
        'credentials.pem',
      ]),
    ).toEqual(['.env.local', '.next/server/app.js', 'credentials.pem']);
  });

  it('allows source and example configuration', () => {
    expect(findForbiddenTrackedFiles(['src/app/page.tsx', '.env.example'])).toEqual([]);
  });
});
```

- [x] **Step 4: Create the verification orchestrator**

Create `tool/verify.mjs`:

```javascript
import { spawnSync } from 'node:child_process';

const commands = [
  ['pnpm', ['format:check']],
  ['pnpm', ['lint']],
  ['pnpm', ['typecheck']],
  ['pnpm', ['test']],
  ['pnpm', ['check:env-example']],
  ['pnpm', ['check:repository']],
  ['pnpm', ['build']],
];

for (const [command, arguments_] of commands) {
  const result = spawnSync(command, arguments_, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      APP_ENVIRONMENT: process.env.APP_ENVIRONMENT ?? 'local',
      APP_DEFAULT_LOCALE: process.env.APP_DEFAULT_LOCALE ?? 'en-US',
      APP_DEFAULT_TIMEZONE: process.env.APP_DEFAULT_TIMEZONE ?? 'UTC',
      FEATURE_ANALYTICS: process.env.FEATURE_ANALYTICS ?? 'false',
      FEATURE_PREMIUM: process.env.FEATURE_PREMIUM ?? 'false',
      FEATURE_WEB_PUSH: process.env.FEATURE_WEB_PUSH ?? 'false',
      NEXT_PUBLIC_APP_URL:
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3000',
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'local-build-key',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
```

- [x] **Step 5: Add repository check and verification scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'check:env-example': 'node tool/check-environment-example.mjs',
  'check:repository': 'node tool/check-repository.mjs',
  verify: 'node tool/verify.mjs',
  'verify:full': 'pnpm verify && pnpm db:start && pnpm db:reset && pnpm db:test && pnpm db:stop && pnpm test:e2e',
};
fs.writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
NODE
```

- [x] **Step 6: Add TypeScript declarations for imported tool modules**

Create `tool/check-environment-example.d.mts`:

```typescript
export function checkEnvironmentExample(path?: string): Promise<void>;
```

Create `tool/check-repository.d.mts`:

```typescript
export function findForbiddenTrackedFiles(files: readonly string[]): string[];
export function checkRepository(): void;
```

- [x] **Step 7: Run tool tests and the baseline verification orchestrator**

Run:

```bash
pnpm exec vitest run tests/unit/tooling
pnpm check:env-example
pnpm check:repository
pnpm verify
```

Expected: all commands pass and the production build completes.

- [x] **Step 8: Commit verification tooling**

Run:

```bash
git add tool tests/unit/tooling package.json
git commit -m "chore: add deterministic repository verification"
```

---

### Task 12: Configure GitHub Actions quality gates

**Files:**

- Create: `.github/workflows/quality.yml`

- [x] **Step 1: Create the quality workflow**

Create `.github/workflows/quality.yml`:

```yaml
name: Quality

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

concurrency:
  group: quality-${{ github.ref }}
  cancel-in-progress: true

env:
  APP_ENVIRONMENT: local
  APP_DEFAULT_LOCALE: en-US
  APP_DEFAULT_TIMEZONE: UTC
  FEATURE_ANALYTICS: 'false'
  FEATURE_PREMIUM: 'false'
  FEATURE_WEB_PUSH: 'false'
  NEXT_PUBLIC_APP_URL: http://127.0.0.1:3000
  NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local-ci-key

jobs:
  application:
    name: Application quality
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - name: Install locked dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify application
        run: pnpm verify

  database:
    name: Supabase database
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - name: Install locked dependencies
        run: pnpm install --frozen-lockfile

      - name: Start Supabase Local
        run: pnpm db:start

      - name: Reset database
        run: pnpm db:reset

      - name: Run database tests
        run: pnpm db:test

      - name: Stop Supabase Local
        if: always()
        run: pnpm db:stop

  browser:
    name: Browser smoke tests
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          run_install: false

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - name: Install locked dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Chromium
        run: pnpm exec playwright install --with-deps chromium

      - name: Run browser smoke tests
        run: pnpm test:e2e

      - name: Upload browser report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [x] **Step 2: Validate workflow YAML syntax locally**

Run:

```bash
node -e "const fs=require('node:fs'); const text=fs.readFileSync('.github/workflows/quality.yml','utf8'); if(!text.includes('name: Quality') || !text.includes('pnpm install --frozen-lockfile') || !text.includes('pnpm db:test') || !text.includes('pnpm test:e2e')) process.exit(1)"
```

Expected: command exits with status `0`.

- [x] **Step 3: Validate workflow references only existing package scripts**

Run:

```bash
node <<'NODE'
const fs = require('node:fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['verify', 'db:start', 'db:reset', 'db:test', 'db:stop', 'test:e2e'];
const missing = requiredScripts.filter((name) => packageJson.scripts?.[name] === undefined);
if (missing.length > 0) {
  throw new Error(`Workflow references missing scripts: ${missing.join(', ')}`);
}
NODE
```

Expected: command exits with status `0`.

- [x] **Step 4: Run every workflow command locally**

Run:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
pnpm test:e2e
```

Expected: all commands pass.

- [x] **Step 5: Commit the GitHub Actions workflow**

Run:

```bash
git add .github/workflows/quality.yml
git commit -m "ci: add web foundation quality gates"
```

---

### Task 13: Document the foundation and verify a clean checkout

**Files:**

- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `docs/operations/ENVIRONMENTS.md`
- Create: `docs/operations/SECRETS.md`
- Create: `docs/operations/VERIFICATION.md`
- Create: `docs/architecture/ADR-001-nextjs-app-router.md`
- Create: `docs/architecture/ADR-002-supabase-postgresql.md`
- Create: `docs/architecture/ADR-003-indexeddb-dexie.md`
- Create: `docs/architecture/ADR-004-browser-resilient-cloud-model.md`
- Create: `docs/architecture/ADR-005-server-authoritative-entitlements.md`
- Create: `docs/architecture/ADR-006-idempotent-commands.md`
- Create: `docs/architecture/ADR-007-single-agent-sequential-delivery.md`
- Create: `docs/architecture/ADR-008-web-push-email-reminders.md`

- [x] **Step 1: Create repository README**

Create `README.md`:

```markdown
# Recovery First

Recovery First is a responsive, recovery-first habit tracker website.

## Repository stage

This repository contains the greenfield web foundation. Product features are introduced through the numbered plans in `docs/implementation/`.

## Required tools

- Git
- Node.js 24 LTS
- pnpm
- Docker Desktop or another Docker-compatible runtime

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:start
pnpm db:reset
pnpm dev
```

Open `http://127.0.0.1:3000`.

## Baseline verification

```bash
pnpm verify
pnpm db:test
pnpm test:e2e
```

## Source of truth

Read these files before implementation:

1. `AGENTS.md`
2. `docs/specs/PRD.md`
3. `docs/specs/UX-FLOWS.md`
4. `docs/specs/UI-SPEC.md`
5. `docs/specs/TECHNICAL-DESIGN.md`
6. `docs/implementation/IMPLEMENTATION-PLAN.md`
7. the active detailed plan
```

- [x] **Step 2: Create contribution rules**

Create `CONTRIBUTING.md`:

```markdown
# Contributing

## Execution model

- Use one agent only.
- Execute detailed plans in numerical order.
- Work on one task at a time.
- Use the exact commit boundary defined by the active plan.

## Branches

Use a dedicated branch or isolated worktree. Do not commit directly to a protected branch.

## Required checks

```bash
pnpm verify
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
pnpm test:e2e
```

## Pull requests

A pull request must include:

- active plan and completed task numbers;
- changed-file summary;
- test and build evidence;
- migration evidence when applicable;
- deviations and unresolved risks;
- confirmation that no secret or local-only file is tracked.
```

- [x] **Step 3: Document environments**

Create `docs/operations/ENVIRONMENTS.md`:

```markdown
# Environments

| Environment | Web runtime | Backend | Production data allowed |
|---|---|---|---|
| Local | `127.0.0.1` | Supabase Local | No |
| Preview | Vercel Preview | Supabase Staging | No |
| Staging | Dedicated staging domain | Supabase Staging | No |
| Production | Production domain | Supabase Production | Yes |

## Rules

- Preview and staging never connect to Supabase Production.
- Production credentials never appear in `.env.example`, CI logs, or preview configuration.
- Environment validation runs during build and server startup.
- Feature flags default to disabled unless the environment explicitly enables them.
- Local Supabase services remain bound to the developer machine and are never publicly exposed.
```

- [x] **Step 4: Document secret handling**

Create `docs/operations/SECRETS.md`:

```markdown
# Secret Handling

## Browser-safe values

Only variables beginning with `NEXT_PUBLIC_` may enter browser bundles, and only when their values are explicitly safe for public disclosure.

## Server-only values

Server-only values include:

- Supabase service-role credentials;
- payment-provider secrets;
- payment webhook secrets;
- email-provider credentials;
- private Web Push keys;
- monitoring upload tokens;
- cron authentication secrets;
- export signing secrets.

## Storage

- Local secrets belong in `.env.local`.
- Preview, staging, and production secrets belong in the deployment provider's encrypted environment configuration.
- Real secrets never appear in Git, screenshots, issue descriptions, test fixtures, or ordinary logs.
- Rotate any credential immediately after suspected exposure.
```

- [x] **Step 5: Document verification commands**

Create `docs/operations/VERIFICATION.md`:

```markdown
# Verification

## Fast application gate

```bash
pnpm verify
```

This runs formatting, linting, strict type checking, Vitest, repository checks, environment-example checks, and a production build.

## Database gate

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
```

## Browser gate

```bash
pnpm test:e2e
```

## Full Foundation gate

```bash
pnpm verify:full
```

A task or plan is not complete while a required command is failing or has not been run.
```

- [x] **Step 6: Create ADR-001 through ADR-004**

Create `docs/architecture/ADR-001-nextjs-app-router.md`:

```markdown
# ADR-001: Next.js App Router

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use Next.js App Router with strict TypeScript. Server Components are the default, with narrow Client Component boundaries for browser-only interaction.

## Consequences

- Routes, layouts, metadata, loading states, and route handlers use App Router conventions.
- Browser-only packages cannot enter Server Components.
- Authorization remains in server operations and PostgreSQL RLS rather than route visibility alone.
```

Create `docs/architecture/ADR-002-supabase-postgresql.md`:

```markdown
# ADR-002: Supabase PostgreSQL

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use Supabase PostgreSQL as the canonical signed-in data store, with Supabase Auth, Row Level Security, migrations, database functions, and Edge Functions.

## Consequences

- Every account-owned table requires tested RLS.
- Privileged operations remain server-only.
- Migrations are immutable after merge and verified from an empty local database.
```

Create `docs/architecture/ADR-003-indexeddb-dexie.md`:

```markdown
# ADR-003: IndexedDB through Dexie

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use IndexedDB through Dexie for Guest data, drafts, durable cache, and pending operations.

## Consequences

- Browser-local schemas use explicit versioned migrations.
- Guest data has no cloud authority before account conversion.
- Signed-in PostgreSQL data remains canonical.
```

Create `docs/architecture/ADR-004-browser-resilient-cloud-model.md`:

```markdown
# ADR-004: Browser-resilient cloud model

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use a cloud-backed model with browser-local resilience rather than claiming unrestricted offline parity.

## Consequences

- Supported offline commands persist in IndexedDB and synchronize with idempotency keys.
- Online-required actions remain visibly unavailable while offline.
- Conflicts are explicit and never resolved by silently discarding user data.
```

- [x] **Step 7: Create ADR-005 through ADR-008**

Create `docs/architecture/ADR-005-server-authoritative-entitlements.md`:

```markdown
# ADR-005: Server-authoritative entitlements

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Premium access is derived only from verified provider events normalized by backend logic.

## Consequences

- Browser redirects and query parameters cannot grant Premium.
- Provider event processing is signed, idempotent, and auditable.
- Checkout return screens remain pending until entitlement verification completes.
```

Create `docs/architecture/ADR-006-idempotent-commands.md`:

```markdown
# ADR-006: Idempotent commands

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Retryable mutations use stable client-generated identifiers, request hashes, and idempotency keys.

## Consequences

- Offline retries and duplicate callbacks do not duplicate business effects.
- Request payload changes under the same idempotency key are rejected.
- Tests cover duplicate submission and retry behavior.
```

Create `docs/architecture/ADR-007-single-agent-sequential-delivery.md`:

```markdown
# ADR-007: Single-agent sequential delivery

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use one agent to execute numbered implementation plans and tasks sequentially.

## Consequences

- No subagents or parallel task execution are used.
- Each task is verified and committed before the next task begins.
- Dependencies and repository state remain explicit at every checkpoint.
```

Create `docs/architecture/ADR-008-web-push-email-reminders.md`:

```markdown
# ADR-008: Web Push with email fallback

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use Web Push for supported and permitted browser installations, with transactional email as an account-level fallback where enabled.

## Consequences

- Reminder scheduling is distinct from delivery confirmation.
- Browser permission is requested contextually.
- Denied or unsupported Web Push does not block core habit functionality.
```

- [x] **Step 8: Format and commit documentation**

Run:

```bash
pnpm format
pnpm format:check
git add README.md CONTRIBUTING.md docs/architecture docs/operations
git commit -m "docs: document web project foundation"
```

- [x] **Step 9: Run the complete Foundation quality gate from the working tree**

Run:

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
pnpm test:e2e
pnpm check:repository
git status --short
```

Expected:

- frozen installation succeeds;
- formatting, lint, strict typecheck, all Vitest tests, and production build pass;
- database reset and four pgTAP assertions pass;
- Playwright smoke tests pass in desktop and mobile Chromium;
- repository policy passes;
- `git status --short` is empty.

- [x] **Step 10: Verify a clean checkout in a temporary directory**

Run:

```bash
temporary_directory="$(mktemp -d)"
git clone --local . "$temporary_directory/recovery-first-habit-tracker"
cd "$temporary_directory/recovery-first-habit-tracker"
pnpm install --frozen-lockfile
pnpm verify
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:stop
pnpm exec playwright install chromium
pnpm test:e2e
```

Expected: every command passes using only tracked files and generated local dependencies.

- [x] **Step 11: Return to the repository and capture final evidence**

Run:

```bash
cd -
git log --oneline --decorate -13
git status --short
```

Expected:

- commit history contains the Foundation task commits;
- working tree is clean.


---

# 4. Final Acceptance Checklist

Plan 01 is complete only when every statement below is proven by fresh command output:

- [x] Node.js major version is 24 and pnpm is pinned in `package.json`.
- [x] `pnpm install --frozen-lockfile` succeeds from a clean checkout.
- [x] Next.js production build succeeds with explicit safe local environment values.
- [x] Strict TypeScript produces zero errors.
- [x] ESLint produces zero errors.
- [x] Prettier check passes.
- [x] Domain architecture boundary test passes.
- [x] Deterministic clock, ID, Result, AppError, and logger tests pass.
- [x] Environment validation tests pass.
- [x] Liveness and readiness route tests pass.
- [x] Component smoke test passes.
- [x] Playwright passes in desktop and mobile Chromium.
- [x] Supabase Local starts and resets from an empty database.
- [x] Database smoke test reports four assertions and zero failures.
- [x] Repository check finds no forbidden tracked file.
- [x] `.env.example` contains all required Foundation keys and no real secret.
- [x] GitHub Actions workflow references existing commands.
- [x] Required ADR and operations documents exist.
- [x] Working tree is clean.

---

# 5. Plan 02 Handoff Contract

Plan 02 may begin only after the Final Acceptance Checklist passes.

The verified Foundation phase supplies these contracts to Plan 02:

- Next.js App Router route and layout foundation;
- strict TypeScript, ESLint, and Prettier configuration;
- Tailwind CSS processing;
- semantic route groups for public and application areas;
- Vitest and React Testing Library support;
- Playwright desktop and mobile Chromium support;
- deterministic time, ID, Result, AppError, and logging contracts;
- validated browser and server environment readers;
- non-sensitive health endpoints;
- Supabase Local baseline with migration and database-test commands;
- cross-platform verification commands;
- CI quality, database, and browser jobs;
- architecture and operational documentation.

Plan 02 must not weaken these contracts. It may extend scripts, routes, test utilities, CSS, and components while preserving clean-checkout reproducibility and all Plan 01 quality gates.
