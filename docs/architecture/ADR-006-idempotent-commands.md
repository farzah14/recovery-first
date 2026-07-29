# ADR-006: Idempotent commands

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Retryable mutations use stable client-generated identifiers, request hashes, and idempotency keys.

## Consequences

- Offline retries and duplicate callbacks do not duplicate business effects.
- Request payload changes under the same idempotency key are rejected.
- Tests cover duplicate submission and retry behavior.
