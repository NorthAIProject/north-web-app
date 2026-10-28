import { serverApi } from '#lib/server/api.js';
import { boardFor } from '#lib/features/leaderboard/leaderboard.js';
import type { PageServerLoad } from './$types';

// Go: internal/xp/handler.go page (GET /app/friends/leaderboard?board=).
export const load: PageServerLoad = async (event) => {
	const board = boardFor(event.url.searchParams.get('board'));
	const api = serverApi(event);
	const [summary, lb] = await Promise.all([
		api.GET('/xp'),
		api.GET('/leaderboard', { params: { query: { metric: board.metric, period: board.period } } })
	]);
	return { board: board.key, summary: summary.data!, leaderboard: lb.data! };
};
