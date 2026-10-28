import { serverApi } from '#lib/server/api.js';
import { filtersFrom, lastPage, PAGE_SIZE, pageParam } from '#lib/features/exercises/vocabulary.js';
import type { PageServerLoad } from './$types';

// Go: internal/exercises/handler.go browse (GET /app/exercises).
export const load: PageServerLoad = async (event) => {
	const filters = filtersFrom(event.url);
	const api = serverApi(event);
	const search = (page: number) =>
		api.GET('/exercises', {
			params: {
				query: {
					q: filters.q || undefined,
					muscle: filters.muscle || undefined,
					category: filters.category || undefined,
					equipment: filters.equipment ? [filters.equipment] : undefined,
					limit: PAGE_SIZE,
					offset: (page - 1) * PAGE_SIZE
				}
			}
		});

	let page = pageParam(event.url);
	let { data } = await search(page);
	// A page past the end re-runs at the last real page rather than rendering
	// an empty list that looks like a filter that matched nothing.
	const last = lastPage(data!.total);
	if (page > last) {
		page = last;
		({ data } = await search(page));
	}
	return {
		filters,
		found: data!.exercises,
		page: { number: page, last: lastPage(data!.total), total: data!.total, firstRow: (page - 1) * PAGE_SIZE + 1 }
	};
};
