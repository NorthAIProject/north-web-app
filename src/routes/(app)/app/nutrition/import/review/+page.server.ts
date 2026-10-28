import { review } from '#lib/features/planimport/server.js';
import type { Actions } from './$types';

// Go: POST /app/nutrition/import/review. Every button on the review page posts
// the whole draft here. Go has no GET for it (405); a visit here shows the
// upload page instead, since the review lives only in the posted draft.
export const actions: Actions = {
	default: (event) => review(event)
};
