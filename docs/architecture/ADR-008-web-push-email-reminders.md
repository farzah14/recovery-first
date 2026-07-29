# ADR-008: Web Push with email fallback

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use Web Push for supported and permitted browser installations, with transactional email as an account-level fallback where enabled.

## Consequences

- Reminder scheduling is distinct from delivery confirmation.
- Browser permission is requested contextually.
- Denied or unsupported Web Push does not block core habit functionality.
