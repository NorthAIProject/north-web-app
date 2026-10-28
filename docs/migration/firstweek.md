# firstweek → SvelteKit

Go: `internal/firstweek/handler.go`, `web/firstweek/*.templ`. Helpers: `src/lib/features/firstweek/firstweek.ts`.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/first-week` (card fragment) | `features/firstweek/FirstWeekCard.svelte`, fed by the My Day and Overview loads; the route itself redirects to `/app` | `GET /first-week` |
| `POST /app/first-week/done` | card: `POST` in the browser (409/404 → re-read); no-JS: `?/done` on `/app/first-week` → `/app` | `POST /first-week/done` |
| `GET /app/first-week/review` | `src/routes/(app)/app/first-week/review/+page.server.ts` + `+page.svelte` (409/404 → `/app`) | `POST /first-week/finish` |

## Deliberate differences

- The "3 of 3 days" moment is decided client-side from `days` (Go decided it in the handler).
- `FIRST_WEEK_ENABLED` is off on the local API, so e2e covers the routes and the card's absence; the
  card's day logic is unit-tested (`firstweek.spec.ts`).

## Library candidates

None.

Tests: `tests/e2e/firstweek.spec.ts`, `src/lib/features/firstweek/firstweek.spec.ts`.
