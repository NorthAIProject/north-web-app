# Migrating a Go/templ feature to SvelteKit

The Go web app in `north-client` (`web/<feature>/*.templ` + `internal/<feature>/handler.go`)
is being ported 1:1 to this app. North-client stays the API (`/api/v1`). This is the
recipe every feature port follows, so the result reads as one codebase.

## Where things are

| What | Path |
| --- | --- |
| Go page markup (source of truth for markup, classes, copy keys) | `../north-client-api/web/<feature>/*.templ` |
| Go page handlers (what data a page loads, what each form/htmx call does) | `../north-client-api/internal/<feature>/handler.go` |
| Go JSON API for the feature | `../north-client-api/internal/<feature>/api.go`, contract `../north-client-api/docs/api/openapi.yaml` |
| Generated TS types for the API | `src/lib/api/generated/schema.d.ts` (regenerate: `bun run api:types`) |
| Routes | `src/routes/(app)/app/<same path as Go>/` and `src/routes/(public)/...` |
| Feature components + helpers | `src/lib/features/<feature>/` |
| UI primitives (shadcn-svelte, restyled to match templUI) | `src/lib/components/ui/<name>/index.js` |
| Khepri shared components (mascot, muscle viewer, medal, KPI strip, empty state, markdown, chart…) | `src/lib/components/khepri/` |
| App shell, palette, nav registry | `src/lib/components/layout/`, `src/lib/nav/` |

URLs stay **exactly** as in Go (`/app/goals/{id}` → `src/routes/(app)/app/goals/[id]/`). HTMX
partial-only routes (`/app/x/panels`, `/app/x/body`, `.../bell`) do not become pages; they
become components or client fetches.

## Imports

`#lib/*` is a package.json subpath import: always write the extension.
`#lib/utils.js`, `#lib/i18n/index.js`, `#lib/components/ui/button/index.js`,
`#lib/components/khepri/Mascot.svelte`. Never `$lib`.

SvelteKit 3: `Handle` from `@sveltejs/kit/hooks`; env vars are declared in `src/env.ts` and read
from `$app/env/private`/`$app/env/public`; `browser`/`dev` from `$app/env`.

## Data

- **Reads** (route-critical): `+page.server.ts` `load` with `serverApi(event)` from
  `#lib/server/api.js`. It is an `openapi-fetch` client typed from the contract:
  `const { data } = await serverApi(event).GET('/goals/{goalID}', { params: { path: { goalID } } })`.
  Non-2xx throws `ApiError` (`#lib/api/errors.js`) — let 404s become `error(404)`; let other
  errors bubble to the error page.
- **Writes from forms**: SvelteKit form actions (`export const actions`) calling `serverApi`,
  enhanced with `use:enhance` so they work without JS. Return `fail(status, { errors: err.fields,
  values })` for 422s and show the field messages where Go showed them.
