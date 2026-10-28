import { expect, test, type APIRequestContext } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Profiles (/app/u/{handle}, workouts, one workout, follow/unfollow) and the
// friends leaderboard. Two users: the one viewed and the viewer.

async function withHandle(request: APIRequestContext, name: string): Promise<TestUser & { handle: string }> {
	const user = await createUser(request, { name });
	const handle = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20);
	await api(request, user, 'PUT', '/social/handle', { handle });
	return { ...user, handle };
}

async function logWorkout(request: APIRequestContext, user: TestUser) {
	await api(request, user, 'PUT', '/calculator/biometrics', {
		weightKg: 75,
		heightCm: 178,
		dateOfBirth: '1990-01-01',
		sex: 'male'
	});
	return api(request, user, 'POST', '/activity/log', { activityCode: 'strength_training', durationMinutes: 30 });
}

test('a profile renders, follow and unfollow work', async ({ page, request }) => {
	const owner = await withHandle(request, 'Ada Lovelace');
	const viewer = await createUser(request, { name: 'Viewer' });
	await signIn(page, viewer, `/app/u/${owner.handle}`);

	await expect(page.getByRole('heading', { level: 1, name: 'Ada Lovelace' })).toBeVisible();
	await expect(page.getByText('@' + owner.handle, { exact: true })).toBeVisible();
	await expect(page.getByText('AL', { exact: true })).toBeVisible();
	await expect(page.getByText('No workouts yet.')).toBeVisible();
	await expect(page).toHaveTitle(new RegExp('@' + owner.handle));

	await page.getByRole('button', { name: 'Follow' }).click();
	await expect(page.getByRole('button', { name: 'Unfollow' })).toBeVisible();
	await expect(page.getByText(/^1\s+Follower$/)).toBeVisible();

	await page.getByRole('button', { name: 'Unfollow' }).click();
	await expect(page.getByRole('button', { name: 'Follow' })).toBeVisible();
	await expect(page.getByText(/^0\s+Followers$/)).toBeVisible();
});

test('own profile has no follow button; unknown handle is 404', async ({ page, request }) => {
	const owner = await withHandle(request, 'Self Viewer');
	await signIn(page, owner, `/app/u/${owner.handle}`);
	await expect(page.getByRole('heading', { level: 1, name: 'Self Viewer' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Follow' })).toHaveCount(0);

	const res = await page.goto('/app/u/nobody_has_this_1');
	expect(res?.status()).toBe(404);
});

test('workouts list and one workout render', async ({ page, request }) => {
	const owner = await withHandle(request, 'Grace Hopper');
	const session = (await logWorkout(request, owner)) as { id: string };
	const viewer = await createUser(request);
	await signIn(page, viewer, `/app/u/${owner.handle}`);

	await expect(page.getByTestId('workout-card')).toHaveCount(1);
	await page.locator(`a[href="/app/u/${owner.handle}/workouts"]`).click();
	await expect(page).toHaveURL(new RegExp(`/app/u/${owner.handle}/workouts$`));
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Grace Hopper · Workouts/);
	await expect(page.getByTestId('workout-card')).toHaveCount(1);

	await page.getByTestId('workout-card').getByRole('link').click();
	await expect(page).toHaveURL(new RegExp(`/workouts/${session.id}$`));
	await expect(page.getByText(/Grace Hopper · /)).toBeVisible();
	await expect(page.getByRole('link', { name: '← Back to profile' })).toBeVisible();
});

test('leaderboard renders and switches boards', async ({ page, request }) => {
	const user = await withHandle(request, 'Board Member');
	await signIn(page, user, '/app/friends/leaderboard');
	await expect(page.getByRole('heading', { level: 1, name: 'Leaderboard' })).toBeVisible();
	await expect(page.getByText('Level 1', { exact: true })).toBeVisible();
	await expect(page.getByText(/XP this week/).first()).toBeVisible();
	await expect(page.getByText('(you)')).toBeVisible();
	// XP sharing is off by default, so the hint names the switch.
	await expect(page.getByText('Your XP and level')).toBeVisible();

	const boardNav = page.getByRole('navigation', { name: 'Boards' });
	await boardNav.getByRole('link', { name: 'Streak' }).click();
	await expect(page).toHaveURL(/board=streak/);
	await expect(boardNav.getByRole('link', { name: 'Streak' })).toHaveAttribute('aria-current', 'page');
	await expect(page.getByText(/^\d+ days?$/)).toBeVisible();
});
