import { expect, test, type Page } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Go: web/activity/activity.templ + internal/activity/handler.go.

async function withBiometrics(request: Parameters<typeof api>[0], user: TestUser) {
	await api(request, user, 'PUT', '/calculator/biometrics', {
		weightKg: 75,
		heightCm: 180,
		dateOfBirth: '1990-05-01',
		sex: 'male'
	});
}

// A first finished session unlocks an award, whose dialog (a shell widget)
// covers the page; dismiss it whenever it shows up.
test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

async function choose(page: Page, triggerId: string, option: string) {
	await page.locator(`#${triggerId}`).click();
	await page.getByRole('option', { name: option, exact: true }).click();
}

test('activity page renders its forms', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/activity');
	await expect(page).toHaveTitle(/Activity/);
	await expect(page.getByRole('heading', { name: 'Activity', level: 1 })).toBeVisible();
	await expect(page.getByText('Start a session')).toBeVisible();
	await expect(page.getByText('Log a finished session')).toBeVisible();
	await expect(page.getByLabel('Minutes')).toBeVisible();
});

test('starting without biometrics shows why it was refused', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/activity');
	await choose(page, 'activity_code', 'Running (9.8 km/h)');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.getByRole('alert')).toContainText('biometrics');
});

test('timer: start, pause, resume, stop, then start and cancel', async ({ page, request }) => {
	const user = await createUser(request);
	await withBiometrics(request, user);
	await signIn(page, user, '/app/activity');

	await choose(page, 'activity_code', 'Running (9.8 km/h)');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.getByText('In progress')).toBeVisible();

	await page.getByRole('button', { name: 'Pause' }).click();
	await expect(page.getByText('Paused', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Resume' }).click();
	await expect(page.getByText('In progress')).toBeVisible();

	await page.getByRole('button', { name: 'Stop' }).click();
	await expect(page.getByText('Start a session')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Recent' })).toBeVisible();
	await expect(page.getByText(/kcal/).first()).toBeVisible();

	await choose(page, 'activity_code', 'Hiking');
	await page.getByRole('button', { name: 'Start', exact: true }).click();
	await expect(page.getByText('In progress')).toBeVisible();
	await page.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByText('Start a session')).toBeVisible();
	const overview = await api(request, user, 'GET', '/activity');
	expect(overview.active).toBeUndefined();
});

test('log a finished session with distance and a start time', async ({ page, request }) => {
	const user = await createUser(request);
	await withBiometrics(request, user);
	await signIn(page, user, '/app/activity');

	await choose(page, 'log_activity_code', 'Running (9.8 km/h)');
	await page.getByLabel('Minutes').fill('30');
	await page.getByLabel('Distance (km, optional)').fill('5');
	// 08:00 on the Lisbon wall clock (the test user's zone).
	await page.getByLabel('Started (optional)').fill('2026-10-01T08:00');
	await page.getByRole('button', { name: 'Log session' }).click();

	const row = page.getByText(/1 Oct · 30 min · 5\.0 km · 6:00 \/km · ~\d+ kcal/);
	await expect(row).toBeVisible();
	const overview = await api(request, user, 'GET', '/activity');
	const logged = overview.recent.find((s: { startedAt: string }) =>
		s.startedAt.startsWith('2026-10-01')
	);
	// Lisbon is UTC+1 in October.
	expect(new Date(logged.startedAt).toISOString()).toBe('2026-10-01T07:00:00.000Z');
});

test('logging an unknown activity shows the error', async ({ page, request }) => {
	const user = await createUser(request);
	await withBiometrics(request, user);
	await signIn(page, user, '/app/activity');
	await page.getByLabel('Minutes').fill('20');
	await page.getByRole('button', { name: 'Log session' }).click();
	await expect(page.getByRole('alert')).toContainText('unknown activity');
});
