import { searchPageLimit } from '#lib/features/knowledge/api.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// Go: internal/documents/handler.go search (the dedicated page). The inline
// box on /app/knowledge and "Show more" fetch from the browser instead.

export const load: PageServerLoad = async (event) => {
	const params = event.url.searchParams;
	const query = (params.get('q') ?? '').trim();
	const int = (v: string | null, min: number) => {
		const n = Number(v ?? '');
		return v && Number.isInteger(n) && n >= min ? n : undefined;
	};
	const limit = int(params.get('limit'), 1) ?? searchPageLimit;
	const offset = int(params.get('offset'), 0) ?? 0;
	// A no-JS "Show more" lands here with append=1: the next rows, without the count.
	const append = params.get('append') === '1';

	if (query === '') return { query, limit, offset, append, hits: [], hasMore: false };

	const { data } = await serverApi(event).GET('/knowledge/search', {
		params: { query: { q: query, limit, offset } }
	});
	return { query, limit, offset, append, hits: data?.hits ?? [], hasMore: data?.hasMore ?? false };
};
