# settings (+ vault, export) — Go → SvelteKit

Go sources: `web/settings/{settings,connections,activity,agentpill}.templ`, `web/settings/vault/vault.templ`,
`internal/settings/handler.go`, `internal/vault/handler.go`, `internal/export/handler.go`.
Svelte: `src/routes/(app)/app/settings/**`, components in `src/lib/features/settings/`.

## Routes

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /settings` | `settings/+page.svelte` (load) | `GET /settings/profile`, `/settings/preferences`, `/settings/notifications`, `/settings/diets`, `/settings/connections` (count) |
| `POST /settings/profile` | `?/profile` | `PUT /settings/profile` (no appearance), then `PUT /settings/appearance` `{surface:"settings"}` when one was picked |
| `POST /settings/notifications` | `?/notifications` | `PUT /settings/notifications` |
| `POST /settings/preferences` | `?/preferences` | `PUT /settings/preferences` |
| `POST /settings/diets` | `?/diets` | `PUT /settings/diets` |
| `POST /settings/target-weight` | `/app/settings?/targetWeight` (redirects to `/app`) | `PUT /settings/target-weight` |
| `POST /settings/account/delete` | `?/deleteAccount` (clears the session cookie, → `/?deleted=1`) | `POST /account/delete` |
| `GET /settings/export.zip` | `settings/export.zip/+server.ts` (streams; 429 as plain text) | `GET /account/export` |
| `GET /settings/connections` | `settings/connections/+page.svelte` | `GET /settings/connections`, `/settings/ai`, `/settings/telegram`, `/settings/calendar` |
| `POST /settings/connections` | `?/create` (token shown from the action result only) | `POST /settings/connections` |
| `POST /settings/connections/{id}/revoke` | `?/revoke` | `DELETE /settings/connections/{connectionID}` |
| `GET /settings/connections/{id}/status` | `ConnectionStatus.svelte`, TanStack Query poll (5 s, 24 tries) | **new** `GET /settings/connections/{connectionID}` |
| `POST /settings/messaging/telegram` | `?/telegramCode` | `POST /settings/telegram/code` |
| `POST /settings/messaging/telegram/disconnect` | `?/telegramDisconnect` | `DELETE /settings/telegram` |
| `POST /settings/integrations/calendar` | `?/calendar` | `PUT /settings/calendar` |
| `POST /settings/integrations/calendar/disconnect` | `?/calendarDisconnect` | `DELETE /settings/calendar` |
| `POST /settings/ai` | `?/ai` | `PUT /settings/ai` |
| `POST /settings/ai/remove` | `?/aiRemove` | `DELETE /settings/ai` |
| `GET /settings/activity` | `settings/activity/+page.svelte` | `GET /settings/activity` |
| `GET /connections/pill` | topbar chrome, already in the shell (layout owner) | `GET /settings/connections` |
| `GET /settings/vault` | `settings/vault/+page.svelte` (404 when the API has no vault) | **new** `GET /settings/vault` |
| `POST /settings/vault/connect` | `?/connect` | **new** `PUT /settings/vault` |
| `POST /settings/vault/disconnect` | `?/disconnect` | **new** `DELETE /settings/vault` |
| `POST /settings/vault/sync` | `?/sync` | **new** `POST /settings/vault/sync` |

## API changes (north-client-api, additive)

- `internal/settings/api.go`: `AIProvider.note` (localised) + `requiresBaseUrl`; `Connection.kindLabel` + `expiresAt`;
  `ConnectionSetup.kind/kindLabel/safe/safeLabel/safeLang/safeNote`; `ConnectionList.previews` (setup per client with
  the placeholder token); `GET /settings/connections/{connectionID}`. Goldens updated.
- `internal/vault/api.go`: JSON routes, mounted only when the vault is enabled (non-production), like the Go pages.
  Wired in `cmd/web/api.go` + `routes.go`; `api_test.go` mounts it so the spec test checks it.

## Deliberate differences

- Vault is gated by the API (404 in production) rather than a public env flag: declaring one needs `src/env.ts`, which
  this port does not own.
- Push row ("Nudges on this device") is not ported: it needs the push subscribe API (`internal/push`, web-only today)
  and the PWA service worker. Gap.
- Coaching style has no dictation mic (Go `dictate.Field`): no shared dictation component exists yet. Gap.
- Go nested the News ticker button inside the Activity button (invalid `<a>` in `<a>`); here they are siblings.
  `/app/settings/news-ticker` itself belongs to the news port (API in `internal/news/api_settings.go`).
- The calendar card renders only when Telegram is enabled, as in Go (it sits inside that `if`).
- Dates use the user's timezone.

## Library candidates

None needed. TanStack Query (already installed) drives the connection-status poll; the page creates its own
`QueryClient` because no app-wide `QueryClientProvider` exists yet. One in the `/app` layout would let it be shared.
