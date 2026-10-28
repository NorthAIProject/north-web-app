# Route parity checklist

Every browser route the Go web app serves, by owning package (generated from
north-client handlers on 2026-10-28). Paths inside `/app` handlers are relative to
`/app`. Tick a route when its SvelteKit equivalent is merged.

## activity (7)

- [ ] `GET /activity`
- [ ] `POST /activity/log`
- [ ] `POST /activity/start`
- [ ] `POST /activity/{id}/cancel`
- [ ] `POST /activity/{id}/pause`
- [ ] `POST /activity/{id}/resume`
- [ ] `POST /activity/{id}/stop`

## auth (15)

- [ ] `GET /auth/google`
- [ ] `GET /auth/google/callback`
- [ ] `GET /forgot-password`
- [ ] `GET /login`
- [ ] `GET /reset-password`
- [ ] `GET /signup`
- [ ] `POST /auth/passkey/login/begin`
- [ ] `POST /auth/passkey/login/finish`
- [ ] `POST /auth/passkey/register/begin`
- [ ] `POST /auth/passkey/register/finish`
- [ ] `POST /forgot-password`
- [ ] `POST /login`
- [ ] `POST /logout`
- [ ] `POST /reset-password`
- [ ] `POST /signup`

## awards (5)

- [ ] `GET /awards`
- [ ] `GET /awards/unseen`
- [ ] `GET /u/{handle}/awards`
- [ ] `POST /awards/seen`
- [ ] `POST /awards/{badgeID}/seen`

## caffeine (1)

- [ ] `POST /caffeine`

## calculator (3)

- [ ] `GET /calculator`
- [ ] `POST /calculator/biometrics`
- [ ] `POST /calculator/generate`

## capture (3)

- [ ] `GET /capture`
- [ ] `GET /capture/panel`
- [ ] `POST /capture/commit`

## care (10)

- [ ] `GET /care`
- [ ] `POST /care/habits`
- [ ] `POST /care/habits/{id}/delete`
- [ ] `POST /care/habits/{id}/toggle`
- [ ] `POST /care/reminders`
- [ ] `POST /care/reminders/{id}/delete`
- [ ] `POST /care/reminders/{id}/toggle`
- [ ] `POST /care/sleep`
- [ ] `POST /care/water`
- [ ] `POST /care/water/{id}/undo`

## checkinreply (1)

- [ ] `GET /check-ins/today/reply`

## checkins (6)

- [ ] `DELETE /check-ins/{id}`
- [ ] `GET /check-ins`
- [ ] `GET /check-ins/live`
- [ ] `GET HX-Request`
- [ ] `PATCH /check-ins/{id}`
- [ ] `POST /check-ins`

## coach (9)

- [ ] `GET /chat`
- [ ] `GET /chat/{id}`
- [ ] `GET /chat/{id}/resume`
- [ ] `GET /chat/{id}/stream`
- [ ] `POST /chat`
- [ ] `POST /chat/{id}/delete`
- [ ] `POST /chat/{id}/messages`
- [ ] `POST /chat/{id}/messages/{messageID}/helpful`
- [ ] `POST /chat/{id}/tools/{messageID}/{decision}`

## crews (44)

- [ ] `DELETE /crews/{crewID}/channels/{channelID}`
- [ ] `DELETE /crews/{crewID}/messages/{messageID}`
- [ ] `DELETE /crews/{crewID}/messages/{messageID}/pin`
- [ ] `DELETE /crews/{crewID}/messages/{messageID}/reactions/{emoji}`
- [ ] `GET /crews`
- [ ] `GET /crews/unread`
- [ ] `GET /crews/{crewID}`
- [ ] `GET /crews/{crewID}/c/{channelID}`
- [ ] `GET /crews/{crewID}/c/{channelID}/messages`
- [ ] `GET /crews/{crewID}/c/{channelID}/pins`
- [ ] `GET /crews/{crewID}/challenge`
- [ ] `GET /crews/{crewID}/channels`
- [ ] `GET /crews/{crewID}/channels/{channelID}/messages`
- [ ] `GET /crews/{crewID}/channels/{channelID}/pins`
- [ ] `GET /crews/{crewID}/live`
- [ ] `GET /crews/{crewID}/m/{messageID}`
- [ ] `GET /crews/{crewID}/m/{messageID}/edit`
- [ ] `GET /crews/{crewID}/messages/{messageID}`
- [ ] `GET /crews/{crewID}/space`
- [ ] `GET /i/c/{code}`
- [ ] `PATCH /crews/{crewID}/channels/{channelID}`
- [ ] `PATCH /crews/{crewID}/messages/{messageID}`
- [ ] `POST /crews`
- [ ] `POST /crews/{crewID}/c/{channelID}/delete`
- [ ] `POST /crews/{crewID}/c/{channelID}/edit`
- [ ] `POST /crews/{crewID}/c/{channelID}/messages`
- [ ] `POST /crews/{crewID}/c/{channelID}/read`
- [ ] `POST /crews/{crewID}/challenge`
- [ ] `POST /crews/{crewID}/channels`
- [ ] `POST /crews/{crewID}/channels/{channelID}/messages`
- [ ] `POST /crews/{crewID}/channels/{channelID}/read`
- [ ] `POST /crews/{crewID}/leave`
- [ ] `POST /crews/{crewID}/m/{messageID}/delete`
- [ ] `POST /crews/{crewID}/m/{messageID}/edit`
- [ ] `POST /crews/{crewID}/m/{messageID}/pin`
- [ ] `POST /crews/{crewID}/m/{messageID}/react`
- [ ] `POST /crews/{crewID}/members/{userID}/remove`
- [ ] `POST /crews/{crewID}/members/{userID}/role`
- [ ] `POST /crews/{crewID}/messages/{messageID}/report`
- [ ] `POST /crews/{crewID}/notifications`
- [ ] `POST /crews/{crewID}/report`
- [ ] `PUT /crews/{crewID}/messages/{messageID}/pin`
- [ ] `PUT /crews/{crewID}/messages/{messageID}/reactions/{emoji}`
- [ ] `PUT /crews/{crewID}/notifications`

