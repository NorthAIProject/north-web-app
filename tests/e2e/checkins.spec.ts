import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

const shots = process.env.E2E_SHOTS;

// The shell's award unlock dialog can open over the page after a write; close it.
test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

test('check-ins: first visit, the wizard saves and shows the receipt', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'POST', '/goals', { title: 'Run a 5k', motivation: '', success: '', category: 'fitness' });
	await signIn(page, user, '/app/check-ins');

	await expect(page.getByRole('heading', { name: 'Check-in', level: 1 })).toBeVisible();
	await expect(page.getByText('Your first check-in. Thirty seconds.')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/checkins-empty.png`, fullPage: true });

	// Mood pane: pick 4 and go on.
	await page.getByLabel('Mood 4 of 5').check({ force: true });
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByLabel('Energy 2 of 5').check({ force: true });
	await page.getByLabel('Stress 3 of 5').check({ force: true });
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByLabel('What went well?').fill('Walked to work');
	// The step strip jumps straight to the last pane.
	await page.getByRole('button', { name: 'Notes', exact: true }).click();
	await page.getByLabel('Tags (optional)').fill('travel, sleep');
	await page.getByRole('button', { name: 'Save check-in' }).click();

	const receipt = page.locator('[data-checkin-saved]');
	await expect(receipt.getByText('mood 4 · energy 2')).toBeVisible();
	await expect(receipt.getByText('1-day streak. Same time tomorrow.')).toBeVisible();
	await expect(receipt.locator('[data-day-state]')).toHaveCount(7);
	// The live region refreshed with the new entry.
	await expect(page.locator('[data-checkin-entry]')).toHaveCount(1);
	await expect(page.getByText('Wins: Walked to work')).toBeVisible();
	await expect(page.locator('[data-checkin-meta]').first()).toContainText('Web');
	await expect(page.getByText('1 in 14d')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/checkins-saved.png`, fullPage: true });

	// Editing reopens the wizard with today's answers.
	await page.getByRole('button', { name: "Edit today's check-in" }).click();
	await expect(page.getByLabel('Mood 4 of 5')).toBeChecked();
	await page.getByRole('button', { name: 'Notes', exact: true }).click();
	await expect(page.getByLabel('Tags (optional)')).toHaveValue('travel, sleep');
	await expect(page.getByText('Same-day edits replace the earlier entry.')).toBeVisible();
});

test('check-ins: a rejected save keeps the answers and opens the failing pane', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/check-ins');
	await page.getByRole('button', { name: 'Notes', exact: true }).click();
	await page.getByLabel('Anything else?').fill('x'.repeat(1001));
	await page.getByRole('button', { name: 'Save check-in' }).click();
	await expect(page.getByText('Keep notes under 1000 characters.')).toBeVisible();
	await expect(page.getByLabel('Anything else?')).toHaveValue('x'.repeat(1001));
});

test('check-ins: history from another surface shows up', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'PUT', '/check-ins/today', { mood: 5, energy: 4, wins: 'PR', challenges: '', notes: '', tags: [] });
	await signIn(page, user, '/app/check-ins');
	await expect(page.locator('[data-checkin-entry]')).toHaveCount(1);
	await expect(page.getByText('iPhone app')).toBeVisible();
	await expect(page.getByText('5.0/5')).toBeVisible();
	await expect(page.locator('[data-mood-energy-chart]')).toBeVisible();
	await expect(page.locator('[data-mood-energy-chart] svg').first()).toBeVisible();
	await expect(page.locator('#checkins-mood-heatmap[data-echarts-ready]')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/checkins-history.png`, fullPage: true });
});
