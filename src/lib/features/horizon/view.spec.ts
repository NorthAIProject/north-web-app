import { describe, expect, it } from 'vitest';
import {
	barFor,
	detrained,
	frameMap,
	isPlain,
	pointAt,
	reach,
	scenarioFrom,
	scenarioHref,
	weeksAhead,
	type Series
} from './view.js';

const series: Series = {
	status: 'ready',
	unit: 'kg',
	needs: [],
	now: 100,
	points: [
		{ offsetDays: 0, low: 100, mid: 100, high: 100 },
		{ offsetDays: 7, low: 99, mid: 101, high: 103 },
		{ offsetDays: 28, low: 98, mid: 104, high: 110 }
	]
};

describe('scenario', () => {
	it('reads a what-if from the address and clamps it', () => {
		expect(scenarioFrom(new URLSearchParams('skipWeeks=9&extraSessions=3&deloadNow=true'))).toEqual(
			{
				skipWeeks: 4,
				extraSessions: 1,
				deloadNow: true
			}
		);
		expect(scenarioFrom(new URLSearchParams('skipWeeks=abc&deloadNow=yes'))).toEqual({
			skipWeeks: 0,
			extraSessions: 0,
			deloadNow: false
		});
	});

	it('writes the plain forecast with no query', () => {
		expect(scenarioHref({ skipWeeks: 0, extraSessions: 0, deloadNow: false })).toBe('/app/horizon');
		expect(scenarioHref({ skipWeeks: 2, extraSessions: 0, deloadNow: true })).toBe(
			'/app/horizon?skipWeeks=2&deloadNow=true'
		);
		expect(isPlain({ skipWeeks: 0, extraSessions: 0, deloadNow: false })).toBe(true);
		expect(isPlain({ skipWeeks: 0, extraSessions: 1, deloadNow: false })).toBe(false);
	});
});

describe('ranges', () => {
	it('finds the day asked for and nothing past the forecast', () => {
		expect(pointAt(series, 7)?.mid).toBe(101);
		expect(pointAt(series, 56)).toBeNull();
		expect(reach(series)).toBe(28);
		expect(reach({ ...series, points: [] })).toBe(0);
	});

	it('places a range on a track spanning the whole forecast', () => {
		const week = barFor(series, 7)!;
		const month = barFor(series, 28)!;
		expect(month.width).toBeGreaterThan(week.width);
		expect(month.left).toBeLessThan(week.left);
		for (const bar of [week, month]) {
			expect(bar.left).toBeGreaterThanOrEqual(0);
			expect(bar.left + bar.width).toBeLessThanOrEqual(100);
			expect(bar.mid).toBeGreaterThan(bar.left);
			expect(bar.mid).toBeLessThan(bar.left + bar.width);
		}
		expect(week.now).toBe(month.now);
	});

	it('keeps today visible though its range has no width', () => {
		const today = barFor(series, 0)!;
		expect(today.width).toBeGreaterThan(0);
	});

	it('has no bar where there is no forecast', () => {
		expect(barFor(series, 56)).toBeNull();
		expect(barFor({ status: 'insufficient', unit: 'kg', needs: [], points: [] }, 0)).toBeNull();
	});
});

describe('frames', () => {
	const frame = {
		offsetDays: 28,
		date: '2026-12-16',
		shape: { waist: 0, hips: 0, chest: 0, overall: 0 },
		regions: [
			{ id: 'chest', fatigue: 0.4, retained: 1 },
			{ id: 'quads', fatigue: 0, retained: 0.8 },
			{ id: 'glutes', fatigue: 0, retained: 0.9 }
		]
	};

	it('draws fatigue as heat', () => {
		expect(frameMap(frame).regions).toEqual([
			{ region: 'chest', intensity: 0.4 },
			{ region: 'quads', intensity: 0 },
			{ region: 'glutes', intensity: 0 }
		]);
		expect(frameMap(undefined).regions).toEqual([]);
	});

	it('lists what time away has cost, most first', () => {
		expect(detrained(frame).map((r) => r.id)).toEqual(['quads', 'glutes']);
	});

	it('names whole weeks only', () => {
		expect(weeksAhead(28)).toBe(4);
		expect(weeksAhead(9)).toBeNull();
		expect(weeksAhead(0)).toBeNull();
	});
});
