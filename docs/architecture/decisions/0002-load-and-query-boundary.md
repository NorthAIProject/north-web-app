# ADR 0002: Separate route loading from client server state

- Status: accepted
- Date: 2026-10-26

## Context

SvelteKit can load data during SSR and client navigation. TanStack Query adds caching, refetching, invalidation, and mutation workflows. Using both without a boundary causes duplicate requests, hydration mismatches, and unclear ownership.

## Decision

SvelteKit `load` owns route-critical and server-only data. TanStack Query owns interactive, cacheable, refetchable server state. A read has one default owner. Query hydration is an explicit optimization requiring a per-request QueryClient and documented dehydration/hydration.

## Consequences

Navigation remains predictable and SSR-safe. Interactive widgets gain cache and mutation behavior without turning every route into a client-only app. Engineers must decide ownership before adding a second fetch path.
