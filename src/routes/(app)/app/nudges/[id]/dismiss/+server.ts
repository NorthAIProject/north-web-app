import { dismissAndRedirect } from '#lib/features/nudges/server.js';
import type { RequestHandler } from './$types';

// The bell's dismiss without JavaScript (Go POST /app/nudges/{id}/dismiss);
// with JavaScript the bell dismisses through the API and refreshes in place.
export const POST: RequestHandler = (event) => dismissAndRedirect(event);
