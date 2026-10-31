import { describe, expect, it } from 'vitest';
import { formatCountChange, formatDelta, formatPct } from './format';

describe('insights deltas', () => {
	it('prints nothing without a previous window or without a change', () => {
		expect(formatDelta({ pct: 12, direction: 1, hasPrior: false })).toBeNull();
		expect(formatDelta({ pct: 0, direction: 0, hasPrior: true })).toBeNull();
	});

	it('carries the direction in the sign as well as the colour', () => {
		expect(formatDelta({ pct: 12.4, direction: 1, hasPrior: true })).toEqual({ direction: 1, text: '+12%' });
		// The API sends a signed pct on the way down; the sign is ours, not the number's.
		expect(formatDelta({ pct: -7.6, direction: -1, hasPrior: true })).toEqual({ direction: -1, text: '−8%' });
		expect(formatDelta({ pct: 7.6, direction: -1, hasPrior: true })).toEqual({ direction: -1, text: '−8%' });
	});

	it('signs a change in a count', () => {
		expect(formatCountChange(2)).toEqual({ direction: 1, text: '+2' });
		expect(formatCountChange(-3)).toEqual({ direction: -1, text: '−3' });
		expect(formatCountChange(0)).toBeNull();
		expect(formatCountChange(4, false)).toBeNull();
	});

	it('keeps the bare magnitude for the percentage', () => {
		expect(formatPct(-12.2)).toBe('12%');
	});
});
