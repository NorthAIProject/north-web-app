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
   `kheprios.com/.well-known/oauth-*`, `kheprios.com/ingest/*`,
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
| Request body | 100 MB (Free/Pro **zone**) | same | **Blocks 200 MB form-check videos.** See below. |

The body cap is a zone limit, not a Workers one. It applies to every proxied
request, including the Worker-less Go routes, so it hits iOS as well as the web.

## Before the DNS move: uploads over 100 MB

Today iOS and the web both POST raw videos (up to `media.MaxVideoBytes`,
200 MB) through `/api/v1`. Once kheprios.com is proxied, anything over 100 MB
gets a Cloudflare 413. Fix, in order:

1. **API (north-client, additive):** `POST /api/v1/form-checks/uploads` returns a
   presigned PUT URL plus an upload id. `internal/media/storage.go` already holds
   an `s3.PresignClient` (GET only today), so this adds a `PresignPutObject` call.
   A second call registers the uploaded object and starts the job. The old
   multipart route stays, because shipped iOS builds use it.
2. **Storage host stays DNS-only.** Presigned URLs point at
   `https://media.kheprios.com` (`STORAGE_ENDPOINT`). That record must be
   **grey-cloud** in Cloudflare DNS, or the PUT hits the same 100 MB cap. The
   signature binds the host, so the name cannot change.
3. **iOS:** upload to the presigned URL; ship it to the App Store.
4. **Web:** `formcheck` uploads from the browser straight to the presigned URL.
   The bytes never touch the Worker.

Until (3) is on most devices, an iOS user with a clip over 100 MB gets a 413 after
the move. To shrink that window, add the cap to the iOS picker. Other uploads
(Hevy CSV, progress photos, plan files, knowledge docs, chat photos) are well
under 100 MB.

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

1. **Uploads:** the presigned upload is live on the API, and an iOS build with
   it is approved.
2. **First deploy (account):** `bun x wrangler login`, then `bun x wrangler
   deploy`. Open the `*.workers.dev` URL; it talks to the production API.
   Sign in, open My Day, and check that the coach streams.
3. **Add the zone (account):** add kheprios.com to Cloudflare. Check the
   imported DNS records against Namecheap's: the apex A `178.105.244.185`,
   `www`, `media`, mail records. Set apex/www to **proxied** and `media` to
   **DNS-only**. SSL mode: **Full (strict)**, since the ingress has a real
   certificate.
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
