# North Web — Frontend Stack

Status: proposed baseline  
Audience: frontend engineers, reviewers, and Claude/code agents  
Scope: browser application only; the existing backend remains the source of truth.

## Decision summary

North Web is a SvelteKit application using Svelte 5 runes, strict TypeScript, Tailwind CSS v4, shadcn-svelte/Bits UI, LayerChart where a charting library is justified, and small custom SVG/Svelte visualizations for domain-specific graphics. Route-critical reads use SvelteKit `load`; interactive server state uses TanStack Query for Svelte. Forms use Superforms plus Zod. Tests use Vitest and Playwright.

The repository instruction says the package manager is **Bun**. The original brief mentioned pnpm; this document resolves that conflict in favor of Bun. Do not add a second lockfile or switch package managers without a new ADR.

## Version policy

Use the latest stable versions that are mutually compatible at the time a dependency is added, then pin them through the repository lockfile and review upgrades deliberately. Do not copy version numbers from this document into `package.json` without checking the package’s current release and peer dependency constraints.

The current scaffold already indicates SvelteKit 3, Svelte 5, Tailwind 4, Vite 8, TypeScript 6, Vitest 4, Playwright, ESLint, Prettier, and `svelte-check`. Existing versions are implementation facts, not a promise that every package should be upgraded independently.

## Selected technologies

| Area | Selection | Responsibility | Alternatives / boundary |
| --- | --- | --- | --- |
| Framework | SvelteKit | Routing, SSR/CSR, layouts, server hooks, rendering, deployment adapter | A standalone Svelte/Vite SPA would lose route/load conventions and SSR options |
| UI | Svelte 5 runes | Component rendering and local reactive state | Do not use legacy `$:`/`export let` in new runes-mode components |
| Language | TypeScript strict | Compile-time contracts for API models, props, forms, and utilities | Avoid `any`; narrow unknown API errors at the boundary |
| Styling | Tailwind CSS v4 + CSS variables | Utility styling and token-backed theme generation | Avoid a second CSS framework; use `@theme` and native variables rather than a legacy JS config for new tokens |
| Components | shadcn-svelte | Copyable, app-owned styled components and composition patterns | Not a remote black-box component dependency; keep generated components accessible and reviewable |
| Primitives | Bits UI | Headless, accessible dialogs, menus, popovers, selects, tabs, etc. | Use native HTML when sufficient; do not duplicate primitive behavior in feature components |
| Charts | LayerChart | Multi-series charts, axes, scales, tooltips, and responsive chart composition | Use custom SVG/Svelte for rings, heatmaps, timelines, and simple progress graphics |
| Icons | Lucide Svelte | Consistent inline icons | Avoid mixing icon families without a documented reason |
| Data loading | SvelteKit `load` | SSR-safe route data and navigation dependencies | Do not duplicate the same query in `load` and a component unless hydration is intentionally designed |
| Server state | `@tanstack/svelte-query` | Client cache, refetching, invalidation, mutations, pagination | Not a global UI store and not a replacement for every `load` function |
| Forms | Superforms + Zod | Typed validation, progressive enhancement, and server/client form state | Native SvelteKit form actions remain useful for simple server-only forms |
| Notifications | Svelte Sonner | Toast feedback for completed or failed user actions | Do not use to communicate persistent errors or important health data |
| API types | `openapi-typescript` if OpenAPI exists | Generate types from the backend contract | Without OpenAPI, maintain small handwritten boundary types and add runtime validation where risk warrants it |
| Unit/component tests | Vitest | Fast tests for pure functions, schemas, query helpers, and component behavior | Browser mode is useful for DOM behavior; it does not replace E2E coverage |
| E2E | Playwright | Real browser journeys, auth flows, responsive checks, and accessibility smoke tests | Keep tests focused on user-visible contracts |
| Quality | ESLint, Prettier, `svelte-check` | Static analysis, formatting, Svelte/TypeScript diagnostics | CI must run all three; formatting is not a substitute for type checking |
| Package manager | Bun | Install, scripts, lockfile, and local developer workflow | pnpm is not selected for this repository |

## Compatibility conclusions

- Svelte 5 runes and current SvelteKit conventions are compatible; new components should use `$props`, `$state`, `$derived`, and `$effect` only for their intended purposes.
- Bits UI 1.x is the Svelte 5 line. shadcn-svelte should be treated as app-owned source built on compatible primitives, not as a reason to mix old Bits UI APIs.
- Tailwind v4 uses CSS-first theme variables. New tokens belong in CSS via `@theme` and runtime semantic variables; do not assume a v3 `tailwind.config.js` is auto-discovered.
- TanStack Query’s Svelte package has a first-class Svelte 5 API, but SSR requires a fresh per-request cache strategy and deliberate dehydration/hydration. Start with SvelteKit `load` for SSR-critical data and introduce Query hydration only when the interaction requires it.
- LayerChart is optional, not foundational. Confirm its current peer compatibility before adding it; a custom SVG is preferred when the visualization is small and domain-specific.

## Non-goals

The web app does not collect HealthKit or Health Connect data, own health-data synchronization, or recreate backend business rules. It consumes normalized API data, presents freshness accurately, and sends user mutations back to the backend.

## Source references

- [SvelteKit introduction](https://svelte.dev/docs/kit/introduction)
- [SvelteKit routing and load files](https://svelte.dev/docs/kit/routing)
- [Svelte 5 `$derived`](https://svelte.dev/docs/svelte/$derived) and [`$effect`](https://svelte.dev/docs/svelte/$effect)
- [TanStack Query for Svelte](https://tanstack.com/query/latest/docs/framework/svelte/overview)
- [TanStack Query SSR and SvelteKit](https://tanstack.com/query/v4/docs/framework/svelte/ssr)
- [Bits UI](https://bits-ui.com/docs/introduction)
- [Tailwind theme variables](https://tailwindcss.com/docs/theme)
- [Vitest browser mode](https://vitest.dev/guide/browser/)
