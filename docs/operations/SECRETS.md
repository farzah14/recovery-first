# Secret Handling

## Browser-safe values

Only variables beginning with `NEXT_PUBLIC_` may enter browser bundles, and only when their values are explicitly safe for public disclosure.

## Server-only values

Server-only values include:

- Supabase service-role credentials;
- payment-provider secrets;
- payment webhook secrets;
- email-provider credentials;
- private Web Push keys;
- monitoring upload tokens;
- cron authentication secrets;
- export signing secrets.

## Storage

- Local secrets belong in `.env.local`.
- Preview, staging, and production secrets belong in the deployment provider's encrypted environment configuration.
- Real secrets never appear in Git, screenshots, issue descriptions, test fixtures, or ordinary logs.
- Rotate any credential immediately after suspected exposure.
