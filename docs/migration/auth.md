# Auth, onboarding and MCP consent: Go → SvelteKit

Go sources: `web/auth/*.templ`, `internal/auth/handler.go`, `internal/auth/api*.go`,
`web/assets/js/auth/passkey.js`, `web/onboarding/*`, `internal/onboarding/*`, and the browser half
of `web/mcpauth` / `internal/mcpauth`. SvelteKit: `src/routes/(public)/{login,signup,logout,
forgot-password,reset-password,auth,oauth}/**`, `src/routes/(app)/app/onboarding/**`,
`src/lib/features/auth/`, `src/lib/server/{google,oauth,form}.ts`.

The session token never reaches page JavaScript. Every route that ends in a session (password,
Google, passkey finish, consent account) is a SvelteKit server action or `+server.ts`, and it writes
the HttpOnly `north_session` cookie (Go's own name, so sessions survive the cut-over) with `writeSession`.

## Pages and forms

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /login` | `(public)/login/+page.*` | `GET /auth/options` |
| `POST /login` | `login` default action | `POST /auth/login` |
| `GET /signup` | `(public)/signup/+page.*` (browser timezone set on mount) | `GET /auth/options` |
| `POST /signup` | `signup` default action (field errors stay on their fields) | `POST /auth/signup` |
| `GET/POST /forgot-password` | `(public)/forgot-password/+page.*` (404 when reset is off) | `POST /auth/forgot-password` |
| `GET/POST /reset-password?token=` (the emailed link) | `(public)/reset-password/+page.*` | `POST /auth/reset-password` **(new)** |
| `POST /logout` | `(public)/logout/+server.ts` | `POST /auth/logout` |
| `GET /auth/google` | `(public)/auth/google/+server.ts` | `POST /auth/google/start` **(new)** |
| `GET /auth/google/callback` | `(public)/auth/google/callback/+server.ts` | `POST /auth/google/code` **(new)** |
| `POST /auth/passkey/{register,login}/begin` | `features/auth/passkey.ts` via `/api` proxy | `POST /auth/passkey/*/begin` |
| `POST /auth/passkey/{register,login}/finish` | `(public)/auth/passkey/finish/+server.ts` | `POST /auth/passkey/*/finish` |
| `GET /app/onboarding` | `(app)/app/onboarding/+page.*` (wide AuthShell) | `GET /onboarding` **(new GET)** |
| `POST /app/onboarding` | `?/complete` → `/app/onboarding/done?thread=` | `POST /onboarding` |
| `POST /app/onboarding/skip` | `?/skip` → `/app` | `POST /onboarding/skip` **(new)** |
| `GET /app/onboarding/done` | `(app)/app/onboarding/done/+page.*` | — (user from locals) |
| `GET /oauth/authorize` | `(public)/oauth/authorize/+page.*` | `POST /auth/oauth/authorize`, `GET /auth/oauth/requests/{id}` **(new)** |
| `POST /oauth/authorize/account` | `?/account` | `POST /auth/oauth/requests/{id}/account` **(new)** |
| `POST /oauth/authorize` (approve/deny) | `?/decide` (plain form, external 303) | `POST /oauth/requests/{id}/{approve,deny}` **(new, bearer)** |
| `GET /oauth/authorize/resume` | `(public)/oauth/authorize/resume/+server.ts` | — |

`GET /api/v1/auth/options` returns `{google, passkey, passwordReset}` and drives the Google button,
the passkey buttons and the "Forgot password?" link. `options.ts` and `AltAuthButtons.svelte` read
it, and `fetchAuthOptions` never throws: if the call fails, everything shows as off.

## API additions (north-client-api)

- `internal/auth/api_web.go`: `GET /auth/options`, `POST /auth/reset-password` (401
  `invalid_reset_token`), `POST /auth/google/start` and `/auth/google/code`. Both Google routes
  return 404 when Google is off. The redirect URI must be https (or http on localhost), and its path
  must be exactly `/auth/google/callback`.
- `internal/auth/google.go`: `GoogleAuthCodeURLFor`, `CompleteGoogleOAuthFor` and `NewGoogleState`.
  The Go web flow is unchanged and now goes through them.
- `internal/onboarding/api.go`: `GET /onboarding` (choices plus first-week templates) and
  `POST /onboarding/skip`.
- `internal/mcpauth/api.go`: the consent JSON API. Public routes:
  `POST /auth/oauth/authorize` (fatal → 400 `oauth_fatal`, redirectable → 200 `{redirect}`,
  parked → 201), `GET /auth/oauth/requests/{id}` and `POST …/account`. Bearer routes:
  `POST /oauth/requests/{id}/approve|deny`. The verifier travels in `X-OAuth-Request-Verifier`.
- `openapi.yaml`: all of the above, as open strings (no new enums).

## Edge routing (cut-over)

SvelteKit must serve these paths: `/login`, `/signup`, `/logout`, `/forgot-password`,
`/reset-password`, `/auth/google`, `/auth/google/callback`, `/auth/passkey/finish`,
`/oauth/authorize`, `/oauth/authorize/resume` and `/app/onboarding*`.

Go keeps these: `/oauth/token`, `/oauth/register`, `/oauth/revoke`, `/.well-known/*`, `/mcp` and
`/api/v1/*`.

The Google Console redirect URI stays `https://<site>/auth/google/callback`, now answered by
SvelteKit. The emailed reset link (`BASE_URL/reset-password?token=`) is unchanged. The consent
verifier cookie `north_oauth_req` is scoped to path `/oauth`, so the `/oauth/authorize*` paths must
reach SvelteKit, not Go. The Google state cookie `north_google_oauth` holds `state|next`, lasts
10 minutes and can be used once.

## Deliberate differences

- A Google callback failure redirects to `/login?google=<reason>` and shows an alert there. Go
  rendered the error in place.
- After parking a consent request, the page redirects to `/oauth/authorize?request_id=…`, so a
  reload never re-parks the request.
- The consent page's passkey button works. Go's consent page had `data-passkey` without
  `#passkey-btn`, so its button did nothing.
- Logout honours a form `next` (through `safeNext`) and defaults to `/login`, as Go does. The
  SvelteKit stub had used `/`.
- Passkey error strings are the English ones from `passkey.js`, as in Go (not translated).
- `/reset-password` without a token returns 200 with "request a new link" (Go returned 400).
- The onboarding submit is the named action `?/complete`, because SvelteKit forbids a default
  action alongside `?/skip`.
- Invite and crew cookies set before onboarding are not consumed here. That is `/app` middleware
  and belongs to the social port.

## Library candidates

- **Motion** (or `svelte/transition`): onboarding step and choice transitions (the coaching-style
  cards, the custom-style field appearing), and the consent page swapping from the account form to
  the signed-in block. Go has no animation here, so this is polish, not parity.
- shadcn primitives: none missing.

## Tests

- Go: `internal/auth/api_web_test.go` covers the options matrix, the Google start/code validation,
  and a full reset from the captured email. `internal/onboarding/api_form_test.go` covers the
  form and an idempotent skip. `internal/mcpauth/api_test.go` (DB) covers create-account →
  approve → code exchange with a read-only scope, deny, and fatal vs redirectable errors. The
  cmd/web spec/bearer contract tests pass. Tests use no real keys.
- Unit (vitest): `features/auth/passkey.spec.ts` and `server/google.spec.ts`.
- e2e: `tests/e2e/auth.spec.ts` covers login failure and success (with `next` and an off-site
  `next`), signup with a validation error then success, onboarding complete → done page, skip,
  logout, forgot password, reset with a bad token, the locale switcher, consent fatal (400 plus
  `X-Frame-Options`), consent create-account → approve, and a signed-in deny.
- Not covered end to end: Google and passkeys, which need a real provider or device. Their halves
  are unit-tested on both sides.
- Visual: `/login`, `/signup`, `/forgot-password`, `/reset-password` and `/app/onboarding`
  compared at 1280px against Go on :8090; they match.

## Notes

- `AuthShell.svelte` now renders its title through `#lib/features/landing/PageTitle.svelte`, so
  link previews carry og/twitter titles. This means a layout component imports from a feature.
