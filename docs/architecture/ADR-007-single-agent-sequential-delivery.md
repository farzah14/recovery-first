# ADR-007: Single-agent sequential delivery

**Status:** Accepted  
**Date:** 2026-07-28

## Decision

Use one agent to execute numbered implementation plans and tasks sequentially.

## Consequences

- No subagents or parallel task execution are used.
- Each task is verified and committed before the next task begins.
- Dependencies and repository state remain explicit at every checkpoint.
