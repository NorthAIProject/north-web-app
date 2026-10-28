import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { createUser, signIn, type TestUser } from './helpers';

// The header's nudge bell and the /app/nudges/{id}/* routes. Nudges come from
// background jobs, so the tests write them straight into the database.

const databaseUrl =
	process.env.NORTH_DATABASE_URL ?? 'postgres://north:north@localhost:5434/north?sslmode=disable';

function seedNudge(user: TestUser, title: string, href = '/app/inbox'): string {
	const key = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const out = execFileSync(
		'psql',
		[
			databaseUrl,
			'-v',
			'ON_ERROR_STOP=1',
			'-qtA',
			'-c',
			`INSERT INTO user_nudges (user_id, kind, dedupe_key, title, body, href)
			 VALUES ('${user.id}', 'e2e', '${key}', '${title}', 'From the test.', '${href}') RETURNING id`
		],
		{ encoding: 'utf8' }
	);
	return out.trim().split('\n')[0];
}

const bell = (page: Page) => page.locator('#nudge-bell');

/** The bell's unread count once it has loaded (a new account already has a welcome note). */
async function unread(page: Page): Promise<number> {
	await expect(bell(page)).toHaveAttribute('data-unread', /\d+/);
	return Number(await bell(page).getAttribute('data-unread'));
}

test('the bell lists unread nudges and dismisses one', async ({ page, request }) => {
	const user = await createUser(request);
	seedNudge(user, 'Time to stretch');
	await signIn(page, user, '/app/overview');
	const before = await unread(page);
	expect(before).toBeGreaterThan(0);
	await page.getByRole('button', { name: 'Coach notes, unread' }).click();
	const row = page.locator('[data-nudge]').filter({ hasText: 'Time to stretch' });
	await expect(row).toBeVisible();
	await expect(page.getByText(before === 1 ? '1 new' : `${before} new`)).toBeVisible();
	await row.getByRole('button', { name: 'Dismiss' }).click();
	await expect(row).toHaveCount(0);
	await expect(bell(page)).toHaveAttribute('data-unread', String(before - 1));
});

test('opening a nudge marks it read and follows its link', async ({ page, request }) => {
	const user = await createUser(request);
	seedNudge(user, 'Clear your inbox', '/app/inbox');
	await signIn(page, user, '/app/overview');
	const before = await unread(page);
	await page.getByRole('button', { name: 'Coach notes, unread' }).click();
	await page
		.locator('[data-nudge]')
		.filter({ hasText: 'Clear your inbox' })
		.getByText('Clear your inbox')
		.click();
	await expect(page).toHaveURL(/\/app\/inbox$/);
	await expect(bell(page)).toHaveAttribute('data-unread', String(before - 1));
});

test('the push open route reads the nudge and redirects; an unknown one goes home', async ({
	page,
	request
}) => {
	const user = await createUser(request);
	const id = seedNudge(user, 'From a push', '/app/inbox');
	await signIn(page, user, '/app/overview');
	const before = await unread(page);
	await page.goto(`/app/nudges/${id}/open?from=push`);
	await expect(page).toHaveURL(/\/app\/inbox$/);
	await expect(bell(page)).toHaveAttribute('data-unread', String(before - 1));
	await page.goto('/app/nudges/00000000-0000-0000-0000-000000000000/open');
	await expect(page).toHaveURL(/\/app$/);
});

test('a nudge arriving while the page is open shows a toast', async ({ page, request }) => {
	test.setTimeout(60_000);
	const user = await createUser(request);
	await signIn(page, user, '/app/overview');
	await unread(page);
	seedNudge(user, 'Fresh from the coach');
	await expect(page.locator('[data-nudge-toast]')).toContainText('Fresh from the coach', {
		timeout: 30_000
	});
});
