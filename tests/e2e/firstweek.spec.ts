import { expect as baseExpect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// The first week. The local API runs with FIRST_WEEK_ENABLED off, so no week
// can be started here: these cover the routes and the card's absence. The
// card's day-by-day decisions are unit tests (src/lib/features/firstweek).
const expect = baseExpect.configure({ timeout: 20_000 });
test.describe.configure({ timeout: 90_000, retries: 2 });

test('no card without a running week, on My Day and the Overview', async ({ page, request }) => {
	const user = await createUser(request);
	const week = await api(request, user, 'GET', '/first-week');
	test.skip(week.status === 'active', 'this API has first weeks on');
	await signIn(page, user, '/app');
	await expect(page.getByTestId('day-rail')).toBeVisible();
	await expect(page.getByTestId('first-week-card')).toHaveCount(0);
	await page.goto('/app/overview');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByTestId('first-week-card')).toHaveCount(0);
});

test('the card route and a review that is not ready land on My Day', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	await page.goto('/app/first-week');
	await expect(page).toHaveURL(/\/app$/);
	await page.goto('/app/first-week/review');
	await expect(page).toHaveURL(/\/app$/);
});
