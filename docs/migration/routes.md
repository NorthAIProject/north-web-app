# Route parity checklist

Every browser route the Go web app serves, by owning package (generated from
north-client handlers on 2026-10-28, audited against `cmd/web/routes.go` and every
`internal/*/handler.go` `Routes` method the same day). Tick a route when its SvelteKit
equivalent is merged; `→` names the Svelte route, action or component that covers it.
`R/` is short for `src/routes/(app)/app/`, `P/` for `src/routes/(public)/`, `F:` for
`src/lib/features/`. `?/name` is a named form action on that page.

**Groups.** Paths in `auth`, `mcpauth`, `web/pwa`, `cmd/web`, `GET /i/{code}` (social) and
`GET /i/c/{code}` (crews) are top-level. Every other section is mounted under `/app`, and its
paths are written relative to `/app` (so `GET /` in `day` is `/app`).

**Go keeps.** Routes marked `→ Go keeps` are machine endpoints that stay in north-client after
cut-over (see `parity-gaps.md`, "Edge routing"). They are ticked because nothing needs porting.

**Audit changes (2026-10-28).** Removed five generator artefacts that were not routes
(`GET HX-Request` ×4, `GET Content-Type`). Insights paths now carry their `/insights` prefix.
`GET /account/export` and 18 crews entries are JSON API routes (`APIRoutes`, `chat_api.go`), so
they are listed without a checkbox. Added 17 quota-guarded routes the generator missed
(`r.With(...).Post`), the `voice` package, and a `cmd/web` section for routes registered
directly in `routes.go`. Totals: 373 routes, 360 covered by SvelteKit, 11 kept by Go, 2 open.
Gaps and deviations: `parity-gaps.md`.

## activity (7)

- [x] `GET /activity` → R/activity
- [x] `POST /activity/log` → R/activity `?/log`
- [x] `POST /activity/start` → R/activity `?/start`
- [x] `POST /activity/{id}/cancel` → R/activity `?/cancel`
- [x] `POST /activity/{id}/pause` → R/activity `?/pause`
- [x] `POST /activity/{id}/resume` → R/activity `?/resume`
- [x] `POST /activity/{id}/stop` → R/activity `?/stop`

## auth (15)

- [x] `GET /auth/google` → P/auth/google/+server.ts
- [x] `GET /auth/google/callback` → P/auth/google/callback/+server.ts
- [x] `GET /forgot-password` → P/forgot-password
- [x] `GET /login` → P/login
- [x] `GET /reset-password` → P/reset-password
- [x] `GET /signup` → P/signup
- [x] `POST /auth/passkey/login/begin` → F:auth/passkey.ts via `/api` proxy
- [x] `POST /auth/passkey/login/finish` → P/auth/passkey/finish/+server.ts
- [x] `POST /auth/passkey/register/begin` → F:auth/passkey.ts via `/api` proxy
- [x] `POST /auth/passkey/register/finish` → P/auth/passkey/finish/+server.ts
- [x] `POST /forgot-password` → P/forgot-password default action
- [x] `POST /login` → P/login default action
- [x] `POST /logout` → P/logout/+server.ts
- [x] `POST /reset-password` → P/reset-password default action
- [x] `POST /signup` → P/signup default action

## awards (5)

- [x] `GET /awards` → R/awards
- [x] `GET /awards/unseen` → F:awards/AwardsHost.svelte (shell)
- [x] `GET /u/{handle}/awards` → R/u/[handle]/awards
- [x] `POST /awards/seen` → F:awards/AwardsHost.svelte (marks each badge seen)
- [x] `POST /awards/{badgeID}/seen` → F:awards/AwardsHost.svelte

## caffeine (1)

- [x] `POST /caffeine` → R (My Day) `?/caffeine`

## calculator (3)

- [x] `GET /calculator` → R/calculator
- [x] `POST /calculator/biometrics` → R/calculator `?/biometrics`
- [x] `POST /calculator/generate` → R/calculator `?/generate`

## capture (5)

- [x] `GET /capture` → R/capture
- [x] `GET /capture/panel` → F:capture/CapturePanel.svelte (in My Day QuickAdd)
- [x] `POST /capture/commit` → R/capture `?/commit`
- [x] `POST /capture/parse` → R/capture `?/parse` *(added by audit)*
- [x] `POST /capture/foods` → F:nutrition/MealVoice.svelte *(added by audit)*

