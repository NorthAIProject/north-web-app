import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

const shots = process.env.E2E_SHOTS;

// The shell's award unlock dialog can open over the page after a write; close it.
test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

test('weekly: plan the week, order goals and pick a volume', async ({ page, request }) => {
	const user = await createUser(request);
	const a = await api(request, user, 'POST', '/goals', { title: 'Alpha', motivation: '', success: '', category: 'work' });
	const b = await api(request, user, 'POST', '/goals', { title: 'Beta', motivation: '', success: '', category: 'work' });
	await signIn(page, user, '/app/weekly');
	await expect(page.getByRole('heading', { name: /Plan the week of/, level: 1 })).toBeVisible();
	await expect(page.getByText('The week that happened')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/weekly.png`, fullPage: true });

	await page.getByPlaceholder('Priority 1').fill('Ship the port');
	await page.getByPlaceholder('Priority 2').fill('Sleep');
	await page.getByLabel('Order of Beta').fill('1');
	await page.getByLabel('Order of Alpha').fill('2');
	await page.getByLabel(/Deload/).check();
	await page.getByRole('button', { name: 'Save the week' }).click();

	await expect(page).toHaveURL(/saved=1/);
	await expect(page.getByRole('status')).toContainText('Saved.');
	await expect(page.getByPlaceholder('Priority 1')).toHaveValue('Ship the port');
	await expect(page.getByLabel(/Deload/)).toBeChecked();
	await expect(page.getByLabel('Order of Beta')).toHaveValue('1');

	const review = await api(request, user, 'GET', '/weekly/review');
	expect(review.current.volume).toBe('deload');
	expect(review.goals.map((g: { id: string }) => g.id).slice(0, 2)).toEqual([b.id, a.id]);
});

test('weekly: a priority that is too long comes back with the message', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/weekly');
	await page.getByPlaceholder('Priority 1').fill('x'.repeat(130));
	await page.getByRole('button', { name: 'Save the week' }).click();
	await expect(page.getByText('Keep each priority under 120 characters.')).toBeVisible();
	await expect(page.getByPlaceholder('Priority 1')).toHaveValue('x'.repeat(130));
});
