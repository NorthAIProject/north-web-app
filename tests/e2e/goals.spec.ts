import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

const shots = process.env.E2E_SHOTS;

// The shell's award unlock dialog can open over the page after a write; close it.
test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

/** Onboarding files the near-term goal; tests that need none remove it. */
async function withoutGoals(request: Parameters<typeof api>[0], user: Parameters<typeof api>[1]) {
	const { goals } = await api(request, user, 'GET', '/goals');
	for (const g of goals) await api(request, user, 'DELETE', `/goals/${g.id}`);
}

test('goals: empty list, create, then the detail page', async ({ page, request }) => {
	const user = await createUser(request);
	await withoutGoals(request, user);
	await signIn(page, user, '/app/goals');
	await expect(page.getByRole('heading', { name: 'Goals', level: 1 })).toBeVisible();
	await expect(page.getByText('Nothing to aim at yet')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/goals-empty.png`, fullPage: true });

	await page.getByRole('button', { name: 'Add a goal' }).click();
	// A rejected goal keeps the form open with the message.
	await page.getByLabel('Why does it matter?').fill('Stairs');
	await page.getByLabel('What is the goal?').fill('x'.repeat(201));
	await page.getByRole('button', { name: 'Add goal' }).click();
	await expect(page.getByText('Keep the name under 200 characters.')).toBeVisible();
	await expect(page.getByLabel('Why does it matter?')).toHaveValue('Stairs');
	await page.getByLabel('What is the goal?').fill('Run 10k');

	await page.locator('#category').click();
	await page.getByRole('option', { name: 'Fitness' }).click();
	await page.getByRole('button', { name: 'Add goal' }).click();
	await page.waitForURL(/\/app\/goals\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { name: 'Run 10k', level: 1 })).toBeVisible();
	await expect(page.getByText('Why it matters')).toBeVisible();
});

test('goals: milestones, a progress note, status and delete', async ({ page, request }) => {
	const user = await createUser(request);
	await withoutGoals(request, user);
	const goal = await api(request, user, 'POST', '/goals', {
		title: 'Learn Portuguese',
		motivation: 'Family',
		success: 'A conversation',
		category: 'learning',
		targetDate: '2099-01-01'
	});
	await signIn(page, user, `/app/goals/${goal.id}`);

	await page.getByLabel('Add a milestone').fill('Finish A1');
	await page.getByRole('button', { name: 'Add milestone' }).click();
	await expect(page.locator('[data-milestone]')).toHaveCount(1);
	await expect(page.getByLabel('Add a milestone')).toHaveValue('');

	// Completing it shows the moment card once.
	await page.getByRole('button', { name: 'Complete' }).click();
	await expect(page).toHaveURL(/done=milestone:/);
	await expect(page.getByText('Checkpoint reached')).toBeVisible();
	await expect(page.getByText('1 of 1 complete.')).toBeVisible();

	// Edit the milestone in place.
	await page.locator('[data-milestone]').getByRole('button', { name: 'Edit' }).click();
	await page.locator('[data-milestone] input[name="milestone_title"]').fill('Finish A2');
	await page.locator('[data-milestone]').getByRole('button', { name: 'Save' }).click();
	await expect(page.locator('[data-milestone]')).toContainText('Finish A2');

	await page.getByPlaceholder('Ran 5k three times this week').fill('Two lessons');
	await page.getByRole('button', { name: 'Add note' }).click();
	await expect(page.locator('[data-goal-update]')).toHaveCount(1);
	await expect(page.locator('[data-goal-update]')).toContainText('Two lessons');

	if (shots) await page.screenshot({ path: `${shots}/goal-detail.png`, fullPage: true });

	// Remove the milestone, through the confirmation.
	await page.locator('[data-milestone]').getByRole('button', { name: 'Remove' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Remove' }).click();
	await expect(page.locator('[data-milestone]')).toHaveCount(0);

	await page.getByRole('button', { name: 'Pause' }).click();
	await expect(page.getByRole('button', { name: 'Make active again' })).toBeVisible();

	await page.getByRole('button', { name: 'Delete this goal' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete this goal' }).click();
	await page.waitForURL(/\/app\/goals$/);
	await expect(page.getByText('Nothing to aim at yet')).toBeVisible();
});

test('goals: list shows KPIs, progress and the category donut', async ({ page, request }) => {
	const user = await createUser(request);
	await withoutGoals(request, user);
	const g = await api(request, user, 'POST', '/goals', {
		title: 'Sleep 8h',
		motivation: 'Recovery',
		success: '',
		category: 'health'
	});
	await api(request, user, 'POST', `/goals/${g.id}/updates`, { note: 'Better week', progress: 40 });
	await signIn(page, user, '/app/goals');
	await expect(page.locator('[data-goal-card]')).toHaveCount(1);
	await expect(page.locator('[data-goal-card]')).toContainText('Recovery');
	await expect(page.locator('[data-goal-card]')).toContainText('40%');
	await expect(page.getByText('40%').first()).toBeVisible();
	await expect(page.locator('#goals-category-donut[data-echarts-ready]')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/goals-list.png`, fullPage: true });

	await page.goto(`/app/goals/${g.id}`);
	await page.getByRole('button', { name: 'Mark achieved' }).click();
	await expect(page.getByText('“Sleep 8h” — achieved')).toBeVisible();
});
