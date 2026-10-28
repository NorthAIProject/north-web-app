# checkins → SvelteKit

Go: `web/checkins/*.templ`, `internal/checkins/handler.go`. API: `internal/checkins/api.go`.

| Go route                           | SvelteKit                                                                  | API                                  |
| ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| `GET /app/check-ins`               | `src/routes/(app)/app/check-ins/+page.server.ts` (load) + `+page.svelte`   | `GET /check-ins`, `GET /goals`       |
| `POST /app/check-ins`              | action `?/save`                                                            | `PUT /check-ins/today`               |
| `GET /app/check-ins/live`          | TanStack `createQuery(['checkins', userId])`, 20 s poll + refetch on save  | `GET /check-ins`                     |
| `GET /app/check-ins/today/reply`   | `SavedPanel.svelte` `reply` prop, fetched from the browser                 | `POST /check-ins/today/reply`        |
| `PATCH/DELETE /app/check-ins/{id}` | `check-ins/[id]/+server.ts`, JSON instead of fragments (no UI used them in Go) | `PATCH/DELETE /check-ins/{id}` exist |

Components in `src/lib/features/checkins/`: `CheckInWizard.svelte` (five steps, all panes stay in
the form so every field submits), `ScalePicker.svelte`, `SavedPanel.svelte` (moment, receipt, run
line, rests, week dots, coach note), `LiveRegion.svelte` (history, KPIs, charts),
`MoodEnergyChart.svelte` + `MoodEnergyLines.svelte`, `DictateField.svelte`, `checkins.ts` (helpers).

**Dictation slot:** `DictateField.svelte` takes `mic?: Snippet<[target: string]>`. When it is set,
the field gets right padding and the mic sits bottom-right. The wizard, the mind journal and the goal
fields all pass `mic` through. Plug `src/lib/features/voice/Dictate.svelte` in there.

## API added

- `CheckInList.previousRun`: drives the "run of N, previous was M" line.
- `CheckInRequest.source` accepts `"web"`, so check-ins filed from the SvelteKit app are labelled web
  rather than iOS. The contract test was updated to match.

## Deliberate differences

- Chart data is computed client-side from `GET /check-ins`: the trailing 14 days, in the user's
  timezone. The mood/energy line uses LayerChart (shadcn Chart). The heatmap stays on
  `EChart.svelte` via the shared `heatmapOption`.
- Go used a version-204 probe. The live region instead polls every 20 s, and also refetches on
  the `checkin-saved` event.
- Without JS, a save re-renders with the saved panel instead of Go's `?saved=1` redirect.
- The coach reply is a browser POST and is only loaded for today's check-in.
- The crisis path is unchanged: Go has no web-specific UI for it (the coach-reply prompt handles it).
- LayerChart crashes under SSR (`ERR_UNKNOWN_FILE_EXTENSION .svelte`), so `MoodEnergyLines` is
  lazy-imported on the client. **vite.config needs `ssr.noExternal: ['layerchart']`**. That file
  is shared, so this is left for the coordinator.

## Library candidates

- None new. LayerChart is already installed, but it needs the SSR config above.

## Tests

`tests/e2e/checkins.spec.ts`: empty state and wizard validation; save → saved panel, moment and run
line → edit; history, KPIs and both charts.
