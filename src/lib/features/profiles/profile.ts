// View helpers for the profile pages (north-client web/profiles/profile.templ).

import type { components } from '#lib/api/generated/schema.js';
import type { CardExercise, WorkoutCardData } from '#lib/components/khepri/types.js';
import type { Translator } from '#lib/i18n/index.js';

export type ProfileView = components['schemas']['ProfileView'];
export type WorkoutCardView = components['schemas']['WorkoutCard'];

/** Up to two upper-case initials, "?" for none (Go: profiles.initials). */
export function initials(name: string): string {
	let out = '';
	for (const f of name.split(/\s+/).filter(Boolean)) {
		if (out.length === 2) break;
		out += [...f][0].toUpperCase();
	}
	return out || '?';
}

export function profileBase(handle: string): string {
	return '/app/u/' + encodeURIComponent(handle);
}

export function workoutHref(handle: string, c: WorkoutCardView): string {
	return `${profileBase(handle)}/workouts/${c.sessionId}`;
}

/** The singular key for exactly one, the plural otherwise (Go: countLabel). */
export function countLabel(i18n: Translator, n: number, one: string, many: string): string {
	return i18n.t(n === 1 ? one : many);
}

/**
 * The API sends a set's best as English "22.5 kg × 8"; reading the numbers
 * back lets the card say it in the reader's language, as Go's BestIn did.
 */
function parseBest(best: string | undefined): Pick<CardExercise, 'bestWeightKg' | 'bestReps'> {
	const m = best?.match(/^([\d.]+) kg × (\d+)$/);
	if (!m) return {};
	return { bestWeightKg: Number(m[1]), bestReps: Number(m[2]) };
}

/** The shared workout card's data from the API's card. */
export function toCardData(c: WorkoutCardView, statsOnly = false): WorkoutCardData {
	return {
		durationSeconds: c.durationSeconds,
		sets: c.sets,
		volumeKg: c.volumeKg,
		distanceM: c.distanceM,
		// The page that lists every exercise shows the card without them (Go: statsOnly).
		prs: statsOnly ? 0 : c.prs,
		exercises: statsOnly ? [] : c.exercises.map(toCardExercise)
	};
}

export function toCardExercise(e: WorkoutCardView['exercises'][number]): CardExercise {
	return { name: e.name, sets: e.sets, volumeKg: e.volumeKg, best: e.best, pr: e.pr, ...parseBest(e.best) };
}
