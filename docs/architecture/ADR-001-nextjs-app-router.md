# ADR-001: Next.js App Router

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use Next.js App Router with strict TypeScript. Server Components are the default, with narrow Client Component boundaries for browser-only interaction.

## Consequences

- Routes, layouts, metadata, loading states, and route handlers use App Router conventions.
- Browser-only packages cannot enter Server Components.
- Authorization remains in server operations and PostgreSQL RLS rather than route visibility alone.