## care (10)

- [x] `GET /care` → R/care
- [x] `POST /care/habits` → R/care `?/habit`
- [x] `POST /care/habits/{id}/delete` → R/care `?/habitDelete`
- [x] `POST /care/habits/{id}/toggle` → R/care `?/habitDone`
- [x] `POST /care/reminders` → R/care `?/reminder`
- [x] `POST /care/reminders/{id}/delete` → R/care `?/reminderDelete`
- [x] `POST /care/reminders/{id}/toggle` → R/care `?/reminderEnabled`
- [x] `POST /care/sleep` → R/care `?/sleep`
- [x] `POST /care/water` → R/care `?/water` (and R `?/water` from My Day)
- [x] `POST /care/water/{id}/undo` → R/care `?/undoWater`

## checkinreply (1)

- [x] `GET /check-ins/today/reply` → F:checkins/SavedPanel.svelte (browser call)

## checkins (5)

- [x] `DELETE /check-ins/{id}` → not ported: no Go page called it (parity-gaps.md §1)
- [x] `GET /check-ins` → R/check-ins
- [x] `GET /check-ins/live` → F:checkins/LiveRegion.svelte (TanStack poll)
- [x] `PATCH /check-ins/{id}` → not ported: no Go page called it (parity-gaps.md §1)
- [x] `POST /check-ins` → R/check-ins `?/save`

## coach (9)

- [x] `GET /chat` → R/chat
- [x] `GET /chat/{id}` → R/chat/[id]
- [x] `GET /chat/{id}/resume` → F:coach/chat.svelte.ts `resume`
- [x] `GET /chat/{id}/stream` → F:coach/chat.svelte.ts (fetch SSE)
- [x] `POST /chat` → R/chat `?/start`
- [x] `POST /chat/{id}/delete` → R/chat/[id] `?/delete`
- [x] `POST /chat/{id}/messages` → F:coach/chat.svelte.ts `send`
- [x] `POST /chat/{id}/messages/{messageID}/helpful` → R/chat/[id] `?/helpful`
- [x] `POST /chat/{id}/tools/{messageID}/{decision}` → R/chat/[id] `?/decide`

## crews (27)

- [x] `GET /crews` → R/crews
- [x] `GET /crews/{crewID}` → R/crews/[crewID]
- [x] `GET /crews/{crewID}/c/{channelID}` → R/crews/[crewID]/c/[channelID]
- [x] `GET /crews/{crewID}/c/{channelID}/messages` → F:crews ChatBody (browser)
- [x] `GET /crews/{crewID}/c/{channelID}/pins` → F:crews pins sheet
- [x] `GET /crews/{crewID}/challenge` → R/crews/[crewID]/challenge
- [x] `GET /crews/{crewID}/channels` → F:crews space query
- [x] `GET /crews/{crewID}/live` → F:crews/api.ts `connectLive` (EventSource)
- [x] `GET /crews/{crewID}/m/{messageID}` → F:crews ChatBody `refreshMessage`
- [x] `GET /crews/{crewID}/m/{messageID}/edit` → F:crews MessageRow inline editor
- [x] `GET /i/c/{code}` → P/i/c/[code]
- [x] `POST /crews` → R/crews default action
- [x] `POST /crews/{crewID}/c/{channelID}/delete` → F:crews channel dialog
- [x] `POST /crews/{crewID}/c/{channelID}/edit` → F:crews channel dialog
- [x] `POST /crews/{crewID}/c/{channelID}/messages` → F:crews Composer
- [x] `POST /crews/{crewID}/c/{channelID}/read` → F:crews mark-read
- [x] `POST /crews/{crewID}/challenge` → R/crews/[crewID]/challenge `?/challenge`
- [x] `POST /crews/{crewID}/channels` → F:crews new-channel dialog
- [x] `POST /crews/{crewID}/leave` → space pages `?/leave`
- [x] `POST /crews/{crewID}/m/{messageID}/delete` → F:crews message menu
- [x] `POST /crews/{crewID}/m/{messageID}/edit` → F:crews MessageRow save
- [x] `POST /crews/{crewID}/m/{messageID}/pin` → F:crews message menu
- [x] `POST /crews/{crewID}/m/{messageID}/react` → F:crews reaction pills
- [x] `POST /crews/{crewID}/members/{userID}/remove` → R/crews/[crewID]/challenge `?/remove`
- [x] `POST /crews/{crewID}/members/{userID}/role` → R/crews/[crewID]/challenge `?/role`
- [x] `POST /crews/{crewID}/notifications` → space pages `?/notify`
- [x] `POST /crews/{crewID}/report` → F:crews report dialog

