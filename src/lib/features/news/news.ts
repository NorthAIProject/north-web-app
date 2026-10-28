// The news ticker's query and its coarse clock (Go web/news timeAgo).

import { browserApi } from '#lib/api/client.js';
import type { components } from '#lib/api/generated/schema.js';
import type { Translator } from '#lib/i18n/index.js';

export type NewsTicker = components['schemas']['NewsTicker'];

/** Go: hx-trigger="load, every 300s". */
export const TICKER_POLL_MS = 300_000;
/** The web strip shows twelve (Go Ticker(…, 12)); the API sends up to twenty. */
export const TICKER_ITEMS = 12;

export function tickerQuery() {
	return {
		queryKey: ['news', 'ticker'] as const,
		queryFn: async ({ signal }: { signal: AbortSignal }): Promise<NewsTicker> => {
			const { data } = await browserApi().GET('/news', { signal });
			const t = data ?? { enabled: false, items: [] };
			return { ...t, items: t.items.slice(0, TICKER_ITEMS) };
		},
		refetchInterval: TICKER_POLL_MS,
		staleTime: 60_000,
		retry: 1
	};
}

/** A ticker says "2h", not a timestamp. */
export function timeAgo(i18n: Translator, at: string, now: Date): string {
	const d = now.getTime() - new Date(at).getTime();
	const minute = 60_000;
	const hour = 60 * minute;
	if (d < minute) return i18n.t('news.ticker.now');
	if (d < hour) return `${Math.floor(d / minute)}m`;
	if (d < 24 * hour) return `${Math.floor(d / hour)}h`;
	return `${Math.floor(d / (24 * hour))}d`;
}
