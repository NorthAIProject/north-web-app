# planimport (meal side)

Go: `internal/planimport/handler.go`, `generate_handler.go`, `form.go`; `web/planimport/{upload,meal,generate}.templ`
(plus `unparsedList`, `defaultSubmit`, `dayLabel` from `workout.templ`). The workout side (`/app/training/import*`)
belongs to the training port.

| Go route | SvelteKit | API |
| --- | --- | --- |
| `GET /app/nutrition/import` | `src/routes/(app)/app/nutrition/import/+page.svelte` (`MealUpload`) | — |
| `POST /app/nutrition/import` (file → review) | same route, default action → renders `MealReview` | `POST /nutrition/import/parse` (multipart) |
| `POST /app/nutrition/import/review` | `src/routes/(app)/app/nutrition/import/review/` default action | `POST /nutrition/import/preview`; save: `POST /nutrition/import` |
| `GET /app/nutrition/plans/generate` | `src/routes/(app)/app/nutrition/plans/generate/` `load` | `GET /nutrition/plans/intake` |
| `POST /app/nutrition/plans/generate` | same route, default action → renders `MealReview` | `POST /nutrition/plans/generate` |

Feature code in `src/lib/features/planimport/`: `form.ts` (ports `mealFromForm`, `foodsFromForm`, `applyMealAction`,
`dropEmpty`, `deleteOption`, `Normalize`), `server.ts` (the three flows over the API), `view.ts`, `MealReview.svelte`,
`MealUpload.svelte`.

The review keeps Go's design: the whole draft travels as JSON in a hidden field, every button posts the form with
`name=action` (`update`, `delete-day:i`, `delete-meal:i:j`, `delete-option:i:j:o`, `delete-food:i:j:o:k`,
`toggle-meal-optional:i:j`, `save`, `save-confirm`) and the edited fields on top (`d0.m1.o0.f2.grams`). Works without JS.

Refused saves: 409 `MacroOverage` → "Confirm and save anyway" when `canConfirm`, else `planimport.err.overeasy` with
the API's sentence (draft re-previewed, since the 409 carries no draft); 422 `MealImportRefusal` → its draft, with
the first field message.

## Deviations

- `GET /app/nutrition/import/review` shows the upload page (Go: 405).
- A 422 refusal shows the first field message in key order (the API's map); Go used the service's insertion order.
- Upload errors other than validation/size/quota show `planimport.err.failed`, as Go; the API's own sentence otherwise.
- Without JS the file input does not auto-submit (Go used an inline `onchange`); with JS, choose/drop submits as in Go.
- Selects are shadcn Select (no search box), so the ingredient picker on long candidate lists has no filter.

## Library candidates

- Motion — the drop-zone highlight and the "Reading your plan…" swap in `MealUpload.svelte` (today a CSS colour
  transition), and day/meal removal on the review page.
- svelte-dnd-action — reordering meals/foods on the review page, should that be wanted (Go has no reordering).
- TanStack Table — the per-option food tables in `MealReview.svelte` if sorting/column control is ever added.
- TanStack Query — not used: generation is one blocking request (no status polling in Go).
