import { expect, test, type APIRequestContext } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Go: internal/recaps/handler.go — GET /app/recap (+ /panels via the range
// links) and POST /app/recap/share (here the page's ?/share action).

test.describe.configure({ timeout: 90_000 });

/** The unlock celebration would cover the page; these tests are not about it. */
async function markAwardsSeen(request: APIRequestContext, user: TestUser) {
	const unseen = await api(request, user, 'GET', '/awards/unseen');
	for (const a of unseen.awards ?? []) await api(request, user, 'POST', `/awards/${a.id}/seen`);
}

async function seedActivity(request: APIRequestContext, user: TestUser) {
	await api(request, user, 'PUT', '/check-ins/today', { mood: 4, energy: 4 });
	await api(request, user, 'PUT', '/calculator/biometrics', { weightKg: 74, heightCm: 178, dateOfBirth: '1990-05-01', sex: 'male' });
	await api(request, user, 'POST', '/activity/log', { activityCode: 'running_9_8kmh', durationMinutes: 30 });
	await markAwardsSeen(request, user);
}

test('an empty week says nothing was logged', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/recap');
	await expect(page.getByRole('heading', { level: 1, name: 'Your recap' })).toBeVisible();
	await expect(page.getByText('Nothing logged in this period yet.')).toBeVisible();
	await expect(page.getByRole('region', { name: 'Totals' })).toContainText('Active days');
	await page.screenshot({ path: 'test-results/recap-empty.png', fullPage: true });
});

test('a logged week shows totals, the daily chart and switches to 30 days', async ({ page, request }) => {
	const user = await createUser(request);
	await seedActivity(request, user);
	await signIn(page, user, '/app/recap');

	const totals = page.getByRole('region', { name: 'Totals' });
	await expect(totals).toContainText('Workouts');
	await expect(totals.locator('p.text-2xl').first()).toHaveText('1');
	await expect(page.locator('[data-testid="recap-panels"] [data-slot="chart"] svg').first()).toBeVisible();
	await expect(page.getByText('Private to you')).toBeVisible();
	await page.screenshot({ path: 'test-results/recap-week.png', fullPage: true });

	const period = page.getByRole('navigation', { name: 'Time period' });
	await period.getByRole('link', { name: 'Last 30 days' }).click();
	await expect(page).toHaveURL(/range=month/);
	await expect(period.locator('[aria-current="true"]')).toHaveText('Last 30 days');
});

test('posting to friends without shared training offers the fix, which posts visibly', async ({ page, request }) => {
	const user = await createUser(request);
	await seedActivity(request, user);
	await api(request, user, 'PUT', '/settings/sharing', { shareTraining: false }).catch(() => {});
	await signIn(page, user, '/app/recap');

	await page.getByRole('button', { name: 'Post to friends' }).click();
	await expect(page).toHaveURL(/posted=(hidden|posted)/);
	if (/posted=hidden/.test(page.url())) {
		await expect(page.getByText("Posted, but friends can't see it yet.")).toBeVisible();
		await page.getByRole('button', { name: 'Share training and post' }).click();
		await expect(page).toHaveURL(/posted=posted/);
	}
	await expect(page.getByText('Posted to your friends feed.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'See the feed' })).toHaveAttribute('href', '/app/friends');
});

test('share copies the recap line where the share sheet is missing', async ({ page, request, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	const user = await createUser(request);
	await seedActivity(request, user);
	await signIn(page, user, '/app/recap');
	await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
	await page.getByRole('button', { name: 'Share' }).click();
	await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toMatch(/^My last 7 days on Khepri — Active days: 1 · Workouts: 1 · Check-ins: 1 http/);
});
