# mind → SvelteKit

Go: `web/mind/*.templ`, `internal/mind/handler.go`. API: `internal/mind/api.go`.

| Go route                 | SvelteKit                                               | API                                   |
| ------------------------ | ------------------------------------------------------- | ------------------------------------- |
| `GET /app/mind`          | `src/routes/(app)/app/mind/+page.server.ts` + `.svelte` | `GET /mind/journal`, `GET /check-ins` |
| `POST /app/mind/journal` | action `?/journal` → redirect `/app/mind`               | `POST /mind/journal`                  |

The page reuses `src/lib/features/checkins/` for the KPIs and the mood/energy chart (the same
instruments as check-ins), and `DictateField` (the `mic` slot) for the reflection.

## API added

- None.

## Deliberate differences

- The averages and chart come from `GET /check-ins` on the client, instead of Go's server-side viz.
  The trailing 14 days are computed in the user's timezone.
- The mood select is a bits-ui Select, not a native select. The form posts the same `mood` field.
- The chart is LayerChart and lazy-loaded (see checkins.md about `ssr.noExternal`).

## Library candidates

- None.

## Tests

`tests/e2e/mind.spec.ts`:

- Empty instruments, a refused blank entry, then an entry with mood that resets the form.
- KPIs and chart read from a check-in.
