# decisions → SvelteKit

Go source: `web/decisions/decisions.templ`, `internal/decisions/handler.go`. Two pages: the log
with a create form (`/app/decisions`) and one decision with its edit form (`/app/decisions/{id}`).
Every write was a plain post + 303.

| Go route | Svelte | API |
| --- | --- | --- |
| `GET /app/decisions` | `decisions/+page.server.ts` `load`, `decisions/+page.svelte` | `GET /decisions` |
| `POST /app/decisions` | `decisions/+page.server.ts` default action | `POST /decisions` |
| `GET /app/decisions/{id}` | `decisions/[id]/+page.server.ts` `load`, `decisions/[id]/+page.svelte` | `GET /decisions/{decisionID}` |
| `POST /app/decisions/{id}` | `decisions/[id]` action `?/update` | `PUT /decisions/{decisionID}` |
| `POST /app/decisions/{id}/delete` | `decisions/[id]` action `?/delete` | `DELETE /decisions/{decisionID}` |

No API changes were needed. 422s come back as `fail(422, { ...posted, errors })` and show under
each field; on the show page the header keeps the stored title while the form shows what was
posted (Go: `ShowPage(user, existing, form)`). A non-UUID or unknown id is a 404.

Components (`src/lib/features/decisions/`): `DecisionFormCard` (create and edit; outcome + "Did it
hold?" radios only when editing, as Go), `DecisionCard`, and `form.ts` (`formFrom`/`formFor`/
`heldLabel`, same i18n keys). Options, rationale and outcome use
`features/voice/DictateField.svelte` like Go's `dictate.Field`.

## Calibration

`GET /decisions/calibration` exists in the API (yes/partly/no/revisited counts) but the Go web
pages never render it, so neither does this port. The e2e spec checks that a review made through
the edit form shows up in it.

## Deliberate differences

- The edit form posts to `?/update` on `/app/decisions/{id}` and delete to `?/delete`, instead of
  `/app/decisions/{id}` and `/app/decisions/{id}/delete`.
- Dates are formatted in the user's timezone (`data.user.timezone`) with Go's layouts
  (`2 Jan 2006`, `2 January 2006`) via `components/khepri/dates.ts`; Go formatted the stored UTC
  time.
- The API lists up to 100 decisions; the page slices to the newest 50 like Go.

## Library candidates

None. A decision graph (Svelte Flow) would only make sense if decisions gain links between them;
Go shows a flat list.
