// Uploads a clip through this app's /api proxy (Go: POST /app/form).
//
// A plain fetch rather than browserApi(): the multipart body streams through the
// proxy untouched, and a 429 carries Retry-After, which the quota panel needs
// and the typed client's error does not keep.

import { apiErrorFrom } from '#lib/api/errors.js';
import type { FormCheck } from './view.js';

export type UploadResult =
	| { ok: true; check: FormCheck }
	| { ok: false; refused: true; retryAfterSeconds: number }
	| { ok: false; refused: false; message: string };

/** Go's own sentence for an empty or oversized upload (handler.upload). */
export const CHOOSE_VIDEO = 'Choose a video to upload. Clips must be under 90 MB.';
/** Go: the sentence for a storage failure. */
export const STORE_FAILED = 'Something went wrong storing that video. Try again.';

export async function uploadFormCheck(video: File | null, fetchImpl: typeof fetch = fetch): Promise<UploadResult> {
	if (!video || video.size === 0) return { ok: false, refused: false, message: CHOOSE_VIDEO };
	const body = new FormData();
	body.set('video', video);
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
	if (err.status === 422) return { ok: false, refused: false, message: err.fields.video || CHOOSE_VIDEO };
	if (err.status === 413) return { ok: false, refused: false, message: CHOOSE_VIDEO };
	return { ok: false, refused: false, message: STORE_FAILED };
}
