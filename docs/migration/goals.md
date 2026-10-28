# goals → SvelteKit

Go: `web/goals/*.templ`, `internal/goals/handler.go`. API: `internal/goals/api.go`,
`internal/milestones`.

| Go route                                        | SvelteKit                                             | API                                          |
| ----------------------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| `GET /app/goals`                                | `src/routes/(app)/app/goals/+page.server.ts` + `.svelte` | `GET /goals`                              |
| `POST /app/goals`                               | action `?/create` → redirect to the goal              | `POST /goals`                                |
| `GET /app/goals/{id}`                           | `src/routes/(app)/app/goals/[id]/+page.server.ts` + `.svelte` | `GET /goals/{goalID}`               |
| `POST /app/goals/{id}`                          | action `?/update`                                     | `PUT /goals/{goalID}`                        |
| `POST /app/goals/{id}/status`                   | action `?/status` (→ `?done=goal`)                    | `PUT /goals/{goalID}/status`                 |
| `POST /app/goals/{id}/updates`                  | action `?/note`                                       | `POST /goals/{goalID}/updates`               |
| `POST /app/goals/{id}/milestones`               | action `?/addMilestone`                               | `POST /goals/{goalID}/milestones`            |
| `POST /app/goals/{id}/milestones/{mid}`         | action `?/editMilestone` (hidden `milestone_id`)      | `PUT /goals/{goalID}/milestones/{id}`        |
| `POST /app/goals/{id}/milestones/{mid}/status`  | action `?/milestoneStatus` (→ `?done=milestone:<id>`) | `PUT …/milestones/{id}/status`               |
| `POST /app/goals/{id}/milestones/{mid}/delete`  | action `?/deleteMilestone`                            | `DELETE …/milestones/{id}`                   |
| `POST /app/goals/{id}/delete`                   | action `?/delete` → `/app/goals`                      | `DELETE /goals/{goalID}`                     |

Feature files in `src/lib/features/goals/`:

- `goals.ts`: progress, deadline and labels, form mapping, and the moment for `?done=`.
- `GoalFields.svelte`
- `ConfirmForm.svelte`

## API added

- `GoalSummary.motivation`: the list card shows the "why".
- `GoalList.overdueMilestones`: feeds the overdue KPI.

## Deliberate differences

- Alpine `confirm()` became a shadcn Dialog (`ConfirmForm`). It is used for milestone remove,
  "Let this one go" and delete. Without JS it submits directly.
- Goal detail shows at most 20 updates, the API limit. Go web showed 50.
- The funnel `MomentShown` event is not fired for goal moments: there is no browser analytics hook yet.
- The category donut stays on ECharts (`EChart.svelte` + the shared `donutOption`).

## Library candidates

- None.

## Tests

`tests/e2e/goals.spec.ts` has three tests:

- Empty state, a refused create that keeps the form values, then create → detail.
- Milestone add/complete (moment)/edit/remove, a progress note, pause, and delete via the dialogs.
- List KPIs, progress, the donut, and the achieved moment.
