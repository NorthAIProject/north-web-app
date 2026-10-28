# PWA, well-known files, error page

| Go | Svelte |
| --- | --- |
| `GET /manifest.webmanifest` (`web/pwa`) | `static/manifest.webmanifest` (verbatim; served as `application/manifest+json`) |
| `GET /offline.html` (+ in-page i18n) | `static/offline.html` (verbatim, self-contained, same URL — what the worker precaches) |
| `GET /sw.js` + `assets/js/shared/pwa.js` registration | `src/service-worker.ts`, registered by SvelteKit as `/service-worker.js`, scope `/` |
| `GET /favicon.ico` → 301 `/assets/brand/favicon.svg` | `src/routes/(public)/favicon.ico/+server.ts` |
| `GET /.well-known/apple-app-site-association` (`internal/auth/aasa.go`) | `src/routes/(public)/.well-known/apple-app-site-association/+server.ts` + `features/pwa/aasa.ts`; env `APPLE_TEAM_ID` (default `84X9WYBF36`), `APPLE_BUNDLE_ID` (default `com.fernandocorreia.khepri,com.fernandocorreia.khepri.beta`, the production values); empty team → 404 |
| chi's plain-text 404/500 | `src/routes/+error.svelte`, modelled on Go's only error page (mcpauth `ErrorPage`: AuthShell, card, destructive alert, "Go to Khepri") |

## Service worker
Same rules as `sw.js`: never cache HTML/POST/SSE; navigations network-first with the offline page as fallback; cache-first + background revalidate for `/assets/*` and now `/_app/immutable/*` (hashed chunks cached as fetched, not precached, so three.js/ECharts are not a first-run download). Push and `notificationclick` handlers unchanged ("Log it" → `/app/capture`, same-origin guard).

Deliberate differences:
- Cache name is `north-shell-<build version>` instead of a hand-bumped `north-shell-v7`; every deploy retires the old cache.
- URL moves from `/sw.js` to `/service-worker.js`. Registering a new script for the same scope updates the existing registration, so browsers with the Go worker (and its push subscription) move over on their next visit. Precache list drops the htmx/Alpine/CSS bundles that no longer exist.
- In `vite dev` SvelteKit registers the worker too; Playwright contexts can opt out with `serviceWorkers: 'block'`.

## Library candidates
None.
