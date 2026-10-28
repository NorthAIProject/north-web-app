# Crews: Go → SvelteKit

Go sources: `internal/crews/handler.go`, `internal/crews/chat_handler.go`, `web/crews/*.templ`,
`web/crews/space.go`. SvelteKit: `src/routes/(app)/app/crews/**`, `src/lib/features/crews/`.
No north-client changes were needed: `internal/crews/api.go` and `chat_api.go` already expose
every service call the Go pages make.

## Pages

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/crews` | `crews/+page.svelte` | `GET /crews` |
| `POST /app/crews` | `crews/+page.server.ts` default action | `POST /crews` (422 → field message) |
| `GET /app/crews/{id}` | `crews/[crewID]/+page.*` → `CrewSpace.svelte` (wide) | `GET /crews/{id}/space`, `GET /crews`, `GET …/channels/{default}/messages` |
| `GET /app/crews/{id}/c/{channelID}` | `crews/[crewID]/c/[channelID]/+page.*` (wide) | same, with that channel |
| `GET /app/crews/{id}/challenge` | `crews/[crewID]/challenge/+page.*` → `ChallengePane.svelte` (wide) | `GET /crews/{id}` (board) |

A crew the viewer is not in (API 403/404) is a 404, as in Go.

## Forms (SvelteKit actions, work without JS)

| Go route | Svelte action | API |
| --- | --- | --- |
| `POST /crews/{id}/leave` | `?/leave` on every space page (`space.server.ts`) | `DELETE /crews/{id}/members/{me}` |
| `POST /crews/{id}/notifications` | `?/notify` | `PUT /crews/{id}/notifications` (`mutedUntil` = now + hour/day/week, as `muteFor`) |
| `POST /app/moderation/terms` (from the crew rules dialog) | `?/terms` on the space pages | `POST /moderation/terms` |
| `POST /crews/{id}/members/{userID}/role` | `challenge/?/role` | `PUT /crews/{id}/members/{userID}/role` |
| `POST /crews/{id}/members/{userID}/remove` | `challenge/?/remove` | `DELETE /crews/{id}/members/{userID}` |
| `POST /crews/{id}/challenge` (`kind=none` clears) | `challenge/?/challenge` | `PUT` / `DELETE /crews/{id}/challenge` |

## htmx calls → browser calls through `/api` (`features/crews/api.ts`)

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /crews/{id}/live` (SSE, named DOM events) | `connectLive()` in `CrewSpace.svelte` (EventSource on `/api/crews/{id}/live`) | `GET /crews/{id}/live` (JSON events) |
| `GET /crews/{id}/channels` (fragment) | channel list from the `['crews', id, 'space']` query | `GET /crews/{id}/space` |
| `GET /crews/{id}/c/{ch}/messages?after/before` | `ChatBody.loadNew()` / Load older | `GET …/channels/{ch}/messages` |
| `GET /crews/{id}/c/{ch}/pins` | pins sheet | `GET …/channels/{ch}/pins` |
| `GET /crews/{id}/m/{mid}` | `ChatBody.refreshMessage()` (404 → row removed) | `GET /crews/{id}/messages/{mid}` |
| `GET /crews/{id}/m/{mid}/edit` | inline editor state in `MessageRow.svelte` | — |
| `POST /crews/{id}/c/{ch}/messages` | `Composer.svelte` | `POST …/channels/{ch}/messages` (403 `terms_required` opens the rules, `suspended` → message) |
| `POST /crews/{id}/c/{ch}/read` | mark-read on load, 1 s after new messages, on tab focus | `POST …/channels/{ch}/read` |
| `POST /crews/{id}/m/{mid}/edit` | `MessageRow` save | `PATCH /crews/{id}/messages/{mid}` |
| `POST /crews/{id}/m/{mid}/delete` | message menu | `DELETE /crews/{id}/messages/{mid}` |
| `POST /crews/{id}/m/{mid}/react` | pills + menu | `PUT`/`DELETE …/messages/{mid}/reactions/{emoji}` |
| `POST /crews/{id}/m/{mid}/pin` | message menu | `PUT`/`DELETE …/messages/{mid}/pin` |
| `POST /crews/{id}/report` (message id in form) | report dialog | `POST …/messages/{mid}/report` |
| `POST /crews/{id}/channels` | new channel dialog → `goto` the channel | `POST /crews/{id}/channels` |
| `POST /crews/{id}/c/{ch}/edit` / `delete` | edit channel dialog | `PATCH` / `DELETE /crews/{id}/channels/{ch}` |
| `POST /app/friends/{userID}/block` (from a message) | message menu → reload | `POST /blocks/{userID}` |

`routes.md` also lists `GET /crews/unread`, `GET /crews/{id}/space`, `PATCH/DELETE …/channels/{ch}`,
`GET/POST …/channels/{ch}/messages|pins|read`, `GET/PATCH/DELETE …/messages/{mid}`,
`PUT/DELETE …/reactions/{emoji}`, `PUT/DELETE …/pin`, `POST …/messages/{mid}/report` and
`PUT …/notifications`: those are JSON API routes (`chat_api.go`), consumed by the calls above.
`GET /i/c/{code}` and the join-from-cookie middleware belong to the social port.

## State

- TanStack Query (`features/crews/queries.ts`): the space (`['crews', id, 'space']`, seeded from
  the route load, invalidated by live `channels`/`message`-elsewhere/`resync`) and the unread
  totals (`['crews', 'unread']`, polled every 30 s and invalidated by live `message`). The rail's
  unread dots read the unread query. `crewQueryClient()` uses the app's QueryClient from context
  when there is one and otherwise sets a client for the crew subtree.
- The transcript is component state in `ChatBody.svelte` (append-by-cursor, prepend older, replace
  one row), keyed on the open channel.
- Live: `message` in the open channel → fetch after the cursor; `update` → refetch that row;
  `removed` (own) → `/app/crews`; a reconnect is treated as `resync` (as the Go page did).

## Deliberate differences

- The Go chat rail had per-crew dots only; `CrewsUnreadBadge.svelte` (total from `GET /crews/unread`)
  is ready for the shell's Crews nav item. **The shell must mount it** (not done here: layout is
  another agent's), ideally under an app-wide `QueryClientProvider` so live events reach it.
- After react/pin/delete the row is refetched right away as well as on the live `update`, so the
  page does not depend on the stream for the actor's own change.
- The edit Cancel restores the row from state instead of refetching it.
- Role/remove/challenge failures surface on SvelteKit's error page (Go: a plain-text error page).

## Library candidates

- **Motion** (or `svelte/transition`): new messages arriving in `ChatBody.svelte` and a reported or
  removed row leaving; the channel unread badge changing. Go has no animation here, so this is
  polish, not parity.
- **Paneforge** (shadcn Resizable): a resizable channel column (`aside` in `CrewSpace.svelte`,
  fixed `w-60` today).

## Tests

`tests/e2e/crews.spec.ts`: list/create (+422), rules dialog on first post, send/edit/react/pin/pins
sheet/delete, channel create/edit/delete, two users with a live message and live reaction via SSE,
report, challenge set, make admin, remove member, leave, notifications, non-member 404.
Screenshots compared with the Go pages (chat and list match; header heights differ by a few px).
