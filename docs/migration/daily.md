# dailyposts + checkinreply → SvelteKit

Go: `internal/dailyposts/handler.go`, `web/dailyposts/{dailyposts.templ,view.go}`;
`internal/checkinreply/handler.go`. Helpers: `src/lib/features/dailyposts/dailyposts.ts`.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/daily` | `src/routes/(app)/app/daily/+page.server.ts` + `+page.svelte` | `GET /daily-posts` |
| `POST /app/daily/{id}/kudos` | `?/kudos` (hidden `postID`) → `/app/daily#post-{id}` | `POST /daily-posts/{id}/kudos` |
| `POST /app/daily/{id}/kudos/undo` | `?/kudosUndo` → `/app/daily#post-{id}` | `DELETE /daily-posts/{id}/kudos` |
| "Ask the coach" (`POST /app/chat` with draft) | form to `/app/chat?/start` (coach port) | `POST /conversations` |
| `GET /app/check-ins/today/reply` | already ported by the check-ins port (`SavedPanel`, `/app/check-ins`) | `POST /check-ins/today/reply` |

## Deliberate differences

- Kudos post to named actions with a hidden id instead of id-in-path routes.

## Library candidates

None.

Tests: `tests/e2e/daily.spec.ts` (render/empty state; kudos round trip when a post exists; Overview
trends), `src/lib/features/dailyposts/dailyposts.spec.ts`.