Not web routes (JSON API in `internal/crews/chat_api.go`, served under `/api/v1`; the generator
listed them by mistake): `DELETE /crews/{crewID}/channels/{channelID}`,
`DELETE /crews/{crewID}/messages/{messageID}`, `DELETE …/messages/{messageID}/pin`,
`DELETE …/messages/{messageID}/reactions/{emoji}`, `GET /crews/unread`,
`GET …/channels/{channelID}/messages`, `GET …/channels/{channelID}/pins`,
`GET /crews/{crewID}/messages/{messageID}`, `GET /crews/{crewID}/space`,
`PATCH …/channels/{channelID}`, `PATCH …/messages/{messageID}`,
`POST …/channels/{channelID}/messages`, `POST …/channels/{channelID}/read`,
`POST …/messages/{messageID}/report`, `PUT …/messages/{messageID}/pin`,
`PUT …/messages/{messageID}/reactions/{emoji}`, `PUT /crews/{crewID}/notifications`.
(`POST /crews/{crewID}/notifications` above is the web one.)

## dailyposts (3)

- [x] `GET /daily` → R/daily
- [x] `POST /daily/{postID}/kudos` → R/daily `?/kudos`
- [x] `POST /daily/{postID}/kudos/undo` → R/daily `?/kudosUndo`

## dashboard (3)

- [x] `GET /overview` → R/overview
- [x] `GET /overview/panels` → R/overview (`?range=` links rerun load)
- [x] `GET /overview/today` → R/overview `onCheckInSaved` + `/overview/version`

## day (4)

- [x] `GET /` → R (My Day)
- [x] `GET /day/checkin` → F:day/StreakLive.svelte
- [x] `GET /day/trends` → F:day/Trends.svelte (in Overview panels)
- [x] `POST /day/rules` → R `?/rules`

## decisions (5)

- [x] `GET /decisions` → R/decisions
- [x] `GET /decisions/{id}` → R/decisions/[id]
- [x] `POST /decisions` → R/decisions default action
- [x] `POST /decisions/{id}` → R/decisions/[id] `?/update`
- [x] `POST /decisions/{id}/delete` → R/decisions/[id] `?/delete`

## documents (10)

- [x] `GET /knowledge` → R/knowledge
- [x] `GET /knowledge/passages` → F:knowledge/Sources.svelte (in chat)
- [x] `GET /knowledge/search` → R/knowledge/search + F:knowledge/Library.svelte
- [x] `GET /knowledge/{id}` → R/knowledge/[id]
- [x] `POST /knowledge/{id}/delete` → R/knowledge/[id] `?/delete`
- [x] `POST /knowledge/notes` → R/knowledge `?/note` *(added by audit)*
- [x] `POST /knowledge/uploads` → R/knowledge `?/upload` *(added by audit)*
- [x] `POST /knowledge/reindex` → R/knowledge `?/reindex` *(added by audit)*
- [x] `POST /knowledge/retry-embeddings` → R/knowledge `?/retryEmbeddings` *(added by audit)*
- [x] `POST /knowledge/{id}/reindex` → R/knowledge/[id] `?/reindex` *(added by audit)*

## exercises (3)

- [x] `GET /exercises` → R/exercises
- [x] `GET /exercises/{slug}` → R/exercises/[slug]
- [x] `GET /exercises/{slug}/muscles` → F:exercises/ExerciseMuscles.svelte (in chat)

## export (1)

- [x] `GET /settings/export.zip` → R/settings/export.zip/+server.ts

Not a web route: `GET /account/export` is `export.Handler.APIRoutes`, served as
`/api/v1/account/export` (the SvelteKit download calls it).

## fasting (2)

- [x] `POST /fasting/start` → R `?/fastStart`
- [x] `POST /fasting/stop` → R `?/fastStop`

## firstweek (3)

