// Uploads a clip through this app's /api proxy (Go: POST /app/form).
//
// A plain fetch rather than browserApi(): the multipart body streams through the
// proxy untouched, and a 429 carries Retry-After, which the quota panel needs
// and the typed client's error does not keep.

import { apiErrorFrom } from '#lib/api/errors.js';
import type { Stills } from './frames.js';
import type { FormCheck } from './view.js';

export type UploadResult =
	| { ok: true; check: FormCheck }
	| { ok: false; refused: true; retryAfterSeconds: number }
	| { ok: false; refused: false; message: string };

/** Go's own sentence for an empty or oversized upload (handler.upload). */
export const CHOOSE_VIDEO = 'Choose a video to upload. Clips must be under 90 MB.';
/** Go: the sentence for a storage failure. */
export const STORE_FAILED = 'Something went wrong storing that video. Try again.';

/**
 * The clip goes up for playback; the stills cut from it are what is read
 * (Go: media.FormUpload). One time per still, comma separated.
 */
export function formCheckBody(video: File, stills: Stills): FormData {
	const body = new FormData();
	body.set('video', video);
	stills.frames.forEach((frame, i) => body.append('frames', frame, `frame-${String(i + 1).padStart(2, '0')}.jpg`));
	body.set('frameTimes', stills.times.join(','));
	body.set('durationSeconds', String(stills.durationSeconds));
	return body;
}

export async function uploadFormCheck(
	video: File | null,
	stills: Stills,
	fetchImpl: typeof fetch = fetch
): Promise<UploadResult> {
	if (!video || video.size === 0) return { ok: false, refused: false, message: CHOOSE_VIDEO };
	const body = formCheckBody(video, stills);
	let res: Response;
	try {
		res = await fetchImpl('/api/form-checks', { method: 'POST', body, headers: { accept: 'application/json' } });
	} catch {
		return { ok: false, refused: false, message: STORE_FAILED };
	}
	if (res.ok) return { ok: true, check: (await res.json()) as FormCheck };
	if (res.status === 429) {
		const retry = Number(res.headers.get('retry-after'));
		return { ok: false, refused: true, retryAfterSeconds: Number.isFinite(retry) && retry > 0 ? retry : 1 };
	}
	const err = await apiErrorFrom(res);
	if (err.status === 422) return { ok: false, refused: false, message: err.fields.video || err.fields.frames || CHOOSE_VIDEO };
	if (err.status === 413) return { ok: false, refused: false, message: CHOOSE_VIDEO };
	return { ok: false, refused: false, message: STORE_FAILED };
}
