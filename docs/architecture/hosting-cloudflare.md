# Hosting on Cloudflare Workers

Decision (2026-10-28): the SvelteKit app runs on Cloudflare Workers with static
assets (`@sveltejs/adapter-cloudflare`, `wrangler.jsonc`). north-client stays on
the k3s cluster (`khepri-web` in `horus`) as the API. kheprios.com moves its
nameservers from Namecheap to Cloudflare and is proxied (orange cloud).

Nothing here has been done against the real account yet. Every step marked
**(account)** needs the Cloudflare account owner and an explicit go-ahead.

## How a request flows

```
browser / iOS ──► Cloudflare edge (kheprios.com, proxied)
                    │
                    ├─ Worker-less routes (Go paths) ───────────────► k3s ingress ─► khepri-web (Go)
                    │
                    └─ Worker route kheprios.com/* ─► khepri-web Worker (SvelteKit)
                                                        │  server load/actions, /api/* proxy
                                                        └─ fetch(https://kheprios.com/api/v1/…) ─► origin (Go)
```

A `fetch()` from a Worker on a **route** to its own zone goes to the DNS origin,
never back into the Worker ("Routes cannot be the target of a same-zone
`fetch()` call", Workers routes docs). That is why `NORTH_API_URL` and
`GO_ORIGIN` can both be `https://kheprios.com`. It also means the Worker must be
attached with **Routes, not a Custom Domain**: a Custom Domain makes the Worker
the origin, and those fetches would have nowhere to go.

## Which paths go where

The list is `src/lib/server/edge.ts` (tested in `edge.spec.ts`), from the audit
in `docs/migration/parity-gaps.md` §3. Go keeps:

- `/api/v1` and `/api/v1/*`
- `/mcp`, `/mcp/*`
- `/oauth/token`, `/oauth/register`, `/oauth/revoke`
- `/.well-known/oauth-*`
- `/.well-known/acme-challenge/*`: cert-manager renews the origin's Let's Encrypt
  certificate over HTTP-01 (`cluster/cert-manager/issuers.yaml` in infra). If the
  Worker answered these, renewal would fail silently and Full (strict) would break
  about 60 days later.
- `/ingest/*`, `/webhooks/*`
- `/healthz`, `/internal/metrics`

Everything else is SvelteKit, including the near neighbours `/api/<x>` (the BFF
proxy), `/oauth/authorize*` and `/.well-known/apple-app-site-association`.

Two layers enforce this:

1. **Worker-less routes (account).** A route with no Worker negates the less
   specific `kheprios.com/*` route, so these requests never run the Worker (no
   CPU, no invocation count, no Worker in the upload path):
   `kheprios.com/api/v1*`, `kheprios.com/mcp*`, `kheprios.com/oauth/token*`,
   `kheprios.com/oauth/register*`, `kheprios.com/oauth/revoke*`,
   `kheprios.com/.well-known/oauth-*`, `kheprios.com/.well-known/acme-challenge/*`,
   `kheprios.com/ingest/*`,
   `kheprios.com/webhooks/*`, `kheprios.com/healthz*`,
   `kheprios.com/internal/metrics*`. Route patterns only take a trailing `*`,
   so `/mcp*` also catches `/mcpx`. Nothing lives there, and an unknown path
   on Go is a 404 either way.
2. **The hook passthrough.** `hooks.server.ts` hands any `isGoPath` request to
   `GO_ORIGIN` before touching the session. This is the safety net if a route
   is missing. It is also what makes `wrangler dev` behave like production.
   An empty `GO_ORIGIN` turns it off, which is right for `vite dev`.

## Limits that matter

From the Workers limits page (checked 2026-10-28):

| Limit | Free | Paid ($5/mo) | Effect here |
| --- | --- | --- | --- |
| CPU per request | 10 ms | 30 s default | SSR of `/app` pages (charts, i18n, big lists) will pass 10 ms. **Use Workers Paid.** |
| Requests | 100k/day | unlimited | Fine either way today. |
| Subrequests | 50/request | 10,000 | The heaviest loads call the API ~10 times. Fine. |
| Worker bundle (gzip) | 3 MB | 10 MB | Current build: 1.27 MB gzip. |
| Request body | 100 MB (Free/Pro **zone**) | same | Videos capped at 90 MB to fit. See below. |

The body cap is a zone limit, not a Workers one. It applies to every proxied
request, including the Worker-less Go routes, so it hits iOS as well as the web.

## Before the DNS move: uploads over 100 MB

Decision (2026-10-28): cap videos below the zone limit rather than add direct-to-storage uploads.

- **API:** `media.MaxVideoBytes` is 90 MB (north-client 9b9bee51). With the multipart overhead,
  a request stays under 100 MB, and refusal messages and help text say 90 MB.
- **iOS:** a picked clip over 90 MB is re-encoded at 720p, then 540p. If it is still too big, the
  person is asked to trim it (north-ios `fix/form-check-video-cap`, 0bc7a5e). **Ship this build
  before the DNS move.** An older build sends raw clips, and one over 100 MB gets Cloudflare's
  413 instead of the API's message.
- **Web:** the browser posts the file as picked. Over 90 MB, the API's message says so.

`media.kheprios.com` (`STORAGE_ENDPOINT`) can stay DNS-only either way. Nothing uploads to it from a
browser, and presigned GETs are signed for that host.

If 200 MB clips are ever needed again, the alternative is a presigned PUT straight to storage
(`internal/media/storage.go` already holds an `s3.PresignClient`).

## Vars and secrets

Plain vars live in `wrangler.jsonc`: `NORTH_API_URL`, `GO_ORIGIN`,
`APPLE_TEAM_ID`, `APPLE_BUNDLE_ID`, `POSTHOG_HOST`. The only per-environment
value is `POSTHOG_API_KEY`. It is public, so a var works; to keep it out of the
repo, use `wrangler secret put POSTHOG_API_KEY` **(account)**. Remember that
`secret put` deploys a new version.

The Worker holds no other secret. The session token sits in the user's
`north_session` HttpOnly cookie, and the Worker forwards it as a bearer.

## Checking a build locally

```sh
bun x vite build
bun x wrangler deploy --dry-run          # bundle + bindings, no upload
bun x wrangler dev --port 8787 \
  --var NORTH_API_URL:http://localhost:8090/api/v1 \
  --var GO_ORIGIN:http://localhost:8090
WEB_URL=http://localhost:8787 bunx playwright test --project desktop
```

## Cut-over runbook

**Status (2026-10-29): live.** Zone Active 19:12 WET; universal certificate issued;
`kheprios.com/*` attached to `khepri-web` (version 80e44647) with the 11 Go
routes Worker-less. Checked through the edge: pages from SvelteKit
(`/service-worker.js` 200, `/sw.js` 404), `/healthz`, `/api/v1`, `/mcp`,
`/oauth/token`, `/.well-known/*` and `/webhooks/telegram` from Go, www → apex 301.
Signed-in check (2026-10-30, owner's Chrome through the edge): the `north_session`
cookie carried over; My Day, the coach (thread history) and 26 other `/app` pages
render from SvelteKit with no console errors; `/service-worker.js` replaced the Go
`/sw.js` registration. Go pages left open before the move poll htmx partials;
the Worker answers any `HX-Request` with `HX-Refresh: true` so they reload
(`staleHtmxPage`, edge.ts).

Provider checks (2026-10-30):
- Strava: real account, Sync now through the Worker → `POST /api/v1/fitness/strava/sync`
  202 → worker `strava sync finished` (token valid, nothing new).
- Google: `/auth/google` through the edge 302s to accounts.google.com with
  `redirect_uri=https://kheprios.com/auth/google/callback`; Google shows its sign-in
  page, no `redirect_uri_mismatch`. Real round trip by the owner's account on 2026-10-30
  09:01: `google/start` 200 → Google account chooser → `/auth/google/callback` →
  `google/code` 200 → `/app` signed in, from SvelteKit.
- Plain http: Cloudflare hands `http://` requests to the Worker untouched (the Go
  ingress used to redirect). Over http the Google start sent an `http://` redirectUri
  and the API refused it (422 in prod logs). The Worker now 308s every non-loopback
  http request to https (`toHttps`, edge.ts).
- Facebook: prod has no `FACEBOOK_APP_ID` in `khepri-env`, so connect is off in Go and
  here alike; nothing to check until a Meta app exists.

1. **Uploads:** the 90 MB API cap is live, and the iOS build that shrinks clips
   is approved.
2. **First deploy (account):** `bun x wrangler login`, then `bun x wrangler
   deploy`. Open the `*.workers.dev` URL; it talks to the production API.
   Sign in, open My Day, and check that the coach streams.
3. **Add the zone (account):** add kheprios.com to Cloudflare. Check the
   imported DNS records against Namecheap's: the apex A `178.105.244.185`,
   `www`, `media`, mail records. Set apex/www to **proxied** and `media` to
   **DNS-only**. SSL mode: **Full (strict)**, since the ingress has a real
   certificate. Add a redirect rule from `www` to the apex (301, keep the path and
   query): the session cookie and the passkey relying party are the apex's.
4. **Nameservers (owner, at Namecheap):** switch to the two Cloudflare
   nameservers. Wait for the zone to show Active.
5. **Routes (account):** the Worker-less Go routes first, then uncomment
   `routes` in `wrangler.jsonc` and deploy. From this moment SvelteKit serves
   kheprios.com.
6. **Verify:**
   - `/healthz`: 200 from Go.
   - Signed-in sessions survive, because the cookie is shared.
   - iOS still works against `/api/v1`.
   - MCP OAuth: authorize goes to SvelteKit, token goes to Go.
   - Telegram webhook delivers.
   - The three provider halves no local test reaches: a real Google sign-in, a Strava connect
     and a Facebook connect (parity-gaps.md §2b).
   - AASA is served.
   - `/sw.js` is gone and `/service-worker.js` registers.
7. **Tell north-60:** the Echo session then deletes `web/` from north-client.

**Health probe:** `/healthz` is Go's, so it tells nothing about the Worker. Probe
`https://kheprios.com/login` for 200. The Cloudflare Worker metrics, with
`observability` turned on, cover errors.

**Rollback:**

- Quick rollback: delete the `kheprios.com/*` Worker route. Requests fall
  through to Go, which still serves the old web app until north-60 deletes
  `web/`. **Keep `web/` until the new app has run a few days.**
- Full rollback: switch the nameservers back at Namecheap.
- Worker code: `wrangler rollback` to an earlier version.
