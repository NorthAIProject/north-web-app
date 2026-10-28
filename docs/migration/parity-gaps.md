# Parity gaps: Go web → SvelteKit

Audit of 2026-10-28 against `routes.md`, which was checked against `cmd/web/routes.go` and every
`internal/*/handler.go` `Routes` method in north-client-api. Result: 373 web routes; 360 covered by
SvelteKit, 11 kept by Go at the edge, 2 closed as dead (below). `/app` paths below are written in full.

## 1. Routes not ported (closed as dead)

| Route | Go handler | What it does | Owner |
| --- | --- | --- | --- |
| `PATCH /app/check-ins/{id}` | `checkins.Handler.update` | Edits a past check-in from the wizard's form fields and re-renders the saved panel (422 re-renders the form). | checkins |
| `DELETE /app/check-ins/{id}` | `checkins.Handler.delete` | Deletes a check-in. Over htmx it answers 204 and fires `checkin-saved` so live displays refresh. | checkins |

Neither route is called by any Go template (`web/**/*.templ`), so a Go web user could never reach
them. `checkins.md` records this as "not ported". The JSON API has `PATCH/DELETE /check-ins/{id}`,
so wiring edit/delete onto the history rows later needs only front-end work. Decision (2026-10-28):
closed as dead for the 1:1 port; editing a past check-in would be a new feature.

## 2. Covered, with a difference a user would notice

One line per deviation, from each feature doc's "Deliberate differences" or "Deviations" section.
Pure refactors (named actions instead of per-id URLs, components instead of fragments) are left out.

- **Auth:** a failed Google sign-in redirects to `/login?google=<reason>` with an alert. Go showed the error in place. (auth.md)
- **Auth:** `/reset-password` without a token is a 200 "request a new link" page. Go returned 400. (auth.md)
- **Auth:** the passkey button on the MCP consent page now works. Go's did nothing. (auth.md)
- **Activity:** a refusal shows the API's message without Go's `: validation failed` suffix. (activity.md)
- **Calculator:** generating a plan without measurements says "The goal could not be worked out." instead of naming the missing biometrics. (calculator.md)
- **Selects (app-wide):** shadcn Select has no search box and no clear (⊗) button; templUI had both. This matters most on long ingredient and country lists. (calculator, nutrition, planimport, social, settings, landing .md)
- **Care:** saving one card resets only that form. Text typed in other cards survives, where Go's panel swap cleared it. (care.md)
- **Charts (app-wide):** Go's Chart.js charts are drawn by shadcn Chart (LayerChart) via `SpecChart`; tick counts and legend swatches differ slightly. ECharts charts are unchanged. (insights.md, care.md)
- **Dates (app-wide):** times show in the user's timezone. Go showed server time or UTC. Affects care, decisions, knowledge, fitness (Strava "last synced"), settings and the moderation queue. (care, decisions, knowledge, fitness, settings, moderation .md)
- **Check-ins:** without JS, a save stays on the page with the saved panel instead of redirecting to `?saved=1`. The live region polls every 20 s instead of Go's version-204 probe. (checkins.md)
- **Check-ins:** the coach reply loads only for today's check-in. (checkins.md)
- **Coach:** a failed stream keeps its error in the bubble until the next action. Go's refresh wiped it at once. A reply the API refuses puts the typed text back in the composer. (coach.md)
- **Coach / dictation:** the mic is hidden when `GET /voice` reports unavailable. The recorder path has never run in a browser. (coach.md)
- **Crews:** role, remove and challenge failures land on SvelteKit's error page. Go showed a plain-text page. (crews.md)
- **Crews:** a new total unread badge sits on the Crews nav item. Go had per-crew dots only. (crews.md, nudges.md)
- **My Day:** write failures appear as a toast instead of an inline 422 fragment. (day.md)
- **Fitness:** Strava connect, sync and disconnect results arrive as `/app/fitness?notice=…` redirects. The row "Show" buttons now tint that day's rows; in Go they did nothing. (fitness.md)
- **Form check:** uploading needs JavaScript; Go's form posted without it. A quota refusal shows inline above the form instead of a bare 429 page. (formcheck.md)
- **Goals:** goal detail shows at most 20 progress updates. Go showed 50. (goals.md)
- **Knowledge:** a quota refusal on rebuild or read-again shows inline. A document that cannot be read falls back to its list record plus the API's message. (knowledge.md)
- **Lifts:** a Hevy import that half-saved shows a generic error without the saved/failed counts. (lifts.md)
- **Lifts:** `/app/lifts/today` is now a real page; in Go it was a bare fragment. (lifts.md)
- **Memories:** after an add, the category select keeps the last choice instead of resetting to `general`. (memories.md)
- **Nutrition:** the food log's quick-capture panel is a link card to `/app/capture`, not an embedded panel. (nutrition.md)
- **Nutrition:** spoken-meal "Find" needs JavaScript. (nutrition.md)
- **Nutrition:** `/app/nutrition` now redirects to `/app/nutrition/log`; in Go it was a 404. (code; nutrition.md still says 404)
- **Plan import:** `GET /app/nutrition/import/review` shows the upload page (Go: 405). Without JS, choosing a file does not auto-submit. (planimport.md)
- **Profiles:** workout list cards show at most two exercises, so a PR on the third or a later exercise has no badge on the card. (profiles.md)
- **Progress:** a refused save keeps the chosen photos; Go lost them. (progress.md)
- **PWA:** the service worker moves from `/sw.js` to `/service-worker.js`, and the cache name now changes on every deploy. (pwa.md)
- **Recaps:** the share link uses the request's origin, not `BASE_URL`. (recaps.md)
- **Reports:** a pending report polls every 5 s and updates in place; Go said "refresh in a moment". Rating is Yes / No / Undo. (reports.md)
- **Training:** the week editor lists 20 plans (Go: 50). A refused edit shows the plan's message instead of "That request could not be read." (training.md)

