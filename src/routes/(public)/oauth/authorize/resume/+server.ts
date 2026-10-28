import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /oauth/authorize/resume?request_id=… (Go: BrowserHandler.resume): the
// return trip from Google, a passkey or "not you?". Every OAuth parameter
// stayed parked on the server; the screen re-renders from the id alone.
export const GET: RequestHandler = ({ url, setHeaders }) => {
	setHeaders({ 'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'" });
	const id = url.searchParams.get('request_id') ?? '';
	redirect(303, `/oauth/authorize?request_id=${encodeURIComponent(id)}`);
};