- **Interactive writes / partial refreshes** (everything htmx swapped in place): call the API
  from the browser through the same-origin proxy with `browserApi()` from `#lib/api/client.js`
  (base `/api` → `/api/v1`, bearer added server-side), then `invalidate('north:<feature>')`
  (load calls `depends('north:<feature>')`) or update local `$state`. TanStack Query is
  available for widgets that poll or share state (e.g. the nudge bell's 20 s poll).
- **SSE** (coach replies, crew live, activity): `fetch('/api/...')` / `EventSource('/api/...')`
  through the proxy; it streams.
- **Uploads**: `FormData` POST to `/api/...` through the proxy.
- Never put the token in the browser, never `fetch` the Go origin directly from browser code.

## When the API is missing something

The Go page handler often calls services the JSON API never exposed. Close the gap **in
north-client**, not with logic in SvelteKit:

1. Work in `../north-client-api` (branch `feat/sveltekit-api-parity`). Add the route to the
   feature's `internal/<feature>/api.go` (`Routes(r chi.Router)`, bearer group), reusing the
   service the Go handler already calls. Keep handlers tiny (AGENTS.md there).
2. Describe it in `docs/api/openapi.yaml` — small, targeted edits (other agents edit the same
   file in parallel: re-read right before each edit, never rewrite the file). New response
   enums are **open strings**, never closed enums (a shipped iOS client breaks on a new value).
   Additive changes only; never change an existing field's meaning or type.
3. `export GOCACHE=/private/tmp/claude-502/-Users-fernandocorreiachill-Work-production-apps-north/752d4342-62ca-441e-8ab6-42aa1b62f0fb/scratchpad/gocache`
   then `go build ./... && go test ./internal/<feature>/ && go test ./cmd/web/ -run 'Spec|Contract'`.
   (Other agents' half-done work may break unrelated packages; only your packages must pass.)
4. `bun run api:types` here, then restart the local API:
   `/private/tmp/claude-502/-Users-fernandocorreiachill-Work-production-apps-north/752d4342-62ca-441e-8ab6-42aa1b62f0fb/scratchpad/restart-api.sh`.
5. Do not `git commit` in either repo; the coordinator commits.

## i18n

`const i18n = useI18n();` then `i18n.t('goals.title')`, `i18n.tf('goals.count', n)` (Go fmt
verbs: `%[1]s`, `%d`, `%.1f`), `i18n.decimal(v, 1)`, `i18n.thousands(n)`, `i18n.locale`.
Keys are the **same keys** the templ passes to `i18n.T`/`Tf`; the four catalogues
(`src/lib/i18n/catalogs/*.json`) were exported from Go. If a page needs a string Go built in
Go code (not the catalogue), port the logic to a helper with the same keys. Dates: format with
`Intl.DateTimeFormat(i18n.locale, …)`, in the user's timezone (`data.user.timezone` from the
`/app` layout) — never the server's.

## Markup and behaviour

- Copy the templ's structure and Tailwind classes; swap templUI calls for the matching
  `#lib/components/ui` component (same names: Card, Button, Input, Badge, Dialog, Sheet, …).
- Alpine `x-data` state → `$state`; `x-show` → `{#if}`; htmx swaps → a fetch + state update or
  invalidate; `hx-confirm` → a Dialog; out-of-band swaps → update every affected piece of state.
- Svelte 5 runes only. `$effect` only for browser side effects. Keep SSR markup stable (no
  `window` during render; dates rendered with the user's timezone, not `new Date()` local).
- Page `<title>`: `<svelte:head><title>{pageTitle(i18n.t('…'))}</title></svelte:head>` with
  `pageTitle` from `#lib/brand.js` (Go passed the same string to `layout.App`).
- Wide pages (Go `layout.AppWide`): return `{ wide: true }` from the page's load.
- Feature components take typed data and callbacks; no API URLs inside presentational components.

## Libraries

UI primitives come from shadcn-svelte (https://shadcn-svelte.com/docs/installation/sveltekit).
A primitive that is missing from `src/lib/components/ui/` is added with
`bun x shadcn-svelte@latest add <name>`, then restyled to the templUI look. Do not hand-write it.
If the CLI would install a new npm package for it (Drawer → vaul-svelte, Resizable → paneforge,
Data Table → TanStack Table), treat it like the libraries below.
Charts use shadcn-svelte's Chart (LayerChart); Go's ECharts charts stay on
`components/khepri/EChart.svelte`. Client-side fetching that polls, caches or shares state
uses TanStack Query (`@tanstack/svelte-query`).

The ecosystem picks below are added only when a feature actually needs one. During a feature
port, **do not `bun add` packages** (parallel agents race on `bun.lock`). Where one would fit,
list it under "Library candidates" in `docs/migration/<feature>.md`, saying where and why. They are
installed in one pass at the end.

| Need | Library |
| --- | --- |
| Motion / transitions | Motion (or `svelte/motion` and `svelte/transition`, built in) |
| Advanced timeline animation | GSAP |
| Headless components | Bits UI (already in), Melt UI |
| Interactive charts | LayerChart (via shadcn Chart), ECharts |
| Node/graph editors | Svelte Flow |
| Complex tables | TanStack Table (shadcn Data Table) |
| Maps | MapLibre GL, deck.gl |
| 3D | Threlte (three is already in) |
| Drag and drop | svelte-dnd-action |
| Resizable panels | Paneforge (shadcn Resizable) |
| Icons | `@lucide/svelte` (already in) |

## Done means

1. Every Go route of the feature (page + every form/htmx endpoint it serves) has a SvelteKit
   equivalent: list them in `docs/migration/<feature>.md` with the Go route → Svelte file → API
   endpoint, and note anything deliberately different.
2. `bun x svelte-check --threshold error` is clean for your files.
3. A Playwright spec `tests/e2e/<feature>.spec.ts` (helpers in `tests/e2e/helpers.ts`: `createUser`,
   `signIn`, `api`) covering each page rendering and each main write, passing against the local
   stack (`bunx playwright test tests/e2e/<feature>.spec.ts --project desktop`). The API runs on
   :8090 with the fake AI provider; the dev server on :5173 is already running (do not start
   another or change its port).
4. Pages visually checked: take a screenshot of each page (Playwright `page.screenshot`) and
   compare with the Go page rendered by the same API — the Go app is served at
   http://localhost:8090 (same database), log in there with the same test user.
