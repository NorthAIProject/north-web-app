import { expect as baseExpect, test, type APIRequestContext, type Locator } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Training (north-client internal/workouts + planimport's training import).
// The fake AI provider cannot write a plan, so plans are arranged through the
// import commit, which stores one without a model.

// The shared dev server is slow under several suites at once.
test.describe.configure({ timeout: 120_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

const draft = (name: string, days = 2) => ({
	name,
	unparsed: [],
	days: [
		{
			label: 'Day 1',
			weekday: 'Monday',
			exercises: [
				{ name: 'Goblet Squat', sets: 3, reps: '8', load: '', notes: 'Brace first', flags: [] },
				{ name: 'Push-up', sets: 3, reps: '10', load: '', notes: '', flags: [] }
			]
		},
		{
			label: 'Day 2',
			weekday: 'Thursday',
			exercises: [{ name: 'Dumbbell Row', sets: 3, reps: '10', load: '20 kg', restSeconds: 90, notes: '', flags: [] }]
		},
		{ label: 'Day 3', weekday: 'Saturday', exercises: [{ name: 'Plank', sets: 3, reps: '30s', load: '', notes: '', flags: [] }] }
	].slice(0, days)
});

async function withPlan(request: APIRequestContext, name = 'Strength A', days = 2) {
	const user = await createUser(request);
	const { planId } = await api(request, user, 'POST', '/training/import', draft(name, days));
	return { user, planId: planId as string };
}

/**
 * Clicks a control that opens something in place, again if the first click
 * landed before hydration (the shared dev server is slow under load).
 */
async function open(control: Locator, opened: Locator) {
	await expect(async () => {
		await control.click();
		await expect(opened).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 30_000 });
}

/** Each edit stores a new version, so the address moves to it. */
async function waitForNewVersion(page: import('@playwright/test').Page, previous: string) {
	await expect(page).not.toHaveURL(new RegExp(`/app/training/${previous}$`));
	await page.waitForLoadState('networkidle');
	return page.url().split('/').pop()!;
}

test('/app/training goes to the intake with no plan, and to the plan with one', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/training');
	await expect(page).toHaveURL(/\/app\/training\/new$/);
	await expect(page.getByRole('heading', { name: 'Build your training plan' })).toBeVisible();
	await expect(page.getByLabel('What are you training for?')).toBeVisible();
	await expect(page.getByLabel('Dumbbells')).toBeVisible();

	await api(request, user, 'POST', '/training/import', draft('Strength A'));
	await page.goto('/app/training');
	await expect(page).toHaveURL(/\/app\/training\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { name: 'Strength A' })).toBeVisible();
});

test('the intake shows field errors and keeps answers', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/training/new');
	await page.getByLabel('Days per week').fill('3');
	await page.getByLabel('Minutes per session').fill('45');
	// No goal: the service refuses it in words beside the field.
	await open(page.getByLabel('Mon', { exact: true }), page.locator('button[role="checkbox"][data-state="checked"]#intake-Monday'));
	await page.getByRole('button', { name: 'Build my plan' }).click();
	await expect(page.getByText('Tell Khepri what you are training for.')).toBeVisible();
	await expect(page.getByLabel('Mon', { exact: true })).toBeChecked();
});

test('plan page renders days, week, set logger and rationale', async ({ page, request }) => {
	const { user, planId } = await withPlan(request);
	await signIn(page, user, `/app/training/${planId}`);
	await expect(page.getByTestId('plan-day')).toHaveCount(2);
	await expect(page.getByRole('heading', { name: 'Monday' })).toBeVisible();
	await expect(page.getByText('3×8').first()).toBeVisible();
	await expect(page.getByText('Brace first')).toBeVisible();
	await expect(page.getByText('Load 20 kg · Rest 90s')).toBeVisible();
	await expect(page.getByTestId('training-week')).toBeVisible();
	await expect(page.getByText('Why this plan')).toBeVisible();
	await expect(page.getByTestId('set-logger')).toBeVisible();
});

