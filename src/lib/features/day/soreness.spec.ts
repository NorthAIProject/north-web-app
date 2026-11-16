import { describe, expect, it } from 'vitest';
import { soreHeat, soreStrip, stripClass, zoneByRegion } from './soreness';

const figure = {
	feet: [],
	knees: [],
	quads: ['quads'],
	shoulders: ['delts', 'traps'],
	upper_back: ['traps', 'lats']
};

describe('soreness on the figure', () => {
	it('colours each region by the worst zone over it', () => {
		const heat = soreHeat(
			[
				{ region: 'shoulders', severity: 1 },
				{ region: 'upper_back', severity: 3 },
				{ region: 'knees', severity: 2 }
			],
			figure
		);
		expect(heat.traps).toBe(1);
		expect(heat.lats).toBe(1);
		expect(heat.delts).toBe(0.05);
		expect(Object.keys(heat).sort()).toEqual(['delts', 'lats', 'traps']);
	});

	it('logs a shared region to the zone that lists it first', () => {
		expect(zoneByRegion(figure)).toEqual({ quads: 'quads', delts: 'shoulders', traps: 'upper_back', lats: 'upper_back' });
	});

	it('lays the history out oldest first with empty days kept', () => {
		const strip = soreStrip({
			days: 3,
			to: '2026-03-01',
			entries: [
				{ date: '2026-03-01', region: 'quads', severity: 2 },
				{ date: '2026-03-01', region: 'knees', severity: 3 },
				{ date: '2026-02-27', region: 'quads', severity: 1 },
				{ date: '2026-02-20', region: 'quads', severity: 3 }
			]
		});
		expect(strip.map((d) => [d.date, d.severity, d.zones.length])).toEqual([
			['2026-02-27', 1, 1],
			['2026-02-28', 0, 0],
			['2026-03-01', 3, 2]
		]);
	});

	it('steps the strip from muted to the full move red', () => {
		expect([0, 1, 2, 3].map(stripClass)).toEqual(['bg-muted', 'bg-day-move/25', 'bg-day-move/55', 'bg-day-move']);
	});
});
