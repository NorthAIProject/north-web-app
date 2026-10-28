import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Go: internal/insights/handler.go — the sleep, cardio, patterns, coach,
// spend and metric pages (statsPage, coach, spend, metric). Each test arranges
// its own data through /api/v1. A fresh account already has today's
// onboarding exchange with the coach (and its naming generation), so the
// empty states are read on ?range=yesterday, which is honestly empty.

test.describe.configure({ timeout: 90_000 });

/** n days ago at hh:mm UTC (the test user lives in Europe/Lisbon). */
const at = (n: number, hour: number, minute = 0) => {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - n);
	d.setUTCHours(hour, minute, 0, 0);
	return d.toISOString();
};

/** The unlock celebration would cover the page; these tests are not about it. */
async function markAwardsSeen(request: APIRequestContext, user: TestUser) {
	const unseen = await api(request, user, 'GET', '/awards/unseen');
	for (const a of unseen.awards ?? []) await api(request, user, 'POST', `/awards/${a.id}/seen`);
}

/**
 * Two weeks of watch data: staged nights, resting heart rate (higher the
 * morning after a run, for the patterns page), runs every other day, and a
 * logged run today.
 */
async function seedFortnight(request: APIRequestContext, user: TestUser) {
	const readings: Record<string, unknown>[] = [];
	const workouts: Record<string, unknown>[] = [];
	for (let n = 1; n <= 14; n++) {
		// The night ending on day n: core, deep, REM.
		readings.push(
			{ metric: 'sleep_core', value: 180, unit: 'min', startedAt: at(n + 1, 23), endedAt: at(n, 2) },
			{ metric: 'sleep_deep', value: 75 + (n % 3) * 10, unit: 'min', startedAt: at(n, 2), endedAt: at(n, 3, 15 + (n % 3) * 10) },
			{ metric: 'sleep_rem', value: 150, unit: 'min', startedAt: at(n, 3, 30), endedAt: at(n, 6) }
		);
		const ranYesterday = (n + 1) % 2 === 0;
		readings.push({ metric: 'resting_heart_rate', value: ranYesterday ? 59 : 52, unit: 'bpm', startedAt: at(n, 8) });
		readings.push({ metric: 'hrv_sdnn', value: ranYesterday ? 38 : 55, unit: 'ms', startedAt: at(n, 8) });
		if (n % 2 === 0) {
			workouts.push({
				activityCode: 'running_9_8kmh',
				externalId: `e2e-b-run-${n}-${Math.random().toString(36).slice(2, 8)}`,
				startedAt: at(n, 17),
				endedAt: at(n, 17, 45),
				calories: 450,
				distanceM: 7000 + n * 100
			});
		}
	}
	await api(request, user, 'POST', '/health/samples', { readings, workouts });
	await api(request, user, 'PUT', '/calculator/biometrics', { weightKg: 74, heightCm: 178, dateOfBirth: '1990-05-01', sex: 'male' });
	await api(request, user, 'POST', '/activity/log', { activityCode: 'running_9_8kmh', durationMinutes: 32, distanceKm: 5.2 });
	await markAwardsSeen(request, user);
}

/** One more exchange with the (fake) coach, its reply rated helpful. */
async function seedCoach(request: APIRequestContext, user: TestUser) {
	const list = await api(request, user, 'GET', '/conversations');
	const id = list.conversations[0].id as string;
	await request.post(`${process.env.NORTH_API_URL ?? 'http://localhost:8090/api/v1'}/conversations/${id}/reply`, {
		headers: { authorization: `Bearer ${user.token}` },
		data: { text: 'How did my week go?' }
	});
	const convo = await api(request, user, 'GET', `/conversations/${id}`);
	const reply = (convo.messages as { id: string; role: string }[]).findLast((m) => m.role !== 'user');
	if (reply) await api(request, user, 'PUT', `/conversations/${id}/messages/${reply.id}/helpful`, { helpful: true });
	await markAwardsSeen(request, user);
}

async function screenshot(page: Page, name: string) {
	await page.screenshot({ path: `test-results/insights-${name}.png`, fullPage: true });
}

const period = (page: Page) => page.getByRole('navigation', { name: 'Time period' });

