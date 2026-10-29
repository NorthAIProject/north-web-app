# calculator

Go: `internal/calculator/handler.go`, `web/calculator/calculator.templ`.

| Go route | SvelteKit | API |
| --- | --- | --- |
| `GET /app/calculator` | `src/routes/(app)/app/calculator/+page.server.ts` `load`, `+page.svelte` | `GET /calculator`, `GET /settings/preferences` (units) |
| `POST /app/calculator/biometrics` | same route, action `?/biometrics` | `PUT /calculator/biometrics` |
| `POST /app/calculator/generate` | same route, action `?/generate` | `POST /calculator/plan` |

Helpers: `src/lib/features/calculator/units.ts` (macroplan `ToMetric`/`Display`/`WeightUnit`/`HeightUnit`,
Go-style `%.0f` rounding), `ChoiceSelect.svelte`.

## API additions (north-client `internal/calculator/api.go`, openapi `Calculator`)

- `biometrics.ageYears` — the age the card shows (Go: `bio.AgeYears(time.Now())`).
- `goal.comparison[]` — `{goal, calorieGoal}` per objective in `options.goals` order (Go: `macroplan.AllGoals`), for "What each goal would cost".

## Deviations

- Generate refused without measurements: Go printed the raw error (`record your biometrics before generating a plan: …`);
  this shows the API's message, "The goal could not be worked out."
- An unparseable date of birth: the API answers under `dateOfBirth` ("Use a date like 1990-05-01."), mapped to the
  `date_of_birth` field; Go said "Enter a date of birth." (`type=date` makes this nearly unreachable).

## Library candidates

None needed.
