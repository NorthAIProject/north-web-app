// Helpers for the exercise pose artwork (north-client web/shared/exerciseart
// and web/shared/exerciserow).

import type { ExerciseLike } from './types.js';

/** What upstream ships for every exercise: a start, a midpoint, and an end. */
export const FRAME_COUNT = 3;

/** Frame interval of the flipbook, in ms. */
export const FRAME_MS = 900;

/**
 * Strips anything that could close the url() and inject a second declaration.
 * The generator only writes [a-z0-9-]; anything else renders nothing.
 */
export function safeSlug(slug: string): string {
	return slug.replace(/[^a-z0-9-]/g, '');
}

/**
 * The mask declaration for one frame. The URL asks for .svg; the file on disk
 * is .svg.gz, and the server bridges the two (Go: mountAssets). The -webkit-
 * prefixes are still required by Safari.
 */
export function maskFor(slug: string, frame: number): string {
	const url = `url(/assets/exercises/${safeSlug(slug)}/frame-${frame}.svg)`;
	return (
		`-webkit-mask-image:${url};mask-image:${url};` +
		'-webkit-mask-size:contain;mask-size:contain;' +
		'-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;' +
		'-webkit-mask-position:center;mask-position:center'
	);
}

/** exercise.Exercise.HasIllustration */
export function hasIllustration(e: ExerciseLike): boolean {
	return Boolean(e.illustrationSlug);
}

/** exercise.Exercise.NeedsEquipment: "none" (bodyweight) is not worth printing. */
export function needsEquipment(e: ExerciseLike): boolean {
	return Boolean(e.equipment) && e.equipment !== 'none';
}
