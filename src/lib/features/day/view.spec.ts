import { describe, expect, it } from 'vitest';
import { bmiClass, sorenessClass } from './view';

// Tracker fills are tuned for rings (3:1); words take the *-text steps
// (4.5:1 in light mode, scripts/brand/contrast.mjs). A bare text-day-<x>
// class on a word is the light-mode contrast failure this guards against.
const fillAsText = /\btext-day-[a-z]+\b(?!-text)/;

describe('tracker text classes', () => {
	it('bmiClass uses a text step for every category', () => {
		for (const c of ['healthy', 'overweight', 'obese', 'underweight', '']) {
			const cls = bmiClass(c);
			expect(cls).toMatch(/\btext-day-[a-z]+-text\b/);
			expect(cls).not.toMatch(fillAsText);
		}
		expect(bmiClass('healthy')).toBe('text-day-food-text');
		expect(bmiClass('obese')).toBe('text-day-move-text');
	});

	it('sorenessClass keeps the move tint behind the move text step', () => {
		expect(sorenessClass(3)).toBe('bg-day-move/20 text-day-move-text');
		expect(sorenessClass(2)).toBe('bg-day-move/12 text-day-move-text');
		expect(sorenessClass(1)).toBe('bg-muted text-muted-foreground');
		for (const s of [1, 2, 3]) expect(sorenessClass(s)).not.toMatch(fillAsText);
	});
});
