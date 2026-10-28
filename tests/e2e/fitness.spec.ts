import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// Go: web/fitness/{fitness,activities}.templ + internal/fitness/handler.go.
// Strava has no credentials locally, so the Strava card and the activities page
// are in their unconfigured state; the callback and the POST routes still run.

test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

test('hub renders the empty week, Strava unconfigured and the explore list', async ({
	page,
	request
}) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/fitness');
	await expect(page).toHaveTitle(/Fitness/);
	await expect(page.getByRole('heading', { name: 'Fitness', level: 1 })).toBeVisible();
	await expect(page.getByText('This week')).toBeVisible();
	await expect(page.getByText('Track a session or connect Strava to fill this in')).toBeVisible();
	await expect(page.getByText('No sessions yet')).toBeVisible();
	await expect(page.getByText('Not configured on this server.')).toBeVisible();
	await expect(page.getByText('No training plan yet.')).toBeVisible();
	await expect(page.getByRole('link', { name: /Activity timer/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Track activity/ })).toHaveAttribute(
		'href',
		'/app/activity'
	);
});

test('hub shows a logged session in the week and the recent list', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'PUT', '/calculator/biometrics', {
		weightKg: 70,
		heightCm: 175,
		dateOfBirth: '1992-02-02',
		sex: 'female'
	});
	await api(request, user, 'POST', '/activity/log', {
		activityCode: 'walking_brisk',
		durationMinutes: 45,
		distanceKm: 4.5
	});
	await signIn(page, user, '/app/fitness');
	await expect(page.getByText('Tracked sessions')).toBeVisible();
	await expect(page.getByText('1 session', { exact: true })).toBeVisible();
	await expect(page.getByText('Walking', { exact: true })).toBeVisible();
	await expect(page.getByText(/45m · 4\.5 km · 10:00\/km · \d+ kcal/)).toBeVisible();
	await expect(page.getByRole('link', { name: 'See all' })).toHaveAttribute(
		'href',
		'/app/activity'
	);
});

test('activities page says Strava is not configured', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/fitness/activities');
	await expect(page.getByRole('heading', { name: 'Your training' })).toBeVisible();
	await expect(page.getByText('Strava is not configured')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Back to Fitness' })).toHaveAttribute(
		'href',
		'/app/fitness'
	);
});

test('the sessions fragment URL lands on the whole page', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/fitness/activities/sessions?page=2');
	await expect(page).toHaveURL(/\/app\/fitness\/activities\?page=2$/);
});

test('Strava connect is not found when unconfigured', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/fitness');
	const res = await page.request.get('/app/fitness/strava/connect', { maxRedirects: 0 });
	expect(res.status()).toBe(404);
});

test('Strava callback reports a cancelled and an expired connection', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/fitness');

	await page.goto('/app/fitness/strava/callback?error=access_denied');
	await expect(page).toHaveURL(/\/app\/fitness\?notice=cancelled$/);
	await expect(page.getByRole('status')).toHaveText('Strava connection was cancelled.');

	await page.goto('/app/fitness/strava/callback?state=never-issued&code=abc');
	await expect(page).toHaveURL(/\/app\/fitness\?notice=expired$/);
	await expect(page.getByRole('status')).toHaveText(
		'That Strava connection expired. Please try again.'
	);
});

test('Strava sync and disconnect post back to the hub with a notice', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/fitness');

	const sync = await page.request.post('/app/fitness/strava/sync', {
		headers: { origin: 'http://localhost:5173' },
		maxRedirects: 0
	});
	expect(sync.status()).toBe(303);
	expect(sync.headers()['location']).toMatch(/^\/app\/fitness\?notice=(sync-first|sync-failed)$/);

	const off = await page.request.post('/app/fitness/strava/disconnect', {
		headers: { origin: 'http://localhost:5173' },
		maxRedirects: 0
	});
	expect(off.status()).toBe(303);
	await page.goto(off.headers()['location']);
	await expect(page.getByRole('status')).toHaveText(
		'Strava disconnected. Activities already imported have been kept.'
	);
});

test('web connect refuses a callback that is not the callback page', async ({ request }) => {
	const user = await createUser(request);
	const res = await request.post('http://localhost:8090/api/v1/fitness/strava/connect/web', {
		headers: { authorization: `Bearer ${user.token}` },
		data: { callbackUrl: 'https://evil.example/elsewhere' }
	});
	expect(res.status()).toBe(422);
});
