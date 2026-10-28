# weekly → SvelteKit

Go: `web/weekly/*.templ`, `internal/weekly/handler.go`. API: `internal/weekly/api.go`.

| Go route           | SvelteKit                                                 | API                  |
| ------------------ | --------------------------------------------------------- | -------------------- |
| `GET /app/weekly`  | `src/routes/(app)/app/weekly/+page.server.ts` + `.svelte` | `GET /weekly/review` |
| `POST /app/weekly` | default action → redirect `/app/weekly?saved=1`           | `PUT /weekly/focus`  |

Feature files in `src/lib/features/weekly/`:

- `form.ts`: priority slots, volumes, and `rank_<goal uuid>` parsing that is Atoi-compatible with Go.
- `radio.ts`: the native radio classes.

## API added

- None.

## Deliberate differences

- None visible. A 422 re-renders with the typed values and the field message, as Go does.

## Library candidates

- svelte-dnd-action, for drag-to-order goals instead of the number inputs. This would be an
  enhancement, not parity.

## Tests

`tests/e2e/weekly.spec.ts`:

- Priorities, goal order and volume are saved and read back through the API.
- A too-long priority is refused and the value is kept.