- [x] `GET /first-week` → F:firstweek/FirstWeekCard.svelte (route redirects to `/app`)
- [x] `GET /first-week/review` → R/first-week/review
- [x] `POST /first-week/done` → FirstWeekCard (browser) / R/first-week `?/done`

## fitness (7)

- [x] `GET /fitness` → R/fitness
- [x] `GET /fitness/activities` → R/fitness/activities
- [x] `GET /fitness/activities/sessions` → R/fitness/activities/sessions/+server.ts (redirect) + browser pager
- [x] `GET /fitness/strava/callback` → R/fitness/strava/callback/+server.ts
- [x] `GET /fitness/strava/connect` → R/fitness/strava/connect/+server.ts
- [x] `POST /fitness/strava/disconnect` → R/fitness/strava/disconnect/+server.ts
- [x] `POST /fitness/strava/sync` → R/fitness/strava/sync/+server.ts

## goals (11)

- [x] `GET /goals` → R/goals
- [x] `GET /goals/{id}` → R/goals/[id]
- [x] `POST /goals` → R/goals `?/create`
- [x] `POST /goals/{id}` → R/goals/[id] `?/update`
- [x] `POST /goals/{id}/delete` → R/goals/[id] `?/delete`
- [x] `POST /goals/{id}/milestones` → R/goals/[id] `?/addMilestone`
- [x] `POST /goals/{id}/milestones/{mid}` → R/goals/[id] `?/editMilestone`
- [x] `POST /goals/{id}/milestones/{mid}/delete` → R/goals/[id] `?/deleteMilestone`
- [x] `POST /goals/{id}/milestones/{mid}/status` → R/goals/[id] `?/milestoneStatus`
- [x] `POST /goals/{id}/status` → R/goals/[id] `?/status`
- [x] `POST /goals/{id}/updates` → R/goals/[id] `?/note`

## health (1)

- [x] `POST /blood-pressure` → R `?/bloodPressure`

## inbox (4)

- [x] `GET /inbox` → R/inbox
- [x] `POST /inbox` → R/inbox `?/add`
- [x] `POST /inbox/{itemID}/dismiss` → R/inbox `?/dismiss`
- [x] `POST /inbox/{itemID}/file` → R/inbox `?/file`

## insights (26)

`/body` and `/panels` fragments are covered by `?range=` links that rerun the page load.

- [x] `GET /insights` → R/insights
- [x] `GET /insights/body` → R/insights/body
- [x] `GET /insights/body/body` → R/insights/body (range links)
- [x] `GET /insights/cardio` → R/insights/cardio
- [x] `GET /insights/cardio/body` → R/insights/cardio (range links)
- [x] `GET /insights/coach` → R/insights/coach
- [x] `GET /insights/coach/body` → R/insights/coach (range links)
- [x] `GET /insights/metric/{key}` → R/insights/metric/[key]
- [x] `GET /insights/metric/{key}/body` → R/insights/metric/[key] (range links)
- [x] `GET /insights/mind` → R/insights/mind
- [x] `GET /insights/mind/body` → R/insights/mind (range links)
- [x] `GET /insights/nutrition` → R/insights/nutrition
- [x] `GET /insights/nutrition/body` → R/insights/nutrition (range links)
- [x] `GET /insights/panels` → R/insights (range links)
- [x] `GET /insights/patterns` → R/insights/patterns
- [x] `GET /insights/patterns/body` → R/insights/patterns (range links)
- [x] `GET /insights/progress` → R/insights/progress
- [x] `GET /insights/progress/body` → R/insights/progress (range links)
- [x] `GET /insights/sleep` → R/insights/sleep
- [x] `GET /insights/sleep/body` → R/insights/sleep (range links)
- [x] `GET /insights/spend` → R/insights/spend
- [x] `GET /insights/spend/body` → R/insights/spend (range links)
- [x] `GET /insights/timeline` → R/insights/timeline
- [x] `GET /insights/timeline/body` → R/insights/timeline (range links)
- [x] `GET /insights/training` → R/insights/training
- [x] `GET /insights/training/body` → R/insights/training (range links)

## lifts (5)

