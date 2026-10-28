# Inbox: Go → SvelteKit

Go sources: `internal/inbox/handler.go`, `web/inbox/inbox.templ`.
SvelteKit: `src/routes/(app)/app/inbox/`, `src/lib/features/inbox/inbox.ts`. No API changes were needed.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/inbox` | `inbox/+page.server.ts` load | `GET /inbox`, `GET /goals` (active, max 8, for filing) |
| `POST /app/inbox` | `?/add` (422 → message under the textarea, text kept) | `POST /inbox` (`source: "web"`) |
| `POST /app/inbox/{id}/file` | `?/file` (item id in a hidden `item` field; journal / knowledge / goal note / suggested) | `POST /inbox/{id}/file` |
| `POST /app/inbox/{id}/dismiss` | `?/dismiss` | `POST /inbox/{id}/dismiss` |

Every form uses `use:enhance`. Write detection is global (playbook, "Writes, awards and quota"), so a filing that earns a badge opens the unlock
dialog. The goal picker is a shadcn Select posting `goal_id`.

## Library candidates

- **Motion** (`svelte/transition` is enough): filed and dismissed items leaving the list.