Doc claims that the code has since fixed (the docs are stale, nothing to do):

- overview.md: first-week, lighter-day and trends embeds "not mounted". They are mounted.
- recaps.md: `RecapStrip` "not mounted". It is on My Day.
- settings.md: push row and coaching-style dictation "Gap". `PushRow` and `DictateField` are both present.
- crews.md: the "shell must mount" unread badge. `AppShell` mounts it.
- activity, exercises, formcheck, lifts and profiles .md: "rail highlight lost". Each of those routes has a `+layout.ts` that sets `navActive`.
- insights.md: has no section for sleep, cardio, patterns, coach, spend or metric. Those pages exist under `R/insights/*`.

## 3. Edge routing after cut-over

SvelteKit must serve these paths:

- Public pages: `/`, `/privacy`, `/terms`, `/facebook-data`, `/i/{code}` and `/i/c/{code}`.
- Visitor settings: `POST /locale` and `POST /appearance`.
- Static and build files: `/favicon.ico`, `/assets/*`, `/_app/*`, `/service-worker.js`, `/manifest.webmanifest`, `/offline.html` and `/robots.txt`.
- Auth: `/login`, `/signup`, `/logout`, `/forgot-password`, `/reset-password`, `/auth/google`, `/auth/google/callback` and `/auth/passkey/finish`.
- MCP consent: `/oauth/authorize` and `/oauth/authorize/resume`. The `north_oauth_req` cookie is scoped to `/oauth`.
- The app: `/app/*`, everything under it.
- `/api/*` **except** `/api/v1/*`. This is SvelteKit's same-origin proxy (`src/routes/api/[...path]`).

Go must keep these paths:

- `/api/v1/*`: the JSON API, for iOS and the SvelteKit server.
- `/mcp`.
- `/oauth/token`, `/oauth/register` and `/oauth/revoke`.
- `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource` and `/.well-known/oauth-protected-resource/mcp`.
- `/ingest/health/*`.
- `/webhooks/telegram`.
- `/healthz` and `/internal/metrics`. Metrics needs `METRICS_SECRET`.

Either one can serve `/.well-known/apple-app-site-association`. Both implement it, and Go's lives in
`cmd/web`, so it survives the `web/` deletion. Pick one. If it is SvelteKit, set `APPLE_TEAM_ID` and
`APPLE_BUNDLE_ID` to Go's values (pwa.md).

These Go paths are retired and nothing replaces them at the same URL:

- `/sw.js`. Old workers are replaced when a SvelteKit page registers `/service-worker.js`.
- `/auth/passkey/{login,register}/{begin,finish}`. The begin calls now go through `/api/auth/passkey/*`; finish is `/auth/passkey/finish`.
- `/oauth/authorize/account`. It is now `?/account`.
- The per-id POST URLs that became named actions (`/app/goals/{id}/delete` and the like).

The rules have to split by exact prefix:

- `/oauth/authorize*` goes to SvelteKit; the rest of `/oauth/*` goes to Go.
- `/.well-known/oauth-*` goes to Go.
- `/api/v1/` goes to Go; any other `/api/` path goes to SvelteKit.

A blanket `/oauth/*`, `/.well-known/*` or `/api/*` rule breaks consent, AASA or the proxy.

### Cut-over risks found during the audit (not in any feature doc's deviation list)

- **Upload body limit.** No `BODY_SIZE_LIMIT` is set anywhere in this repo. adapter-node's default
  of 512 KB would refuse uploads before they reach the API: form-check videos (need at least 201M),
  Hevy imports (at least 11 MB), progress photos and knowledge uploads. (formcheck.md, lifts.md, progress.md)
  On Cloudflare the platform caps a request body too (100 MB on Free/Pro plans), so 201 MB videos
  cannot pass through the proxied zone at all, from the web or from iOS. Plan: presigned PUT
  straight to `media.kheprios.com` (DNS-only), before the DNS move. See
  `docs/architecture/hosting-cloudflare.md`.
- ~~**Session cookie renamed.**~~ Fixed: SvelteKit now uses Go's `north_session` cookie (same
  token, path and flags), so signed-in users stay signed in across the cut-over.
- **SvelteKit health probe.** SvelteKit has no `/healthz` (that path stays Go's). On Workers there
  is no pod; probe `/login` for 200 (hosting-cloudflare.md).
