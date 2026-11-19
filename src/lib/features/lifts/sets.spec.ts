import { describe, expect, it } from 'vitest';
import type { Translator } from '#lib/i18n/index.js';
import { liftKey, nextLoad, wantsSuggestion, type LiftSet } from './sets.js';

const set = (exerciseName: string) => ({ exerciseName }) as LiftSet;

const i18n = {
	tf: (key: string, ...args: unknown[]) => `${key}(${args.join(',')})`,
	decimal: (v: number, places: number) => v.toFixed(places).replace('.', ',')
} as unknown as Translator;

describe('next-set suggestion', () => {
	it('asks for a lift the way the server keys a name', () => {
		expect(liftKey('  Bench Press ')).toBe('bench press');
	});

	it('is wanted only before the first set of that exercise today', () => {
		expect(wantsSuggestion([], 'Squat')).toBe(true);
		expect(wantsSuggestion([set('Bench Press')], 'Squat')).toBe(true);
		expect(wantsSuggestion([set('squat ')], 'Squat')).toBe(false);
	});

	it('is not wanted with no exercise named', () => {
		expect(wantsSuggestion([], '   ')).toBe(false);
	});

	it("words a load in the reader's decimals, and bodyweight without a weight", () => {
		expect(nextLoad(i18n, 62.5, 8)).toBe('62,5 kg × 8');
		expect(nextLoad(i18n, 60, 10)).toBe('60 kg × 10');
		expect(nextLoad(i18n, 0, 12)).toBe('lifts.list.bodyweight(12)');
	});
});
