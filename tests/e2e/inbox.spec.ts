import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// The inbox (/app/inbox): capture a thought, then file or dismiss it.

test('inbox renders empty and refuses an empty capture', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/inbox');
	await expect(page).toHaveTitle(/Inbox · Khepri/);
	await expect(page.getByText('Nothing waiting.')).toBeVisible();
	await page.getByRole('button', { name: 'Save to Inbox' }).click();
	await expect(page.locator('#text')).toHaveAttribute('aria-invalid', 'true');
});

test('a saved thought waits, then files to the journal', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/inbox');
	await page
		.getByPlaceholder('A thought, a link, something that happened…')
		.fill('Slept badly, legs heavy');
	await page.getByRole('button', { name: 'Save to Inbox' }).click();
	const item = page.locator('[data-inbox-item]');
	await expect(item).toContainText('Slept badly, legs heavy');
	await expect(page.getByText('1 waiting')).toBeVisible();
	await item.getByRole('button', { name: 'Journal', exact: true }).click();
	await expect(page.getByText('Nothing waiting.')).toBeVisible();
	await expect(item).toHaveCount(0);
});

test('a thought can be dismissed', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'POST', '/inbox', { text: 'Not worth keeping', source: 'web' });
	await signIn(page, user, '/app/inbox');
	const item = page.locator('[data-inbox-item]');
	await expect(item).toContainText('Not worth keeping');
	await item.getByRole('button', { name: 'Dismiss' }).click();
	await expect(item).toHaveCount(0);
	await expect(page.getByText('Nothing waiting.')).toBeVisible();
});