- [x] `GET /lifts/import` → R/lifts/import
- [x] `GET /lifts/today` → F:lifts/TodayCard.svelte (+ R/lifts/today page)
- [x] `POST /lifts/import` → R/lifts/import default action
- [x] `POST /lifts/sets` → F:lifts/TodayCard.svelte (browser)
- [x] `POST /lifts/sets/{setID}/delete` → F:lifts/TodayCard.svelte (browser)

## lighterday (2)

- [x] `GET /today/lighter` → F:lighterday/LighterDayCard.svelte (Overview)
- [x] `POST /today/lighter` → LighterDayCard (browser) / R/today/lighter default action

## mcpauth (10)

- [x] `GET /.well-known/oauth-authorization-server` → Go keeps
- [x] `GET /.well-known/oauth-protected-resource` → Go keeps
- [x] `GET /.well-known/oauth-protected-resource/mcp` → Go keeps
- [x] `GET /oauth/authorize` → P/oauth/authorize
- [x] `GET /oauth/authorize/resume` → P/oauth/authorize/resume/+server.ts
- [x] `POST /oauth/authorize` → P/oauth/authorize `?/decide`
- [x] `POST /oauth/authorize/account` → P/oauth/authorize `?/account`
- [x] `POST /oauth/register` → Go keeps
- [x] `POST /oauth/revoke` → Go keeps
- [x] `POST /oauth/token` → Go keeps

## meals (23)

- [x] `GET /nutrition/ingredients` → R/nutrition/ingredients
- [x] `GET /nutrition/log` → R/nutrition/log
- [x] `GET /nutrition/plans` → R/nutrition/plans
- [x] `GET /nutrition/plans/{id}` → R/nutrition/plans/[id]
- [x] `POST /nutrition/days/{dayID}` → R/nutrition/plans/[id] `?/updateDay`
- [x] `POST /nutrition/days/{dayID}/delete` → R/nutrition/plans/[id] `?/removeDay`
- [x] `POST /nutrition/days/{dayID}/meals` → R/nutrition/plans/[id] `?/addMeal`
- [x] `POST /nutrition/ingredients` → R/nutrition/ingredients `?/create`
- [x] `POST /nutrition/ingredients/{id}/delete` → R/nutrition/ingredients `?/delete`
- [x] `POST /nutrition/log/ingredients` → R/nutrition/log `?/ingredient`
- [x] `POST /nutrition/log/meals` → R/nutrition/log `?/meal`
- [x] `POST /nutrition/log/{id}/delete` → R/nutrition/log `?/delete`
- [x] `POST /nutrition/meal-ingredients/{id}/delete` → R/nutrition/plans/[id] `?/removePortion`
- [x] `POST /nutrition/meal-ingredients/{id}/optional` → R/nutrition/plans/[id] `?/setPortionOptional`
- [x] `POST /nutrition/meals/{mealID}/delete` → R/nutrition/plans/[id] `?/removeMeal`
- [x] `POST /nutrition/meals/{mealID}/ingredients` → R/nutrition/plans/[id] `?/addPortion`
- [x] `POST /nutrition/meals/{mealID}/ingredients/batch` → R/nutrition/plans/[id] `?/addPortions`
- [x] `POST /nutrition/meals/{mealID}/optional` → R/nutrition/plans/[id] `?/setMealOptional`
- [x] `POST /nutrition/meals/{mealID}/options` → R/nutrition/plans/[id] `?/addOption`
- [x] `POST /nutrition/plans` → R/nutrition/plans default action
- [x] `POST /nutrition/plans/{id}/days` → R/nutrition/plans/[id] `?/addDay`
- [x] `POST /nutrition/plans/{id}/delete` → R/nutrition/plans/[id] `?/delete`
- [x] `POST /nutrition/plans/{id}/settings` → R/nutrition/plans/[id] `?/settings`

## media (5)

- [x] `GET /form` → R/form
- [x] `GET /form/{id}` → R/form/[id]
- [x] `GET /form/{id}/status` → F:formcheck/AnalysisStatus.svelte (TanStack poll)
- [x] `GET /media/{id}` → R/media/[id]/+server.ts
- [x] `POST /form` → F:formcheck/upload.ts (browser, `/api/form-checks`) *(added by audit)*

## medications (4)

- [x] `POST /care/medications` → R/care `?/medication`
- [x] `POST /care/medications/doses/{id}/undo` → R/care `?/undoDose`
- [x] `POST /care/medications/{id}/doses` → R/care `?/dose`
- [x] `POST /care/medications/{id}/stop` → R/care `?/medicationStop`

