import { describe, expect, it } from 'vitest';
import type { Translator } from '#lib/i18n/index.js';
import { cardOf, dotClass, type FirstWeek } from './firstweek';

// The card decisions north-client's firstweek handler tests cover, carried over.
const keys: Record<string, string> = { 'firstweek.sleep.action': 'Lights out by 23:00.' };
const i18n = { t: (k: string) => keys[k] ?? k, has: (k: string) => k in keys } as unknown as Translator;

const week = (over: Partial<FirstWeek>): FirstWeek => ({
	status: 'active',
	template: 'sleep',
	day: 1,
	totalDays: 7,
	done: false,
	doneCount: 0,
	days: [],
	...over
});
const days = (...done: boolean[]) => done.map((d, i) => ({ day: i + 1, date: '2026-10-01', done: d })) as FirstWeek['days'];

describe('first week card', () => {
	it('shows nothing without a running week', () => {
		expect(cardOf(i18n, null).show).toBe(false);
		expect(cardOf(i18n, week({ status: 'none', day: 0 })).show).toBe(false);
		expect(cardOf(i18n, week({ status: 'finished', day: 8 })).show).toBe(false);
	});

	it("words the day's action in the person's language, else the API's", () => {
		expect(cardOf(i18n, week({})).action).toBe('Lights out by 23:00.');
		expect(cardOf(i18n, week({ template: 'custom', action: 'Walk 20 minutes.' })).action).toBe('Walk 20 minutes.');
	});

	it('marks three of three only on day 3 with all three done', () => {
		expect(cardOf(i18n, week({ day: 3, days: days(true, true, true) })).moment?.kind).toBe('first_week_three');
		expect(cardOf(i18n, week({ day: 3, days: days(true, false, true) })).moment).toBeNull();
		expect(cardOf(i18n, week({ day: 4, days: days(true, true, true, false) })).moment).toBeNull();
	});

	it('offers the review from day 7 and calls the week over after it', () => {
		expect(cardOf(i18n, week({ day: 6 })).reviewReady).toBe(false);
		expect(cardOf(i18n, week({ day: 7 })).reviewReady).toBe(true);
		expect(cardOf(i18n, week({ day: 7 })).over).toBe(false);
		expect(cardOf(i18n, week({ day: 8 })).over).toBe(true);
	});

	it('draws done, today and the rest as different dots', () => {
		expect(dotClass(1, 2, true)).toContain('bg-signal');
		expect(dotClass(2, 2, false)).toContain('border-signal');
		expect(dotClass(3, 2, false)).toContain('bg-muted');
	});
});
