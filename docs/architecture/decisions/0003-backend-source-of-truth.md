# ADR 0003: Keep the existing API as the source of truth

- Status: accepted
- Date: 2026-10-26

## Context

North already has a backend handling authentication, business rules, persistence, and normalized health data. Native iOS and planned Android clients use that platform. Reimplementing those rules in SvelteKit would create divergent behavior and data semantics.

## Decision

The web app consumes the existing API and owns presentation, client interaction, and request orchestration only. SvelteKit server code may proxy or adapt transport concerns, but must not become a second domain backend.

## Consequences

API contracts, freshness metadata, units, timezone semantics, and error codes must be documented and versioned by the backend. Web-specific view models may exist, but they must map from API data rather than silently inventing business rules.