## dailyposts (3)

- [ ] `GET /daily`
- [ ] `POST /daily/{postID}/kudos`
- [ ] `POST /daily/{postID}/kudos/undo`

## dashboard (3)

- [ ] `GET /overview`
- [ ] `GET /overview/panels`
- [ ] `GET /overview/today`

## day (4)

- [ ] `GET /`
- [ ] `GET /day/checkin`
- [ ] `GET /day/trends`
- [ ] `POST /day/rules`

## decisions (5)

- [ ] `GET /decisions`
- [ ] `GET /decisions/{id}`
- [ ] `POST /decisions`
- [ ] `POST /decisions/{id}`
- [ ] `POST /decisions/{id}/delete`

## documents (6)

- [ ] `GET /knowledge`
- [ ] `GET /knowledge/passages`
- [ ] `GET /knowledge/search`
- [ ] `GET /knowledge/{id}`
- [ ] `GET Content-Type`
- [ ] `POST /knowledge/{id}/delete`

## exercises (3)

- [ ] `GET /exercises`
- [ ] `GET /exercises/{slug}`
- [ ] `GET /exercises/{slug}/muscles`

## export (2)

- [ ] `GET /account/export`
- [ ] `GET /settings/export.zip`

## fasting (2)

- [ ] `POST /fasting/start`
- [ ] `POST /fasting/stop`

## firstweek (4)

- [ ] `GET /first-week`
- [ ] `GET /first-week/review`
- [ ] `GET HX-Request`
- [ ] `POST /first-week/done`

## fitness (7)

- [ ] `GET /fitness`
- [ ] `GET /fitness/activities`
- [ ] `GET /fitness/activities/sessions`
- [ ] `GET /fitness/strava/callback`
- [ ] `GET /fitness/strava/connect`
- [ ] `POST /fitness/strava/disconnect`
- [ ] `POST /fitness/strava/sync`

## goals (11)

- [ ] `GET /goals`
- [ ] `GET /goals/{id}`
- [ ] `POST /goals`
- [ ] `POST /goals/{id}`
- [ ] `POST /goals/{id}/delete`
- [ ] `POST /goals/{id}/milestones`
- [ ] `POST /goals/{id}/milestones/{mid}`
- [ ] `POST /goals/{id}/milestones/{mid}/delete`
- [ ] `POST /goals/{id}/milestones/{mid}/status`
- [ ] `POST /goals/{id}/status`
- [ ] `POST /goals/{id}/updates`

## health (1)

- [ ] `POST /blood-pressure`

## inbox (4)

- [ ] `GET /inbox`
- [ ] `POST /inbox`
- [ ] `POST /inbox/{itemID}/dismiss`
- [ ] `POST /inbox/{itemID}/file`

## insights (26)

- [ ] `GET /`
- [ ] `GET /body`
- [ ] `GET /body/body`
- [ ] `GET /cardio`
- [ ] `GET /cardio/body`
- [ ] `GET /coach`
- [ ] `GET /coach/body`
- [ ] `GET /metric/{key}`
- [ ] `GET /metric/{key}/body`
- [ ] `GET /mind`
- [ ] `GET /mind/body`
- [ ] `GET /nutrition`
- [ ] `GET /nutrition/body`
- [ ] `GET /panels`
- [ ] `GET /patterns`
- [ ] `GET /patterns/body`
- [ ] `GET /progress`
- [ ] `GET /progress/body`
- [ ] `GET /sleep`
- [ ] `GET /sleep/body`
- [ ] `GET /spend`
- [ ] `GET /spend/body`
- [ ] `GET /timeline`
- [ ] `GET /timeline/body`
- [ ] `GET /training`
- [ ] `GET /training/body`