test.describe('insights stats pages', () => {
	test('sleep: tiles, nights chart, schedule, stages, extremes; empty window', async ({ page, request }) => {
		const user = await createUser(request);
		await seedFortnight(request, user);
		await signIn(page, user, '/app/insights/sleep?range=week');

		await expect(page.getByRole('heading', { level: 1, name: 'Sleep' })).toBeVisible();
		const panel = page.getByTestId('insights-sleep');
		await expect(panel).toBeVisible();
		await expect(panel.getByText('Stages')).toBeVisible();
		await expect(panel.locator('[data-slot="chart"] svg').first()).toBeVisible();
		await expect(period(page).locator('[aria-current="true"]')).toHaveAttribute('href', /range=week/);
		await screenshot(page, 'sleep');

		// The range switch refreshes the panels in place.
		await period(page).locator('a[href$="range=yesterday"]').click();
		await expect(page).toHaveURL(/range=yesterday/);
		await expect(page.getByTestId('insights-sleep')).toBeVisible();
		await period(page).locator('a[href$="range=today"]').click();
		await expect(page).toHaveURL(/range=today/);
		await expect(page.getByText(/sleep/i).first()).toBeVisible();
	});

	test('sleep, cardio and spend say so when the window is empty', async ({ page, request }) => {
		const user = await createUser(request);
		await signIn(page, user, '/app/insights/sleep?range=yesterday');
		await expect(page.getByTestId('insights-sleep')).toHaveCount(0);
		await expect(page.locator('#insights-panels [data-slot="card"]')).toBeVisible();
		await screenshot(page, 'sleep-empty');

		await page.goto('/app/insights/cardio?range=yesterday');
		await expect(page.getByTestId('insights-cardio')).toHaveCount(0);
		await expect(page.locator('#insights-panels [data-slot="card"]')).toBeVisible();

		await page.goto('/app/insights/spend?range=yesterday');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByTestId('insights-spend')).toHaveCount(0);
	});

	test('cardio: tiles, weekly chart, kinds, running, heart, recent', async ({ page, request }) => {
		const user = await createUser(request);
		await seedFortnight(request, user);
		await signIn(page, user, '/app/insights/cardio?range=month');

		await expect(page.getByRole('heading', { level: 1, name: 'Cardio' })).toBeVisible();
		const panel = page.getByTestId('insights-cardio');
		await expect(panel).toBeVisible();
		await expect(panel.locator('[data-slot="chart"] svg').first()).toBeVisible();
		await expect(panel.getByText(/bpm/).first()).toBeVisible();
		await expect(panel.getByText(/km/).first()).toBeVisible();
		await screenshot(page, 'cardio');
	});

	test('patterns: intro with the window, findings or the empty card', async ({ page, request }) => {
		const empty = await createUser(request);
		await signIn(page, empty, '/app/insights/patterns');
		await expect(page.getByTestId('insights-patterns')).toBeVisible();
		await expect(page.getByTestId('insights-patterns').locator('[data-slot="card"]')).toHaveCount(1);
		await screenshot(page, 'patterns-empty');

		const user = await createUser(request);
		await seedFortnight(request, user);
		await page.context().clearCookies();
		await signIn(page, user, '/app/insights/patterns?range=month');
		const panel = page.getByTestId('insights-patterns');
		await expect(panel.locator('p').first()).toContainText('90');
		await expect(panel.locator('[data-slot="card-title"]').first()).toBeVisible();
		await screenshot(page, 'patterns');
	});
});

test.describe('insights coach, spend and metric', () => {
	test('coach: counts, rated share, conversation chart; empty window links to chat', async ({ page, request }) => {
		const user = await createUser(request);
		await seedCoach(request, user);
		await signIn(page, user, '/app/insights/coach?range=week');

		await expect(page.getByRole('heading', { level: 1, name: 'Coaching' })).toBeVisible();
		const panel = page.getByTestId('insights-coach');
		await expect(panel).toBeVisible();
		await expect(panel.getByText('100%')).toBeVisible();
		await expect(panel.locator('[data-slot="chart"] svg').first()).toBeVisible();
		await screenshot(page, 'coach');

		await period(page).locator('a[href$="range=yesterday"]').click();
		await expect(page).toHaveURL(/range=yesterday/);
		await expect(page.locator('#insights-panels a[href="/app/chat"]')).toBeVisible();
	});

	test('spend: cost, generations, tokens and the breakdowns', async ({ page, request }) => {
		const user = await createUser(request);
		await markAwardsSeen(request, user);
		await signIn(page, user, '/app/insights/spend?range=week');

		const panel = page.getByTestId('insights-spend');
		await expect(panel).toBeVisible();
		await expect(panel.getByText('fake')).toBeVisible();
		await screenshot(page, 'spend');
	});

	test('metric: headline, chart, trend, comparison; unknown key is a 404', async ({ page, request }) => {
		const user = await createUser(request);
		await seedFortnight(request, user);
		await signIn(page, user, '/app/insights/metric/sessions?range=month');

		const panel = page.getByTestId('insights-metric');
		await expect(panel).toBeVisible();
		await expect(panel.locator('[data-slot="chart"] svg').first()).toBeVisible();
		await expect(panel.locator('a[href^="/app/insights/"]').first()).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Insights sections' }).locator('[aria-current]')).toHaveCount(0);
		await screenshot(page, 'metric');

		await period(page).locator('a[href$="range=yesterday"]').click();
		await expect(page).toHaveURL(/metric\/sessions\?range=yesterday/);

		const res = await page.goto('/app/insights/metric/not-a-metric');
		expect(res?.status()).toBe(404);
	});
});
