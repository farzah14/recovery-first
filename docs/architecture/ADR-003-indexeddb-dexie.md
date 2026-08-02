# ADR-003: IndexedDB with Dexie

## Status

Accepted.

## Context

Guest users require durable browser-local canonical data. Signed-in users require local cache, drafts, and pending operations. Native IndexedDB is asynchronous and transactional but verbose to version and test directly.

## Decision

Use one Dexie database named `recovery_first_web` per website origin. Schema versions are append-only. Guest domain records are not deliberately evicted. Derived query-cache rows are evictable. Migration tests start from every supported prior version.

## Consequences

- Guest data remains limited to the current browser profile and origin.
- Clearing browser storage can remove Guest data.
- Schema changes require explicit Dexie version upgrades.
- Live queue leadership and synchronization are deferred to Plan 05.
