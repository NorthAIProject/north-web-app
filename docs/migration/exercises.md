# exercises

Go: `web/exercises/exercises.templ`, `web/exercises/exercises_view.go`, `internal/exercises/handler.go`.

| Go route | SvelteKit | API |
| --- | --- | --- |
| `GET /app/exercises` (filter GET form, `?q&muscle&category&equipment&page`) | `src/routes/(app)/app/exercises/+page.server.ts`, `+page.svelte` | `GET /exercises?limit=24&offset=` (re-run at the last page when `page` is past the end) |
| `GET /app/exercises/{slug}` | `src/routes/(app)/app/exercises/[slug]/` | `GET /exercises/{slug}`, `GET /training/plans` (first = followed plan) + `GET /training/plans/{id}` for the "add to a day" days, `GET /exercises?muscle=&limit=5` for similar |
| `GET /app/exercises/{slug}/muscles` (htmx partial for the coach transcript) | component `src/lib/features/exercises/ExerciseMuscles.svelte` (`<ExerciseMuscles slug=… />`), no route | `GET /exercises/{slug}` through `/api`, TanStack Query cached per slug |
| "add to a day" form (`POST /app/training/{id}/days/{day}/exercises`, `catalog_slug`) | plain form posted to the training feature's route (owned by training) | — |

Helpers: `src/lib/features/exercises/vocabulary.ts` (vocabularies, labels with Go's humanize fallback,
`pageURL` with Go's sorted query encoding, `weekdayName`, `dayLabel`), `ExerciseRow.svelte`,
`FilterSelect.svelte` (bits-ui Select with a hidden input so the GET form submits without JS).

## API changes (north-client-api)

- `ExerciseSummary` and `ExerciseDetail` gained `illustrationSlug` (omitempty): the web masks the
  artwork files under `/assets/exercises/{illustrationSlug}/` rather than drawing `art` path data.
  Golden file `internal/exercises/testdata/exercises.golden.json` updated.

## Deviations

- The rail highlights by URL; Go lit "Fitness" for these pages (`BuildNav(ctx, "/app/fitness")`).
  Shell-wide question, left to the shell owner.
- `/muscles` is a component, not a route (playbook: htmx partials become components). The chat port
  should render `ExerciseMuscles` where Go swapped the partial in.

## Library candidates

None needed.
