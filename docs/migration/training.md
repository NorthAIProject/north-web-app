# Training (workouts + training import)

Go: `internal/workouts/handler.go`, `week_handler.go`, `web/workouts/*.templ`; the training half of
`internal/planimport/handler.go` + `web/planimport/{upload,workout}.templ`.
Svelte: `src/routes/(app)/app/training/**`, `src/routes/(app)/app/workouts/[id]`, `src/lib/features/training/`.
Spec: `tests/e2e/training.spec.ts`.

## Routes

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /training` | `training/+page.server.ts` (redirect: newest plan or `/new`) | `GET /training/plans` |
| `GET /training/new` | `training/new/+page.svelte` | `GET /training/intake` |
| `POST /training/new` | `training/new` default action | `POST /training/plans` |
| `GET /training/plans` | `training/plans/+page.svelte` | `GET /training/plans` |
| `GET /training/{id}` | `training/[id]/+page.svelte` | `GET /training/plans/{id}`, `GET /training/plans`, `GET /training/overview` (new), `GET /training/week` |
| `POST /training/{id}/activate` | `training/[id]/activate` default action (FollowCard form) | `POST /training/plans/{id}/activate` |
| `GET /training/week` (htmx: card / next week) | `WeekSection.svelte`, browser fetch | `GET /training/week[?week=next]` |
| `GET /training/week/edit` (htmx: editor) | `WeekSection.svelte` editor state | — |
| `POST /training/week/edit` (htmx: preview) | `WeekSection.svelte` `preview()` | `POST /training/week/suggestion` |
| `POST /training/week` | `WeekSection.svelte` `save()` | `PUT /training/week` |
| `POST /training/week/reset` | `WeekSection.svelte` `reset()` | `DELETE /training/week` |
| `GET /training/{id}/days/{day}` (htmx: picker Cancel) | `DayCard.svelte` local state | — |
| `GET /training/{id}/days/{day}/add` (htmx: add picker) | `PickerPanel.svelte` | `GET …/days/{day}/suggestions[?q=]` (q new) |
| `GET /training/{id}/days/{day}/exercises/{index}/swap` | `PickerPanel.svelte` | `GET …/exercises/{index}/replacements[?q=]` (q new) |
| `POST /training/{id}/days/{day}/exercises` (htmx) | `DayCard.svelte` → `edits.add` | `POST …/days/{day}/exercises` |
| `POST /training/{id}/days/{day}/exercises` (plain form, exercise page "add to a day") | `training/[id]/days/[day]/exercises` default action | same |
| `POST …/exercises/{index}/swap` | `edits.swap` | `PUT …/exercises/{index}` |
| `POST …/exercises/{index}/remove` (hx-confirm) | `ExerciseRow.svelte` Dialog → `edits.remove` | `DELETE …/exercises/{index}` |
| `POST …/exercises/{index}/move` | `edits.move` | `POST …/exercises/{index}/move` |
| `POST …/exercises/{index}/sets` | `edits.setPrescription` | `PUT …/exercises/{index}/prescription` |
| `POST /training/{id}/days/{day}/start-time` | `edits.setStartTime` | `PUT …/days/{day}/start-time` |
| `GET /workouts/{id}` (legacy nudge link) | `workouts/[id]/+page.server.ts` (301) | — |
| `GET /training/import` | `training/import/+page.svelte` (`ImportUpload`) | — |
| `POST /training/import` (parse) | `training/import` default action → `ImportReview` | `POST /training/import/parse` (multipart) |
| `POST /training/import/review` | `training/import/review` default action (save) | `POST /training/import` |

Every edit stores a new plan version (append-only). The page shows the version the API answers
with, then `goto`s its URL (Go: `HX-Push-Url`), so reload shows what is on screen. A 409
(superseded) answers with the newest version, which is shown the same way (Go: `afterEditError`).

## API added (north-client-api)

- `GET /training/overview` → `{ recap?: LiftRecap, readiness?: TrainingReadiness }`: this week's
  latest workout and the body's readiness, which Go's `planView` added from the lifts service.
  `internal/workouts/overview_api.go`; wired with `workouts.NewAPI(…).WithRecaps(liftSvc).WithLoads(liftSvc)`.
- `?q=` on `…/days/{day}/suggestions` and `…/exercises/{index}/replacements`: the picker's search
  (Go: `fillPicker` → `SearchCatalog`).
- `DayExercise.illustrationSlug` and `DayExercise.stabilizerMuscles` (additive): the row artwork
  and the muscles dialog's third tier.
- Golden `internal/workouts/testdata/plan.golden.json` updated for the two fields.

## Deviations

- Removes on the import review happen in the page; only Save posts (Go posted the whole draft back
  on every Remove). `/training/import/review` keeps its URL as the save action.
- Edits, the picker and the week editor need JavaScript (Go's htmx ones did too); the follow
  button, intake, import and the exercise page's add-to-day form work without it.
- A refused edit (422, e.g. "an exercise needs at least one set") shows the plan's message above the
  days; Go answered a bare "That request could not be read." and htmx swapped it in.
- The week editor lists plans from `GET /training/plans` (20); Go read 50.
- "From another plan" in the week compares the session's plan version with the followed plan's
  current version; Go compared intake ids. Same answer unless a version is stale.
- The recap's volume chart is drawn with ECharts (`EChart`) from the same grouped-bar config Go fed
  Chart.js.
- Intake failure copy stays English, as in Go (`submitIntake`).

## Library candidates

- **svelte-dnd-action**: dragging exercises within a day (`DayCard.svelte`) as well as the up/down
  buttons, which stay because order is training information and Go has no drag.
- **LayerChart (shadcn Chart)**: the recap volume chart, if recaps move off ECharts app-wide.

## Notes

- Locally the fake AI provider cannot write a plan, so `POST /training/plans` answers 503 and the
  intake shows its failure notice above the form. The spec arranges plans through the import commit.
- The set logger on the plan page is the lifts feature's `TodayCard`.
