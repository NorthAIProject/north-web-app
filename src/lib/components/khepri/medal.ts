// Coin geometry and colours: a port of the helpers in north-client
// web/shared/medal/medal.templ, reading the same medals.json (docs/medals),
// which iOS also copies. Keep medals.json byte-identical to the Go one.

import raw from './medals.json';
import type { MedalProps } from './types.js';

export type MedalArea = { fill: string; rim: string };

export type MedalSet = {
	license: string;
	stroke: number;
	coin: {
		viewBox: number;
		rimRadius: number;
		faceRadius: number;
		faceEdge: { color: string; width: number };
		glyph: { translate: number; scale: number };
		scallop: { bumps: number; baseRadius: number; depth: number; points: number };
		locked: { opacity: number; grayscale: number };
	};
	areas: Record<string, MedalArea>;
	monthly: {
		rim: string;
		fill: string;
		text: {
			color: string;
			monthSize: number;
			monthY: number;
			numberSize: number;
			numberY: number;
			numberWideFrom: number;
			numberWideScale: number;
			fontWeight: number;
			fontFamily: string;
			anchor: string;
			baseline: boolean;
		};
	};
	glyphs: Record<string, string[]>;
};

export const medalSet: MedalSet = raw as MedalSet;

const fontStacks: Record<string, string> = {
	rounded: "ui-rounded,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif"
};

export function fontStack(s: MedalSet): string {
	return fontStacks[s.monthly.text.fontFamily] ?? 'system-ui,sans-serif';
}

/** "central" when the json y values are not baselines. */
export function baselineAttr(s: MedalSet): string {
	return s.monthly.text.baseline ? 'alphabetic' : 'central';
}

/** Whether the coin shows month and target rather than a glyph. */
export function hasText(p: MedalProps): boolean {
	return Boolean(p.monthly && p.month);
}

export function faceFill(s: MedalSet, p: MedalProps): string {
	if (hasText(p)) return s.monthly.fill;
	return s.areas[p.area ?? '']?.fill ?? '';
}

export function rimColour(s: MedalSet, p: MedalProps): string {
	if (p.monthly) return s.monthly.rim;
	return s.areas[p.area ?? '']?.rim ?? '';
}

/** Shrinks three-digit targets so they stay inside the face. */
export function numberSize(s: MedalSet, p: MedalProps): number {
	let size = s.monthly.text.numberSize;
	if ((p.target ?? 0) >= s.monthly.text.numberWideFrom) size *= s.monthly.text.numberWideScale;
	return size;
}

/** Go's fmt.Sprint of a float64: shortest round-trip form. */
export function num(f: number): string {
	return String(f);
}

export function coinStyle(s: MedalSet, p: MedalProps): string {
	if (p.locked) return `filter:grayscale(${num(s.coin.locked.grayscale)});opacity:${num(s.coin.locked.opacity)}`;
	return '';
}

/** The outline of a coin with a ring of bumps. */
export function scallop(s: MedalSet): string {
	const c = s.coin;
	const mid = c.viewBox / 2;
	let out = '';
	for (let i = 0; i < c.scallop.points; i++) {
		const a = (2 * Math.PI * i) / c.scallop.points;
		const r = c.scallop.baseRadius + c.scallop.depth * Math.cos(c.scallop.bumps * a);
		out += `${i === 0 ? 'M' : 'L'}${(mid + r * Math.cos(a)).toFixed(2)} ${(mid + r * Math.sin(a)).toFixed(2)}`;
	}
	return out + 'Z';
}