test('edit sets, start time, move and remove — each a new version', async ({ page, request }) => {
	const { user, planId } = await withPlan(request);
	await signIn(page, user, `/app/training/${planId}`);

	// Sets, reps and rest.
	const first = page.getByTestId('plan-exercise').first();
	await open(page.getByRole('button', { name: '3×8' }), first.locator('input[name="sets"]'));
	await first.locator('input[name="sets"]').fill('5');
	await first.locator('input[name="reps"]').fill('5');
	await first.getByRole('button', { name: 'Save' }).click();
	let id = await waitForNewVersion(page, planId);
	await expect(page.getByRole('button', { name: '5×5' })).toBeVisible();

	// Start time.
	await open(page.getByRole('button', { name: 'Set a start time' }).first(), page.locator('input[name="start_time"]'));
	await page.locator('input[name="start_time"]').fill('07:30');
	await page.getByTestId('plan-day').first().getByRole('button', { name: 'Save' }).click();
	id = await waitForNewVersion(page, id);
	await expect(page.getByRole('button', { name: 'Starts at 07:30' })).toBeVisible();

	// Move Push-up above Goblet Squat.
	await page.getByRole('button', { name: 'Move later in the session' }).first().click();
	id = await waitForNewVersion(page, id);
	await expect(page.getByTestId('plan-exercise').first()).toContainText('Push-up');

	// Remove, confirmed in a dialog.
	await page.getByTestId('plan-exercise').first().getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByRole('dialog')).toContainText('Remove Push-up from this session?');
	await page.getByRole('dialog').getByRole('button', { name: 'Remove' }).click();
	id = await waitForNewVersion(page, id);
	await expect(page.getByTestId('plan-day').first().getByTestId('plan-exercise')).toHaveCount(1);

	// A reload shows what is on screen.
	await page.reload();
	await expect(page.getByTestId('plan-day').first().getByTestId('plan-exercise')).toHaveCount(1);
});

test('swap and add through the picker, then view muscles', async ({ page, request }) => {
	const { user, planId } = await withPlan(request);
	await signIn(page, user, `/app/training/${planId}`);

	const day2 = page.getByTestId('plan-day').nth(1);
	await open(day2.getByRole('button', { name: 'Swap' }), day2.getByTestId('exercise-picker'));
	await expect(day2.getByTestId('exercise-picker')).toContainText('Replacing Dumbbell Row');
	await day2.getByPlaceholder('Search the catalog').fill('goblet');
	await expect(day2.getByText('Matches')).toBeVisible();
	await day2.getByRole('button', { name: /Goblet Squat/ }).first().click();
	let id = await waitForNewVersion(page, planId);
	await expect(page.getByTestId('plan-day').nth(1).getByTestId('plan-exercise').first()).toContainText('Goblet Squat');
	// A catalog exercise brings its artwork, and with it the licence credit.
	await expect(page.getByText('Bryl Lim')).toBeVisible();

	const day1 = page.getByTestId('plan-day').first();
	await open(day1.getByRole('button', { name: 'Add exercise' }), day1.getByTestId('exercise-picker'));
	await expect(day1.getByTestId('exercise-picker')).toContainText('Add to Monday');
	await expect(day1.getByText('Suggested')).toBeVisible();
	await day1.getByTestId('exercise-picker').getByRole('button').nth(1).click();
	id = await waitForNewVersion(page, id);
	await expect(page.getByTestId('plan-day').first().getByTestId('plan-exercise')).toHaveCount(3);

	await page.getByTestId('plan-day').nth(1).getByRole('button', { name: 'View muscles' }).click();
	await expect(page.getByRole('dialog')).toContainText('Goblet Squat');
	expect(id).not.toBe(planId);
});

