// Cuts the stills a form check is read from out of the clip, in the browser.
//
// The API reads stills, not video (north-client internal/media): the clip is
// kept for playback and these are what the model sees. Cutting them here means
// nothing on the server has to decode video.

/** The server's limits (Go: analysis.MaxFrames, media.MaxFrameEdge). */
export const MAX_FRAMES = 24;
export const MAX_EDGE = 1024;

/** What this page sends: well inside the limits, about one still a second. */
export const TARGET_FRAMES = 16;
export const FRAME_EDGE = 768;
const MIN_FRAMES = 4;
/** Stills closer together than this show the same position twice. */
const MIN_GAP_SECONDS = 0.25;
const JPEG_QUALITY = 0.8;
/** A seek that never lands must not leave the upload hanging. */
const SEEK_TIMEOUT_MS = 8000;

export type Stills = { frames: Blob[]; times: number[]; durationSeconds: number };

/**
 * The seconds to cut stills at: evenly spread, each in the middle of its
 * slice, so neither the black first frame nor the very end is sampled. Rounded
 * to hundredths and strictly increasing, which the server requires.
 */
export function frameTimes(durationSeconds: number, target = TARGET_FRAMES): number[] {
	if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return [];
	const fit = Math.floor(durationSeconds / MIN_GAP_SECONDS);
	const n = Math.max(1, Math.min(target, MAX_FRAMES, Math.max(MIN_FRAMES, fit)));
	const times: number[] = [];
	for (let i = 0; i < n; i++) {
		const at = Math.round(((durationSeconds * (i + 0.5)) / n) * 100) / 100;
		if (at > durationSeconds) break;
		const last = times.at(-1);
		if (last === undefined || at > last) times.push(at);
	}
	return times;
}

/** The size a still is drawn at: the longer side at most `edge`, never enlarged. */
export function fitWithin(width: number, height: number, edge = FRAME_EDGE): { width: number; height: number } {
	const longer = Math.max(width, height);
	if (longer <= 0) return { width: 0, height: 0 };
	const scale = Math.min(1, edge / longer);
	return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function once(target: EventTarget, ok: string, timeoutMs: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const done = (fn: () => void) => {
			clearTimeout(timer);
			target.removeEventListener(ok, onOk);
			target.removeEventListener('error', onError);
			fn();
		};
		const onOk = () => done(resolve);
		const onError = () => done(() => reject(new Error('video error')));
		const timer = setTimeout(() => done(() => reject(new Error('video timeout'))), timeoutMs);
		target.addEventListener(ok, onOk);
		target.addEventListener('error', onError);
	});
}

/**
 * Cuts the stills. Rejects when this browser cannot decode the clip (an HEVC
 * .mov outside Safari, say); the caller says so, because a check with no
 * stills cannot be read.
 */
export async function extractStills(clip: File): Promise<Stills> {
	const url = URL.createObjectURL(clip);
	const video = document.createElement('video');
	video.muted = true;
	video.playsInline = true;
	video.preload = 'auto';
	try {
		const loaded = once(video, 'loadeddata', SEEK_TIMEOUT_MS);
		video.src = url;
		await loaded;

		const durationSeconds = video.duration;
		const times = frameTimes(durationSeconds);
		const size = fitWithin(video.videoWidth, video.videoHeight);
		if (times.length === 0 || size.width === 0) throw new Error('unreadable clip');

		const canvas = document.createElement('canvas');
		canvas.width = size.width;
		canvas.height = size.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('no canvas');

		const frames: Blob[] = [];
		for (const at of times) {
			const seeked = once(video, 'seeked', SEEK_TIMEOUT_MS);
			video.currentTime = at;
			await seeked;
			ctx.drawImage(video, 0, 0, size.width, size.height);
			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
			});
			if (!blob) throw new Error('no still');
			frames.push(blob);
		}
		return { frames, times, durationSeconds: Math.round(durationSeconds * 100) / 100 };
	} finally {
		video.removeAttribute('src');
		video.load();
		URL.revokeObjectURL(url);
	}
}
