# ADR-003: IndexedDB through Dexie

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use IndexedDB through Dexie for Guest data, drafts, durable cache, and pending operations.

## Consequences

- Browser-local schemas use explicit versioned migrations.
- Guest data has no cloud authority before account conversion.
- Signed-in PostgreSQL data remains canonical.