test('the week: next week, change the days, save, back to usual', async ({ page, request }) => {
	const { user, planId } = await withPlan(request);
	await signIn(page, user, `/app/training/${planId}`);
	const week = page.getByTestId('training-week');
	await expect(week).toContainText('This week');

	await open(week.getByRole('button', { name: 'Next week' }), page.getByRole('button', { name: 'Change next week' }));
	await expect(page.getByTestId('training-week')).toContainText('2 training days');

	await page.getByRole('button', { name: 'Change next week' }).click();
	const editor = page.getByTestId('training-week-editor');
	await expect(editor).toBeVisible();
	await editor.getByRole('button', { name: '3 days' }).click();
	await expect(editor.getByRole('button', { name: '3 days' })).toHaveAttribute('class', /bg-signal/);
	await editor.getByRole('button', { name: 'Save next week' }).click();
	await expect(page.getByTestId('training-week')).toContainText('3 training days');
	await expect(page.getByTestId('training-week')).toContainText('changed from your usual week');

	await page.getByRole('button', { name: 'Back to your usual week' }).click();
	await expect(page.getByTestId('training-week')).not.toContainText('changed from your usual week');
	await expect(page.getByTestId('training-week')).toContainText('2 training days');
});

test('plans list, following another plan', async ({ page, request }) => {
	const { user, planId } = await withPlan(request);
	const { planId: second } = await api(request, user, 'POST', '/training/import', draft('Strength B', 3));
	await signIn(page, user, '/app/training/plans');
	await expect(page.getByRole('heading', { name: 'Training plans' })).toBeVisible();
	await expect(page.getByRole('link', { name: /Strength A/ })).toBeVisible();
	await expect(page.getByRole('link', { name: /Strength B/ })).toBeVisible();

	// Importing does not change which plan is followed.
	const other = (await api(request, user, 'GET', '/training/plans')).plans.find((p: { active: boolean }) => !p.active);
	await page.goto(`/app/training/${other.id}`);
	await expect(page.getByText('You are not following this plan right now.')).toBeVisible();
	await page.getByRole('button', { name: 'Follow this plan' }).click();
	await expect(page.getByTestId('training-week')).toBeVisible();
	await expect(page.getByText('You are not following this plan right now.')).toHaveCount(0);
	expect([planId, second]).toContain(other.id);
});

test('import: upload a sheet, review, remove a row, save', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/training/import');
	await expect(page.getByRole('heading', { name: 'Import a workout plan' })).toBeVisible();
	const csv = [
		'day,exercise,sets,reps,load,rest,notes',
		'Monday,Goblet Squat,3,8,,90,',
		'Monday,Push-up,3,10,,60,',
		'Thursday,Dumbbell Row,3,10,20 kg,90,'
	].join('\n');
	await page.locator('input[type="file"]').setInputFiles({ name: 'plan.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
	await expect(page.getByRole('heading', { name: 'Check your workout plan' })).toBeVisible({ timeout: 20_000 });
	await expect(page.getByTestId('import-day')).toHaveCount(2);
	await page.getByRole('button', { name: 'Remove Push-up' }).click();
	await page.locator('input[name="name"]').fill('Imported plan');
	await page.getByRole('button', { name: 'Save plan' }).click();
	await expect(page).toHaveURL(/\/app\/training\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { name: 'Imported plan' })).toBeVisible();
	await expect(page.getByText('Push-up')).toHaveCount(0);
});

test('a plain form post adds to a day; the legacy /app/workouts link redirects', async ({ page, request }) => {
	const { user, planId } = await withPlan(request);
	await signIn(page, user, `/app/workouts/${planId}`);
	await expect(page).toHaveURL(new RegExp(`/app/training/${planId}$`));

	// The exercise page's "add to a day" form (Go: exercises_view.go).
	await page.evaluate((id) => {
		const f = document.createElement('form');
		f.method = 'post';
		f.action = `/app/training/${id}/days/1/exercises`;
		const i = document.createElement('input');
		i.name = 'catalog_slug';
		i.value = 'goblet-squat';
		f.append(i);
		document.body.append(f);
		f.submit();
	}, planId);
	await expect(page).toHaveURL(/\/app\/training\/[0-9a-f-]{36}$/);
	await expect(page).not.toHaveURL(new RegExp(planId));
	await expect(page.getByTestId('plan-day').nth(1).getByTestId('plan-exercise')).toHaveCount(2);
});

export type { TestUser };
