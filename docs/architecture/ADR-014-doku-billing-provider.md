# ADR-014: DOKU Billing Provider for IDR Subscriptions

## Status

Accepted as the active pre-launch provider decision. This ADR supersedes the Paddle provider decision in ADR-012. No customer or Xendit subscription data is being migrated because the application has not launched with paying customers.

## Decision

The application uses DOKU as its active payment provider:

- DOKU Checkout creates the hosted payment session and supports the configured one-time payment methods.
- DOKU Account Billing is the target scheduler for Lite and Premium monthly or annual subscriptions.
- The recurring payment-method options are Direct Debit BRI, OVO, and Credit Card, subject to the merchant capabilities enabled by DOKU.
- All billing amounts are integer IDR values supplied through server-only environment configuration.
- Entitlements remain backend-authoritative and are changed only after a verified DOKU notification or reconciliation result.
- The browser receives only a validated DOKU hosted Checkout URL; it never receives DOKU credentials or payment tokens.

## Provider boundary

DOKU-specific request signing, notification verification, Checkout response parsing, invoice-number mapping, payment-method payloads, and provider identifiers remain inside `src/lib/payments/`. Product, entitlement, idempotency, ordering, and access-control code consumes normalized provider-neutral events.

## Recurring capability boundary

Recurring channels are not interchangeable:

- Direct Debit and OVO use DOKU's SNAP/direct-debit flow and token/authorization lifecycle.
- Credit Card recurring uses DOKU Host-to-Host charge with a billing number.
- Account Billing scheduler operations require the merchant-specific DOKU Account Billing connection and contract. The repository must not invent an SFTP/API payload that DOKU has not enabled for this merchant.

Until sandbox credentials and the activated Account Billing/SNAP channel contracts are supplied, Checkout and signature verification can be tested locally, while live binding, renewal, refund, cancellation, and reconciliation remain release-blocked.

## Migration and rollback

There are no customer records to migrate. New billing records use `doku`; historical provider values remain accepted by the database constraints for compatibility. The removed Xendit worktree directories are not part of the active implementation; their Git branches remain as history.
