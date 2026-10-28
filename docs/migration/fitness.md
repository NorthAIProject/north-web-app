# fitness → SvelteKit

Go: `web/fitness/{fitness,activities}.templ`, `web/fitness/*_view.go`, `internal/fitness/handler.go`,
`internal/fitness/hub.go`, `internal/fitness/strava`. API: `internal/fitness/api.go` + new
`internal/fitness/hub_api.go`.

| Go route                                               | SvelteKit                                                                                                                                                   | API                                             |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `GET /app/fitness`                                     | `src/routes/(app)/app/fitness/+page.server.ts` + `+page.svelte`                                                                                             | `GET /fitness/hub` (new)                        |
| `GET /app/fitness/activities`                          | `fitness/activities/+page.server.ts` + `+page.svelte`                                                                                                       | `GET /fitness/activities?page=` (new)           |
| `GET /app/fitness/activities/sessions` (HTMX fragment) | pager fetches the API in the browser + shallow `pushState`; the URL itself redirects to `/app/fitness/activities?page=N` (`activities/sessions/+server.ts`) | `GET /fitness/activities/sessions?page=` (new)  |
| `GET /app/fitness/strava/connect`                      | `fitness/strava/connect/+server.ts` (302 to Strava; 404 when unconfigured)                                                                                  | `POST /fitness/strava/connect/web` (new)        |
| `GET /app/fitness/strava/callback`                     | `fitness/strava/callback/+server.ts` → `/app/fitness?notice=…`                                                                                              | `POST /fitness/strava/connect/web/finish` (new) |
| `POST /app/fitness/strava/sync`                        | `fitness/strava/sync/+server.ts` → `/app/fitness?notice=…`                                                                                                  | `POST /fitness/strava/sync`                     |
| `POST /app/fitness/strava/disconnect`                  | `fitness/strava/disconnect/+server.ts` → `/app/fitness?notice=…`                                                                                            | `DELETE /fitness/strava`                        |

Helpers: `src/lib/features/fitness/hub.ts` (all hub_view.go/fitness.templ funcs and the notice
texts), `activities.ts` (trend state, sentence, chart option, session rows, pager numbers),
`ActivitySessions.svelte`. Charts reuse `#lib/features/viz` (`areaLine`, `trainingTrendOption`)
and `SpecChart` / `EChart`.

## Strava OAuth

SvelteKit owns the browser redirect and the callback page; the client secret and the code
exchange stay in Go. `connect/web` takes the web app's absolute
`…/app/fitness/strava/callback` (path is validated; Strava enforces the domain) and stores a
hashed state server-side bound to the signed-in person (reusing the native flow's state table).
`finish` takes `{state, code}`, refuses a state issued to another person (`unverified`), an
unknown/used one (`expired`), and returns `{result}`. This replaces Go's state cookie with the
same guarantee. `?error=` on the callback is `cancelled` without calling the API.

## API added (all additive)

- `GET /fitness/hub` — `FitnessHub`: week (days as local dates), recent sessions, steps/VO2
  series (empty = no card), weight, 30-day strength and cardio, plan next/done-today, today's
  macros, Strava status, device readings. Built by the same `Service.Load` + `buildHubData` the
  Go page uses.
- `GET /fitness/activities`, `GET /fitness/activities/sessions` — trend (days, per-family bands,
  normal line, shape as an open string) and a page of sessions.
- `POST /fitness/strava/connect/web`, `POST /fitness/strava/connect/web/finish`.
- `StravaStatus.unavailable` (optional): connection unreadable → no Connect button.
- Wiring: `fitness.NewAPI(...).WithHub(fitnessHandler.Hub())` in `cmd/web/routes.go`.
- Tests: goldens for the new shapes, `validWebCallback`, `FinishWebConnect` refusing another
  person's state (DB test).

## Deliberate differences

- Go re-rendered the hub with a notice after OAuth/sync/disconnect; here the routes redirect to
  `/app/fitness?notice=<code>` and the page maps known codes to Go's exact English text (unknown
  codes show nothing, so the URL cannot inject text).
- Strava timestamps ("Last synced 2 Jan, 15:04") are shown in the user's zone (Go used the
  server's).
- The WebGL calendar terrain no longer exists in Go: it was replaced by the ECharts training
  chart, which is what is ported. The row "Show" buttons were wired to the terrain's Alpine
  scope, which the Go page no longer has (they did nothing); here they tint that day's rows.

## Not verified visually

Strava is unconfigured locally, so the chart, verdict, KPI strip and session list on
`/app/fitness/activities` render only in code review against Go; the unconfigured state, the hub
and the timer page were screenshot-compared with Go at :8090 (identical layout).

## Library candidates

- MapLibre GL (+ deck.gl): a route map per Strava session (polylines are not imported yet), or a
  revived terrain/heatmap of where someone trains.
- Threlte: only if the 3D calendar terrain is ever brought back (Go removed it).
- Motion: bar growth on the weekly strip.

## Tests

`tests/e2e/fitness.spec.ts`: hub empty state, hub with a logged session, activities unconfigured,
fragment URL redirect, connect 404 when unconfigured, callback cancelled/expired notices,
sync/disconnect redirects + notice, API refuses a foreign callback URL.
