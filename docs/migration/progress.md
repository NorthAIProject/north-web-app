# progresschecks → SvelteKit

Go: `internal/progresschecks/handler.go`, `web/progress/{progress.templ,view.go}`,
`web/assets/js/shared/progress-photo.js`.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/progress` | `src/routes/(app)/app/progress/+page.server.ts` `load` + `+page.svelte` | `GET /progress/checks`, `GET /progress/assist` |
| `POST /app/progress` (multipart) | action `?/create` (use:enhance; works without JS) | `POST /progress/checks` (multipart: `check` JSON + `front`/`side`/`back`) |
| `POST /app/progress/schedule` | action `?/schedule` | `PUT /progress/schedule` |
| `POST /app/progress/{id}/delete` | action `?/delete` (id in a hidden field), behind the confirm Dialog | `DELETE /progress/checks/{checkID}` |
| `POST /app/progress/compare` | action `?/compare` → 303 `/app/progress#progress-compare`, or the page with the reason | `POST /progress/compare` |
| `POST /app/progress/estimate` (htmx swap of `#progress-fields`) | browser `POST /api/progress/checks/estimate` from `NewCheck.svelte`, fields filled in place (`applyEstimate`) | `POST /progress/checks/estimate` |

Components: `src/lib/features/progress/` — `NewCheck.svelte` (form + Fields + estimate),
`PoseSlot.svelte` (uses `#lib/components/khepri/progress-photo.ts` to shrink/strip EXIF in place),
`Reminder.svelte`, `Comparison.svelte`, `History.svelte` (check rows + delete dialog),
`view.ts` (ports of `pageCheck`, `lastPhotos`, `formInput`, `applyEstimate`, `readNumber`, `delta`).

## API changes (north-client)

- `ProgressPhoto.mediaId` (uuid, additive): the page links photos to `/app/media/{id}` like Go
  did (a fresh signed URL on every open) instead of the two-hour signed `url`.
  Golden `internal/progresschecks/testdata/progress_checks.golden.json` updated.

## Deviations

- Form posts are named actions on `/app/progress` (`?/create`, `?/schedule`, `?/delete`,
  `?/compare`) rather than separate URLs.
- The estimate is a browser call rather than an htmx fragment; same result (fields filled,
  photos kept), and its error copy maps by status: 503 → `progress.estimate.unavailable`,
  429 → the quota message, other → `progress.estimate.failed`, 422 → field errors.
- A refused save keeps the chosen photos (Go's full re-render lost them).
- Number inputs are `type=number`; the server-side `formInput` still accepts a comma.
- Estimate and compare run in e2e against the provider stub (`tests/e2e/stubs/providers.ts`,
  Anthropic shape). Without the stub the local stack has no photo-capable provider and the
  estimate box and compare button are hidden, as in Go.
- Photo uploads go through the SvelteKit action: a production adapter's body-size limit must
  allow three ≤1600px JPEGs (Go capped the request at 3 × the media cap + 1 MB).
