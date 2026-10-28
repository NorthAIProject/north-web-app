# insights → SvelteKit

Go: `internal/insights/handler.go` (`/app/insights/*`), `web/insights/*.templ`, view builders in
`internal/insights/*_view.go`. JSON API: `internal/insights/api.go`, `domain_api.go`,
`internal/stats/api.go`. Every page has a Go `/body` (or `/panels`) fragment the range selector swapped
in with htmx; here the range options are plain links to `?range=` that SvelteKit follows client-side
(`data-sveltekit-noscroll`, `data-sveltekit-reset="false"`): the page load re-runs and only the panels
re-render. So no `/body` route exists.

Shared pieces (`src/lib/features/insights/`): `InsightsPage.svelte` (Go `page`/`pageAfter`: header,
section nav, range selector), `sections.ts`, `format.ts`, `load.ts` (`rangeQuery`, `readOr404`),
`StatTile`, `DeltaChip`, `PanelEmpty`.

## Routes

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/insights` (+ `/panels`) | `src/routes/(app)/app/insights/+page.*`, `features/insights/summary/` | `GET /insights?range=`, `GET /awards` (awards card) |
| `GET /app/insights/timeline` (+ `/body`, `?kind=`) | `insights/timeline/`, `features/insights/timeline/TimelinePanels.svelte` | `GET /insights/timeline?range=&kind=` |
| `GET /app/insights/body` (+ `/body/body`) | `insights/body/`, `features/insights/body/BodyPanels.svelte` | `GET /insights/body` |
| `GET /app/insights/mind` (+ `/body`) | `insights/mind/`, `features/insights/mind/MindPanels.svelte` | `GET /insights/mind` |
| `GET /app/insights/progress` (+ `/body`) | `insights/progress/`, `features/insights/progress/ProgressPanels.svelte` | `GET /insights/progress` |
| `GET /app/insights/training` (+ `/body`) | `insights/training/`, `features/insights/training/` (TrainingPanels, LiftingSection, `recap.ts`) | `GET /insights/training` |
| `GET /app/insights/nutrition` (+ `/body`) | `insights/nutrition/`, `features/insights/nutrition/NutritionPanels.svelte` | `GET /insights/nutrition` |
<!-- sleep, cardio, patterns, coach, spend, metric/{key}: see the stats/coach/spend/metric port's section -->

## API changes

- `InsightsSummary.days` (required, possibly empty): the day-by-day table Go rendered and the projection
  dropped (`SummaryView.Days`/`HasDays`).
- `InsightsTimelineEntry.href`, `.icon`; `InsightsTraining.lifting` (new `InsightsLifting`);
  `InsightsNutrition.eating` (new `InsightsEating`, reusing `InsightsStatsRow`/`InsightsStatsBar`).

## Charts

Go drew two kinds of chart. ECharts options (`viz.GaugeOptionJSON`, `HeatmapJSON`, `DonutOptionJSON`,
`TrainingTrendJSON`) are ported key for key in `src/lib/features/viz/echarts.ts` and drawn by
`#lib/components/khepri/EChart.svelte`. Chart.js charts (templUI chart + `viz.Bar`, `SingleLine`,
`Sparkline`, `GroupedBar`, `StackedBar`, `AreaLine`, `MoodEnergyLine`) became **shadcn-svelte Chart
(LayerChart 2.9)**: `src/lib/features/viz/chartjs.ts` builds the same `chart.Props` shape
(`ChartSpec`) and `SpecChart` (`#lib/components/ui/chart/spec-chart.svelte`) draws it with
`BarChart`/`LineChart`/`AreaChart`, styled like north-client's `chart.js` (token colours, muted tick
labels, `--border` grid, legend on top, square bars, dots only on hover, tooltip on the page background
with a `--border` hairline).

| Go chart | Now |
| --- | --- |
| Summary score rings (`GaugeOptionJSON`) | EChart |
| Summary pinned sparklines (`viz.Sparkline`) | LayerChart (`SpecChart`) |
| Body water / sleep, mind journal, progress notes, training burn, lifting weekly, nutrition calories (`viz.Bar`, `SingleLine`) | LayerChart |
| Mind mood/energy (`viz.MoodEnergyLine`) | LayerChart (axis fits the data: Go's yMin/yMax sat in a raw config Chart.js ignored) |
| Training recap volume (`viz.GroupedBar` via workoutsummary) | LayerChart |
| Body habit gauge, mind heatmap, progress status donut, training kinds donut, nutrition macro split | EChart |

## Deliberate differences / gaps

- No `/body` or `/panels` routes: the range links re-run the page load client-side.
- The timeline's range links drop `kind`, as Go's did.
- The training recap card has not been seen rendering with test data (logged sets are not tied to a
  session through the public API).
- LayerChart picks its own tick counts; axis ticks can differ from Chart.js's.

