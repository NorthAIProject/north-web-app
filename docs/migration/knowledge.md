# Knowledge (documents) — Go → SvelteKit

Go: `web/knowledge/*.templ`, `internal/documents/handler.go`. API: `internal/documents/api.go`.
The routes.md entry `GET Content-Type` is a scrape artefact; the real list is below.

| Go route | SvelteKit | API |
| --- | --- | --- |
| `GET /app/knowledge` | `src/routes/(app)/app/knowledge/+page.svelte` (load) | `GET /knowledge` |
| `POST /app/knowledge/notes` | same page, action `?/note` | `POST /knowledge/notes` |
| `POST /app/knowledge/uploads` | same page, action `?/upload` (multipart re-posted by the action) | `POST /knowledge/uploads` |
| `POST /app/knowledge/reindex` | same page, action `?/reindex` | `POST /knowledge/reindex` |
| `POST /app/knowledge/retry-embeddings` | same page, action `?/retryEmbeddings` | `POST /knowledge/retry-embeddings` **(new)** |
| `GET /app/knowledge/search` (page) | `knowledge/search/+page.svelte` (load; typing → `goto`) | `GET /knowledge/search?q&limit&offset` |
| `GET /app/knowledge/search` (htmx: inline panel, append rows) | `features/knowledge/Library.svelte` + search page "Show more", browser fetch | same |
| `GET /app/knowledge/passages?ref=…` (htmx fragment) | `features/knowledge/Sources.svelte` (component, used by chat) | `GET /knowledge/passages?ref=…` **(new)** |
| `GET /app/knowledge/{id}` | `knowledge/[id]/+page.svelte` (load; `?from&to` highlight) | `GET /knowledge/{documentID}` |
| `POST /app/knowledge/{id}/reindex` | `[id]` action `?/reindex` | `POST /knowledge/{documentID}/reindex` |
| `POST /app/knowledge/{id}/delete` | `[id]` action `?/delete` (also posted from list rows) | `DELETE /knowledge/{documentID}` |

## API changes (additive)

- `GET /knowledge`: documents gain `lineCount`, `stale`; counts gain `chunks`; list gains
  `problems[]` (`kind` is an open string: failed, empty, stale, old-reader, stuck),
  `embeddingGap`, `lastRun` (absent when never run). Health lookups are best effort, as on the page.
- `GET /knowledge/search`: `offset` param, `hasMore` in the response, `endLine` on hits; a
  punctuation-only query is an empty result (was an error); a hit with no highlighted
  snippet (vector-only) now carries the first 240 bytes of the passage in `snippet`, as Go showed.
- `GET /knowledge/{id}`: `headings[]` (`level`, `text`, `line`).
- New `GET /knowledge/passages`, `POST /knowledge/retry-embeddings`.
- Goldens updated; new test for the snippet fallback.

## Sources contract (for chat)

`<Sources refs={message.evidenceRefs} label={…'chat.sources.one' / 'chat.sources.many'} />` —
renders the disclosure button; on click fetches `/api/knowledge/passages` and replaces itself
with the passages list. The caller wraps it in Go's `<div class="ml-1 w-full max-w-[94%]">` and
renders it only when the message has `chunk:` refs.

## Deliberate differences

- Dates (`Read` column, document "read" date, last-run summary) use the user's timezone; Go used
  the DB value's location.
- A document whose bytes cannot be read: Go showed the raw error on the page. The API answers 5xx
  for that, so the page falls back to the list's record and shows the API's message.
- Quota refusals (429) on rebuild/read-again show as an inline alert instead of Go's refusal page.
- Upload/note failures come back through `fail()`; a no-JS "Show more" link renders the next rows
  as Go's `append=1` full page did.
- "Download export" links to `/app/settings/export.zip` (settings owns it) with
  `data-sveltekit-reload`.

## Library candidates

None. Go never polled indexing status on this page, so TanStack Query is not needed for a 1:1
port; if live indexing status is wanted later, a `createQuery` on `GET /knowledge` with a
refetch interval while `counts.pending > 0` would sit in `Library.svelte`/`IndexMeter.svelte`.

## Tests

`tests/e2e/knowledge.spec.ts` (8 tests). The local stack runs no worker, so documents stay
"waiting" and search returns nothing there; hit rendering was checked visually against the Go
page with chunks seeded by SQL.
