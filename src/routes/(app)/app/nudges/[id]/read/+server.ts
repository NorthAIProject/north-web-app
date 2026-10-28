import { openAndRedirect } from '#lib/features/nudges/server.js';
import type { RequestHandler } from './$types';

// A bell row's form (Go POST /app/nudges/{id}/read): marks it read from the
// bell and follows it.
export const POST: RequestHandler = (event) => openAndRedirect(event, 'bell');
