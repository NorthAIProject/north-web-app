import { expect, test } from '@playwright/test';
import { createUser, signIn } from './helpers';

test('signed-out /app goes to sign-in and back', async ({ page, request }) => {
	const user = await createUser(request);
	await page.goto('/app');
	await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
	await signIn(page, user, '/app');
	await expect(page).toHaveURL(/\/app$/);
	await expect(page.getByRole('link', { name: 'My Day' }).first()).toBeVisible();
});

test('command palette finds a page', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user);
	await page.waitForLoadState('networkidle');
	await page.keyboard.press('ControlOrMeta+k');
	await page.getByRole('combobox').fill('nutr');
	await expect(page.getByRole('option').first()).toBeVisible();
});

test('sign out ends the session', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user);
	await page.getByRole('button', { name: 'Sign out' }).click();
	await page.goto('/app');
	await expect(page).toHaveURL(/\/login/);
});
