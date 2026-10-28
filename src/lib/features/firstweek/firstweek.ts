// The first week's day card (north-client internal/firstweek handler.go
// render + web/firstweek card.templ): what it shows on a given day.

import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';
import type { MomentData } from '#lib/components/khepri/types.js';

export type FirstWeek = components['schemas']['FirstWeek'];

/** The length of the programme (firstweek.Days). */
export const DAYS = 7;
export const REVIEW_PATH = '/app/first-week/review';

export type Card = {
	show: boolean;
	day: number;
	days: boolean[];
	action: string;
	done: boolean;
	moment: MomentData | null;
	reviewReady: boolean;
	over: boolean;
};

/** A running week from day 0 until the review is opened; nothing otherwise. */
export function cardOf(i18n: Translator, w: FirstWeek | null): Card {
	const show = Boolean(w && w.status === 'active' && w.day >= 0);
	if (!w || !show) return { show: false, day: 0, days: [], action: '', done: false, moment: null, reviewReady: false, over: false };
	const days = w.days.map((d) => d.done);
	// "3 of 3 days": counted where it is earned, shown for the rest of day 3.
	const three = w.day === 3 && days.length >= 3 && days[0] && days[1] && days[2];
	return {
		show,
		day: w.day,
		days,
		action: w.template && i18n.has(`firstweek.${w.template}.action`) ? i18n.t(`firstweek.${w.template}.action`) : (w.action ?? ''),
		done: w.done,
		moment: three
			? { kind: 'first_week_three', title: i18n.t('moments.firstweek.three.title'), body: i18n.t('moments.firstweek.three.body') }
			: null,
		reviewReady: w.day >= DAYS,
		over: w.day > DAYS
	};
}

export function dotClass(day: number, today: number, done: boolean): string {
	if (done) return 'bg-signal size-2 rounded-full';
	if (day === today) return 'border-signal size-2 rounded-full border';
	return 'bg-muted size-2 rounded-full';
}
