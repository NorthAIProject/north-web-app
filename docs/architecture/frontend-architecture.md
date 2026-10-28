# North Web — Frontend Architecture

## Architectural shape

The browser is a presentation and interaction client for the existing API. Keep business rules, persistence, authentication authority, health-data normalization, and aggregation ownership in the backend. SvelteKit supplies routing, rendering, request-scoped server code, and form transport where useful; it is not a second domain backend.

```text
route (+page/+layout) -> feature view -> application component -> API/query function -> existing backend API
          |                    |                 |
       URL state          local UI state     server state cache
```

## Routing and layouts

Use filesystem routing:

- `src/routes/(public)` for landing, sign-in, password recovery, and legal pages.
- `src/routes/(app)` for authenticated pages with the app shell.
- `src/routes/(app)/dashboard`, `/timeline`, `/metrics`, `/workouts`, `/sleep`, `/nutrition`, `/hydration`, `/goals`, and `/coach` for feature entry points.
- Nested `+layout.svelte` files own shell composition; nested `+layout.server.ts` files may enforce authentication when credentials are server-only.
- `+error.svelte` belongs at the root and at important feature boundaries where a tailored recovery state matters.

Prefer route groups for organization without changing URLs. Keep URL filters, date ranges, tabs, and pagination in search parameters so links are shareable and browser navigation works.

## Authentication

Prefer an HttpOnly, Secure, SameSite-appropriate session cookie managed by the backend or a trusted BFF boundary. Never put refresh tokens or long-lived credentials in `localStorage`, URL parameters, or serialized page data. A server hook can resolve the current user into `event.locals`; protected layouts redirect unauthenticated users. If the API requires bearer tokens, keep refresh handling server-side where possible and treat access tokens as short-lived.

If the backend mandates browser-held tokens, document the threat model before implementation. Every client request must handle `401` consistently, avoid refresh stampedes, and redirect only after refresh failure.

## API integration

Create one typed API boundary in `src/lib/api`. It should own base URL resolution, headers, credentials, JSON parsing, error normalization, request IDs, and abort signals. Feature code calls named API functions such as `getDailySummary` rather than assembling URLs inline.

Use SvelteKit server load when:

- the data is required to render the route or shell;
- the request needs private environment variables or server-only credentials;
- the response should be available in the initial HTML;
- route dependencies should re-run through SvelteKit invalidation.

Use TanStack Query when:

- data is interactive, refetchable, paginated, or shared by several mounted widgets;
- a mutation needs invalidation, retries, or optimistic updates;
- stale-while-revalidate behavior is more valuable than blocking navigation;
- the same server state changes independently of route navigation.

Use a direct client request only inside an API/query function or a genuinely one-off browser interaction. Do not scatter `fetch` calls across markup.

Do not fetch the same endpoint in both `load` and `createQuery` by default. Choose one owner. If SSR and client cache hydration are later required, use TanStack’s documented prefetch/dehydrate approach with a fresh QueryClient per request; otherwise use `load` data as the initial route source and let Query own only subsequent interactive state.

## Component architecture

There are three layers:

1. **Primitives** — Bits UI and native HTML for behavior, focus, keyboard interaction, and ARIA.
2. **System components** — shadcn-svelte components and North components for the shared visual language: Button, Card, Dialog, Sheet, DataTable, MetricTile, ChartFrame, Skeleton, EmptyState, and ErrorState.
3. **Feature components** — domain-specific compositions such as SleepScoreCard, DailyTimeline, HydrationGoal, ActivityHeatmap, and CoachConversation.

Feature components receive typed data and callbacks. They should not know how authentication, cache invalidation, or API URLs work. Dashboard widgets should be independently loadable and have explicit loading, empty, partial, stale, and error states.

For visualizations:

- Use semantic HTML first for values and labels.
- Use custom SVG/Svelte for rings, gauges, heatmaps, timelines, and small progress graphics.
- Use LayerChart for charts that need axes, scales, legends, tooltips, multiple series, or non-trivial responsive behavior.
- Provide text summaries and accessible labels for every chart; never make color the only encoding.

## State management rules

- `$state`: ephemeral component state such as open panels, draft input, hover/selection state, and local UI preferences.
- `$derived`: pure values computed from props, `$state`, URL state, or query results.
- `$effect`: browser-only side effects such as integrating a charting imperative API, subscriptions, or analytics. Do not use it to synchronize values that should be `$derived`.
- Props and callbacks: the default parent-child contract. Prefer explicit callbacks over hidden shared mutable state.
- Context: cross-cutting tree-local dependencies such as a form context, query client, or app-shell capabilities. Do not use context as an invisible global store.
- TanStack Query: remote/server state only.
- URL search parameters: shareable view state such as date, range, filter, tab, and page.
- SvelteKit load data: route-scoped data needed for navigation and SSR.

Do not add Redux, Zustand, XState, or a custom global store until a concrete cross-route client-state problem is demonstrated and recorded in an ADR.

## Errors and mutations

Normalize API errors into a small discriminated type: authentication, validation, rate limit, conflict, unavailable, and unknown. Retry idempotent reads on transient network/5xx failures with bounded backoff. Do not blindly retry mutations. Optimistic updates are appropriate for reversible, low-risk UI state such as toggling a habit completion; they are not appropriate when a health record’s authoritative result or audit trail matters more than latency.

After a successful mutation, invalidate the smallest affected query keys and update the URL/load state only when navigation semantics require it. Show toast feedback for transient confirmation; show inline errors for form correction and persistent data problems.

## Rendering and hydration

Keep browser-only APIs behind `browser` guards or in effects. Avoid reading `window`, `document`, or timezone-dependent display values during SSR unless the server and browser inputs are identical. Serialize only data safe for the user and safe to embed in HTML. Use stable initial markup for charts and responsive widgets to avoid hydration mismatch; render measurement-dependent enhancement after mount.

## Environment configuration

Public configuration belongs in `PUBLIC_` variables and may be bundled. Secrets belong in private server environment variables and server-only modules. Validate required configuration at startup or first server request with a clear operational error. Never log tokens, raw health payloads, or personal identifiers.
