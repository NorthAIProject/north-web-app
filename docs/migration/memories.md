# memories → SvelteKit

Go source: `web/memories/memories.templ`, `web/memories/group.go`, `internal/memories/handler.go`,
`internal/memories/view.go`. One page, `/app/memories`, plus the fragment a finished reflection
loads (`/app/memories/for/{conversationID}`). Go's approve/reject swapped `#memories-panel` with
htmx; every other control was a plain post + 303 back to `/app/memories`.

Here each control is a form posting to a named action on
`src/routes/(app)/app/memories/+page.server.ts` with the memory id in a hidden `id` field, enhanced
with `use:enhance` (the 303 is followed client-side, so the page reloads its data in place and
works with no script). A 422 on create comes back as `fail(422, { create })` and shows under the
add form; a 422 on an inline edit comes back as `fail(422, { edit })` and swaps that card for the
"Fix this fact" card with the field messages (Go: `approvedCardEdit`).

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/memories` | `memories/+page.server.ts` `load`, `memories/+page.svelte` | `GET /memories` |
| `GET /app/memories/for/{conversationID}` | `src/lib/features/memories/ConversationMemories.svelte` (client fetch) | `GET /memories/for/{conversationID}` (**new**) |
| `POST /app/memories` | action `?/create` | `POST /memories` |
| `POST /app/memories/{id}` | action `?/update` | `PUT /memories/{memoryID}` |
| `POST /app/memories/{id}/approve` | action `?/approve` (page); `POST` via proxy (ConversationMemories) | `POST /memories/{memoryID}/approve` |
| `POST /app/memories/{id}/reject` | action `?/reject` (page); `POST` via proxy (ConversationMemories) | `POST /memories/{memoryID}/reject` |
| `POST /app/memories/{id}/pin` | action `?/pin` | `PUT /memories/{memoryID}/pinned` `{value:true}` |
| `POST /app/memories/{id}/unpin` | action `?/unpin` | `PUT /memories/{memoryID}/pinned` `{value:false}` |
| `POST /app/memories/{id}/exclude` | action `?/exclude` | `PUT /memories/{memoryID}/excluded` `{value:true}` |
| `POST /app/memories/{id}/include` | action `?/include` | `PUT /memories/{memoryID}/excluded` `{value:false}` |
| `POST /app/memories/{id}/delete` | action `?/delete` (confirm Dialog) | `DELETE /memories/{memoryID}` |

## API changes (north-client `internal/memories/api.go`, `docs/api/openapi.yaml`)

- `GET /memories/for/{conversationID}` → `ConversationMemories { pending: Memory[] }`: the
  proposals from one conversation still waiting for a verdict (`Service.ListPendingForConversation`,
  the call the Go fragment made). Unknown or someone else's conversation → empty list.
- `Memory` gained `updatedAt`, `supersedesId` and `validTo` (all additive, optional in the
  contract). The page needs them for the "replaces a known fact" / "no longer current" badges,
  for hiding pin/hide on a retired fact, and for Go's within-category sort (pinned, then current,
  then most recently changed). Golden `testdata/memories.golden.json` updated.

## Components (`src/lib/features/memories/`)

- `ConversationMemories.svelte` — `{ conversationId: string }`. Renders
  `<div id="reflection-memories">` with Go's `ConversationPending` chips (Save to memory / Skip),
  fetching itself through `browserApi()`; after each verdict it refetches, so it disappears once
  nothing is left. Used by chat's reflection close.
- `PendingCard`, `ApprovedCard` (inline edit, pin/hide/include, delete dialog, fix-errors card),
  `CategoryField` (Select, empty → `general` as the Go selectbox did).
- `view.ts` — `groupApprovedByCategory` (port of `GroupApprovedByCategory`), `buildInstruments`
  + the donut option (port of `viz.DonutOptionJSON` with North's palette, drawn by
  `components/khepri/EChart.svelte`), `categoryLabel`.
- Fact textareas use `features/voice/DictateField.svelte` like Go's `dictate.Field`.

## Deliberate differences

- Forms post to `?/<action>` on `/app/memories` instead of `/app/memories/{id}/<verb>`; the
  resulting navigation and markup are the same.
- After a successful add, the add form's category select keeps the last choice rather than
  snapping back to `general` (Go reloaded the page). The text is cleared.

## Library candidates

None. The donut stays on ECharts (`EChart.svelte`), as the playbook says for Go's ECharts charts.
