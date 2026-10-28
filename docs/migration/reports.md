# reports → SvelteKit

Go: `web/reports/*.templ`, `internal/reports/handler.go`. API: `internal/reports/api.go`.

| Go route                            | SvelteKit                                                     | API                                     |
| ----------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| `GET /app/reports` (`?archived=1`)  | `src/routes/(app)/app/reports/+page.server.ts` + `.svelte`    | `GET /reports` (`archived`)             |
| `POST /app/reports/generate`        | action `?/generate` (`src/lib/features/reports/generate.server.ts`) | `POST /reports/generate` **(new)** |
| `GET /app/reports/{id}`             | `src/routes/(app)/app/reports/[id]/+page.server.ts` + `.svelte` | `GET /reports/{reportID}`             |
| `POST /app/reports/{id}/archive`    | action `?/archive` → `/app/reports`                           | `POST /reports/{reportID}/archive`      |
| `POST /app/reports/{id}/regenerate` | action `?/regenerate`                                         | `POST /reports/{reportID}/regenerate` **(new)** |
| `POST /app/reports/{id}/helpful`    | action `?/helpful`                                            | `PUT /reports/{reportID}/helpful`       |
| `POST /app/reports/briefing`        | (dashboard button, My Day owner)                              | `POST /reports/briefing` **(new)**      |

## API added

- `POST /reports/generate`, `POST /reports/briefing` and `POST /reports/{reportID}/regenerate`.
  - All three answer 202 with `ReportDetail`.
  - They are guarded by the `report_generate` quota (429) via `WithQuotas`.
  - A refusal is 409 with `code` `cooldown` or `archived`.
  - They are in openapi.yaml, and `bun run api:types` has been regenerated.

## Deliberate differences

- A pending report is polled every 5 s with TanStack `createQuery(['report', id])` on the app
  QueryClient. Go only said "refresh in a moment".
- A 409 redirects with `?notice=cooldown|archived`, giving the same notices as Go. A 429 shows the
  quota message inline.
- Rating is "Yes / No / Undo" through one `?/helpful` action (`helpful|unhelpful|clear`).
- Locally, nothing generates reports unless `cmd/worker` runs. The e2e test marks the report ready
  in Postgres, the same way memories.spec.ts seeds data.

## Library candidates

- None. Markdown uses the existing renderer.

## Tests

`tests/e2e/reports.spec.ts` covers one flow:

- Empty state, generate, pending, then polled to ready.
- Rate, undo, the regenerate cooldown notice, archive, and the archived tab.
