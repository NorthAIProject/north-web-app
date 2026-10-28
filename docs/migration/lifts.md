# lifts

Go: `web/lifts/today.templ`, `web/lifts/import.templ`, `internal/lifts/handler.go`.

| Go route | SvelteKit | API |
| --- | --- | --- |
| `GET /app/lifts/today` (htmx fragment: `LoaderCard` → `TodayCard`, embedded on the training plan page) | `src/lib/features/lifts/TodayCard.svelte` — self-loading, no props; also shown alone at `src/routes/(app)/app/lifts/today/+page.svelte` | `GET /lifts/today` (new) |
| `POST /app/lifts/sets` (log, keeps exercise/weight/reps/kind, clears RIR) | `TodayCard` → browser `POST /api/lifts/sets` with `setNumber: 0` | `POST /lifts/sets` |
| `POST /app/lifts/sets/{setID}/delete` | `TodayCard` → `DELETE /api/lifts/sets/{setID}` (404 ignored, as Go) | `DELETE /lifts/sets/{setID}` |
| `GET /app/lifts/import` | `src/routes/(app)/app/lifts/import/+page.svelte` | — |
| `POST /app/lifts/import` (multipart `file`, drag-and-drop) | default form action in `import/+page.server.ts`, `use:enhance` | `POST /lifts/import/hevy` (multipart) |

`GET /lifts/last`, `/lifts/stats`, `/lifts/sessions/{id}/recap` and `/body/map` have no Go page in
this package (recap/readiness cards render on the training plan and insights pages via the shared
`RecapCard`/`ReadinessCard`); they are unchanged.

Helpers: `src/lib/features/lifts/sets.ts` (`parseSetForm` = Go `parseSetForm` with the same
message keys, `loadLabel`, `rirLabel`, `shortDecimal` = `i18n.Decimal(v, -1)`).

## API changes (north-client-api)

- `GET /lifts/today` → `LiftToday { sets: LiftSet[] (today, oldest first), recent: string[] }`,
  wrapping `Service.Today` exactly as the web handler did.
- `POST /lifts/sets`: `setNumber: 0` now means "the web form's set": the server numbers it as the
  next set of that exercise today and, when `exerciseSlug` is absent, matches the name to the
  catalog (Go web handler's `MatchExercise` + `NextSetNumber`). Previously 0 was a 422, so existing
  clients are unaffected. Documented in openapi `LiftSetInput.setNumber`.

## Deviations

- `/app/lifts/today` is a real page here (Go's was a bare fragment), so the URL leads somewhere and
  the card can be tested on its own.
- A failed import that half-saved (Go: 500 with the counts and `lifts.err.partial`) shows
  `lifts.err.generic`: the API's error does not carry the partial counts.
- Uploads go through a SvelteKit form action; production `BODY_SIZE_LIMIT` (adapter-node defaults to
  512 KB) must be raised to ≥ 11 MB for 10 MB Hevy exports.
- Rail highlight: Go lit "Fitness" (`BuildNav(ctx, "/app/fitness")`); the shell highlights by URL.

## Library candidates

None needed.
