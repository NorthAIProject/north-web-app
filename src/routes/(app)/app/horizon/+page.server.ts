import { error } from '@sveltejs/kit';
import { scenarioFrom } from '#lib/features/horizon/view.js';
import { serverApi } from '#lib/server/api.js';
import type { PageServerLoad } from './$types';

// The forecast for the what-if the address asks for. A what-if is a query on
// this page, so it loads on the server like any other page and can be shared
// or undone with the back button.
export const load: PageServerLoad = async (event) => {
	const scenario = scenarioFrom(event.url.searchParams);
	const { data } = await serverApi(event).GET('/horizon', {
		params: {
			query: {
				skipWeeks: scenario.skipWeeks,
				extraSessions: scenario.extraSessions,
				deloadNow: scenario.deloadNow
			}
		}
	});
	if (!data) error(502, 'The forecast could not be loaded.');
	return { horizon: data };
};
