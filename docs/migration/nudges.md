# Nudges, shell widgets, outreach, push: Go → SvelteKit

Go sources: `internal/nudges/handler.go`, `web/nudges/*.templ`, `web/shared/layout` (bell, agent
pill, awards host), `internal/outreach/handler.go`, `internal/push/handler.go` + `push.js`.
SvelteKit: `src/lib/components/layout/ShellWidgets.svelte`, `src/lib/features/{nudges,awards,outreach,push}/`,
`src/routes/(app)/app/nudges/[id]/*`, `src/routes/(app)/app/outreach/[id]/actions`.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/nudges/bell` (htmx, every 20 s) | `NudgeBell.svelte`, `createQuery(bellQuery())` with a 20 s `refetchInterval` | `GET /nudges` |
| `POST /app/nudges/{id}/read` | `nudges/[id]/read/+server.ts` (a plain form, 303 to the nudge's href) | `POST /nudges/{id}/open` |
| `POST /app/nudges/{id}/dismiss` | JS: `dismissNudge` (announced by the browserApi middleware); no-JS: `nudges/[id]/dismiss/+server.ts` | `POST /nudges/{id}/dismiss` |
| `GET /app/nudges/{id}/open?from=push` (service worker tap) | `nudges/[id]/open/+server.ts` (unknown id → `/app`) | `POST /nudges/{id}/open?from=push` |
| agent pill (layout) | `ShellWidgets.svelte`, fetched once (`staleTime: Infinity`) | `GET /settings/connections` |
| awards unlock (layout) | `features/awards/AwardsHost.svelte` + `UnlockDialog.svelte` | `GET /awards/unseen`, `POST /awards/{id}/seen`, `GET /social` |
| `GET /app/outreach` (My Day partial) | `features/outreach/OutreachCard.svelte` (self-loading, for My Day to mount) | `GET /outreach/today` |
| `POST /app/outreach/{id}/actions` | JS: in the card; no-JS: `outreach/[id]/actions/+server.ts` | `POST /outreach/{id}/actions` |
| `POST`/`DELETE /app/push/subscriptions` (cookie, `push.js`) | `features/push/push.svelte.ts` `PushOptIn`; `PushRow.svelte` (settings notifications card), `PushCard.svelte` (overview next step) | `GET /push/config`, `POST`/`DELETE /push/subscriptions` (new, `internal/push/api.go`) |

The crews unread badge (`features/crews/CrewsUnreadBadge.svelte`) is mounted next to the Crews
link in `AppShell.svelte`.

## Deliberate differences

- The toast is driven by the TanStack poll. It appears when unread rises between two polls, as Go's swap did.
- `PushRow` renders nothing until `/push/config` says push is configured, matching Go's `if f.PushEnabled`.
  The hints are English, as in Go's `push.js`.
- The XP page has no Go route of its own. `/app/friends/leaderboard` is ported by the social agent.

## Library candidates

- **Motion / GSAP**: the badge unlock coin turn (`awards-coin-turn`, currently CSS) and a level-up flourish.
- **Motion** (or `svelte/transition`): the nudge toast's slide-in and fade-out.
