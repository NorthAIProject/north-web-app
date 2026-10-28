# Moderation

Go: `internal/moderation/handler.go` + `web/moderation/ops.templ`. Paths are under `/app`.

## Routes

| Go route | Svelte file | API |
| --- | --- | --- |
| `GET /ops/moderation` | `src/routes/(app)/app/ops/moderation/+page.{server.ts,svelte}` | **new** `GET /ops/moderation` |
| `POST /ops/moderation/{kind}/{subjectID}/{action}` | same page, action `?/decide` (fields `kind`, `subject`, `action`) | **new** `POST /ops/moderation/{kind}/{subjectID}/{action}` |
| `POST /ops/moderation/users/{userID}/suspend` | same page, action `?/suspend` (fields `user`, `hours`) | **new** `POST /ops/moderation/users/{userID}/suspend` `{hours}` |
| `POST /moderation/terms` | rendered inside the crew space: owned by the crews port | `POST /moderation/terms` (existing) |

Feature code: `src/lib/features/moderation/moderation.ts` (reasons text, action button variant).

## API added (north-client)

`internal/moderation/api.go`: the three `/ops/moderation` routes above. Operators are
`OPERATOR_USER_IDS`; everyone else gets 404, as on the Go page. The queue view carries `reasons` as a
sorted list, and `actions` (hide/dismiss, or unhide/hide when hidden) so the client does not re-derive
them. All described in `docs/api/openapi.yaml` (`ModerationQueue`, `ModerationReportGroup`,
`SuspendRequest`); `kind` and `actions` are open strings.

## Local operator for e2e

Operators are static config, so the local API (`scratchpad/run-api.sh`) exports
`OPERATOR_USER_IDS=7c64d151-fe4b-4903-bfb0-2f4cebdfa813`, the fixed account
`e2e-operator@khepri.local` (test password). `tests/e2e/moderation.spec.ts` signs in as it and skips if it
cannot. A fresh database needs that account recreated and the id updated in `run-api.sh`.

## Deviations

- Decide/suspend post to SvelteKit actions on the page (`?/decide`, `?/suspend`) instead of the Go
  per-subject URLs; both end in a 303 back to the queue.
- "Since" is shown in the operator's timezone; Go formatted it in the server's (UTC in production).
- Copy stays English and out of the catalogues, as in Go.

## Library candidates

- **TanStack Table (shadcn Data Table)** for the operator queue (`ops/moderation/+page.svelte`): sorting
  and filtering by kind/reason once the queue is longer than a screen. It uses the existing `ui/table`
  primitives today, like Go's templUI table.

## Tests

`tests/e2e/moderation.spec.ts`: non-operator 404; operator sees a reported crew message with its reason,
dismisses one and hides another; suspend author posts and the author can no longer post.
