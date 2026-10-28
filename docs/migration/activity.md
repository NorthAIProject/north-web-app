# activity → SvelteKit

Go: `web/activity/activity.templ`, `internal/activity/handler.go`. API: `internal/activity/api.go`.

| Go route                         | SvelteKit                                                               | API                                 |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| `GET /app/activity`              | `src/routes/(app)/app/activity/+page.server.ts` (load) + `+page.svelte` | `GET /activity`                     |
| `POST /app/activity/start`       | action `?/start`                                                        | `POST /activity/start`              |
| `POST /app/activity/log`         | action `?/log`                                                          | `POST /activity/log`                |
| `POST /app/activity/{id}/pause`  | action `?/pause` (hidden `id`)                                          | `POST /activity/{sessionID}/pause`  |
| `POST /app/activity/{id}/resume` | action `?/resume`                                                       | `POST /activity/{sessionID}/resume` |
| `POST /app/activity/{id}/stop`   | action `?/stop`                                                         | `POST /activity/{sessionID}/stop`   |
| `POST /app/activity/{id}/cancel` | action `?/cancel`                                                       | `DELETE /activity/{sessionID}`      |

Helpers: `src/lib/features/activity/format.ts` (session summary line, MET names, the
log form's parsing incl. `datetime-local` read in the user's zone), `ActivitySelect.svelte`.

## API added

- `ActivityOverview.todayCalories` (additive): what completed sessions burned since local
  midnight — the "~N kcal burned today" line, which Go computed in the page handler.

## Deliberate differences

- The six POSTs are named actions on `/app/activity` rather than six URLs; they work without JS and
  redirect back exactly like Go (303 to `/app/activity`), or re-render with the refusal.
- Refusal text is the API's message ("record your biometrics before tracking activity"), without
  Go's raw `: validation failed` suffix. The log form's own parse errors use Go's wording.
- The rail does not highlight Fitness on this page (Go passed `/app/fitness` as the active nav);
  the shell picks the active item from the path. Shell-owned.
- No polling: the Go page shows only Running/Paused and never ticks, so nothing is polled. If a
  live elapsed clock is wanted later, use `createQuery` on `GET /activity` from the app-wide
  QueryClient (`elapsedSeconds` + `startedAt` let a client tick without polling).
- Depends on the shared `sprintf` handling Go's `%.0[1]f` (precision before index) for
  `activity.today.burned`; reported to the coordinator (format.ts is shared).

## Library candidates

- Motion / `svelte/motion`: a ticking elapsed counter and a gentle state change on the timer card,
  if the timer ever shows live time (not in Go today).

## Tests

`tests/e2e/activity.spec.ts`: render, refusal without biometrics, start → pause → resume → stop,
start → cancel, log with distance + start time (checks the Lisbon wall clock becomes the right
instant), log error for an unknown activity.
