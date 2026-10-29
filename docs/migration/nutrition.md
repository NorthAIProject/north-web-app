# nutrition

Go: `internal/meals/handler_ingredients.go`, `handler_log.go`, `handler_plans.go`, `handler.go`;
`web/nutrition/{ingredients,log,plans,plan_detail}.templ`, `web/nutrition/plan_view.go`.
Plan import, plan generation and the calculator are in `planimport.md` and `calculator.md`.

`src/routes/(app)/app/nutrition/+layout.ts` keeps the Fitness nav link active, as Go did.

| Go route | SvelteKit | API |
| --- | --- | --- |
| `GET /app/nutrition/ingredients` | `nutrition/ingredients/+page.server.ts` `load` | `GET /nutrition/ingredients?q=&limit=50` |
| `POST /app/nutrition/ingredients` | action `?/create` | `POST /nutrition/ingredients` |
| `POST /app/nutrition/ingredients/{id}/delete` | action `?/delete` | `DELETE /nutrition/ingredients/{id}` |
| `GET /app/nutrition/log` | `nutrition/log/+page.server.ts` `load` | `GET /nutrition/log`, `GET /nutrition/ingredients?limit=200`, `GET /nutrition/log/meal-options` (new) |
| `POST /app/nutrition/log/ingredient` | action `?/ingredient` | `POST /nutrition/log/ingredients` |
| `POST /app/nutrition/log/meal` | action `?/meal` | `POST /nutrition/log/meals` |
| `POST /app/nutrition/log/{id}/delete` | action `?/delete` | `DELETE /nutrition/log/{entryID}` |
| `GET /app/nutrition/plans` | `nutrition/plans/+page.server.ts` `load` | `GET /nutrition/plans`, `GET /nutrition/plan-options` |
| `POST /app/nutrition/plans` | default action (redirects to the plan) | `POST /nutrition/plans` |
| `GET /app/nutrition/plans/{id}` | `nutrition/plans/[id]/+page.server.ts` `load` | `GET /nutrition/plans/{id}`, plan-options, ingredients |
| `POST …/plans/{id}/delete` | `?/delete` | `DELETE /nutrition/plans/{id}` |
| `POST …/plans/{id}/settings` (incl. mode switch, `confirm_reset`) | `?/settings` | `PUT /nutrition/plans/{id}` |
| `POST …/plans/{id}/days` | `?/addDay` | `POST /nutrition/plans/{id}/days` |
| `POST …/days/{dayId}` · `/days/{dayId}/delete` | `?/updateDay` · `?/removeDay` | `PUT` · `DELETE /nutrition/plan-days/{id}` |
| `POST …/days/{dayId}/meals` | `?/addMeal` | `POST /nutrition/plan-days/{id}/meals` |
| `POST …/meals/{mealId}/delete` · `/optional` | `?/removeMeal` · `?/setMealOptional` | `DELETE /nutrition/meals/{id}` · `PUT …/{id}/optional` |
| `POST …/meals/{mealId}/options` | `?/addOption` (lands on `?option=<new id>`) | `POST /nutrition/meals/{id}/options` |
| `POST …/meals/{mealId}/ingredients` · `/ingredients/batch` | `?/addPortion` · `?/addPortions` | `POST /nutrition/meals/{id}/ingredients` (`…/batch`) |
| `POST …/portions/{id}/delete` · `/optional` | `?/removePortion` · `?/setPortionOptional` | `DELETE /nutrition/meal-ingredients/{id}` · `PUT …/{id}/optional` |
| Spoken meal "Find" (htmx partial) | `MealVoice.svelte`, client call | `POST /capture/foods` |

Ids for the nested routes travel as hidden fields (`day_id`, `meal_id`, `portion_id`); a malformed id is a 404 like Go's.
Overage: a 409 `MacroOverage` returns `fail(409, {overage})`; `OverageAlert.svelte` re-posts the same fields with
`confirm_overage=1` when `canConfirm`. A 422 shows its field errors only on the form named by its scope
(`settings`, `days`, `day:<id>`, `meal:<dayId>`, `option:<mealId>`, `portion:<mealId>`). Totals, statuses and
"not counted" come from the API; the page never sums.

Code: `src/lib/features/nutrition/` — `view.ts` (plan_view.go helpers, `tf` with Go half-even `%.0f`),
`server.ts` (overage capture, form parsing), `enhance.ts` (`clearOnSuccess`), `SettingsCard`, `DayCard`,
`MealBlock`, `OptionBody`, `MealVoice`, `PlanTypeFields`, `OverageAlert`, `PlanNotes`, `TargetNotice`.

## API additions (north-client `internal/meals/api.go`, openapi)

- `GET /nutrition/log/meal-options` (`listLoggableMeals`, `LoggableMealList`) — the log page's "Plan – Meal · Option"
  list, shared with Go's `mealOptionsFor`.
- `GET /nutrition/ingredients` takes `limit` (1–200, default 60). The service still treats >100 as 25, exactly as Go's
  page did (it asks for 200 and gets the first 25 by name).

## Deviations

- `/app/nutrition` has no Go page (only `/app/insights/nutrition`, whose empty state links to it) — not ported, still 404.
- The log page's embedded quick-capture panel is a card linking to `/app/capture?return_to=/app/nutrition/log` until a
  capture panel component exists.
- Go's portion "count it" compared `confirm_overage` to `"true"` while its re-post sent `"1"`; any non-empty value confirms here.
- Named actions on one route replace Go's per-URL POST endpoints; the URLs the browser lands on are the same.
- Spoken-meal "Find" needs JS (Go posted an htmx partial).
- e2e: a dialog trigger clicked while a select is closing is sometimes ignored by bits-ui; the advanced-plan test retries the open.

## Library candidates

- **svelte-dnd-action** — reorder meals within a day and foods within an option (`DayCard`, `OptionBody`); Go has no
  reorder today, so this needs an API `position` field first.
- **TanStack Table** — the ingredients list (sort by kcal/macros, pagination past 50) on `nutrition/ingredients`.
- **Motion** — option tab changes, dialog open/close and the overage alert on the plan page.
- TanStack Query — not needed here: nothing polls and no state is shared across pages.
