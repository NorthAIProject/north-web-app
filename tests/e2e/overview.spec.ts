import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

/** A goal and a coach thread: the first-run steps before the check-in are done. */
async function settle(request: APIRequestContext, user: TestUser) {
	await api(request, user, 'POST', '/goals', { title: 'Run 10k', category: 'fitness' });
	await api(request, user, 'POST', '/conversations', { kind: 'chat' });
}

test('overview renders the command center and its panels', async ({ page, request }) => {
	const user = await createUser(request, { name: 'Ana Overview' });
	await signIn(page, user, '/app/overview');
	await expect(page).toHaveTitle(/Overview · Khepri/);
	await expect(page.getByRole('heading', { name: 'Hello, Ana' })).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Time period' })).toBeVisible();
	await expect(page.getByText('Briefing', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Training' }).or(page.getByText('Training', { exact: true })).first()).toBeVisible();
	await expect(page.getByText('Mood & energy')).toBeVisible();
	await page.screenshot({ path: test.info().outputPath('overview.png'), fullPage: true });
});

test('the range selector switches period', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/overview');
	await page.getByRole('navigation', { name: 'Time period' }).getByRole('radio', { name: 'Last 7 days' }).click();
	await expect(page).toHaveURL(/\/app\/overview\?range=week/);
	await expect(
		page.getByRole('navigation', { name: 'Time period' }).locator('[aria-current="true"]')
	).toHaveText('Last 7 days');
	await expect(page.getByText('Everything across Khepri, for Last 7 days.')).toBeVisible();
});

test('a check-in shows on the Today card and the feed', async ({ page, request }) => {
	const user = await createUser(request);
	await settle(request, user);
	await api(request, user, 'PUT', '/check-ins/today', { mood: 4, energy: 3 });
	await signIn(page, user, '/app/overview');
	const today = page.locator('[data-today]');
	await expect(today).toBeVisible();
	await expect(today.locator('[data-today-item="checkin"]')).toHaveAttribute('data-done', 'true');
	await expect(today.locator('[data-today-item="checkin"]')).toContainText('Mood 4 · energy 3');
	await expect(page.getByTestId('overview-timeline')).toContainText('Checked in');
	await expect(page.getByTestId('overview-mood-chart')).toBeVisible();
});

test('the Today card refreshes after a check-in saved elsewhere', async ({ page, request }) => {
	test.setTimeout(60_000);
	const user = await createUser(request);
	await settle(request, user);
	await signIn(page, user, '/app/overview');
	// Before the check-in the next step asks for it, in place of the Today card.
	await expect(page.locator('[data-next-step="checkin"]')).toBeVisible();
	await api(request, user, 'PUT', '/check-ins/today', { mood: 5, energy: 4 });
	await expect(page.locator('[data-today-item="checkin"]')).toHaveAttribute('data-done', 'true', { timeout: 30_000 });
});
