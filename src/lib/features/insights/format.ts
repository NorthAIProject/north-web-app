// north-client web/insights/shell.templ formatters.

import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

/** "12%" — the magnitude only; the arrow carries the direction. */
export function formatPct(pct: number): string {
	return `${Math.abs(pct).toFixed(0)}%`;
}

export function formatKcal(v: number): string {
	return v <= 0 ? '—' : `${v.toFixed(0)} kcal`;
}

export function formatLitres(i18n: Translator, ml: number): string {
	if (ml <= 0) return '—';
	if (ml >= 1000) return `${i18n.decimal(ml / 1000, 1)} L`;
	return `${Math.trunc(ml)} ml`;
}

export function formatHours(minutes: number): string {
	if (minutes <= 0) return '—';
	const total = Math.trunc(minutes);
	const h = Math.trunc(total / 60);
	const m = total % 60;
	return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatScore(i18n: Translator, v: number): string {
	return v <= 0 ? '—' : `${i18n.decimal(v, 1)}/5`;
}

/**
 * "just now", "5 min ago"… then a short date. now is passed in so SSR and the
 * browser agree; timeZone is the reader's.
 */
export function relativeTime(i18n: Translator, t: Date, now: Date, timeZone?: string): string {
	const d = now.getTime() - t.getTime();
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;
	if (d < minute) return i18n.t('insights.ago.now');
	if (d < hour) return i18n.tf('insights.ago.minutes', Math.trunc(d / minute));
	if (d < day) return i18n.tf('insights.ago.hours', Math.trunc(d / hour));
	if (d < 7 * day) return i18n.tf('insights.ago.days', Math.trunc(d / day));
	return formatTime(i18n.locale, t, '2 Jan', timeZone);
}
