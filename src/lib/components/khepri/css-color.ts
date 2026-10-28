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

const CSS_VAR = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/;

/**
 * Walks an option tree and replaces every "var(--token)" string with the
 * token's current value as rgba(). An unset property leaves the string alone,
 * so a typo is visible instead of invisible.
 */
export function resolveColors<T>(node: T): T {
	if (typeof node === 'string') {
		const match = node.match(CSS_VAR);
		if (!match) return node;
		const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
		return (value ? toRGBA(value) : node) as T;
	}
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
