# ADR-004: Deterministic Domain Rules

## Status

Accepted.

## Context

Habit limits, recurrence validation, check-in metrics, continuity, Recovery counters, and entitlement interpretation must produce the same result in tests, browser-local workflows, and authoritative server transactions.

## Decision

Implement framework-independent TypeScript domain functions for client and test use. Mirror transaction-sensitive invariants in PostgreSQL functions and constraints. Use fixed UUIDs and timestamps in database fixtures. Store immutable habit versions rather than mutating historical definitions.

## Consequences

- UI components cannot own business rules.
- PostgreSQL remains authoritative for signed-in writes.
- Cross-language fixtures must be reviewed when algorithms change.
- Derived metrics can be recomputed from authoritative sessions and check-ins.
