# Landing page + public layout + analytics + SEO

| Go | Svelte | API |
| --- | --- | --- |
| `GET /` → `web/landing/page.templ` (+ `herowall`, `product`, `demos`, `apps`, `sections`, `cta.go`, `assets/js/landing/landing.js`) | `src/routes/(public)/(site)/+page.svelte`, components in `src/lib/features/landing/` | none (signed-in state from root layout `user`) |
| `layout.Public` (navbar + main) | `src/routes/(public)/(site)/+layout.svelte` (a `(site)` group so the auth pages in `(public)` keep `AuthShell`) | — |
| `layout.Base` link-preview meta (description, og:*, twitter:*) | `features/landing/SeoMeta.svelte` in the root layout; per-page `<title>`/`og:title`/`twitter:title` via `features/landing/PageTitle.svelte` | — |
| `layout.analyticsSnippet` + `web/shared/analytics` + `assets/js/shared/analytics.js` | `features/analytics/Analytics.svelte` (root layout) + `analytics.ts` (decisions, unit-tested) | — |

Behaviour ported: bearing rail / mobile progress hairline, hero wall geometry (`herowall.ts`, same numbers), thread stagger (CSS `animate-thread-in`), lazy 3D muscle figure (IntersectionObserver, 300px, `khepri/muscle-viewer.ts`, `theme-changed`), goal repair parser + typing animation, surface tab auto-tour (4.6 s, halts on interaction), BMI, goal setter ("Nothing at all" settles the other boxes), signed-in CTAs ("Open Khepri", no language switcher, no "Sign in" button), Discord click event.

## Deliberate differences
- Demo copy is read from the SvelteKit catalogue instead of the `north-landing-copy` JSON island.
- The muscle figure is painted from the exercise data, not read back from the active panel's DOM (same single source).
- Analytics: env `POSTHOG_API_KEY` / `POSTHOG_HOST` (public, same names as the Go deployment; empty key = off). Vendored `posthog.min.js` copied to `static/assets/js/vendor/`, preloaded in `<head>` and run after hydration (Go ran it synchronously in `<head>`). Because navigation is client-side: pageviews captured on every navigation, autocapture limited with `url_allowlist` to Go's page set, query stripping decided per event, replay started/stopped per page (stopped in `beforeNavigate`), `identify` re-run when the user signs in without a reload.
- `og:title`/`twitter:title` are emitted only by pages that use `PageTitle.svelte` (public pages); AuthShell/app pages set `<title>` only. Suggest AuthShell adopt `PageTitle`.
- The setter's select uses the shared bits-ui Select: Go's templUI selectbox shows a clear (⊗) icon once a value is chosen, ours a chevron.

## Visual check
Go (:8090) vs SvelteKit (:5173), full-page, desktop 1440 + mobile 390, light + dark: identical page heights; pixel diff limited to the select trigger icon above. Remaining diffs on reruns came from `font-display: optional` (fallback font on a cold load) and dev-server reloads by other agents.

## Library candidates
- **Motion**: thread-entry stagger (now CSS keyframes + inline delay), hero wall sway (CSS), surface tab panel switch (now instant), goal "typing" reveal.
- **GSAP (ScrollTrigger)**: the bearing rail / waypoints are scroll-linked by hand (scroll listener → height %); section reveal-on-scroll would fit here — Go has none today, so not added.