## lifts (5)

- [ ] `GET /lifts/import`
- [ ] `GET /lifts/today`
- [ ] `POST /lifts/import`
- [ ] `POST /lifts/sets`
- [ ] `POST /lifts/sets/{setID}/delete`

## lighterday (3)

- [ ] `GET /today/lighter`
- [ ] `GET HX-Request`
- [ ] `POST /today/lighter`

## mcpauth (10)

- [ ] `GET /.well-known/oauth-authorization-server`
- [ ] `GET /.well-known/oauth-protected-resource`
- [ ] `GET /.well-known/oauth-protected-resource/mcp`
- [ ] `GET /oauth/authorize`
- [ ] `GET /oauth/authorize/resume`
- [ ] `POST /oauth/authorize`
- [ ] `POST /oauth/authorize/account`
- [ ] `POST /oauth/register`
- [ ] `POST /oauth/revoke`
- [ ] `POST /oauth/token`

## meals (23)

- [ ] `GET /nutrition/ingredients`
- [ ] `GET /nutrition/log`
- [ ] `GET /nutrition/plans`
- [ ] `GET /nutrition/plans/{id}`
- [ ] `POST /nutrition/days/{dayID}`
- [ ] `POST /nutrition/days/{dayID}/delete`
- [ ] `POST /nutrition/days/{dayID}/meals`
- [ ] `POST /nutrition/ingredients`
- [ ] `POST /nutrition/ingredients/{id}/delete`
- [ ] `POST /nutrition/log/ingredients`
- [ ] `POST /nutrition/log/meals`
- [ ] `POST /nutrition/log/{id}/delete`
- [ ] `POST /nutrition/meal-ingredients/{id}/delete`
- [ ] `POST /nutrition/meal-ingredients/{id}/optional`
- [ ] `POST /nutrition/meals/{mealID}/delete`
- [ ] `POST /nutrition/meals/{mealID}/ingredients`
- [ ] `POST /nutrition/meals/{mealID}/ingredients/batch`
- [ ] `POST /nutrition/meals/{mealID}/optional`
- [ ] `POST /nutrition/meals/{mealID}/options`
- [ ] `POST /nutrition/plans`
- [ ] `POST /nutrition/plans/{id}/days`
- [ ] `POST /nutrition/plans/{id}/delete`
- [ ] `POST /nutrition/plans/{id}/settings`

## media (4)

- [ ] `GET /form`
- [ ] `GET /form/{id}`
- [ ] `GET /form/{id}/status`
- [ ] `GET /media/{id}`

## medications (4)

- [ ] `POST /care/medications`
- [ ] `POST /care/medications/doses/{id}/undo`
- [ ] `POST /care/medications/{id}/doses`
- [ ] `POST /care/medications/{id}/stop`

## memories (11)

- [ ] `GET /memories`
- [ ] `GET /memories/for/{conversationID}`
- [ ] `POST /memories`
- [ ] `POST /memories/{id}`
- [ ] `POST /memories/{id}/approve`
- [ ] `POST /memories/{id}/delete`
- [ ] `POST /memories/{id}/exclude`
- [ ] `POST /memories/{id}/include`
- [ ] `POST /memories/{id}/pin`
- [ ] `POST /memories/{id}/reject`
- [ ] `POST /memories/{id}/unpin`

## milestones (2)

- [ ] `POST /trackers`
- [ ] `POST /trackers/{id}/done`

## mind (2)

- [ ] `GET /mind`
- [ ] `POST /mind/journal`

## moderation (4)

- [ ] `GET /ops/moderation`
- [ ] `POST /moderation/terms`
- [ ] `POST /ops/moderation/users/{userID}/suspend`
- [ ] `POST /ops/moderation/{kind}/{subjectID}/{action}`

## news (5)

- [ ] `GET /news-ticker`
- [ ] `GET /settings/news-ticker`
- [ ] `POST /settings/news-ticker`
- [ ] `POST /settings/news-ticker/feeds`
- [ ] `POST /settings/news-ticker/feeds/{id}/delete`

## nudges (4)

- [ ] `GET /nudges/bell`
- [ ] `GET /nudges/{id}/open`
- [ ] `POST /nudges/{id}/dismiss`
- [ ] `POST /nudges/{id}/read`

## onboarding (4)

- [ ] `GET /onboarding`
- [ ] `GET /onboarding/done`
- [ ] `POST /onboarding`
- [ ] `POST /onboarding/skip`

## outreach (3)

- [ ] `GET /outreach`
- [ ] `GET HX-Request`
- [ ] `POST /outreach/{id}/actions`

## planimport (5)

