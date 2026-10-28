# capture → SvelteKit

Go: `internal/capture/handler.go`, `web/capture/*.templ`. Helpers: `src/lib/features/capture/capture.ts`
(form → items, receipt line), panel: `features/capture/CapturePanel.svelte`.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/capture` (`?text=`/share target) | `src/routes/(app)/app/capture/+page.server.ts` + `+page.svelte` | — |
| `GET /app/capture/panel` | `CapturePanel` embedded in My Day's quick add (`returnTo: /app`) | — |
| `POST /app/capture/parse` | `?/parse` on `/app/capture` | `POST /capture/parse` (quota-guarded) |
| `POST /app/capture/commit` | `?/commit` on `/app/capture`; embedded clean save redirects to `returnTo` | `POST /capture/commit` |
| `POST /app/capture/foods` | not here: the meal-voice route belongs to the nutrition port | `POST /capture/foods` |

## Deliberate differences

- Dictation reuses `#lib/features/voice/Dictate.svelte` (voice port).
- The fake AI provider cannot answer the parse's JSON shape, so e2e covers the failure path (sentence
  kept, "Try again"); the preview → commit form logic is unit-tested (`capture.spec.ts`).

## Library candidates

None.

Tests: `tests/e2e/capture.spec.ts`, `src/lib/features/capture/capture.spec.ts`.
