import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { createUser, signIn, webUrl, type TestUser } from './helpers';

// The header widgets: the agent pill and the awards unlock host.

const databaseUrl =
	process.env.NORTH_DATABASE_URL ?? 'postgres://north:north@localhost:5434/north?sslmode=disable';

function sql(statement: string): string {
	return execFileSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-qtA', '-c', statement], {
		encoding: 'utf8'
	});
}

/** Grants the first-workout badge without its celebration, as the awards job would. */
function earnBadge(user: TestUser) {
	sql(`INSERT INTO achievements (user_id, category, kind, title, occurred_at, source_key)
	     VALUES ('${user.id}', 'awards', 'badge_earned', 'First Workout', now(), 'workouts_1')`);
}

function celebrated(user: TestUser): boolean {
	return (
		sql(
			`SELECT celebrated_at IS NOT NULL FROM achievements WHERE user_id='${user.id}' AND source_key='workouts_1'`
		).trim() === 't'
	);
}

test('a person with no agent sees the connect pill', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/overview');
	await expect(page.getByRole('link', { name: /Connect your Agent/ }).first()).toHaveAttribute(
		'href',
		'/app/settings/connections'
	);
});

test('an unseen badge opens the unlock dialog; Done marks it seen', async ({ page, request }) => {
	const user = await createUser(request);
	earnBadge(user);
	await signIn(page, user, '/app/overview');
	const dialog = page.getByTestId('awards-unlock');
	await expect(dialog).toBeVisible();
	await expect(dialog).toContainText('You earned a medal');
	await dialog.getByRole('button', { name: 'Done' }).click();
	await expect(dialog).toBeHidden();
	await expect.poll(() => celebrated(user)).toBe(true);
	await page.reload();
	await expect(page.getByRole('heading', { name: /Hello/ })).toBeVisible();
	await expect(dialog).toHaveCount(0);
});

test('a write announces itself and the host checks for new badges', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/inbox');
	await expect(page.getByText('Nothing waiting.')).toBeVisible();
	earnBadge(user);
	// No navigation: only the enhanced form's notifyWrite can bring the dialog up.
	await page
		.getByPlaceholder('A thought, a link, something that happened…')
		.fill('A badge should follow');
	await page.getByRole('button', { name: 'Save to Inbox' }).click();
	await expect(page.getByTestId('awards-unlock')).toBeVisible();
});

test('the settings push row stays hidden when push is not configured', async ({
	page,
	request
}) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');
	await expect(page.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
	const config = await page.request.get('/api/push/config');
	const enabled = config.ok() && (await config.json()).enabled;
	await expect(page.locator('[data-push]')).toHaveCount(enabled ? 1 : 0);
});

test('a browserApi write is detected without the page announcing it', async ({ page, request }) => {
	// The page script imports a source module, which only vite dev serves.
	test.skip(webUrl !== 'http://localhost:5173', 'needs vite dev');
	const user = await createUser(request);
	await signIn(page, user, '/app/overview');
	await expect(page.getByRole('heading', { name: /Hello/ })).toBeVisible();
	await expect(page.getByTestId('awards-unlock')).toHaveCount(0);
	earnBadge(user);
	// Any successful non-GET through the /api proxy, here from page script.
	await page.evaluate(async () => {
		const { browserApi } = await import('/src/lib/api/client.ts');
		await browserApi().PUT('/check-ins/today', { body: { mood: 3, energy: 3 } } as never);
	});
	await expect(page.getByTestId('awards-unlock')).toBeVisible();
});
