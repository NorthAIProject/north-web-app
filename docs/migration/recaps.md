# recaps → SvelteKit

Go: `internal/recaps/handler.go`, `web/recaps/{recaps.templ,view.go}`. API: `internal/recaps/api.go`
(unchanged — the page view is built from the raw recap in `src/lib/features/recaps/view.ts`, a port of
`web/recaps/view.go`).

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/recap` | `src/routes/(app)/app/recap/+page.server.ts` (load) + `+page.svelte`, `features/recaps/RecapPanels.svelte` | `GET /recap?range=week\|month` |
| `GET /app/recap/panels` | not a page: the 7/30-day links navigate to `?range=` and re-run the load client-side (`data-sveltekit-noscroll`, `data-sveltekit-reset="false"`) | same |
| `POST /app/recap/share` | `?/share` form action on `/app/recap` (`use:enhance`), redirects to `/app/recap?range=…&posted=posted\|hidden` like Go | `POST /recap/share {range, shareTraining}` |
| `GET /app/recap/strip` | `features/recaps/RecapStrip.svelte` — fetches the week after mount through the `/api` proxy (Go: `hx-trigger="load"`), renders nothing on error | `GET /recap?range=week` |

## Deliberate differences

- The share form posts to `/app/recap?/share` instead of `/app/recap/share` (SvelteKit named action).
- The share link (`ShareURL`, Go `cfg.BaseURL`) is the request's origin.
- The daily chart (Go `viz.StackedBar`, Chart.js) and the strip sparkline (Go `viz.Sparkline`) are
  drawn with shadcn-svelte Chart / LayerChart via `SpecChart` (`#lib/components/ui/chart`), legend on
  top like Chart.js; its swatches are squares rather than Chart.js's wide boxes.
- `RecapStrip` is not mounted yet: My Day (`src/routes/(app)/app/+page.svelte`, another port) should
  render `<RecapStrip />` where its comment says.

Tests: `tests/e2e/recaps.spec.ts` (empty week, populated week + 30-day switch, post → hidden notice →
"Share training and post" → posted, share-button clipboard fallback).
