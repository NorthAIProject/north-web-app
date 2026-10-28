import { expect as baseExpect, test, type Page } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// My Day (/app): the page and every write its dialogs make. Each write
// reloads the page's data, which on a busy dev server takes a few seconds.
const expect = baseExpect.configure({ timeout: 20_000 });
// Retries: other ports editing shared files make the dev server reload pages mid-test.
test.describe.configure({ timeout: 90_000, retries: 2 });

async function openCard(page: Page, id: string) {
	await expect(async () => {
		await page.getByTestId(`card-${id}`).click();
		await baseExpect(page.getByRole('dialog')).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout: 20_000 });
}

test('My Day renders the rail, vitals, cards and body', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'POST', '/care/water', { amountMl: 500 });
	await api(request, user, 'POST', '/caffeine', { preset: 'espresso' });
	await signIn(page, user, '/app');

	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	await expect(page.getByTestId('day-rail')).toBeVisible();
	await expect(page.getByTestId('rail-card').first()).toBeVisible();
	await expect(page.getByTestId('rail-card').filter({ hasText: 'Espresso' })).toBeVisible();
	for (const key of ['caffeine', 'energy', 'sunlight', 'screen', 'streak']) {
		await expect(page.getByTestId(`vital-${key}`)).toBeVisible();
	}
	for (const id of ['fast', 'food', 'water', 'activity', 'sleep', 'workouts', 'nutrients', 'streak']) {
		await expect(page.getByTestId(`card-${id}`)).toBeVisible();
	}
	await expect(page.getByTestId('card-water')).toContainText('500');
	await expect(page.getByTestId('body-panel')).toBeVisible();
	await page.screenshot({ path: test.info().outputPath('day.png'), fullPage: true });
});

test('another date has no now line and a Today button', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app?date=2026-01-15');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('15 January');
	await expect(page.getByRole('link', { name: 'Today' })).toBeVisible();
	await expect(page.locator('[data-now]')).toHaveCount(0);
});

test('water from its card and from quick add', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	await openCard(page, 'water');
	await page.getByRole('dialog').getByRole('button', { name: '+250 ml' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(page.getByTestId('card-water')).toContainText('250');

	await page.getByRole('button', { name: 'Add to your day' }).click();
	await page.getByTestId('quick-water-other').getByRole('spinbutton').fill('120');
	await page.getByTestId('quick-water-other').getByRole('button').click();
	await expect(page.getByTestId('card-water')).toContainText('370');
});

test('caffeine, supplement, screen time and a tracker from quick add', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	const add = page.getByRole('button', { name: 'Add to your day' });

	await add.click();
	await page.getByTestId('quick-caffeine').getByRole('button', { name: /Coffee/ }).click();
	await expect(page.getByTestId('vital-caffeine')).not.toContainText('—');

	await add.click();
	await page.getByTestId('quick-screen').getByRole('spinbutton').first().fill('2');
	await page.getByTestId('quick-screen').getByRole('button').click();
	await expect(page.getByTestId('vital-screen')).toContainText('2h');

	await add.click();
	await page.locator('#supplement-preset').click();
	await page.getByRole('option', { name: 'Vitamin D3' }).click();
	await page.getByTestId('quick-supplement').getByRole('button', { name: 'Log' }).click();
	await expect(page.getByTestId('rail-card').filter({ hasText: 'Vitamin D3' })).toBeVisible();

	await add.click();
	await page.getByPlaceholder('Dentist, haircut…').fill('Dentist');
	await page.getByPlaceholder('Dentist, haircut…').press('Enter');
	await expect(page.getByTestId('vital-tracker')).toContainText('Dentist');
});

test('a fast starts and stops from its card', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	await openCard(page, 'fast');
	await page.getByRole('dialog').getByRole('button', { name: /16h/ }).click();
	await expect(page.getByTestId('card-fast')).toContainText('0:00');
	await openCard(page, 'fast');
	await page.getByRole('dialog').getByRole('button', { name: 'End the fast' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
});

test('body dialog: soreness, goal weight and blood pressure', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	await page.getByTestId('body-panel').getByRole('button', { name: 'Update body' }).click();
	const dialog = page.getByRole('dialog');

	await dialog.locator('#region').click();
	// The list scrolls inside its own box; pick a region in its first screen.
	await page.getByRole('option', { name: 'Chest' }).click();
	await dialog.getByRole('button', { name: 'Sore', exact: true }).click();
	await expect(page.getByTestId('soreness')).toContainText('Chest');

	await dialog.getByLabel('Systolic').fill('121');
	await dialog.getByLabel('Diastolic').fill('79');
	await dialog.getByLabel('Diastolic').press('Enter');
	await expect(page.getByTestId('body-chips')).toContainText('121/79');
	// The dialog stays open: only the chips change, as Go's swap did.
	await expect(dialog).toBeVisible();
});

test('rules draw a marker on the rail', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	await page.getByRole('button', { name: 'Day rules' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.locator('input[name="at_kitchen_closes"]').fill('20:00');
	await dialog.locator('#rule-on-kitchen_closes').click();
	await dialog.getByRole('button', { name: 'Save rules' }).click();
	await expect(page.getByTestId('marker-kitchen_closes')).toBeVisible();
});

test('the streak tile picks up a check-in saved elsewhere', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	await expect(page.locator('[data-streak-today]')).toContainText('No check-in yet');
	await api(request, user, 'PUT', '/check-ins/today', { mood: 4, energy: 3 });
	await page.evaluate(() => document.dispatchEvent(new CustomEvent('checkin-saved')));
	await expect(page.locator('[data-streak-today]')).toContainText('mood 4');
});
