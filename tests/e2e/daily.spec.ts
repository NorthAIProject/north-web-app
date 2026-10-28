import { expect as baseExpect, test } from '@playwright/test';
import { createUser, signIn } from './helpers';

// The daily post (/app/daily). Posts are written by a worker job, never on
// request, so a fresh account sees the empty state; kudos run only when the
// local database already holds a post.
const expect = baseExpect.configure({ timeout: 20_000 });
test.describe.configure({ timeout: 90_000, retries: 2 });

test('the daily page renders its header, today and the disclaimer', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/daily');
	await expect(page.getByRole('heading', { level: 1, name: 'Daily post' })).toBeVisible();
	await expect(page.getByText('One short read a day on training, food, sleep and feeling well.')).toBeVisible();
	await expect(page.getByText('Not medical advice')).toBeVisible();
	const today = page.getByTestId('daily-today');
	if ((await today.count()) === 0) {
		await expect(page.getByRole('heading', { name: 'No post yet today' })).toBeVisible();
		return;
	}
	// A post exists: kudos, then take it back.
	const kudos = today.getByTestId('daily-kudos');
	const before = (await kudos.textContent())?.trim() ?? '';
	await kudos.click();
	await expect(kudos).not.toHaveText(before);
	await kudos.click();
	await expect(kudos).toHaveText(before);
	await expect(today.getByTestId('daily-ask')).toBeVisible();
});

test('the Overview shows My Day trends after the page', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/overview');
	await expect(page.getByTestId('trends')).toBeVisible();
});
