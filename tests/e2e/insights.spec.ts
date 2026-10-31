import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { api, createUser, password, signIn, type TestUser } from './helpers';

// Go: internal/insights/handler.go — /app/insights/{timeline,body,mind,progress,
// training,nutrition}. Each test arranges its own data through /api/v1.

test.describe.configure({ timeout: 90_000 });

const daysAgo = (n: number, hour = 7) => {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - n);
	d.setUTCHours(hour, 0, 0, 0);
	return d.toISOString();
};

/** A week of logging: check-ins, water, sleep, journal, workouts, a goal. */
async function seedWeek(request: APIRequestContext, user: TestUser) {
	await api(request, user, 'PUT', '/check-ins/today', { mood: 4, energy: 3, wins: 'Ran before work' });
	await api(request, user, 'POST', '/care/water', { amountMl: 750 });
	await api(request, user, 'POST', '/care/water', { amountMl: 500 });
	await api(request, user, 'PUT', '/care/sleep', { durationMinutes: 450, quality: 4 });
	await api(request, user, 'POST', '/mind/journal', { content: 'Felt strong on the run today.', mood: 4 });
	await api(request, user, 'PUT', '/calculator/biometrics', { weightKg: 74, heightCm: 178, dateOfBirth: '1990-05-01', sex: 'male' });
	await api(request, user, 'POST', '/activity/log', { activityCode: 'running_9_8kmh', durationMinutes: 32, distanceKm: 5.2 });
	const readings = [1, 2, 3, 4, 5].flatMap((n) => [
		{ metric: 'sleep_asleep', value: 400 + n * 10, unit: 'min', startedAt: daysAgo(n, 6) },
		{ metric: 'resting_heart_rate', value: 52 + n, unit: 'bpm', startedAt: daysAgo(n, 8) },
		{ metric: 'steps', value: 8000 + n * 500, unit: 'count', startedAt: daysAgo(n, 20) }
	]);
	const workouts = [2, 4].map((n) => ({
		activityCode: 'running_9_8kmh',
		externalId: `e2e-run-${n}-${Math.random().toString(36).slice(2, 8)}`,
		startedAt: daysAgo(n, 7),
		endedAt: daysAgo(n, 8),
		calories: 420,
		distanceM: 8000
	}));
	await api(request, user, 'POST', '/health/samples', { readings, workouts });
	const goal = await api(request, user, 'POST', '/goals', {
		title: 'Run a 10k',
		motivation: 'Feel fit',
		success: 'Finish under an hour',
		category: 'fitness'
	});
	await api(request, user, 'POST', `/goals/${goal.id}/updates`, { note: 'Did 5k easy', progress: 30 });
	await markAwardsSeen(request, user);
}

