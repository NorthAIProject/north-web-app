import { browserApi } from '#lib/api/client.js';
import type { KnowledgeHit } from './types.js';

// Browser-side reads for what htmx swapped in place on the Go pages. Everything
// goes through the same-origin /api proxy.

/** Inline library search, the index page's results panel (Go: searchLimit). */
export const inlineSearchLimit = 6;

/** The dedicated search page's page size (Go: searchPageDefault). */
export const searchPageLimit = 20;

export type SearchPage = { hits: KnowledgeHit[]; hasMore: boolean };

export async function searchKnowledge(
	q: string,
	opts: { limit: number; offset?: number; signal?: AbortSignal }
): Promise<SearchPage> {
	const { data } = await browserApi().GET('/knowledge/search', {
		params: { query: { q, limit: opts.limit, offset: opts.offset ?? 0 } },
		signal: opts.signal
	});
	return { hits: data?.hits ?? [], hasMore: data?.hasMore ?? false };
}

/** The passages one coach reply cited (Go: GET /app/knowledge/passages?ref=…). */
export async function knowledgePassages(refs: string[], signal?: AbortSignal): Promise<KnowledgeHit[]> {
	const { data } = await browserApi().GET('/knowledge/passages', {
		params: { query: { ref: refs } },
		signal
	});
	return data?.hits ?? [];
}
