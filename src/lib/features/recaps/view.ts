// north-client web/recaps/view.go: the recap page and the My Day strip,
// built from the API's raw recap (GET /api/v1/recap).

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';
import { sparkline, stackedBar, type ChartSpec } from '#lib/features/viz/chartjs.js';

export type Recap = components['schemas']['Recap'];

export const recapKeys = ['week', 'month'] as const;
export type RecapKey = (typeof recapKeys)[number];

/** An unknown range is the week rather than an error (Go ValidKey). */
export function recapKey(raw: string | null | undefined): RecapKey {
	return raw === 'month' ? 'month' : 'week';
}

/** What the page says after a post to the friends feed. */
export type Notice = '' | 'posted' | 'hidden';

export function noticeOf(raw: string | null): Notice {
	return raw === 'posted' || raw === 'hidden' ? raw : '';
}

export type Tile = { label: string; value: number; delta: number; hasPrior: boolean };

export type RecapPageView = {
	key: RecapKey;
	options: { key: RecapKey; label: string; selected: boolean }[];
	/** "9 Oct – 15 Oct" */
	period: string;
	tiles: Tile[];
	chart: ChartSpec;
	hasActivity: boolean;
	highlights: Recap['highlights'];
	shareText: string;
	shareUrl: string;
};

// Dates are calendar days (YYYY-MM-DD): read and printed in UTC so no zone
// shifts them.
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Go BuildView. siteUrl is what a shared recap links back to. */
export function buildView(i18n: Translator, r: Recap, siteUrl: string): RecapPageView {
	const key = recapKey(r.range);
	const tile = (labelKey: string, now: number, before: number): Tile => ({
		label: i18n.t(labelKey),
		value: now,
		delta: now - before,
		hasPrior: true
	});
	return {
		key,
		options: recapKeys.map((k) => ({ key: k, label: i18n.t(`range.${k}`), selected: k === key })),
		period: `${formatTime(i18n.locale, day(r.since), '2 Jan', 'UTC')} – ${formatTime(i18n.locale, day(r.until), '2 Jan', 'UTC')}`,
		tiles: [
			tile('recap.tile.active', r.totals.activeDays, r.prior.activeDays),
			tile('recap.tile.workouts', r.totals.workouts, r.prior.workouts),
			tile('recap.tile.sets', r.totals.sets, r.prior.sets),
			tile('recap.tile.food', r.totals.foodLogs, r.prior.foodLogs),
			tile('recap.tile.checkins', r.totals.checkIns, r.prior.checkIns),
			{ label: i18n.t('recap.tile.streak'), value: r.checkInStreak, delta: 0, hasPrior: false }
		],
		chart: dailyChart(i18n, 'recap-daily', r),
		hasActivity: r.totals.activeDays > 0,
		highlights: r.highlights,
		shareText: shareText(i18n, r),
		shareUrl: siteUrl
	};
}

const one = (n: number) => (n > 0 ? 1 : 0);

/**
 * Go dailyChart: what each day had — training, food, a check-in — one unit
 * each, so the question is which days showed up, not how much each logged.
 */
function dailyChart(i18n: Translator, id: string, r: Recap): ChartSpec {
	const layout = r.range === 'month' ? '2' : 'Mon';
	return stackedBar(
		id,
		r.days.map((d) => formatTime(i18n.locale, day(d.date), layout, 'UTC')),
		[
			{ label: i18n.t('recap.chart.training'), values: r.days.map((d) => one(d.workouts + d.sets)) },
			{ label: i18n.t('recap.chart.food'), values: r.days.map((d) => one(d.foodLogs)) },
			{ label: i18n.t('recap.chart.checkins'), values: r.days.map((d) => one(d.checkIns)) }
		]
	);
}

/** Go ShareText: the window and the non-zero numbers, "label: value". */
export function shareText(i18n: Translator, r: Recap): string {
	const parts = [`${i18n.t('recap.tile.active')}: ${r.totals.activeDays}`];
	for (const [key, n] of [
		['recap.tile.workouts', r.totals.workouts],
		['recap.tile.sets', r.totals.sets],
		['recap.tile.food', r.totals.foodLogs],
		['recap.tile.checkins', r.totals.checkIns]
	] as const) {
		if (n > 0) parts.push(`${i18n.t(key)}: ${n}`);
	}
	return i18n.tf(`recap.share.text.${recapKey(r.range)}`, parts.join(' · '));
}

/** Go Strip: the compact "your week" line on My Day. */
export type Strip = { activeDays: number; workouts: number; checkIns: number; chart: ChartSpec };

export function buildStrip(r: Recap): Strip {
	// Go formats these with time.Format("Mon"): English, not the catalogue.
	const labels = r.days.map((d) => formatTime('en', day(d.date), 'Mon', 'UTC'));
	const values = r.days.map((d) => one(d.workouts + d.sets) + one(d.foodLogs) + one(d.checkIns));
	return {
		activeDays: r.totals.activeDays,
		workouts: r.totals.workouts,
		checkIns: r.totals.checkIns,
		chart: { ...sparkline('recap-strip', labels, values), class: 'h-8 w-24' }
	};
}
