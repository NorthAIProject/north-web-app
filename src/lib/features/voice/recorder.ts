// Dictation, the parts with no markup (north-client web/assets/js/shared/dictate.js).
//
// Records a clip, re-encodes it as 16 kHz mono WAV, posts it to the API's
// /voice/transcribe through the /api proxy, and hands the words back for the
// box the button names. Nothing is submitted: the person reads what was heard
// and sends it themselves.

import { browserApi } from '#lib/api/client.js';

// Speech, mono, at the rate every speech model works in.
const RATE = 16000;

// In preference order; '' lets MediaRecorder pick, as a last resort.
const TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/ogg;codecs=opus', ''];

export type Capabilities = { available: boolean; maxSeconds: number; maxBytes: number };

let capabilities: Promise<Capabilities> | null = null;

/** Whether this deployment can transcribe, asked once per page load. */
export function voiceCapabilities(): Promise<Capabilities> {
	capabilities ??= browserApi()
		.GET('/voice')
		.then(({ data }) => data ?? { available: false, maxSeconds: 120, maxBytes: 8 << 20 })
		.catch(() => ({ available: false, maxSeconds: 120, maxBytes: 8 << 20 }));
	return capabilities;
}

export function supported(): boolean {
	return typeof MediaRecorder !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export function pickType(): string {
	for (const type of TYPES) {
		if (type === '' || MediaRecorder.isTypeSupported(type)) return type;
	}
	return '';
}

/**
 * The box's new value with the words written in at the selection, spaced from
 * what is around them and cut to the box's maxlength. Null when there is no
 * room left at all.
 */
export function place(
	value: string,
	start: number,
	end: number,
	text: string,
	max: number
): { value: string; cursor: number } | null {
	const before = value.slice(0, start);
	const after = value.slice(end);
	if (before && !/\s$/.test(before)) text = ' ' + text;
	if (after && !/^\s/.test(after)) text = text + ' ';
	if (max > 0) {
		const room = max - before.length - after.length;
		if (room <= 0) return null;
		text = text.slice(0, room);
	}
	return { value: before + text + after, cursor: before.length + text.length };
}

/** Writes the words into the box at the cursor, the way typing would. */
export function insert(box: HTMLTextAreaElement | HTMLInputElement, text: string) {
	const value = box.value;
	let start = typeof box.selectionStart === 'number' ? box.selectionStart : value.length;
	let end = typeof box.selectionEnd === 'number' ? box.selectionEnd : value.length;
	// A box that was never focused reports 0, which would put the words first.
	if (document.activeElement !== box && start === 0 && end === 0) start = end = value.length;

	const next = place(value, start, end, text, parseInt(box.getAttribute('maxlength') ?? '', 10));
	if (!next) return;
	box.value = next.value;
	box.focus();
	box.setSelectionRange(next.cursor, next.cursor);
	// So bind:value and anything else listening see it as typing.
	box.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Re-encodes whatever the browser recorded as 16-bit PCM WAV. */
export async function toWav(blob: Blob): Promise<Blob> {
	const w = window as unknown as {
		AudioContext?: typeof AudioContext;
		webkitAudioContext?: typeof AudioContext;
		OfflineAudioContext?: typeof OfflineAudioContext;
		webkitOfflineAudioContext?: typeof OfflineAudioContext;
	};
	const Ctx = w.AudioContext || w.webkitAudioContext;
	const Offline = w.OfflineAudioContext || w.webkitOfflineAudioContext;
	if (!Ctx) throw new Error('no audio context');

	const ctx = new Ctx();
	const bytes = await blob.arrayBuffer();
	const audio = await new Promise<AudioBuffer>((resolve, reject) => {
		const decoded = ctx.decodeAudioData(bytes, resolve, reject);
		if (decoded && typeof decoded.then === 'function') decoded.then(resolve, reject);
	});
	void ctx.close();
	if (!Offline) return encodeWav(audio);

	const frames = Math.max(1, Math.ceil(audio.duration * RATE));
	let off: OfflineAudioContext;
	try {
		off = new Offline(1, frames, RATE);
	} catch {
		return encodeWav(audio);
	}
	const source = off.createBufferSource();
	source.buffer = audio;
	source.connect(off.destination);
	source.start();
	return encodeWav(await off.startRendering());
}

function encodeWav(audio: AudioBuffer): Blob {
	const samples = audio.getChannelData(0);
	const rate = audio.sampleRate;
	const bytes = new ArrayBuffer(44 + samples.length * 2);
	const view = new DataView(bytes);
	const ascii = (offset: number, text: string) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};
	ascii(0, 'RIFF');
	view.setUint32(4, 36 + samples.length * 2, true);
	ascii(8, 'WAVE');
	ascii(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	ascii(36, 'data');
	view.setUint32(40, samples.length * 2, true);
	for (let i = 0; i < samples.length; i++) {
		const sample = Math.max(-1, Math.min(1, samples[i]));
		view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
	}
	return new Blob([bytes], { type: 'audio/wav' });
}

export type TranscribeResult = { text: string } | { error: 'limit' | 'unreachable' | 'unreadable'; message?: string };

/** Posts the clip. Every refusal from the API carries words to show. */
export async function transcribe(wav: Blob, surface?: string): Promise<TranscribeResult> {
	const form = new FormData();
	form.append('audio', wav, 'note.wav');
	if (surface) form.append('surface', surface);
	let response: Response;
	try {
		response = await fetch('/api/voice/transcribe', { method: 'POST', body: form });
	} catch {
		return { error: 'unreachable' };
	}
	if (response.status === 429) return { error: 'limit' };
	try {
		const body = (await response.json()) as { text?: string; error?: { message?: string } };
		if (response.ok && typeof body.text === 'string') return { text: body.text };
		return { error: 'unreadable', message: body.error?.message };
	} catch {
		return { error: 'unreachable' };
	}
}
