# Form check (Go package `media`)

Go: `north-client/web/form/form.templ`, `internal/media/handler.go`. API: `internal/media/api.go`.

| Go route | SvelteKit | API |
| --- | --- | --- |
| `GET /app/form` | `src/routes/(app)/app/form/+page.server.ts`, `+page.svelte` | `GET /form-checks` (first 20, as Go) |
| `POST /app/form` (multipart, quota `media_analysis`) | browser `POST /api/form-checks` through the proxy (`#lib/features/formcheck/upload.ts`), then `goto('/app/form/{id}')` | `POST /form-checks` (202, `GuardJSON(MediaAnalysis)`) |
| `GET /app/form/{id}` | `src/routes/(app)/app/form/[id]/+page.server.ts`, `+page.svelte` | `GET /form-checks/{analysisID}` (carries `playbackUrl`) |
| `GET /app/form/{id}/status` (htmx poll, every 3 s) | no route: TanStack Query `createQuery` (app-wide client) on the detail page polls `GET /api/form-checks/{id}` every 3 s while `pending`/`running`; `AnalysisStatus.svelte` is the fragment | `GET /form-checks/{analysisID}` |
| `GET /app/media/{id}` (302 to a signed URL) | `src/routes/(app)/app/media/[id]/+server.ts` → `redirect(302, url, { external: true })` | **new** `GET /media/{mediaID}` → `MediaLink { id, url, kind, mimeType }` |

Components: `src/lib/features/formcheck/` — `view.ts` (Trustworthy/Clean/InProgress/Timestamp,
badge choices, `issuesHeading`, quota `DelayLabel`), `upload.ts`, `AnalysisStatus.svelte`
(StatusFragment + result + issueCard), `QuotaRefused.svelte` (web/quota `Refused`).

## API added (north-client-api)

- `GET /api/v1/media/{mediaID}` in `internal/media/api.go` (`link`), reusing `Service.GetMedia`
  (owner check) and `Service.PlaybackURL`. Contract golden `testdata/media-link.golden.json`;
  `MediaLink` schema + path in `docs/api/openapi.yaml`. `/app/media/{id}` is also what chat
  photos and progress photos point at, so those features get it for free.

## Deliberate differences

- Upload needs JavaScript (Go's form posted without it). The bytes stream through `/api`
  instead of being buffered by a form action. **Prod:** the Node adapter's `BODY_SIZE_LIMIT`
  must be ≥ 201M or clips over 512 KB are refused before they reach the API.
- Quota refusal: Go answered the plain POST with a bare 429 panel page; here the same
  `quota.title`/`quota.body` alert (from `Retry-After`) shows above the form.
- Error copy: empty file and storage failure use Go's sentences; type/size errors show the API's
  `fields.video` (the same service sentences Go showed). A body over the API cap answers the API's
  "Choose a video under 200 MB." rather than Go's longer sentence.
- The h1 (exercise name) updates when the poll finishes; in Go only the status fragment swapped
  until a reload. The `<video>` keeps its first signed URL (each poll signs a new one).
- Malformed or foreign ids are a 404 page, as Go.

## Known gaps (not in this slice)

- Rail highlight: Go lit **Fitness** on `/app/form` (`BuildNav(ctx, "/app/fitness")`); the shell's
  `activeHref` only matches path prefixes, so nothing is lit. Needs a nav "activeUnder" hint (shell owner).

## Local stack notes

- Uploads need S3 on :9000: `docker run -d --name north-progress-s3 -p 9000:8333 chrislusf/seaweedfs:latest server -s3 -dir=/data`,
  `curl -X PUT http://localhost:9000/north-media`, and `STORAGE_ACCESS_KEY=north STORAGE_SECRET_KEY=northnorth`
  (added to the scratchpad `run-api.sh`).
- Analyses run on the worker and need a video-capable model; the fake provider returns non-JSON,
  so `tests/e2e/formcheck.spec.ts` writes finished/failed states into `form_analyses` via
  `docker exec north-client-postgres-1 psql` (override with `NORTH_PG_CONTAINER`).

## Library candidates

None needed. Polling uses `@tanstack/svelte-query` (already installed) through the app-wide
`QueryClient` the root layout provides (`src/lib/query.ts`).
