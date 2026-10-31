import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { color as zrColor } from 'echarts';
import { heatmapOption } from '#lib/features/viz/echarts.js';
import { resolveColor, resolveColors } from './css-color.js';

// A stand-in for the browser: :root custom properties, and a 2D canvas whose
// fillStyle behaves as a real one does — it accepts rgb(), hex, transparent
// and color-mix(), and silently keeps the previous fill for anything it cannot
// parse (var() above all), which is how the heatmap ended up black.
const tokens: Record<string, string> = {
	'--north-signal': 'rgb(232 182 92)',
	'--background': 'rgb(11 17 28)',
	'--foreground': 'rgb(246 242 234)',
	'--muted-foreground': 'rgb(166 175 189)',
	'--x': 'rgb(200 0 0)'
};

type RGBA = [number, number, number, number];

function splitArgs(s: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let cur = '';
	for (const ch of s) {
		if (ch === '(') depth++;
		if (ch === ')') depth--;
		if (ch === ',' && depth === 0) {
			out.push(cur.trim());
			cur = '';
		} else cur += ch;
	}
	out.push(cur.trim());
	return out;
}

function paint(s: string): RGBA | null {
	s = s.trim();
	if (s.includes('var(')) return null;
	if (s === 'transparent') return [0, 0, 0, 0];
	let m = s.match(/^#([0-9a-f]{6})$/i);
	if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)).concat(1) as RGBA;
	m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/);
	if (m) return [+m[1], +m[2], +m[3], 1];
	m = s.match(/^color-mix\((.*)\)$/);
	if (m) {
		const [, a, b] = splitArgs(m[1]);
		const pa = a.match(/^(.*?)\s+(\d+)%$/);
		const ca = paint(pa ? pa[1] : a);
		const cb = paint(b);
		if (!ca || !cb) return null;
		const t = pa ? +pa[2] / 100 : 0.5;
		return ca.map((v, i) => Math.round(v * t + cb[i] * (1 - t))) as RGBA;
	}
	return null;
}

class FakeContext {
	#fill: RGBA = [0, 0, 0, 1];
	#pixel: RGBA = [0, 0, 0, 0];
	set fillStyle(v: string) {
		const c = paint(v);
		if (c) this.#fill = c;
	}
	clearRect() {
		this.#pixel = [0, 0, 0, 0];
	}
	fillRect() {
		this.#pixel = [this.#fill[0], this.#fill[1], this.#fill[2], Math.round(this.#fill[3] * 255)];
	}
	getImageData() {
		return { data: this.#pixel };
	}
}

const g = globalThis as Record<string, unknown>;
beforeAll(() => {
	g.document = {
		documentElement: {},
		createElement: () => ({ width: 0, height: 0, getContext: () => new FakeContext() })
	};
	g.getComputedStyle = () => ({ getPropertyValue: (name: string) => tokens[name] ?? '' });
});
afterAll(() => {
	delete g.document;
	delete g.getComputedStyle;
});

const RGBA_STRING = /^rgba\(\d{1,3},\d{1,3},\d{1,3},[\d.]+\)$/;

/** Every string in an option tree, with the key it sits under. */
function strings(node: unknown, key = '', out: [string, string][] = []): [string, string][] {
	if (typeof node === 'string') out.push([key, node]);
	else if (Array.isArray(node)) node.forEach((n) => strings(n, key, out));
	else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) strings(v, k, out);
	return out;
}

describe('resolveColor', () => {
	it('resolves a bare var() to rgba', () => {
		expect(resolveColor('var(--x)')).toBe('rgba(200,0,0,1)');
	});

	it('resolves color-mix() containing var() to rgba, not black', () => {
		expect(resolveColor('color-mix(in srgb, var(--x) 50%, rgb(0 0 200))')).toBe('rgba(100,0,100,1)');
		const low = resolveColor('color-mix(in oklch, var(--north-signal) 20%, var(--background))');
		expect(low).toMatch(RGBA_STRING);
		expect(low).not.toBe('rgba(0,0,0,1)');
		expect(low).not.toBe(resolveColor('var(--background)'));
	});

	it('uses a var() fallback when the token is unset', () => {
		expect(resolveColor('var(--unset-token, rgb(1 2 3))')).toBe('rgba(1,2,3,1)');
	});

	it('leaves a string naming an unset token alone, so the typo shows', () => {
		expect(resolveColor('var(--unset-token)')).toBe('var(--unset-token)');
		expect(resolveColor('color-mix(in oklch, var(--unset-token) 20%, var(--x))')).toBe(
			'color-mix(in oklch, var(--unset-token) 20%, var(--x))'
		);
	});

	it('leaves strings that are not colour expressions alone', () => {
		expect(resolveColor('{value}%')).toBe('{value}%');
		expect(resolveColor('#5470c6')).toBe('#5470c6');
		expect(resolveColor('shadow')).toBe('shadow');
	});
});

describe('heatmapOption through resolveColors', () => {
	it('hands setOption only colours zrender parses; every var-derived one is rgba', () => {
		const option = resolveColors(
			heatmapOption('Mood', [
				{ label: 'Mon', value: 1 },
				{ label: 'Tue', value: 5 }
			])
		);
		const all = strings(option);
		for (const [, s] of all) {
			expect(s).not.toContain('var(');
			expect(s).not.toContain('color-mix');
		}
		const colours = all.filter(([k]) => /color$/i.test(k));
		expect(colours.length).toBeGreaterThan(0);
		for (const [, s] of colours) expect(zrColor.parse(s), s).toBeTruthy();

		const range = (option.visualMap as { inRange: { color: string[] } }[])[0].inRange.color;
		expect(range).toHaveLength(2);
		for (const c of range) {
			expect(c).toMatch(RGBA_STRING);
			expect(c).not.toBe('rgba(0,0,0,1)');
		}
		expect(range[1]).toBe('rgba(232,182,92,1)');
	});
});
