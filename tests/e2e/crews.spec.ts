import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Crews: list + create, the space and its chat, channels, the live stream,
// and the challenge tab's owner/admin forms (Go: internal/crews handlers).

type Crew = { id: string; name: string; joinUrl: string };
type Space = { channels: { id: string; name: string; default?: boolean }[] };

async function makeCrew(request: APIRequestContext, owner: TestUser, name = 'Morning runners'): Promise<Crew> {
	return api(request, owner, 'POST', '/crews', { name });
}

async function join(request: APIRequestContext, user: TestUser, crew: Crew) {
	const code = crew.joinUrl.split('/').pop()!;
	await api(request, user, 'POST', `/crews/join/${code}`);
}

async function general(request: APIRequestContext, user: TestUser, crew: Crew) {
	const space: Space = await api(request, user, 'GET', `/crews/${crew.id}/space`);
	return space.channels.find((c) => c.default)!;
}

const acceptTerms = (request: APIRequestContext, user: TestUser) => api(request, user, 'POST', '/moderation/terms');

/** Opens a message's action menu. */
async function menuFor(page: Page, text: string) {
	const row = page.locator('article', { hasText: text });
	await row.hover();
	await row.getByRole('button', { name: 'Message actions' }).click();
}

test('list and create a crew', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/crews');
	await expect(page.getByRole('heading', { name: 'Crews', level: 1 })).toBeVisible();
	await page.getByLabel('Name').fill('Lunch lifters');
	await page.getByRole('button', { name: 'Create' }).click();
	// The first visit compiles the space page in dev; allow for it.
	await expect(page).toHaveURL(/\/app\/crews\/[0-9a-f-]{36}$/, { timeout: 15_000 });
	await expect(page.getByRole('heading', { name: 'general', level: 1 })).toBeVisible();
	await expect(page.locator('#crew-channels')).toContainText('general');

	await page.goto('/app/crews');
	await expect(page.getByRole('link', { name: 'Lunch lifters' })).toBeVisible();
	await expect(page.getByText('1 person')).toBeVisible();
});

test('create refuses an empty name', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/crews');
	await page.getByRole('button', { name: 'Create' }).click();
	await expect(page.locator('p.text-destructive')).toBeVisible();
	await expect(page).toHaveURL(/\/app\/crews$/);
});

test('first post asks for the crew rules, then send, edit, react, pin and delete', async ({ page, request }) => {
	const user = await createUser(request);
	const crew = await makeCrew(request, user);
	await signIn(page, user, `/app/crews/${crew.id}`);

	const box = page.getByRole('textbox', { name: 'Message #general' });
	await box.fill('hello crew');
	await box.press('Enter');
	await expect(page.getByRole('dialog')).toContainText('Crew rules');
	await page.getByRole('button', { name: 'I agree' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();

	await box.fill('hello crew');
	await box.press('Enter');
	await expect(page.locator('#crew-messages article', { hasText: 'hello crew' })).toBeVisible();
	await expect(box).toHaveValue('');

	await menuFor(page, 'hello crew');
	await page.getByRole('menuitem', { name: 'Edit' }).click();
	const editor = page.getByRole('textbox', { name: 'Edit' });
	await editor.fill('hello again crew');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.locator('article', { hasText: 'hello again crew' })).toContainText('(edited)');

	await menuFor(page, 'hello again crew');
	await page.getByRole('menuitem', { name: 'React with 🔥' }).click();
	await expect(page.locator('article', { hasText: 'hello again crew' }).getByRole('button', { name: '🔥 1' })).toBeVisible();

	await menuFor(page, 'hello again crew');
	await page.getByRole('menuitem', { name: 'Pin', exact: true }).click();
	await expect(page.locator('article', { hasText: 'hello again crew' })).toContainText('Pinned');
	await page.getByRole('button', { name: 'Pinned messages' }).click();
	await expect(page.locator('#crew-pins-body')).toContainText('hello again crew');
	await page.keyboard.press('Escape');

	await menuFor(page, 'hello again crew');
	await page.getByRole('menuitem', { name: 'Delete' }).click();
	await expect(page.getByText('This message was deleted.')).toBeVisible();
});

test('an owner makes, edits and deletes a channel', async ({ page, request }) => {
	const user = await createUser(request);
	const crew = await makeCrew(request, user);
	await signIn(page, user, `/app/crews/${crew.id}`);

	await page.locator('#crew-channels').waitFor();
	await page.locator('aside').getByRole('button', { name: 'New channel' }).click();
	await page.getByLabel('Channel name').fill('lifting');
	await page.getByLabel('Topic (optional)').fill('Heavy things');
	await page.getByRole('button', { name: 'Create channel' }).click();
	await expect(page).toHaveURL(/\/c\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { name: 'lifting', level: 1 })).toBeVisible();
	await expect(page.getByText('Heavy things')).toBeVisible();

	await page.getByRole('button', { name: 'Edit channel' }).click();
	await page.getByLabel('Topic (optional)').fill('Squats mostly');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.locator('#crew-pane header')).toContainText('Squats mostly');

	await page.getByRole('button', { name: 'Edit channel' }).click();
	await page.getByRole('button', { name: 'Delete channel' }).click();
	await expect(page).toHaveURL(new RegExp(`/app/crews/${crew.id}$`));
	await expect(page.locator('#crew-channels')).not.toContainText('lifting');
});

