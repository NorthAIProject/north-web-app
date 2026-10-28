import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// The awards page (/app/awards) and another person's (/app/u/{handle}/awards).

test('own awards page shows the challenge and locked badges', async ({ page, request }) => {
	const user = await createUser(request, { name: 'Coin Holder' });
	await signIn(page, user, '/app/awards');
	await expect(page.getByRole('heading', { level: 1, name: 'Awards' })).toBeVisible();
	await expect(page.locator('#monthly-challenge')).toBeVisible();
	await expect(page.getByText('Still to earn')).toBeVisible();
	await expect(page.locator('[data-badge="workouts_1"]')).toContainText('First Workout');
	await expect(page.locator('[data-badge="workouts_1"]')).toContainText('0/1');
	// No handle yet: no way back to a profile.
	await expect(page.getByRole('link', { name: 'Back to profile' })).toHaveCount(0);
});

test("another person's awards page and the profile shelf", async ({ page, request }) => {
	const owner = await createUser(request, { name: 'Shelf Owner' });
	const handle = `aw${Date.now().toString(36)}`;
	await api(request, owner, 'PUT', '/social/handle', { handle });
	const viewer = await createUser(request);

	await signIn(page, viewer, `/app/u/${handle}/awards`);
	await expect(page.getByRole('heading', { level: 1, name: "Shelf Owner's awards" })).toBeVisible();
	await expect(page.getByText('No awards to show yet.')).toBeVisible();
	await expect(page.getByText('Still to earn')).toHaveCount(0);
	await expect(page.locator('#monthly-challenge')).toHaveCount(0);
	await page.getByRole('link', { name: 'Back to profile' }).click();
	await expect(page).toHaveURL(new RegExp(`/app/u/${handle}$`));

	const missing = await page.goto('/app/u/nobody_has_this_2/awards');
	expect(missing?.status()).toBe(404);
});

test('own awards page links back to the profile once there is a handle', async ({ page, request }) => {
	const user = await createUser(request);
	const handle = `ah${Date.now().toString(36)}`;
	await api(request, user, 'PUT', '/social/handle', { handle });
	await signIn(page, user, '/app/awards');
	await page.getByRole('link', { name: 'Back to profile' }).click();
	await expect(page).toHaveURL(new RegExp(`/app/u/${handle}$`));
	// The owner's profile carries the month's challenge too.
	await expect(page.locator('#monthly-challenge')).toBeVisible();
});
