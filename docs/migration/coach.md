# Coach chat and dictation: port notes

Go: `web/chat/*`, `internal/coach/handler.go`, `web/shared/ui/dictate`, `internal/voice`.
Svelte: `src/routes/(app)/app/chat/`, `src/lib/features/coach/`, `src/lib/features/voice/`.
Spec: `tests/e2e/coach.spec.ts`, 11 tests.

## Routes

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/chat` | `chat/+page.server.ts` load: redirects to the newest thread, or renders `EmptyCoach` | `GET /conversations`, `GET /conversations/stats` |
| `POST /app/chat` (`kind`, `draft`) | `chat/+page.server.ts` `?/start` (`StartForm.svelte`, posted from every chat page) | `POST /conversations` |
| `GET /app/chat/{id}` | `chat/[id]/+page.server.ts` load (`depends('north:chat')`) → `ChatPage.svelte` | `GET /conversations/{id}`, `/conversations`, `/conversations/stats` |
| `POST /app/chat/{id}/messages` + `GET /app/chat/{id}/stream?m=&media=` | `ChatStream.send` in `chat.svelte.ts`: upload, then one streaming POST | `POST /conversations/{id}/attachments`, `POST /conversations/{id}/reply` |
| `GET /app/chat/{id}/stream?begin=1` | `ChatStream.begin` (opens on sight for an empty reflection) | `POST /conversations/{id}/reply {begin:true}` |
| `GET /app/chat/{id}/resume` | `ChatStream.resume` (opens on sight when `awaitingResume`) | `POST /conversations/{id}/resume` |
| `POST /app/chat/{id}/tools/{messageID}/{decision}` | `[id]` `?/decide` (fields `messageId`, `decision`), `ApprovalCard.svelte` | `POST /conversations/{id}/tools/{messageID}` |
| `POST /app/chat/{id}/messages/{messageID}/helpful` | `[id]` `?/helpful` (fields `messageId`, `answer`), `MessageFeedback.svelte` swaps itself in place | `PUT .../messages/{messageID}/helpful` |
| `POST /app/chat/{id}/delete` | `[id]` `?/delete` (asks first with `confirm()`, as Go did) | `DELETE /conversations/{id}` |
| `GET /app/media/{id}` (chat photos) | `<img src="/api/conversations/{id}/attachments/{mediaId}">` | **new** `GET /conversations/{id}/attachments/{mediaID}` (302) |
| `GET /app/exercises/{slug}/muscles` (in transcript) | `features/exercises/ExerciseMuscles.svelte` | `GET /exercises/{slug}` |
| `GET /app/knowledge/passages?ref=` (sources) | `features/knowledge/Sources.svelte` | knowledge port |
| `GET /app/memories/for/{id}` (reflection close) | `features/memories/ConversationMemories.svelte` | memories port |
| `POST /app/voice/transcribe` | `features/voice/Dictate.svelte`, `DictateField.svelte`, `recorder.ts` | **new** `GET /voice`, `POST /voice/transcribe` |

## API changes (north-client-api)

All additive. The iOS app skips unknown SSE events (`CoachService.decode`), so the new event is safe.

- `ChatMessage` gains `toolTurn`, `proactive`, `sourceLabel`, `evidenceRefs` (only when a chunk ref is present), and `sourceCount`.
- `ApprovalCall.watch` (`WatchProposal`) carries a parsed `create_watch`, so a client can show the standing-task card.
- The reply and resume streams gain a `status` event, `{"line": "is checking your goals"}`, emitted per round of tool calls (Go web's named `status` frame).
- `GET /conversations/stats` returns `{threadCount, messagesThisWeek}`, from the same `buildCoachStats` the web page used.
- `GET /conversations/{id}/attachments/{mediaID}` answers 302 to the stored file. The URL resolver is wired in `cmd/web/routes.go`.
- `internal/voice/api.go` adds `GET /voice` (`{available, maxSeconds, maxBytes}`) and `POST /voice/transcribe` in the upload group, using the same handler and quota as the web (`GuardJSON`).

## Stream protocol

The Go page sent HTML fragments over a GET `EventSource`: unnamed frames for tokens and errors, and named frames for `status`, `failed` and `done`. A `done` frame triggered an `hx-get` of the whole `#chat-root`.

The port reads the API's typed JSON frames off `fetch` (`stream.ts`, a small SSE parser; `EventSource` cannot POST). Tokens append as plain text with the caret. A `status` frame sets the header line. An `error` frame shows the message in the bubble. When the stream closes, `invalidate('north:chat')` brings back the stored turn, which is the same as Go's `done` refresh. The mascot is driven through `mascot.streamOpened/streamMessage/streamFailed/streamClosed`.

## Approval timeout

Go ran the tools inside the POST and then redirected. The port does the same through `?/decide`. While the request runs, both buttons are disabled and the header shows "is thinking".

The request can end without a redirect. That happens on a 409 (the approval is already being resolved), a 404 (the turn moved on), or a dropped connection or timeout while the server is still running the tools detached. In those cases the card polls `GET /conversations/{id}` every 3 s with TanStack Query until the pending turn changes. It then re-reads the page, and the resume stream opens. The e2e spec covers this case with an approval answered from another client.

## Deliberate differences

- If a stream fails, the error stays in the bubble until the next action. In Go, the `done` refresh wiped it at once. If the API refuses a reply before streaming (429 quota, 409, 503), the typed text goes back into the composer, because nothing was stored.
- The API decides that a refused upload or an empty message is refused, and the composer shows its message ("Type something first." is checked client-side first, as in Go).
- `toolTurn` messages are hidden, as Go hid `IsToolTurn()` turns.

## Library candidates

- **Motion** (or the built-in `svelte/transition`): fade or slide newly arrived bubbles in, and cross-fade the streaming bubble into the stored reply on refresh. The place is `ChatPage.svelte` and `StreamingBubble.svelte`. Go has no transition here, so this is polish, not parity.

## Known gaps

- Dictation is unavailable locally (no transcriber configured; `GET /voice` returns `available:false`), so the microphone does not render. The recorder path has not been tested in a browser.
- Exercise art in the transcript depends on `ExerciseMuscles` from the exercises port.
