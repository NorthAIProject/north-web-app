import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

const shots = process.env.E2E_SHOTS;

// The shell's award unlock dialog can open over the page after a write; close it.
test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

test('mind: empty instruments, then a journal entry with a mood', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/mind');
	await expect(page.getByRole('heading', { name: "How you've been", level: 1 })).toBeVisible();
	await expect(page.getByText('No check-ins yet in this window.')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/mind-empty.png`, fullPage: true });

	// A blank entry is refused.
	await page.getByRole('button', { name: 'Save entry' }).click();
	await expect(page.getByText('Write something.')).toBeVisible();

	await page.getByLabel('Reflection').fill('Calm day by the sea.');
	await page.locator('#mood').click();
	await page.getByRole('option', { name: '4/5' }).click();
	await page.getByRole('button', { name: 'Save entry' }).click();
	await expect(page.locator('[data-journal-entry]')).toHaveCount(1);
	await expect(page.locator('[data-journal-entry]')).toContainText('Calm day by the sea.');
	await expect(page.locator('[data-journal-entry]')).toContainText('· mood 4/5');
	await expect(page.getByLabel('Reflection')).toHaveValue('');
});

test('mind: the instruments read the check-ins', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'PUT', '/check-ins/today', { mood: 4, energy: 3, wins: '', challenges: '', notes: '', tags: [] });
	await signIn(page, user, '/app/mind');
	await expect(page.getByText('4.0/5')).toBeVisible();
	await expect(page.getByText('3.0/5')).toBeVisible();
	await expect(page.getByText('1 in 14d')).toBeVisible();
	await expect(page.locator('[data-mood-energy-chart] svg').first()).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/mind.png`, fullPage: true });
});
