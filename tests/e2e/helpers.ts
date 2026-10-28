import type { APIRequestContext, Page } from '@playwright/test';

export const apiUrl = process.env.NORTH_API_URL ?? 'http://localhost:8090/api/v1';
// The app under test, as playwright.config.ts's baseURL sees it (vite dev or wrangler dev).
export const webUrl = process.env.WEB_URL ?? 'http://localhost:5173';
export const webHost = new URL(webUrl).host.replace(/[.]/g, '\\.');
export const password = 'correct horse battery staple';

export type TestUser = { email: string; token: string; id: string };

/** A fresh account through the API, onboarded unless told otherwise. */
export async function createUser(
	request: APIRequestContext,
	opts: { onboarded?: boolean; locale?: string; name?: string } = {}
): Promise<TestUser> {
	const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@khepri.local`;
	const signup = await request.post(`${apiUrl}/auth/signup`, {
		headers: opts.locale ? { 'accept-language': opts.locale } : {},
		data: {
			email,
			password,
			passwordConfirmation: password,
			displayName: opts.name ?? 'E2E Tester',
			timezone: 'Europe/Lisbon'
		}
	});
	if (!signup.ok()) throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);
	const body = await signup.json();
	const user = { email, token: body.token as string, id: body.user.id as string };
	if (opts.onboarded ?? true) {
		const done = await request.post(`${apiUrl}/onboarding`, {
			headers: { authorization: `Bearer ${user.token}` },
			data: { focusAreas: ['fitness'], coachingStyle: 'direct', nearTermGoal: 'Run 5k' }
		});
		if (!done.ok()) throw new Error(`onboarding failed: ${done.status()} ${await done.text()}`);
	}
	return user;
}

/** Calls the API as user, for arranging state a test needs. */
export async function api(request: APIRequestContext, user: TestUser, method: string, path: string, data?: unknown) {
	const res = await request.fetch(`${apiUrl}${path}`, {
		method,
		headers: { authorization: `Bearer ${user.token}` },
		data
	});
	if (!res.ok()) throw new Error(`${method} ${path} → ${res.status()} ${await res.text()}`);
	return res.status() === 204 ? undefined : res.json();
}

/** Signs in through the real login form. */
export async function signIn(page: Page, user: TestUser, next = '/app') {
	await page.goto(`/login?next=${encodeURIComponent(next)}`);
	await page.getByLabel('Email').fill(user.email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL((url) => !url.pathname.startsWith('/login'));
	// Hydrated: handlers are attached once the client router has taken over.
	await page.waitForLoadState('networkidle');
}
