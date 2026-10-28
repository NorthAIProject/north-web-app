// View helpers for the shared workout card (north-client
// web/shared/workoutcard/view.go) and the lift labels it reads.

import type { Translator } from '#lib/i18n/index.js';
import type { CardExercise, WorkoutCardData } from './types.js';

/** How many movements a card names. */
export const TOP_EXERCISES = 2;

export function topExercises(c: WorkoutCardData): CardExercise[] {
	return c.exercises.slice(0, TOP_EXERCISES);
}

/** "22.5 kg" / "80 kg" (Go: lift.formatKg). */
export function formatKg(i18n: Translator, v: number): string {
	if (Number.isInteger(v)) return `${v.toFixed(0)} kg`;
	return i18n.decimal(v, 1) + ' kg';
}

/** "22,5 kg × 8" in the reader's language (Go: lift.bestLabel). */
export function bestLabel(i18n: Translator, weightKg: number, reps: number): string {
	return `${formatKg(i18n, weightKg)} × ${Math.trunc(reps)}`;
}

/**
 * The heaviest set in the reader's language (Go: CardExercise.BestIn). Falls
 * back to the English `best` when only that was sent (the API's shape).
 */
export function cardBestIn(i18n: Translator, e: CardExercise): string {
	if (e.bestWeightKg === undefined) return e.best ?? '';
	if (e.bestWeightKg <= 0) return '';
	return bestLabel(i18n, e.bestWeightKg, e.bestReps ?? 0);
}

/**
 * The card's numbers in reading order: time, sets, volume, then distance. A
 * part that is zero is left out rather than shown as "0 sets".
 */
export function cardStats(i18n: Translator, c: WorkoutCardData): string[] {
	const out: string[] = [];
	const m = Math.round(c.durationSeconds / 60);
	if (m > 0) out.push(i18n.tf('workoutcard.minutes', m));
	if (c.sets === 1) out.push(i18n.t('workoutcard.set'));
	else if (c.sets > 1) out.push(i18n.tf('workoutcard.sets', c.sets));
	if (c.volumeKg > 0) out.push(i18n.tf('workoutcard.volume', i18n.thousands(Math.round(c.volumeKg))));
	if (c.distanceM != null && c.distanceM > 0) {
		// One decimal at most, trimmed: "5 km", "5.2 km".
		const km = Math.round(c.distanceM / 100) / 10;
		out.push(i18n.tf('workoutcard.km', i18n.decimal(km, Number.isInteger(km) ? 0 : 1)));
	}
	return out;
}