/** A habit kept today, lifting sets, a training plan, food against a target. */
async function seedMore(request: APIRequestContext, user: TestUser) {
	const care = await api(request, user, 'POST', '/care/habits', { name: 'Stretch', domain: 'health', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
	const habit = care.habits.find((h: { name: string }) => h.name === 'Stretch');
	await api(request, user, 'PUT', `/care/habits/${habit.id}/done`, { value: true });

	for (const [i, [kg, reps]] of [
		[100, 5],
		[105, 5],
		[110, 3]
	].entries()) {
		await api(request, user, 'POST', '/lifts/sets', { exerciseName: 'Back squat', setNumber: i + 1, weightKg: kg, reps });
	}
	await api(request, user, 'POST', '/lifts/sets', { exerciseName: 'Bench press', setNumber: 1, weightKg: 70, reps: 8 });

	await api(request, user, 'POST', '/training/import', {
		name: 'Strength A',
		unparsed: [],
		days: [
			{ label: 'Day 1', weekday: 'Monday', exercises: [{ name: 'Back squat', sets: 3, reps: '5', load: '', notes: '', flags: [] }] },
			{ label: 'Day 2', weekday: 'Thursday', exercises: [{ name: 'Bench press', sets: 3, reps: '8', load: '', notes: '', flags: [] }] }
		]
	});

	await api(request, user, 'POST', '/calculator/plan', { activityLevel: 'moderate', goal: 'maintenance', macroSplit: 'moderate_carb' });
	const chicken = await api(request, user, 'POST', '/nutrition/ingredients', {
		name: 'Aa insights chicken',
		category: 'protein',
		servingSizeGrams: 100,
		per100g: { calories: 165, proteinG: 31, fatG: 4, carbG: 0 }
	});
	const rice = await api(request, user, 'POST', '/nutrition/ingredients', {
		name: 'Aa insights rice',
		category: 'carb',
		servingSizeGrams: 100,
		per100g: { calories: 130, proteinG: 3, fatG: 0, carbG: 28 }
	});
	await api(request, user, 'POST', '/nutrition/log/ingredients', { ingredientId: chicken.id, quantityGrams: 200 });
	await api(request, user, 'POST', '/nutrition/log/ingredients', { ingredientId: rice.id, quantityGrams: 250 });
	await markAwardsSeen(request, user);
}

/** The unlock celebration would cover the page; these tests are not about it. */
async function markAwardsSeen(request: APIRequestContext, user: TestUser) {
	const unseen = await api(request, user, 'GET', '/awards/unseen');
	for (const a of unseen.awards ?? []) await api(request, user, 'POST', `/awards/${a.id}/seen`);
}

/** Onboarding creates a goal; an account with nothing logged has none. */
async function clearGoals(request: APIRequestContext, user: TestUser) {
	const list = await api(request, user, 'GET', '/goals');
	for (const g of list.goals) await api(request, user, 'DELETE', `/goals/${g.id}`);
}

async function screenshot(page: Page, name: string) {
	await page.screenshot({ path: `test-results/insights-${name}.png`, fullPage: true });
}

test.describe('insights domain pages, populated', () => {
	test.describe.configure({ mode: 'serial' });
	let user: TestUser;

	test.beforeAll(async ({ request }) => {
		test.setTimeout(90_000);
		user = await createUser(request);
		await seedWeek(request, user);
		await seedMore(request, user);
	});

	test('timeline lists entries, filters by kind, and a range switch starts from everything again', async ({ page }) => {
		await signIn(page, user, '/app/insights/timeline?range=week');
		await expect(page.getByRole('heading', { level: 1, name: 'Activity' })).toBeVisible();
		const entries = page.getByTestId('insights-timeline-entries');
		await expect(entries).toContainText('Felt strong on the run today.');

		const filter = page.getByRole('navigation', { name: 'Filter by kind' });
		await expect(filter.locator('[aria-current="true"]')).toContainText('Everything');
		const everything = await entries.locator('li').count();
		await filter.locator('a[href*="kind=journal"]').click();
		await expect(page).toHaveURL(/kind=journal/);
		await expect(filter.locator('[aria-current="true"]')).toHaveAttribute('href', /kind=journal/);
		await expect(entries.locator('li')).toHaveCount(1);
		expect(everything).toBeGreaterThan(1);

		const period = page.getByRole('navigation', { name: 'Time period' });
		await period.locator('a[href*="range=month"]').click();
		await expect(page).toHaveURL(/range=month/);
		await expect(period.locator('[aria-current="true"]')).toHaveAttribute('href', /range=month/);
		// Like Go's range picker, the period links carry the range alone.
		await expect(page).not.toHaveURL(/kind=/);
		await expect(filter.locator('[aria-current="true"]')).toContainText('Everything');
		await expect(entries.locator('li')).toHaveCount(everything);
		await page.goto('/app/insights/timeline?range=week');
		await expect(entries).toBeVisible();
		await screenshot(page, 'timeline');
	});

	test('body: water, sleep and the habit gauge', async ({ page }) => {
		await signIn(page, user, '/app/insights/body?range=week');
		await expect(page.getByRole('heading', { level: 1, name: 'Body' })).toBeVisible();
		await expect(page.getByText(/1[.,]\d L/).first()).toBeVisible();
		await expect(page.locator('[data-slot="chart"] svg').first()).toBeVisible();
		await expect(page.getByText('Stretch')).toBeVisible();
		await expect(page.locator('#insights-habit-gauge[data-echarts-ready="true"]')).toBeAttached();
		await screenshot(page, 'body');
	});

	test('mind: mood and energy, heatmap, journalling', async ({ page }) => {
		await signIn(page, user, '/app/insights/mind?range=week');
		await expect(page.getByRole('heading', { level: 1, name: 'Mind' })).toBeVisible();
		await expect(page.locator('[data-slot="chart"]')).toHaveCount(2);
		await expect(page.locator('#insights-mind-heatmap[data-echarts-ready="true"]')).toBeAttached();
		await screenshot(page, 'mind');
	});

	test('progress: goals, statuses, notes', async ({ page }) => {
		await signIn(page, user, '/app/insights/progress?range=week');
		await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
		await expect(page.getByTestId('insights-progress-goals').getByRole('link', { name: /Run a 10k/ })).toBeVisible();
		await expect(page.locator('#insights-progress-donut[data-echarts-ready="true"]')).toBeAttached();
		await expect(page.locator('[data-slot="chart"] svg').first()).toBeVisible();
		await screenshot(page, 'progress');
	});

	test('training: plan, burn, kinds, lifting and sessions', async ({ page }) => {
		await signIn(page, user, '/app/insights/training?range=week');
		await expect(page.getByRole('heading', { level: 1, name: 'Training' })).toBeVisible();
		await expect(page.getByTestId('insights-plan')).toBeVisible();
		const lifting = page.getByTestId('insights-lifting');
		await expect(lifting.getByRole('cell', { name: 'Back squat' })).toBeVisible();
		await expect(lifting.getByRole('cell', { name: 'Bench press' })).toBeVisible();
		await expect(page.locator('#insights-training-donut[data-echarts-ready="true"]')).toBeAttached();
		await expect(page.getByTestId('insights-training-sessions').locator('li').first()).toBeVisible();
		await screenshot(page, 'training');
	});

	test('nutrition: averages against the goal, calories, split, how you eat', async ({ page }) => {
		await signIn(page, user, '/app/insights/nutrition?range=week');
		await expect(page.getByRole('heading', { level: 1, name: 'Nutrition' })).toBeVisible();
		await expect(page.getByText(/^goal \d+ kcal$/).first()).toBeVisible();
		await expect(page.locator('[data-slot="chart"] svg').first()).toBeVisible();
		await expect(page.locator('#insights-nutrition-split[data-echarts-ready="true"]')).toBeAttached();
		await expect(page.getByTestId('insights-eating')).toBeVisible();
		await screenshot(page, 'nutrition');
	});
});

test.describe('insights domain pages, empty', () => {
	let user: TestUser;

	test.beforeAll(async ({ request }) => {
		user = await createUser(request);
		await clearGoals(request, user);
		await markAwardsSeen(request, user);
	});

	const cases: [string, string, RegExp, string][] = [
		['timeline', 'Activity', /Nothing logged in this window\./, '/app/check-ins'],
		['body', 'Body', /No water logged in this window\./, '/app/care'],
		['mind', 'Mind', /No check-ins in this window\./, '/app/check-ins'],
		['progress', 'Progress', /No active goals\./, '/app/goals'],
		['training', 'Training', /No sets logged in this window\./, '/app/training'],
		['nutrition', 'Nutrition', /No food logged in this window\./, '/app/nutrition']
	];
	for (const [slug, title, message, href] of cases) {
		test(`${slug} says so and links somewhere to start`, async ({ page }) => {
			await signIn(page, user, `/app/insights/${slug}?range=week`);
			await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
			await expect(page.getByText(message).first()).toBeVisible();
			await expect(page.locator(`#insights-panels a[href="${href}"]`).first()).toBeVisible();
			if (slug === 'training' || slug === 'nutrition') await screenshot(page, `${slug}-empty`);
		});
	}
});

// Side by side with the Go pages; run with INSIGHTS_COMPARE=1.
test('compare with the Go pages', async ({ page, browser, request }) => {
	test.skip(!process.env.INSIGHTS_COMPARE, 'set INSIGHTS_COMPARE=1');
	test.setTimeout(240_000);
	const user = await createUser(request);
	await seedWeek(request, user);
	await seedMore(request, user);
	await signIn(page, user, '/app/insights/body?range=week');
	const go = await (await browser.newContext({ viewport: page.viewportSize() ?? undefined })).newPage();
	await go.goto('http://localhost:8090/login');
	await go.locator('input[name=email]').fill(user.email);
	await go.locator('input[name=password]').fill(password);
	await go.locator('form button[type=submit]').first().click();
	await go.waitForLoadState('networkidle');
	for (const slug of ['timeline', 'body', 'mind', 'progress', 'training', 'nutrition']) {
		await page.goto(`/app/insights/${slug}?range=week`);
		await page.waitForTimeout(1500);
		await page.screenshot({ path: `test-results/cmp-a-svelte-${slug}.png`, fullPage: true });
		await go.goto(`http://localhost:8090/app/insights/${slug}?range=week`);
		await go.waitForTimeout(2000);
		await go.screenshot({ path: `test-results/cmp-a-go-${slug}.png`, fullPage: true });
	}
});

test.describe('insights summary', () => {
	test('empty account says so and links home', async ({ page, request }) => {
		const user = await createUser(request);
		await clearGoals(request, user);
		await signIn(page, user, '/app/insights');
		await expect(page.getByRole('heading', { level: 1, name: 'Summary' })).toBeVisible();
		await expect(page.getByText(/Nothing logged in this window yet\./)).toBeVisible();
		await expect(page.locator('#insights-panels a[href="/app"]')).toBeVisible();
		await screenshot(page, 'summary-empty');
	});

	test('populated week: rings, pinned cards, day table, awards; range switch refreshes panels', async ({
		page,
		request
	}) => {
		const user = await createUser(request);
		await seedWeek(request, user);
		await signIn(page, user, '/app/insights');

		await expect(page.getByTestId('insights-score-body')).toBeVisible();
		await expect(page.getByTestId('insights-score-mind')).toContainText(/\d+\/\d+|—/);
		await expect(page.getByTestId('insights-pinned-water')).toContainText(/1[.,]\d L/);
		await expect(page.locator('[data-testid="insights-pinned-water"] [data-slot="chart"] svg').first()).toBeVisible();
		await expect(page.locator('[data-echarts-ready="true"]').first()).toBeAttached();
		await expect(page.locator('#insights-awards')).toBeVisible();

		// The range selector re-runs the load client-side and keeps the shell;
		// a week is listed day by day.
		const period = page.getByRole('navigation', { name: 'Time period' });
		await period.locator('a[href$="range=week"]').click();
		await expect(page).toHaveURL(/range=week/);
		await expect(period.locator('[aria-current="true"]')).toHaveAttribute('href', /range=week/);
		await expect(page.locator('#insights-panels table:not(.sr-only) tbody tr')).toHaveCount(7);
		await expect(page.locator('[data-testid="insights-pinned-sleep"] [data-slot="chart"] svg').first()).toBeVisible();
		await screenshot(page, 'summary');
	});
});
