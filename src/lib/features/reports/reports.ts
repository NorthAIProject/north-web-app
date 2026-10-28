// Report view helpers (north-client web/reports/reports.templ).

import type { components } from '#lib/api/generated/schema.js';
import { formatTime } from '#lib/components/khepri/dates.js';
import type { Translator } from '#lib/i18n/index.js';

export type ReportSummary = components['schemas']['ReportSummary'];
export type ReportDetail = components['schemas']['ReportDetail'];

/** statusLabel: what the list and the detail header say under the title. */
export function statusLabel(i18n: Translator, r: ReportSummary, timeZone: string): string {
	switch (r.status) {
		case 'pending':
			return i18n.t('reports.label.pending');
		case 'failed':
			return i18n.t('reports.label.failed');
		default:
			if (r.generatedAt) {
				return i18n.tf('reports.label.readyon', formatTime(i18n.locale, r.generatedAt, '2 Jan', timeZone));
			}
			return i18n.t('reports.label.ready');
	}
}

/** The status word on a list row; a value this build does not know reads as ready. */
export function statusWord(i18n: Translator, status: string): string {
	const key = `reports.status.${status}`;
	return i18n.has(key) ? i18n.t(key) : status;
}

/** types.Helpful* — the answers the helpful form posts. */
export type HelpfulAnswer = 'helpful' | 'unhelpful' | 'clear';

/** types.ParseHelpful: null clears the rating; anything unknown is undefined. */
export function parseHelpful(answer: string): boolean | null | undefined {
	switch (answer) {
		case 'helpful':
			return true;
		case 'unhelpful':
			return false;
		case 'clear':
			return null;
		default:
			return undefined;
	}
}
