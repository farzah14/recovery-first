# ADR-002: Supabase PostgreSQL

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use Supabase PostgreSQL as the canonical signed-in data store, with Supabase Auth, Row Level Security, migrations, database functions, and Edge Functions.

## Consequences

- Every account-owned table requires tested RLS.
- Privileged operations remain server-only.
- Migrations are immutable after merge and verified from an empty local database.
