// View helpers for the awards page and the profile's awards shelf (north-client
// web/awards/awards.templ, monthly.templ, unlock.templ helpers).

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';

export type AwardView = components['schemas']['AwardView'];
export type MonthlyChallengeView = components['schemas']['MonthlyChallengeView'];

/** How many coins the profile shows before the link to all (Go: profiles.stripCount). */
export const STRIP_COUNT = 8;

/** "3/10" toward a locked badge's target (Go: progressText). */
export function progressText(a: AwardView): string {
	return `${a.progress ?? 0}/${a.target}`;
}

/**
 * The short, upper-case month a monthly coin carries, "OCT" for "2026-10" in
 * the reader's language (Go: award.MonthlyCoinMonth). Empty for a bad key.
 */
export function coinMonth(locale: string, key: string): string {
	if (!/^\d{4}-\d{2}$/.test(key)) return '';
	return formatTime(locale, `${key}-01T00:00:00Z`, 'Jan', 'UTC').toUpperCase();
}

/**
 * The newest n awards, newest first (Go: profiles.newestAwards). The API sends
 * badges and monthly medals merged, oldest first.
 */
export function newestAwards(all: AwardView[] | undefined, n: number = STRIP_COUNT): AwardView[] {
	const out: AwardView[] = [];
	const list = all ?? [];
	for (let i = list.length - 1; i >= 0 && out.length < n; i--) out.push(list[i]);
	return out;
}
