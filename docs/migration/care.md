# care + medications → SvelteKit

Go source: `web/care/care.templ`, `web/care/medications.templ`, `internal/care/handler.go`,
`internal/medications/handler.go`. One page, `/app/care`; every write was a small form that
htmx swapped into `#care-panel` (and a plain post + 303 without script).

Here every write is a named form action on `src/routes/(app)/app/care/+page.server.ts`, so the
page still works with no script. Enhanced (`careSubmit` in `src/lib/features/care/forms.ts`),
a success does not follow the 303: it `invalidate('north:care')`s (load reads `GET /care` and
`GET /medications`), clears any earlier rejection and resets the form that was sent. A 422
comes back as `fail(422, { form, errors, values })` and only that form shows its messages,
keeping what was typed (Go: `respond(422, Forms{X: form})`).

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/care` | `care/+page.server.ts` `load`, `care/+page.svelte` | `GET /care`, `GET /medications` |
| `POST /app/care/water` | action `?/water` (`WaterCard`) | `POST /care/water` |
| `POST /app/care/water/{id}/undo` | action `?/undoWater` | `DELETE /care/water/{entryID}` |
| `POST /app/care/sleep` | action `?/sleep` (`SleepCard`) | `PUT /care/sleep` |
| `POST /app/care/habits` | action `?/habit` (`HabitsCard`) | `POST /care/habits` |
| `POST /app/care/habits/{id}/toggle` | action `?/habitDone` | `PUT /care/habits/{habitID}/done` |
| `POST /app/care/habits/{id}/delete` | action `?/habitDelete` | `DELETE /care/habits/{habitID}` |
| `POST /app/care/reminders` | action `?/reminder` (`RemindersCards`) | `POST /care/reminders` |
| `POST /app/care/reminders/{id}/toggle` | action `?/reminderEnabled` | `PUT /care/reminders/{reminderID}/enabled` |
| `POST /app/care/reminders/{id}/delete` | action `?/reminderDelete` | `DELETE /care/reminders/{reminderID}` |
| `POST /app/care/medications` | action `?/medication` (`MedicationsCard`) | `POST /medications` |
| `POST /app/care/medications/{id}/doses` | action `?/dose` | `POST /medications/{medicationID}/doses` |
| `POST /app/care/medications/doses/{id}/undo` | action `?/undoDose` | `DELETE /medications/doses/{logID}` |
| `POST /app/care/medications/{id}/stop` | action `?/medicationStop` | `POST /medications/{medicationID}/stop` |

No API changes were needed.

Components: `src/lib/features/care/` — `CareInstruments` (KPI strip + three instruments),
`WaterCard`, `SleepCard`, `HabitsCard`, `MedicationsCard`, `RemindersCards` (due + manage),
`DayChecks`, `ActionButton` (the one-button forms); wording helpers in `format.ts` (same
i18n keys as the templ helpers), chart options in `charts.ts`.

## Deliberate differences

- **Water and sleep charts** were Chart.js (templUI `chart`, `viz.Bar` / `viz.SingleLine`).
  There is no Chart.js component here, so they are drawn with the shared `EChart` in the same
  shape (signal bars / smooth signal line, no legend, y grid only, y from zero). The habit
  gauge was already ECharts and is ported option for option.
- **Form reset scope**: htmx swapped the whole panel, so a save emptied every form on the page.
  Here only the form that was saved resets; text typed in another form survives.
- **Times** (water entries, as-needed doses) are formatted in the user's timezone from the
  `/app` layout; Go formatted the stored time as-is.
- Sleep description: Go's templ rendered `Last night: 7h 30m , quality 4/5` (a whitespace
  artefact between two expressions); here it reads `7h 30m, quality 4/5`.
- `return_to=/app`: Go's `POST /app/care/water` redirected to `/app` when the dashboard posted
  it. The dashboard's quick-water form belongs to whoever ports `/app`; it should call
  `POST /care/water` itself (the care action always returns to `/app/care`).

## Library candidates

None to install. The playbook routes Go's Chart.js charts to shadcn Chart (LayerChart, already
in `package.json`). Another agent is porting the shared helpers, `#lib/features/viz/chartjs.ts`
(`bar`, `singleLine`) and `#lib/features/viz/echarts.ts` (`gaugeOption`), on top of
`#lib/components/ui/chart`, but that component does not export a `Chart` yet. When it does,
`CareInstruments` should drop `features/care/charts.ts` and use
`bar('care-hydration', 'Water (ml)', …)`, `singleLine('care-sleep', 'Hours', …)` and
`gaugeOption('Adherence', habitRate)`, the same calls Go made in `internal/care/view.go`.

## Tests

`tests/e2e/care.spec.ts` (desktop): page render, water log/undo, sleep 422 + log, habit
add/done/undone/delete, reminder add/disable/enable/delete, medication add/taken/undo,
as-needed dose, stop, and a no-script water post. Run with an isolated output dir when other
specs run in parallel (`--output <dir> --trace off`): shared `test-results/` gets wiped.
