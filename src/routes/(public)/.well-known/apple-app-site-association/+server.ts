import { error, json } from '@sveltejs/kit';
import { APPLE_BUNDLE_ID, APPLE_TEAM_ID } from '$app/env/private';
import { appSiteAssociation } from '#lib/features/pwa/aasa.js';
import type { RequestHandler } from './$types';

// Apple's CDN fetches and caches this; it must be JSON at this exact path,
// with no redirect.
export const GET: RequestHandler = () => {
	const body = appSiteAssociation(APPLE_TEAM_ID, APPLE_BUNDLE_ID);
	if (!body) error(404, 'Not found');
	return json(body);
};
