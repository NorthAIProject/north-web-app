/**
 * The 3D emblem's motion: turns a time (and a pointer) into values.
 *
 * Pure arithmetic over `emblem-motion.json` (a byte-for-byte copy of
 * design/emblem-motion.json). No renderer import: scene.ts applies the values.
 * north-ios `EmblemMotion.swift` does the same arithmetic, and both test suites
 * assert design/emblem-motion.fixtures.json.
 */
import motion from './emblem-motion.json';

export type Easing = 'linear' | 'sine' | 'easeOutCubic';

export interface Keyframe {
	t: number;
	v: number;
}

export interface Track {
	material?: string;
	light?: string;
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

export interface Pointer {
	maxYawDegrees: number;
	maxPitchDegrees: number;
	timeConstantSeconds: number;
}

export const ENTRANCE = motion.entrance as Entrance;
export const IDLE = motion.idle as Track[];
export const POINTER = motion.pointer as Pointer;

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
 * Target tilt toward a pointer at (x, y), each in [-1, 1] from the emblem's
 * centre, +y up. Pitch is negative when the pointer is above: rotateX by a
 * negative angle turns the face (+Z) up.
 */
export function tilt(
	pointer: Pointer,
	x: number,
	y: number
): { yawDegrees: number; pitchDegrees: number } {
	return {
		yawDegrees: clamp(x, -1, 1) * pointer.maxYawDegrees,
		pitchDegrees: -clamp(y, -1, 1) * pointer.maxPitchDegrees
	};
}

/** Exponential approach of `current` to `target` over `dt` seconds. */
export function approach(current: number, target: number, dt: number, tau: number): number {
	return current + (target - current) * (1 - Math.exp(-dt / tau));
}