## memories (11)

- [x] `GET /memories` → R/memories
- [x] `GET /memories/for/{conversationID}` → F:memories/ConversationMemories.svelte (in chat)
- [x] `POST /memories` → R/memories `?/create`
- [x] `POST /memories/{id}` → R/memories `?/update`
- [x] `POST /memories/{id}/approve` → R/memories `?/approve`
- [x] `POST /memories/{id}/delete` → R/memories `?/delete`
- [x] `POST /memories/{id}/exclude` → R/memories `?/exclude`
- [x] `POST /memories/{id}/include` → R/memories `?/include`
- [x] `POST /memories/{id}/pin` → R/memories `?/pin`
- [x] `POST /memories/{id}/reject` → R/memories `?/reject`
- [x] `POST /memories/{id}/unpin` → R/memories `?/unpin`

## milestones (2)

- [x] `POST /trackers` → R `?/tracker`
- [x] `POST /trackers/{id}/done` → R `?/trackerDone`

## mind (2)

- [x] `GET /mind` → R/mind
- [x] `POST /mind/journal` → R/mind `?/journal`

## moderation (4)

- [x] `GET /ops/moderation` → R/ops/moderation
- [x] `POST /moderation/terms` → crew space pages `?/terms`
- [x] `POST /ops/moderation/users/{userID}/suspend` → R/ops/moderation `?/suspend`
- [x] `POST /ops/moderation/{kind}/{subjectID}/{action}` → R/ops/moderation `?/decide`

## news (5)

- [x] `GET /news-ticker` → F:news/NewsTicker.svelte (Overview)
- [x] `GET /settings/news-ticker` → R/settings/news-ticker
- [x] `POST /settings/news-ticker` → R/settings/news-ticker `?/toggle`
- [x] `POST /settings/news-ticker/feeds` → R/settings/news-ticker `?/add`
- [x] `POST /settings/news-ticker/feeds/{id}/delete` → R/settings/news-ticker `?/remove`

## nudges (4)

- [x] `GET /nudges/bell` → F:nudges/NudgeBell.svelte (shell)
- [x] `GET /nudges/{id}/open` → R/nudges/[id]/open/+server.ts
- [x] `POST /nudges/{id}/dismiss` → R/nudges/[id]/dismiss/+server.ts + `dismissNudge`
- [x] `POST /nudges/{id}/read` → R/nudges/[id]/read/+server.ts

## onboarding (4)

- [x] `GET /onboarding` → R/onboarding
- [x] `GET /onboarding/done` → R/onboarding/done
- [x] `POST /onboarding` → R/onboarding `?/complete`
- [x] `POST /onboarding/skip` → R/onboarding `?/skip`

## outreach (2)

- [x] `GET /outreach` → F:outreach/OutreachCard.svelte (My Day)
- [x] `POST /outreach/{id}/actions` → OutreachCard (browser) / R/outreach/[id]/actions/+server.ts

## planimport (8)

- [x] `GET /nutrition/import` → R/nutrition/import
- [x] `GET /nutrition/plans/generate` → R/nutrition/plans/generate
- [x] `GET /training/import` → R/training/import
- [x] `POST /nutrition/import/review` → R/nutrition/import/review default action
- [x] `POST /training/import/review` → R/training/import/review default action
- [x] `POST /nutrition/import` → R/nutrition/import default action *(added by audit)*
- [x] `POST /nutrition/plans/generate` → R/nutrition/plans/generate default action *(added by audit)*
- [x] `POST /training/import` → R/training/import default action *(added by audit)*

## profiles (5)

- [x] `GET /u/{handle}` → R/u/[handle]
- [x] `GET /u/{handle}/workouts` → R/u/[handle]/workouts
- [x] `GET /u/{handle}/workouts/{sessionID}` → R/u/[handle]/workouts/[sessionID]
- [x] `POST /u/{handle}/follow` → R/u/[handle] `?/follow`
- [x] `POST /u/{handle}/unfollow` → R/u/[handle] `?/unfollow`

## progresschecks (6)

