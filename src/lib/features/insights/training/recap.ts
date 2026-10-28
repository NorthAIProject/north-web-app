// The API's LiftRecap (lifts.LiftRecapView) in the shape khepri's newRecap
// reads (lift.Recap), so the training page's recap card is the one the rest of
// the app draws.

import type { components } from '#lib/api/generated/schema.js';
import type { LiftRecap } from '#lib/components/khepri/types.js';

type WireRecap = components['schemas']['LiftRecap'];

export function recapInput(r: WireRecap): LiftRecap {
	return {
		startedAt: r.startedAt,
		planWeekday: r.planWeekday,
		focus: r.focus,
		sentence: r.sentence,
		durationSeconds: r.durationSeconds,
		setsDone: r.setsDone,
		setsPrescribed: r.setsPrescribed,
		volumeKg: r.volumeKg,
		calories: r.calories,
		exercises: r.exercises.map((e) => ({
			name: e.name,
			sets: e.sets,
			volumeKg: e.volumeKg,
			best: e.best,
			e1rm: e.e1rmKg,
			previousE1rm: e.previousE1rmKg,
			change: e.changeE1rmKg,
			previousVolume: e.previousVolumeKg,
			hasPrevious: e.previousE1rmKg !== undefined
		}))
	};
}
