/**
 * The 3D mascot's motion: turns a time (and a pointer) into values.
 *
 * Pure arithmetic over `mascot-motion.json` (a byte-for-byte copy of
 * design/mascot-motion.json). No renderer import: scene.ts applies the values.
 * north-ios `MascotMotion.swift` does the same arithmetic, and both test suites
 * assert design/mascot-motion.fixtures.json. Self-contained on purpose: the
 * emblem experiment (src/lib/emblem3d) can be deleted without touching this.
 */
import motion from './mascot-motion.json';

export type Easing = 'linear' | 'sine' | 'easeOutCubic';

export interface Keyframe {
	t: number;
	v: number;
}

export interface Track {
	joint: string;
	property: string;
	periodSeconds: number;
	easing: Easing;
	keyframes: Keyframe[];
}

export interface Entrance {
	durationSeconds: number;
	easing: Easing;
	from: { translateY: number; rotateYDegrees: number };
}

export interface Blink {
	joint: string;
	cycleSeconds: number;
	startsSeconds: number[];
	closeSeconds: number;
	holdSeconds: number;
	openSeconds: number;
	closedScaleY: number;
}

export interface LookAt {
	maxHeadYawDegrees: number;
	maxHeadPitchDegrees: number;
	maxPupilX: number;
	maxPupilY: number;
	timeConstantSeconds: number;
}

export interface Look {
	headYawDegrees: number;
	headPitchDegrees: number;
	pupilX: number;
	pupilY: number;
}

export const ENTRANCE = motion.entrance as Entrance;
export const IDLE = motion.idle as Track[];
export const BLINK = motion.blink as Blink;
export const LOOK_AT = motion.lookAt as LookAt;

const clamp = (x: number, low: number, high: number) => Math.min(high, Math.max(low, x));

/** Eases x in [0, 1]; x outside is clamped. */
export function ease(easing: Easing, x: number): number {
	const u = clamp(x, 0, 1);
	switch (easing) {
		case 'sine':
			return (1 - Math.cos(Math.PI * u)) / 2;
		case 'easeOutCubic':
			return 1 - (1 - u) ** 3;
		default:
			return u;
	}
}

/** A looping track's value at `seconds` (negative times wrap too). */
export function sampleTrack(track: Track, seconds: number): number {
	const turns = seconds / track.periodSeconds;
	const u = turns - Math.floor(turns);
	const keys = track.keyframes;
	for (let i = 0; i < keys.length - 1; i++) {
		const a = keys[i];
		const b = keys[i + 1];
		if (u >= a.t && u <= b.t) {
			const local = b.t > a.t ? (u - a.t) / (b.t - a.t) : 0;
			return a.v + (b.v - a.v) * ease(track.easing, local);
		}
	}
	return keys[keys.length - 1].v;
}

/** Offsets from rest during the one-shot entrance; zero once it is over. */
export function entranceAt(
	entrance: Entrance,
	seconds: number
): { translateY: number; rotateYDegrees: number } {
	const left = 1 - ease(entrance.easing, seconds / entrance.durationSeconds);
	return {
		translateY: entrance.from.translateY * left,
		rotateYDegrees: entrance.from.rotateYDegrees * left
	};
}

/**
 * The eyes' vertical scale at `seconds`: 1 when open, `closedScaleY` when
 * shut. Each blink in the repeating cycle closes, holds and opens with a sine
 * ease; overlapping blinks take the more closed value.
 */
export function blinkAt(blink: Blink, seconds: number): number {
	const turns = seconds / blink.cycleSeconds;
	const u = (turns - Math.floor(turns)) * blink.cycleSeconds;
	const { closeSeconds: close, holdSeconds: hold, openSeconds: open, closedScaleY: closed } = blink;
	let scale = 1;
	for (const start of blink.startsSeconds) {
		const d = u - start;
		if (d < 0 || d >= close + hold + open) continue;
		let v: number;
		if (d < close) v = 1 - (1 - closed) * ease('sine', d / close);
		else if (d < close + hold) v = closed;
		else v = closed + (1 - closed) * ease('sine', (d - close - hold) / open);
		scale = Math.min(scale, v);
	}
	return scale;
}

/**
 * Where the mascot looks for a pointer at (x, y), each in [-1, 1] from its
 * centre, +y up. The head turns toward it (pitch is negative when the pointer
 * is above: rotateX by a negative angle turns the face, +Z, up), and the
 * pupils shift toward it inside the eyes.
 */
export function look(lookAt: LookAt, x: number, y: number): Look {
	const cx = clamp(x, -1, 1);
	const cy = clamp(y, -1, 1);
	return {
		headYawDegrees: cx * lookAt.maxHeadYawDegrees,
		headPitchDegrees: -cy * lookAt.maxHeadPitchDegrees,
		pupilX: cx * lookAt.maxPupilX,
		pupilY: cy * lookAt.maxPupilY
	};
}

/** Exponential approach of `current` to `target` over `dt` seconds. */
export function approach(current: number, target: number, dt: number, tau: number): number {
	return current + (target - current) * (1 - Math.exp(-dt / tau));
}