- [x] `GET /progress` → R/progress
- [x] `POST /progress` → R/progress `?/create`
- [x] `POST /progress/schedule` → R/progress `?/schedule`
- [x] `POST /progress/{id}/delete` → R/progress `?/delete`
- [x] `POST /progress/compare` → R/progress `?/compare` *(added by audit)*
- [x] `POST /progress/estimate` → F:progress/NewCheck.svelte (browser) *(added by audit)*

## push (2)

- [x] `DELETE /push/subscriptions` → F:push/push.svelte.ts `PushOptIn`
- [x] `POST /push/subscriptions` → F:push/push.svelte.ts `PushOptIn`

## recaps (4)

- [x] `GET /recap` → R/recap
- [x] `GET /recap/panels` → R/recap (`?range=` links rerun load)
- [x] `GET /recap/strip` → F:recaps/RecapStrip.svelte (My Day)
- [x] `POST /recap/share` → R/recap `?/share`

## reports (7)

- [x] `GET /reports` → R/reports
- [x] `GET /reports/{id}` → R/reports/[id]
- [x] `POST /reports/{id}/archive` → R/reports/[id] `?/archive`
- [x] `POST /reports/{id}/helpful` → R/reports/[id] `?/helpful`
- [x] `POST /reports/generate` → R/reports `?/generate` *(added by audit)*
- [x] `POST /reports/briefing` → R/overview `?/briefing` *(added by audit)*
- [x] `POST /reports/{id}/regenerate` → R/reports/[id] `?/regenerate` *(added by audit)*

## screentime (1)

- [x] `POST /screen-time` → R `?/screen`

## settings (19)

- [x] `GET /connections/pill` → lib/components/layout/ShellWidgets.svelte
- [x] `GET /settings` → R/settings
- [x] `GET /settings/activity` → R/settings/activity
- [x] `GET /settings/connections` → R/settings/connections
- [x] `GET /settings/connections/{id}/status` → F:settings/ConnectionStatus.svelte (poll)
- [x] `POST /settings/account/delete` → R/settings `?/deleteAccount`
- [x] `POST /settings/ai` → R/settings/connections `?/ai`
- [x] `POST /settings/ai/remove` → R/settings/connections `?/aiRemove`
- [x] `POST /settings/connections` → R/settings/connections `?/create`
- [x] `POST /settings/connections/{id}/revoke` → R/settings/connections `?/revoke`
- [x] `POST /settings/diets` → R/settings `?/diets`
- [x] `POST /settings/integrations/calendar` → R/settings/connections `?/calendar`
- [x] `POST /settings/integrations/calendar/disconnect` → R/settings/connections `?/calendarDisconnect`
- [x] `POST /settings/messaging/telegram` → R/settings/connections `?/telegramCode`
- [x] `POST /settings/messaging/telegram/disconnect` → R/settings/connections `?/telegramDisconnect`
- [x] `POST /settings/notifications` → R/settings `?/notifications`
- [x] `POST /settings/preferences` → R/settings `?/preferences`
- [x] `POST /settings/profile` → R/settings `?/profile`
- [x] `POST /settings/target-weight` → R `?/targetWeight` / R/settings `?/targetWeight`

## social (19)

- [x] `GET /friends` → R/friends
- [x] `GET /friends/facebook/callback` → R/friends/facebook/callback/+server.ts
- [x] `GET /friends/facebook/connect` → R/friends/facebook/connect/+server.ts
- [x] `GET /i/{code}` → P/i/[code]
- [x] `POST /friends/facebook/disconnect` → R/friends `?/facebookDisconnect`
- [x] `POST /friends/follow` → R/friends `?/follow`
- [x] `POST /friends/handle` → R/friends `?/handle`
- [x] `POST /friends/kudos/{achievementID}` → R/friends `?/kudos`
- [x] `POST /friends/kudos/{achievementID}/undo` → R/friends `?/unkudos`
- [x] `POST /friends/phone` → R/friends `?/phone`
- [x] `POST /friends/phone/cancel` → R/friends `?/phoneCancel`
- [x] `POST /friends/phone/check` → R/friends `?/phoneCheck`
- [x] `POST /friends/phone/remove` → R/friends `?/phoneRemove`
- [x] `POST /friends/sharing` → R/friends `?/sharing`
- [x] `POST /friends/{userID}/accept` → R/friends `?/accept`
- [x] `POST /friends/{userID}/block` → R/friends `?/block` (+ crew message menu)
- [x] `POST /friends/{userID}/remove` → R/friends `?/remove`
- [x] `POST /friends/{userID}/unblock` → R/friends `?/unblock`
- [x] `POST /friends/{userID}/unfollow` → R/friends `?/unfollow`

