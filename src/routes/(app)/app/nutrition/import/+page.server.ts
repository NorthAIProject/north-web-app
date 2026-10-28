import { parseUpload } from '#lib/features/planimport/server.js';
import type { Actions } from './$types';

// Go: internal/planimport/handler.go — GET /app/nutrition/import (the upload
// page) and POST /app/nutrition/import (read the file, show the review here).
export const actions: Actions = {
	default: (event) => parseUpload(event)
};