test('a crewmate joins and their message arrives live', async ({ page, request }) => {
	const owner = await createUser(request, { name: 'Olive Owner' });
	const mate = await createUser(request, { name: 'Mo Mate' });
	const crew = await makeCrew(request, owner);
	await join(request, mate, crew);
	await acceptTerms(request, mate);
	const ch = await general(request, mate, crew);

	await signIn(page, owner, `/app/crews/${crew.id}`);
	await expect(page.locator('#crew-pane header')).toContainText('2 people');
	// The stream is open once the page has hydrated; give it a moment to subscribe.
	await page.waitForTimeout(1000);
	await api(request, mate, 'POST', `/crews/${crew.id}/channels/${ch.id}/messages`, { body: 'morning all' });
	await expect(page.locator('#crew-messages article', { hasText: 'morning all' })).toBeVisible({ timeout: 10_000 });
	await expect(page.locator('#crew-messages article', { hasText: 'morning all' })).toContainText('Mo Mate');

	// A reaction from the mate redraws the row through the stream.
	const page1 = await api(request, mate, 'GET', `/crews/${crew.id}/channels/${ch.id}/messages`);
	const id = page1.messages.find((m: { body: string }) => m.body === 'morning all').id;
	await api(request, mate, 'PUT', `/crews/${crew.id}/messages/${id}/reactions/clap`);
	await expect(page.locator(`#m-${id}`).getByRole('button', { name: '👏 1' })).toBeVisible({ timeout: 10_000 });

	// Reporting it takes it off the reporter's page.
	await menuFor(page, 'morning all');
	await page.getByRole('menuitem', { name: 'Report' }).click();
	await page.getByLabel('Spam').check();
	await page.getByRole('button', { name: 'Send report' }).click();
	await expect(page.locator(`#m-${id}`)).toHaveCount(0);
});

test('challenge tab: set a challenge, make an admin, remove a member, leave', async ({ page, request }) => {
	const owner = await createUser(request);
	const mate = await createUser(request, { name: 'Mo Mate' });
	const crew = await makeCrew(request, owner, 'Board crew');
	await join(request, mate, crew);

	await signIn(page, owner, `/app/crews/${crew.id}/challenge`);
	await expect(page.locator('#crew-pane h1.text-2xl')).toHaveText('Board crew');
	await expect(page.getByText('No challenge this week.')).toBeVisible();
	await expect(page.locator('#crew-board-url')).toHaveValue(crew.joinUrl);

	await page.locator('#kind').click();
	await page.getByRole('option', { name: 'Workouts' }).click();
	await page.getByLabel('Times a week').fill('4');
	await page.getByRole('button', { name: 'Set', exact: true }).click();
	await expect(page.getByText('4 workouts each, Monday to Sunday.')).toBeVisible();
	await expect(page.getByText('0/4').first()).toBeVisible();

	const mateRow = page.locator('li', { hasText: 'Mo Mate' });
	await mateRow.getByRole('button', { name: 'Make admin' }).click();
	await expect(mateRow).toContainText('admin');
	await expect(mateRow.getByRole('button', { name: 'Remove admin' })).toBeVisible();

	await mateRow.getByRole('button', { name: 'Remove', exact: true }).click();
	await expect(page.locator('li', { hasText: 'Mo Mate' })).toHaveCount(0);

	await page.getByRole('button', { name: 'Leave crew' }).click();
	await expect(page).toHaveURL(/\/app\/crews$/);
	await expect(page.getByRole('link', { name: 'Board crew' })).toHaveCount(0);
});

test('notification settings save from the crew menu', async ({ page, request }) => {
	const user = await createUser(request);
	const crew = await makeCrew(request, user);
	await signIn(page, user, `/app/crews/${crew.id}`);
	await page.locator('aside').getByRole('button', { name: 'Crew menu' }).click();
	await page.getByRole('menuitem', { name: 'Notifications' }).click();
	await page.getByLabel('Nothing').check();
	await page.getByLabel('For a day').check();
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
	const space = await api(request, user, 'GET', `/crews/${crew.id}/space`);
	expect(space.notify).toBe('none');
	expect(space.mutedUntil).toBeTruthy();
});

test('a crew you are not in is not found', async ({ page, request }) => {
	const owner = await createUser(request);
	const other = await createUser(request);
	const crew = await makeCrew(request, owner);
	await signIn(page, other);
	const res = await page.goto(`/app/crews/${crew.id}`);
	expect(res?.status()).toBe(404);
});