## soreness (1)

- [x] `POST /soreness` → R `?/soreness`

## supplements (1)

- [x] `POST /supplements` → R `?/supplement`

## vault (4)

- [x] `GET /settings/vault` → R/settings/vault
- [x] `POST /settings/vault/connect` → R/settings/vault `?/connect`
- [x] `POST /settings/vault/disconnect` → R/settings/vault `?/disconnect`
- [x] `POST /settings/vault/sync` → R/settings/vault `?/sync`

## voice (1) *(added by audit)*

- [x] `POST /voice/transcribe` → F:voice/Dictate.svelte + recorder.ts (`/api/voice/transcribe`)

## web/pwa (3)

- [x] `GET /manifest.webmanifest` → static/manifest.webmanifest
- [x] `GET /offline.html` → static/offline.html
- [x] `GET /sw.js` → src/service-worker.ts (served as `/service-worker.js`)

## weekly (2)

- [x] `GET /weekly` → R/weekly
- [x] `POST /weekly` → R/weekly default action

## workouts (21)

- [x] `GET /training` → R/training (redirect to newest plan or `/new`)
- [x] `GET /training/new` → R/training/new
- [x] `GET /training/plans` → R/training/plans
- [x] `GET /training/week` → F:training/WeekSection.svelte
- [x] `GET /training/week/edit` → F:training/WeekSection.svelte (editor state)
- [x] `GET /training/{id}` → R/training/[id]
- [x] `GET /training/{id}/days/{day}` → F:training/DayCard.svelte (local state)
- [x] `GET /training/{id}/days/{day}/add` → F:training/PickerPanel.svelte
- [x] `GET /training/{id}/days/{day}/exercises/{index}/swap` → F:training/PickerPanel.svelte
- [x] `GET /workouts/{id}` → R/workouts/[id] (301)
- [x] `POST /training/new` → R/training/new default action
- [x] `POST /training/week` → F:training/WeekSection.svelte `save`
- [x] `POST /training/week/edit` → F:training/WeekSection.svelte `preview`
- [x] `POST /training/week/reset` → F:training/WeekSection.svelte `reset`
- [x] `POST /training/{id}/activate` → R/training/[id]/activate default action
- [x] `POST /training/{id}/days/{day}/exercises` → F:training/edits.ts + R/training/[id]/days/[day]/exercises
- [x] `POST /training/{id}/days/{day}/exercises/{index}/move` → F:training/edits.ts `move`
- [x] `POST /training/{id}/days/{day}/exercises/{index}/remove` → F:training/edits.ts `remove`
- [x] `POST /training/{id}/days/{day}/exercises/{index}/sets` → F:training/edits.ts `setPrescription`
- [x] `POST /training/{id}/days/{day}/exercises/{index}/swap` → F:training/edits.ts `swap`
- [x] `POST /training/{id}/days/{day}/start-time` → F:training/edits.ts `setStartTime`

## xp (1)

- [x] `GET /friends/leaderboard` → R/friends/leaderboard

## cmd/web (14) *(added by audit; registered directly in `cmd/web/routes.go`, top-level)*

- [x] `GET /` → P/(site)/+page.svelte (landing)
- [x] `GET /privacy` → P/(site)/privacy
- [x] `GET /terms` → P/(site)/terms
- [x] `GET /facebook-data` → P/(site)/facebook-data
- [x] `POST /locale` → P/locale/+server.ts
- [x] `POST /appearance` → P/appearance/+server.ts
- [x] `GET /favicon.ico` → P/favicon.ico/+server.ts
- [x] `GET /assets/*` → static/assets (brand `source/` originals not copied)
- [x] `GET /.well-known/apple-app-site-association` → P/.well-known/apple-app-site-association (Go also serves it)
- [x] `GET /healthz` → Go keeps (SvelteKit has no health route of its own)
- [x] `GET /internal/metrics` → Go keeps
- [x] `* /mcp` → Go keeps
- [x] `* /ingest/health/*` → Go keeps
- [x] `* /webhooks/telegram` → Go keeps
