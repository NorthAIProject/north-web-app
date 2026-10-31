/**
 * Reading Khepri's design tokens into canvases (three.js, ECharts).
 *
 * Port of north-client web/assets/js/shared/css-color.js plus the colour
 * resolver in echarts-init.js. The tokens are `oklch()`, which neither
 * THREE.Color.setStyle() nor ECharts' parser understands, so the string is
 * handed to the one colour parser every browser already has — the 2D canvas —
 * and what it painted is read back.
 *
 * Browser-only: call from an effect, never during SSR. Deliberately free of a
 * three.js import so ECharts callers don't pull three in; readCSSColor takes
 * the THREE namespace from its (lazy-importing) caller.
 */
import type * as ThreeNS from 'three';

/**
 * Resolves a CSS custom property on :root to a THREE.Color. A translucent
 * token is composited over `backdrop` first. The "#000" sentinel means a value
 * the canvas cannot parse comes back visibly black rather than reusing the
 * previous fill.
 */
export function readCSSColor(
	THREE: typeof ThreeNS,
	varName: string,
	fallbackHex: number,
	backdrop = '#000'
): ThreeNS.Color {
	const color = new THREE.Color(fallbackHex);
	const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	if (!raw) return color;
	const ctx = document.createElement('canvas').getContext('2d');
	if (!ctx) return color;
	ctx.fillStyle = '#000';
	ctx.fillStyle = backdrop;
	ctx.fillRect(0, 0, 1, 1);
	ctx.fillStyle = '#000';
	ctx.fillStyle = raw;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
	color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
	return color;
}

let probe: CanvasRenderingContext2D | null = null;

/** Any CSS colour → "rgba(r,g,b,a)", via a 1x1 canvas. */
export function toRGBA(value: string): string {
	if (!probe) {
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = 1;
		probe = canvas.getContext('2d', { willReadFrequently: true });
		if (!probe) return value;
	}
	probe.clearRect(0, 0, 1, 1);
	probe.fillStyle = '#000';
	probe.fillStyle = value;
	probe.fillRect(0, 0, 1, 1);
	const d = probe.getImageData(0, 0, 1, 1).data;
	return 'rgba(' + d[0] + ',' + d[1] + ',' + d[2] + ',' + +(d[3] / 255).toFixed(3) + ')';
}

// Colour functions a canvas can parse but ECharts' zrender cannot.
const CSS_COLOR_FN = /^\s*(?:color-mix|oklch|oklab|lch|lab|hwb|color)\(/;

/**
 * Replaces the first var(--name[, fallback]) in s, or returns null when there
 * is none or it cannot be resolved (unset and no fallback).
 */
function substituteVar(s: string, root: CSSStyleDeclaration): string | null {
	const start = s.indexOf('var(');
	if (start < 0) return null;
	let depth = 0;
	let end = -1;
	let comma = -1;
	for (let i = start + 3; i < s.length; i++) {
		const ch = s[i];
		if (ch === '(') depth++;
		else if (ch === ')' && --depth === 0) {
			end = i;
			break;
		} else if (ch === ',' && depth === 1 && comma < 0) comma = i;
	}
	if (end < 0) return null;
	const name = s.slice(start + 4, comma < 0 ? end : comma).trim();
	const fallback = comma < 0 ? '' : s.slice(comma + 1, end).trim();
	const value = root.getPropertyValue(name).trim() || fallback;
	if (!value) return null;
	return s.slice(0, start) + value + s.slice(end + 1);
}

/**
 * Resolves one string that names a theme colour — a bare "var(--token)" or
 * any expression containing var(), such as
 * "color-mix(in oklch, var(--north-signal) 20%, var(--background))" — to
 * rgba(). Each var() is replaced by the token's computed value, then the
 * whole expression is painted through the 1x1 canvas, which understands
 * oklch() and color-mix(). Strings without var() or a modern colour function
 * pass through untouched. A var() naming an unset property (and with no
 * fallback) leaves the string alone, so a typo is visible instead of invisible.
 */
export function resolveColor(value: string): string {
	const hasVar = value.includes('var(');
	if (!hasVar && !CSS_COLOR_FN.test(value)) return value;
	let out = value;
	if (hasVar) {
		const root = getComputedStyle(document.documentElement);
		// Computed custom properties already have their own var()s substituted;
		// the bound guards a fallback that names a token, and a cycle.
		for (let i = 0; i < 16 && out.includes('var('); i++) {
			const next = substituteVar(out, root);
			if (next === null) return value;
			out = next;
		}
		if (out.includes('var(')) return value;
	}
	return toRGBA(out);
}

/**
 * Walks an option tree and resolves every colour string in it to rgba()
 * (see resolveColor), so nothing ECharts cannot parse reaches setOption —
 * an unparsed colour is drawn black.
 */
export function resolveColors<T>(node: T): T {
	if (typeof node === 'string') return resolveColor(node) as T;
	if (Array.isArray(node)) return node.map(resolveColors) as T;
	if (node && typeof node === 'object') {
		const out: Record<string, unknown> = {};
		for (const key in node) {
			if (Object.prototype.hasOwnProperty.call(node, key)) {
				out[key] = resolveColors((node as Record<string, unknown>)[key]);
			}
		}
		return out as T;
	}
	return node;
}
