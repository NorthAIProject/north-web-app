import type { Translator } from '#lib/i18n/index.js';

/**
 * Go web/insights/spend.templ formatTokens: a six-figure token count kept
 * readable — the order of magnitude is the whole message.
 */
export function formatTokens(i18n: Translator, n: number): string {
	if (n >= 1_000_000) return `${i18n.decimal(n / 1_000_000, 1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
	return String(n);
}
