# ADR-005: Server-authoritative entitlements

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Premium access is derived only from verified provider events normalized by backend logic.

## Consequences

- Browser redirects and query parameters cannot grant Premium.
- Provider event processing is signed, idempotent, and auditable.
- Checkout return screens remain pending until entitlement verification completes.
