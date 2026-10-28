# Overview (dashboard): Go → SvelteKit

Go sources: `internal/dashboard/handler.go`, `web/app/dashboard.templ` (+ panels/today partials).
SvelteKit: `src/routes/(app)/app/overview/`, `src/lib/features/overview/`.

## Pages and partials

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/overview?range=` | `overview/+page.server.ts` load → `+page.svelte` | `GET /overview?range=` (new) |
| `GET /app/overview/panels` (htmx, range switch) | plain links with `data-sveltekit-reset="false"`; the load reruns | `GET /overview?range=` |
| `GET /app/overview/today` (htmx `checkin-saved from:body, every 20s`) | `onCheckInSaved()` in `+page.svelte` → `invalidate('north:overview')` only when the version moved | `GET /overview/version` (new) |
| briefing prompt form | `?/briefing` action (`use:enhance`) | `POST /reports/briefing` (409 → `/app?notice=cooldown`, 429 → `QuotaPanel`) |
| reflect form | posts to `/app/chat?/start` with `kind=reflection` | owned by the chat port |

## API added (north-client)

- `internal/dashboard/api_overview.go`: `GET /overview` returns `OverviewResponse`, which carries the
  TodaySnapshot plus the plan day, check-ins, habits, hydration and the ticker flag. `GET /overview/version`.
  The goldens are in `internal/dashboard/testdata/overview*.golden.json`.
- `internal/quota/middleware.go`: the JSON 429 now carries `code: "quota_exceeded"` and
  `fields: {action, retryAfter}`, which is what `QuotaPanel` reads.

## Deliberate differences

- Chart.js mood/energy line and hydration bars are now LayerChart, through shadcn Chart. The point markers are kept.
  The heatmap, habits gauge and donut stay on ECharts (`EChart.svelte`).
- "Mood"/"Energy" series labels stay English, as in Go.
- These embeds are not mounted here. Their owners' components go in once they exist: the first-week card,
  the lighter-day offer and the day-trends cards.

## Library candidates

- **Motion** (or `svelte/transition`): KPI delta chips and the Today card swapping in after a live refresh.
  Go had no animation, so this is optional.
