# Visual Regression Testing Guide

## Overview

Visual regression testing in Recovery First ensures that visual tokens, light-theme surface contrast, typography scale, responsive breakpoints (`390px`, `834px`, `1280px`, `1440px`), and interactive component baselines maintain pixel-level consistency across changes.

## Commands

Run visual baseline specs via Playwright:

```bash
pnpm test:visual
```

Run Playwright E2E suite:

```bash
pnpm test:e2e
```

## Maintenance Procedure

1. Run visual baseline checks before releasing any design system changes.
2. Update Playwright visual snapshots when design specifications are intentionally modified.
3. Confirm that light-theme contrast ratios satisfy Web Content Accessibility Guidelines (WCAG 2.1 AA) before accepting snapshot updates.
