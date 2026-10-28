# Profiles, leaderboard and awards page

Go: `internal/profiles/handler.go` + `web/profiles/profile.templ`, `internal/xp/handler.go` +
`web/leaderboard/leaderboard.templ`, `internal/awards/handler.go` + `web/awards/{awards,monthly}.templ`.
Paths are under `/app`.

## Routes

| Go route | Svelte file | API |
| --- | --- | --- |
| `GET /u/{handle}` | `src/routes/(app)/app/u/[handle]/+page.{server.ts,svelte}` | `GET /profiles/{handle}` |
| `POST /u/{handle}/follow` | same, action `?/follow` | `POST /follows` `{handle}` |
| `POST /u/{handle}/unfollow` | same, action `?/unfollow` | `GET /profiles/{handle}` (id), `DELETE /follows/{userID}` |
| `GET /u/{handle}/workouts?before=` | `src/routes/(app)/app/u/[handle]/workouts/` | `GET /profiles/{handle}/workouts`, `GET /profiles/{handle}` (name) |
| `GET /u/{handle}/workouts/{sessionID}` | `src/routes/(app)/app/u/[handle]/workouts/[sessionID]/` | `GET /profiles/{handle}/workouts/{sessionID}`, `GET /profiles/{handle}` |
| `GET /friends/leaderboard?board=` | `src/routes/(app)/app/friends/leaderboard/` | `GET /xp`, `GET /leaderboard?metric=&period=` |
| `GET /awards` | `src/routes/(app)/app/awards/` | `GET /awards` (now also returns `handle`) |
| `GET /u/{handle}/awards` | `src/routes/(app)/app/u/[handle]/awards/` | **new** `GET /profiles/{handle}/awards` |
| `GET /awards/unseen`, `POST /awards/seen`, `POST /awards/{badgeID}/seen` | not here: the shell's unlock dialog (`src/lib/features/awards/`, another port) | `GET /awards/unseen`, `POST /awards/{badgeID}/seen` |

Feature code: `src/lib/features/profiles/` (header, workout item, card mapping, 404 helper),
`src/lib/features/awards-page/` (coin, monthly card, awards shelf, page), `src/lib/features/leaderboard/`
(boards, kind/value/switch labels ported from `xp/handler.go` with the same keys).

## API added (north-client)

- `internal/awards/api.go`: `WithPeople(People)`; `GET /profiles/{handle}/awards` (the web's `page()`:
  owner gets locked + monthly challenge, others get public badges + medals only when shared; 404 for an
  unknown handle or a block); `GET /awards` gains optional `handle`. Wired in `cmd/web/routes.go`
  (`awards.NewAPI(awardsSvc).WithPeople(profilesSvc)`). Described in `docs/api/openapi.yaml`
  (`PersonAwards`, `Awards.handle`).

## Deviations

- Follow/unfollow post to SvelteKit actions (`/app/u/{handle}?/follow`) instead of `/app/u/{handle}/follow`;
  both end in a 303 back to the profile, and work without JS.
- List cards come from the API with at most two exercises (`ProjectCard(c, 2)`), so a PR badge on a
  third-or-later exercise does not show on the list card (Go's web card had all of them). The single-
  workout page has every exercise.
- The API sends a set's best as English "22.5 kg × 8"; `toCardExercise` parses it back so the card shows
  it in the reader's language like Go's `BestIn`.
- The badge "detail" is the list item itself, as in Go: there is no separate badge page.
- The shell rail does not highlight Friends on `/app/u/*` and `/app/awards` (Go passed
  `BuildNav(ctx, "/app/friends")`); that is the shell's nav-matching, not these pages.
- Go's leaderboard progress bar drew a full light track at 0 XP (templUI script quirk); ours is empty.

## Library candidates

- **TanStack Table (shadcn Data Table)** for the leaderboard board if it grows sorting or paging; today it
  is a plain `<ol>` like the Go page, so nothing is needed yet.

## Tests

`tests/e2e/profiles.spec.ts` (profile render, follow/unfollow with two users, own profile, 404, workouts
list + one workout, leaderboard boards) and `tests/e2e/awards.spec.ts` (own page, another person's page,
back-to-profile, 404). Screenshots vs Go: identical content area for profile, workouts, workout,
person awards, own awards and leaderboard.
