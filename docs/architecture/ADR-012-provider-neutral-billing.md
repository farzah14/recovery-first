# ADR-012: Provider-Neutral Billing with Authoritative Entitlements

## Status

Accepted.

## Decision

The initial website billing adapter uses Paddle Billing in sandbox. Product code depends on the internal `PaymentProvider` and normalized billing-event contracts; Paddle event names, price IDs, signatures, and SDK entities remain inside the server-only adapter boundary.

Checkout is created by the authenticated server with server-owned custom data. The browser return URL and Paddle.js events are informational only. Lite or Premium access changes only after a verified webhook or authoritative provider reconciliation updates PostgreSQL.

## Consequences

- Lite and Premium price IDs are read from server configuration and are never selected by browser input.
- Webhook signatures are verified before normalization; invalid events cannot produce entitlement state.
- Normalized events have deterministic status, account, product, and entitlement-window fields.
- Customer portal URLs are created on demand and are not persisted.
- A replacement provider must satisfy the same internal contract tests.
- Trial cancellation, expiry, refund, and revocation remain explicit non-destructive entitlement states.
