# ADR-004: Browser-resilient cloud model

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use a cloud-backed model with browser-local resilience rather than claiming unrestricted offline parity.

## Consequences

- Supported offline commands persist in IndexedDB and synchronize with idempotency keys.
- Online-required actions remain visibly unavailable while offline.
- Conflicts are explicit and never resolved by silently discarding user data.
