# News ticker: Go → SvelteKit

Go sources: `internal/news/handler.go`, `web/news/news.templ`.
SvelteKit: `src/lib/features/news/`, `src/routes/(app)/app/settings/news-ticker/`.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/news-ticker` (dashboard partial) | `NewsTicker.svelte` on the overview when `newsTickerEnabled`; TanStack query, 5 min refetch | `GET /news` |
| `GET /app/settings/news-ticker` | `settings/news-ticker/+page.*` (`navActive: /app/settings`); API 404 → page 404 | `GET /news/settings` (new) |
| `POST /app/settings/news-ticker` | `?/toggle` (the switch submits on change, with a noscript Save) | `PUT /news/settings` (new) |
| `POST /app/settings/news-ticker/feeds` | `?/add` (422 → `fields.url` under the input) | `POST /news/feeds` (new) |
| `POST /app/settings/news-ticker/feeds/{id}/delete` | `?/remove` (hidden `feed`) | `DELETE /news/feeds/{id}` (new) |

The endpoints are in `internal/news/api_settings.go`. They answer 404 when the deployment has no
`NEWS_TICKER_FEEDS`, which is also the local stack's state. The e2e spec therefore covers the off
path, and the on path is covered by the Go contract tests.

## Library candidates

- **Motion / GSAP**: a scrolling ticker. Go's is a static card list, so this is only if the design wants
  a marquee.