- [ ] `GET /nutrition/import`
- [ ] `GET /nutrition/plans/generate`
- [ ] `GET /training/import`
- [ ] `POST /nutrition/import/review`
- [ ] `POST /training/import/review`

## profiles (5)

- [ ] `GET /u/{handle}`
- [ ] `GET /u/{handle}/workouts`
- [ ] `GET /u/{handle}/workouts/{sessionID}`
- [ ] `POST /u/{handle}/follow`
- [ ] `POST /u/{handle}/unfollow`

## progresschecks (4)

- [ ] `GET /progress`
- [ ] `POST /progress`
- [ ] `POST /progress/schedule`
- [ ] `POST /progress/{id}/delete`

## push (2)

- [ ] `DELETE /push/subscriptions`
- [ ] `POST /push/subscriptions`

## recaps (4)

- [ ] `GET /recap`
- [ ] `GET /recap/panels`
- [ ] `GET /recap/strip`
- [ ] `POST /recap/share`

## reports (4)

- [ ] `GET /reports`
- [ ] `GET /reports/{id}`
- [ ] `POST /reports/{id}/archive`
- [ ] `POST /reports/{id}/helpful`

## screentime (1)

- [ ] `POST /screen-time`

## settings (19)

- [ ] `GET /connections/pill`
- [ ] `GET /settings`
- [ ] `GET /settings/activity`
- [ ] `GET /settings/connections`
- [ ] `GET /settings/connections/{id}/status`
- [ ] `POST /settings/account/delete`
- [ ] `POST /settings/ai`
- [ ] `POST /settings/ai/remove`
- [ ] `POST /settings/connections`
- [ ] `POST /settings/connections/{id}/revoke`
- [ ] `POST /settings/diets`
- [ ] `POST /settings/integrations/calendar`
- [ ] `POST /settings/integrations/calendar/disconnect`
- [ ] `POST /settings/messaging/telegram`
- [ ] `POST /settings/messaging/telegram/disconnect`
- [ ] `POST /settings/notifications`
- [ ] `POST /settings/preferences`
- [ ] `POST /settings/profile`
- [ ] `POST /settings/target-weight`

## social (19)

- [ ] `GET /friends`
- [ ] `GET /friends/facebook/callback`
- [ ] `GET /friends/facebook/connect`
- [ ] `GET /i/{code}`
- [ ] `POST /friends/facebook/disconnect`
- [ ] `POST /friends/follow`
- [ ] `POST /friends/handle`
- [ ] `POST /friends/kudos/{achievementID}`
- [ ] `POST /friends/kudos/{achievementID}/undo`
- [ ] `POST /friends/phone`
- [ ] `POST /friends/phone/cancel`
- [ ] `POST /friends/phone/check`
- [ ] `POST /friends/phone/remove`
- [ ] `POST /friends/sharing`
- [ ] `POST /friends/{userID}/accept`
- [ ] `POST /friends/{userID}/block`
- [ ] `POST /friends/{userID}/remove`
- [ ] `POST /friends/{userID}/unblock`
- [ ] `POST /friends/{userID}/unfollow`

## soreness (1)

- [ ] `POST /soreness`

## supplements (1)

- [ ] `POST /supplements`

## vault (4)

- [ ] `GET /settings/vault`
- [ ] `POST /settings/vault/connect`
- [ ] `POST /settings/vault/disconnect`
- [ ] `POST /settings/vault/sync`

## web/pwa (3)

- [ ] `GET /manifest.webmanifest`
- [ ] `GET /offline.html`
- [ ] `GET /sw.js`

## weekly (2)

- [ ] `GET /weekly`
- [ ] `POST /weekly`

## workouts (21)

- [ ] `GET /training`
- [ ] `GET /training/new`
- [ ] `GET /training/plans`
- [ ] `GET /training/week`
- [ ] `GET /training/week/edit`
- [ ] `GET /training/{id}`
- [ ] `GET /training/{id}/days/{day}`
- [ ] `GET /training/{id}/days/{day}/add`
- [ ] `GET /training/{id}/days/{day}/exercises/{index}/swap`
- [ ] `GET /workouts/{id}`
- [ ] `POST /training/new`
- [ ] `POST /training/week`
- [ ] `POST /training/week/edit`
- [ ] `POST /training/week/reset`
- [ ] `POST /training/{id}/activate`
- [ ] `POST /training/{id}/days/{day}/exercises`
- [ ] `POST /training/{id}/days/{day}/exercises/{index}/move`
- [ ] `POST /training/{id}/days/{day}/exercises/{index}/remove`
- [ ] `POST /training/{id}/days/{day}/exercises/{index}/sets`
- [ ] `POST /training/{id}/days/{day}/exercises/{index}/swap`
- [ ] `POST /training/{id}/days/{day}/start-time`

## xp (1)

- [ ] `GET /friends/leaderboard`
