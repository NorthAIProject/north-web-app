# Social (friends, phone, Facebook, invite and crew links)

Go source: `internal/social/handler.go`, `handler_finding.go`, `web/social/social.templ`,
`web/social/finding.templ`, `internal/crews/handler.go` (`joinLink`, `JoinFromCookie`),
`web/crews/crews.templ` (`JoinPage`).

Each Go POST under `/app/friends` is a named form action on the `/app/friends` page
(`/app/friends?/<name>`), enhanced with `use:enhance` and working without JavaScript. Person
and kudos actions carry the id the Go path had in a hidden `id` field. Every action redirects
where Go redirected (`/app/friends`, `#feed`, `#phone-card`, `#facebook`); a refused form comes
back as a 422 with the field messages shown where Go showed them.

| Go route | SvelteKit | API (`/api/v1`) |
| --- | --- | --- |
| `GET /app/friends` | `src/routes/(app)/app/friends/+page.server.ts` load, `+page.svelte` | `GET /social`, `GET /feed`, `GET /social/sharing`, `GET /invites?channel=x`, `GET /invites?channel=facebook`, `GET /social/phone`, `GET /social/phone/countries` (new), `GET /social/facebook` |
| `POST /app/friends/handle` | `?/handle` | `PUT /social/handle` |
| `POST /app/friends/follow` | `?/follow` (also the Follow button beside a Facebook match) | `POST /follows` |
| `POST /app/friends/{userID}/accept` | `?/accept` | `POST /followers/{userID}/accept` |
| `POST /app/friends/{userID}/remove` | `?/remove` | `DELETE /followers/{userID}` |
| `POST /app/friends/{userID}/unfollow` | `?/unfollow` | `DELETE /follows/{userID}` |
| `POST /app/friends/{userID}/block` | `?/block` | `POST /blocks/{userID}` |
| `POST /app/friends/{userID}/unblock` | `?/unblock` | `DELETE /blocks/{userID}` |
| `POST /app/friends/sharing` | `?/sharing` | `PUT /social/sharing` |
| `POST /app/friends/kudos/{achievementID}` | `?/kudos` | `POST /achievements/{achievementID}/kudos` |
| `POST /app/friends/kudos/{achievementID}/undo` | `?/unkudos` | `DELETE /achievements/{achievementID}/kudos` |
| `POST /app/friends/phone` | `?/phone` | `POST /social/phone/verification` |
| `POST /app/friends/phone/check` | `?/phoneCheck` | `POST /social/phone/verification/check` |
| `POST /app/friends/phone/cancel` | `?/phoneCancel` | `DELETE /social/phone/verification` |
| `POST /app/friends/phone/remove` | `?/phoneRemove` | `DELETE /social/phone` |
| `GET /app/friends/facebook/connect` | `src/routes/(app)/app/friends/facebook/connect/+server.ts` | `POST /social/facebook/web` (new) |
| `GET /app/friends/facebook/callback` | `src/routes/(app)/app/friends/facebook/callback/+server.ts` | `GET /social/facebook`, `POST /social/facebook/web/callback` (new) |
| `POST /app/friends/facebook/disconnect` | `?/facebookDisconnect` | `DELETE /social/facebook` |
| `GET /i/{code}` | `src/routes/(public)/i/[code]/` | `GET /invites/{code}` (public), `POST /invites/{code}/redeem` |
| `GET /i/c/{code}` (crews) | `src/routes/(public)/i/c/[code]/` | `GET /crews/join/{code}` (made public), `POST /crews/join/{code}` |
| `/app` middleware `RedeemInvite` + `JoinFromCookie` | `redeemLinkCookies` in `src/routes/(app)/app/+layout.server.ts` | `POST /invites/{code}/redeem`, `POST /crews/join/{code}` |

There is no Go `/app/feed` or `/app/invites` page: the feed is the "Recent" card on
`/app/friends` (`GET /feed`), and invites are the `/i/{code}` landing plus redemption. No routes
were invented for them.

Feature code: `src/lib/features/social/` (`FeedCard`, `PhoneCard`, `FacebookCard`, `PersonRow`,
`NameLink`, `PostForm`, `FieldError`, `format.ts` text helpers with Go's keys, `share.ts` share
intents, `facebook.server.ts` state cookie, `invite-cookies.server.ts` link cookies and
redemption).

## API added in north-client

- `internal/social/api_web.go`: `GET /social/phone/countries` (calling codes + the account's
  default, Go's `phone.Countries` / `phone.DefaultDial`), `POST /social/facebook/web` (consent URL,
  state, expiresIn for the web callback `/app/friends/facebook/callback`),
  `POST /social/facebook/web/callback` (`{code}` → FacebookFriends; 409 when the Facebook account
  is linked elsewhere). The state check stays in the front end, as in Go.
- `internal/crews/api.go`: `GET /crews/join/{code}` moved to a new `PublicRoutes` (wired in
  `cmd/web/api.go`), so the signed-out crew landing can show the crew. Same response.
- `docs/api/openapi.yaml`: the three operations, `PhoneCountries`, `FacebookWebStart`,
  `FacebookWebCode`, and `security: []` on `previewCrew`.

## Cookies

Same names, paths and lifetimes as Go: `north_invite` and `north_crew` (path `/`, 30 days,
HttpOnly, Lax), `north_facebook_oauth` (path `/app/friends/facebook`, 10 minutes). Secure follows
`secureCookies(url)` (https) instead of Go's `cfg.Env.IsProduction()`.

## Deliberate differences

- Form posts target `/app/friends?/<action>` rather than Go's per-route POST paths (see table).
- After a refused phone code the OTP boxes come back empty (keyed on the form result), matching
  Go's full re-render.
- The rate-limit and unknown-handle messages are Go's hard-coded English strings, as in Go.
- "5m ago" is measured from the server's clock at load so server and browser render the same.
- The invite URL shown is the API's `invite.url` (north-client `BASE_URL` + `/i/<code>`), as Go.

## Checked

- `tests/e2e/social.spec.ts`: 13 tests (page renders; handle save and refusal; follow by handle,
  unknown handle, unfollow, block, unblock; remove follower; kudos and undo between two users;
  sharing switches; phone verify with the dev verifier's `000000`, wrong code, remove; cancel a
  pending code; Facebook connect 404 without a Meta app; invite and crew links signed out with
  redemption on the first `/app` page; signed-in invite link; unknown invite 404).
- Screenshots of `/app/friends`, its feed card, and `/i/{code}` match the Go pages served by the
  same API.
- Not exercised locally: the Facebook happy path (no Meta app configured).

## Library candidates

- Motion (or built-in `svelte/transition`): the kudos button's count change and the feed rows
  appearing after a follow. Go has no animation here, so this is optional polish.
