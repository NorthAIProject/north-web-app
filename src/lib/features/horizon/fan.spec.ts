import { describe, expect, it } from 'vitest';
import { daysBetween, fan, niceStep } from './fan.js';

const points = [
	{ offsetDays: 0, low: 100, mid: 100, high: 100 },
	{ offsetDays: 28, low: 98, mid: 102, high: 106 },
	{ offsetDays: 56, low: 96, mid: 104, high: 112 }
];

describe('daysBetween', () => {
	it('counts calendar days whatever the clock does', () => {
		expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2); // across a clock change
		expect(daysBetween('2026-11-19', '2026-11-12')).toBe(-7);
	});
});

describe('niceStep', () => {
	it('picks round steps', () => {
		expect(niceStep(16, 4)).toBe(5);
		expect(niceStep(3, 4)).toBe(1);
		expect(niceStep(90, 4)).toBe(50);
		expect(niceStep(0, 4)).toBe(1);
	});
});

describe('fan', () => {
	const history = [
		{ date: '2026-09-24', value: 95 },
		{ date: '2026-10-22', value: 98 },
		{ date: '2026-11-18', value: 100 }
	];

	it('puts today between the logged line and the band', () => {
		const f = fan(history, points, '2026-11-19');
		expect(f).not.toBeNull();
		// 56 days back, 56 ahead: today is the middle.
		expect(f!.todayX).toBe(50);
		expect(f!.historyDays).toBe(56);
		expect(f!.line.startsWith('M0 ')).toBe(true);
		expect(f!.band.endsWith('Z')).toBe(true);
		expect(f!.xTicks.map((t) => t.weeks)).toEqual([4, 8]);
	});

	it('keeps every value inside the plot on round guides', () => {
		const f = fan(history, points, '2026-11-19')!;
		expect(f.yTicks.map((t) => t.value)).toEqual([115, 110, 105, 100, 95]);
		expect(f.yTicks[0].y).toBe(0);
		expect(f.yTicks.at(-1)!.y).toBe(100);
	});

	it('cuts a long past so the band keeps its room', () => {
		const old = [{ date: '2025-12-01', value: 60 }, ...history];
		const f = fan(old, points, '2026-11-19')!;
		// Twice the forecast's reach, not a year.
		expect(f.historyDays).toBeLessThanOrEqual(112);
		expect(f.yTicks.at(-1)!.value).toBe(95);
	});

	it('draws history alone when there is no forecast yet', () => {
		const f = fan(history, [], '2026-11-19')!;
		expect(f.band).toBe('');
		expect(f.mid).toBe('');
		expect(f.todayX).toBe(100);
		expect(f.xTicks).toEqual([]);
	});

	it('never puts a logged day in the future', () => {
		// A day logged in a timezone ahead of the reader's clock.
		const f = fan([{ date: '2026-11-20', value: 100 }], points, '2026-11-19')!;
		expect(f.line).toBe(`M${f.todayX} ${f.line.split(' ')[1]}`);
	});

	it('has nothing to draw from nothing', () => {
		expect(fan([], [], '2026-11-19')).toBeNull();
	});
});
