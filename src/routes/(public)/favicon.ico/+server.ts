import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Browsers ask for /favicon.ico whatever the page declares. The mark is an
// SVG, so the old path just points at it (north-client cmd/web mountAssets).
export const GET: RequestHandler = () => {
	redirect(301, '/assets/brand/favicon.svg');
};
