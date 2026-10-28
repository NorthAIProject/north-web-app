# day (My Day) + small trackers + lighterday → SvelteKit

Go: `internal/day/handler.go`, `web/day/{day,cards,trends}.templ`, `web/day/view.go`; the tracker
handlers `internal/{caffeine,fasting,supplements,screentime,soreness,milestones}/handler.go`,
`internal/health/web.go`; `internal/lighterday/handler.go`, `web/lighterday/lighterday.templ`.
View model: `src/lib/features/day/view.ts` (a port of `BuildView`, `BuildRail`, `SleepBars`, the
gauge/ring geometry, `BuildTrends`).

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app` (`?date=`) | `src/routes/(app)/app/+page.server.ts` (load) + `+page.svelte`, `features/day/*` | `GET /day?date=`, `GET /day/rules`, `GET /body/map?days=7`, `GET /body/current`, `GET /progress/checks`, `GET /first-week` |
| `POST /app/day/rules` | `?/rules` | `PUT`/`DELETE /day/rules/{kind}` |
| `GET /app/day/checkin` (streak tile poll) | `features/day/StreakLive.svelte` (TanStack Query, 20 s + `checkin-saved`) | **new** `GET /day/checkin?v=` (204 when current) |
| `GET /app/day/trends` | `features/day/Trends.svelte`, mounted in `features/overview/OverviewPanels.svelte` | `GET /day/trends` |
| `POST /app/caffeine` | `?/caffeine` | `POST /caffeine` |
| `POST /app/fasting/start`, `/stop` | `?/fastStart`, `?/fastStop` | `POST /fasting/start`, `/fasting/stop` |
| `POST /app/supplements` | `?/supplement` | `POST /supplements` |
| `POST /app/screen-time` | `?/screen` | `PUT /screen-time` |
| `POST /app/soreness` | `?/soreness` (severity 0 → delete) | `PUT`/`DELETE /soreness/{region}` |
| `POST /app/trackers`, `/trackers/{id}/done` | `?/tracker`, `?/trackerDone` | `POST /trackers`, `POST /trackers/{id}/done` |
| `POST /app/blood-pressure` | `?/bloodPressure` | `POST /health/blood-pressure` |
| `POST /app/settings/target-weight` (from the body dialog) | `?/targetWeight` (keeps the dialog open) | `PUT /settings/target-weight` |
| water (quick add / card, Go posted to care) | `?/water` | `POST /care/water` |
| `GET /app/today/lighter` | `features/lighterday/LighterDayCard.svelte` (self-loading), mounted in the Overview training panel | `GET /today/lighter` |
| `POST /app/today/lighter` | card: `PUT` in the browser; no-JS: `src/routes/(app)/app/today/lighter/+page.server.ts` default action → `/app` | `PUT /today/lighter` |

API additions (north-client-api, `internal/day/api.go`, `internal/lighterday/api.go`, openapi):
`GET /day/checkin`; `DayResponse.around` (yesterday/tomorrow entries for the rail's extended window),
`fasts`, `checkIn` (streak tile), `presets` (caffeine/supplement presets, soreness regions);
`DayTimelineEntry.presetKey`; `LighterDay.covered` (the outreach message already covers today; the
card hides, as Go's handler did).

## Deliberate differences

- Go swapped fragments with htmx; here each write is a named form action with `use:enhance`, then
  the page's load re-runs (`depends('north:day')`). Dialogs that Go kept open after a swap (body,
  water "other") stay open. Failures toast the localised error instead of an inline 422 fragment.
- The fast "started" label and the trend fast dates stay English (`time.Format` in Go).
- Recap strip, outreach card and first-week card are mounted from their own features.

## Library candidates

- `svelte/motion` (`Tween`) or Motion for ring/gauge fill transitions on value change (Go had none;
  would be new polish, not parity).

Tests: `tests/e2e/day.spec.ts` (render, other date, water, quick-add trackers, fast, body dialog,
rules marker, streak live refresh).
