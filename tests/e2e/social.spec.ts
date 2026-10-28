import { expect, test, type APIRequestContext } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Following earns medals (First Follower); the shell's unlock dialog then opens
// over the page, as in Go. Close it so the next click lands.
test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

// The social slice: /app/friends and every form on it, the phone card (the
// local API runs the dev verifier, which accepts 000000), Facebook unconfigured,
// the invite and crew landing pages, and /app redeeming their cookies.

// The dev server is shared with other ports in progress and slows under load.
test.describe.configure({ timeout: 90_000 });

const handleFor = (prefix: string) =>
	`${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

async function withHandle(request: APIRequestContext, user: TestUser, prefix: string) {
	const handle = handleFor(prefix);
	await api(request, user, 'PUT', '/social/handle', { handle });
	return handle;
}

test('friends page renders its cards', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/friends');
	await expect(page.getByRole('heading', { level: 1, name: 'Friends' })).toBeVisible();
	await expect(page).toHaveTitle(/Friends · Khepri/);
	await expect(page.locator('#feed')).toBeVisible();
	await expect(page.locator('#invite-url')).toHaveValue(/\/i\/[a-z0-9]+$/);
	await expect(page.getByRole('link', { name: /X/ }).first()).toHaveAttribute(
		'href',
		/x\.com\/intent\/post/
	);
	await expect(page.locator('#sharing')).toBeVisible();
	// No Meta app locally: the Facebook card is not offered.
	await expect(page.locator('#facebook')).toHaveCount(0);
});

test('set a handle, and a taken-format one is refused', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/friends');
	await page.locator('#handle').fill('x');
	await page.locator('form[action$="?/handle"] button[type=submit]').click();
	await expect(page.locator('form[action$="?/handle"] p.text-red-500')).toBeVisible();

	const handle = handleFor('h');
	await page.locator('#handle').fill(handle);
	await page.locator('form[action$="?/handle"] button[type=submit]').click();
	await expect(page.locator('#handle')).toHaveValue(handle);
	await expect(page.getByRole('link', { name: /profile/i })).toHaveAttribute(
		'href',
		`/app/u/${handle}`
	);
	const overview = await api(request, user, 'GET', '/social');
	expect(overview.handle).toBe(handle);
});

test('follow by handle, unknown handle, unfollow, block and unblock', async ({ page, request }) => {
	const me = await createUser(request, { name: 'Ana Me' });
	const them = await createUser(request, { name: 'Bea Them' });
	const theirs = await withHandle(request, them, 'b');

	await signIn(page, me, '/app/friends');
	await page.locator('#follow').fill('@nobody' + Date.now());
	await page.locator('form[action$="?/follow"] button[type=submit]').last().click();
	await expect(page.getByText('Nobody has that handle.')).toBeVisible();

	await page.locator('#follow').fill('@' + theirs);
	await page.locator('form[action$="?/follow"] button[type=submit]').last().click();
	const row = page.locator('li', { hasText: '@' + theirs });
	await expect(row).toBeVisible();
	await expect(row.getByRole('link', { name: 'Bea Them' })).toHaveAttribute(
		'href',
		`/app/u/${theirs}`
	);

	// They see me as a follower.
	const theirView = await api(request, them, 'GET', '/social');
	expect(theirView.followers.map((p: { id: string }) => p.id)).toContain(me.id);

	await row.getByRole('button', { name: 'Unfollow' }).click();
	await expect(page.locator('li', { hasText: '@' + theirs })).toHaveCount(0);

	// Follow again, then block from the following list and unblock.
	await api(request, me, 'POST', '/follows', { handle: theirs });
	await page.reload();
	await page.waitForLoadState('networkidle');
	await page
		.locator('li', { hasText: '@' + theirs })
		.getByRole('button', { name: 'Block' })
		.click();
	await expect(page.getByText('Blocked')).toBeVisible();
	await page
		.locator('li', { hasText: '@' + theirs })
		.getByRole('button', { name: 'Unblock' })
		.click();
	await expect(page.locator('li', { hasText: '@' + theirs })).toHaveCount(0);
});

test('remove a follower', async ({ page, request }) => {
	const me = await createUser(request);
	const fan = await createUser(request, { name: 'Fan Person' });
	const mine = await withHandle(request, me, 'm');
	await api(request, fan, 'POST', '/follows', { handle: mine });

	await signIn(page, me, '/app/friends');
	const row = page.locator('li', { hasText: 'Fan Person' });
	await row.getByRole('button', { name: 'Remove' }).click();
	await expect(page.locator('li', { hasText: 'Fan Person' })).toHaveCount(0);
	const fanView = await api(request, fan, 'GET', '/social');
	expect(fanView.following).toHaveLength(0);
});

test('give kudos on a friend’s moment and take it back', async ({ page, request }) => {
	const me = await createUser(request);
	const friend = await createUser(request, { name: 'Kudo Friend' });
	const theirs = await withHandle(request, friend, 'k');
	await api(request, me, 'POST', '/follows', { handle: theirs });
	const goal = await api(request, friend, 'POST', '/goals', {
		title: 'Run 5k',
		motivation: 'health',
		success: 'done',
		category: 'fitness'
	});
	await api(request, friend, 'PUT', `/goals/${goal.id}/status`, { status: 'achieved' });

	await signIn(page, me, '/app/friends');
	const item = page.locator('#feed li[data-feed-item]', { hasText: 'Run 5k' });
	await expect(item).toBeVisible();
	await item.getByRole('button', { name: 'Give kudos' }).click();
	await expect(item.getByRole('button', { name: 'Kudos · 1' })).toBeVisible();
	await item.getByRole('button', { name: 'Kudos · 1' }).click();
	await expect(item.getByRole('button', { name: 'Give kudos' })).toBeVisible();
});

test('sharing switches save', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/friends');
	const xp = page.locator('#share_xp');
	await expect(xp).toHaveAttribute('aria-checked', 'false');
	await xp.click();
	await page.locator('#sharing button[type=submit]').click();
	await expect.poll(async () => (await api(request, user, 'GET', '/social/sharing')).xp).toBe(true);
	await page.reload();
	await page.waitForLoadState('networkidle');
	await expect(page.locator('#share_xp')).toHaveAttribute('aria-checked', 'true');
});

test('verify a phone number with the dev code, then remove it', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/friends');
	const card = page.locator('#phone-card');
	await expect(card).toBeVisible();
	// Lisbon timezone preselects Portugal.
	await expect(card.locator('#countryCode')).toContainText('+351');
	const number = '91' + String(Date.now()).slice(-7);
	await card.locator('#phone').fill(number);
	await card.getByRole('button', { name: 'Text me a code' }).click();
	const slot = card.locator('#code-container input:not([type=hidden])').first();
	await expect(slot).toBeVisible();

	// A wrong code is refused next to the field.
	await slot.click();
	await page.keyboard.type('123456');
	await card.getByRole('button', { name: 'Verify', exact: true }).click();
	await expect(card.locator('p.text-red-500')).toBeVisible();

	await expect(slot).toHaveValue('');
	await slot.click();
	await page.keyboard.type('000000');
	await card.getByRole('button', { name: 'Verify', exact: true }).click();
	await expect(card.getByText('+351' + number, { exact: true })).toBeVisible();

	await card.getByRole('button', { name: 'Remove' }).click();
	await expect(card.getByText('+351' + number, { exact: true })).toHaveCount(0);
});

test('cancel a pending phone code', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'POST', '/social/phone/verification', {
		phone: '+35191' + String(Date.now()).slice(-7),
		countryCode: ''
	});
	await signIn(page, user, '/app/friends');
	const card = page.locator('#phone-card');
	await card.locator('form[action$="?/phoneCancel"] button').click();
	await expect(card.locator('#phone')).toBeVisible();
});

test('facebook connect is not found without a Meta app', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/friends');
	const res = await page.goto('/app/friends/facebook/connect');
	expect(res?.status()).toBe(404);
});

test('invite link: signed-out landing, then redeemed on the first /app page', async ({
	page,
	request
}) => {
	const inviter = await createUser(request, { name: 'Ivo Inviter' });
	const { invite } = await api(request, inviter, 'GET', '/social');
	const guest = await createUser(request);

	await page.goto(`/i/${invite.code}`);
	await expect(page.getByText('Ivo Inviter invited you to Khepri')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Create your account' })).toHaveAttribute(
		'href',
		'/signup'
	);
	const cookie = (await page.context().cookies()).find((c) => c.name === 'north_invite');
	expect(cookie?.value).toBe(invite.code);

	await signIn(page, guest, '/app');
	const after = (await page.context().cookies()).find((c) => c.name === 'north_invite');
	expect(after).toBeUndefined();
	const view = await api(request, inviter, 'GET', '/social');
	expect(view.joined).toBe(1);
});

test('invite link while signed in goes straight to friends', async ({ page, request }) => {
	const inviter = await createUser(request);
	const { invite } = await api(request, inviter, 'GET', '/social');
	const guest = await createUser(request);
	await signIn(page, guest, '/app');
	await page.goto(`/i/${invite.code}`);
	await expect(page).toHaveURL(/\/app\/friends$/);
});

test('unknown invite link is not found', async ({ page }) => {
	const res = await page.goto('/i/doesnotexist0');
	expect(res?.status()).toBe(404);
});

test('crew link: signed-out landing, then joined on the first /app page', async ({
	page,
	request
}) => {
	const owner = await createUser(request);
	const crew = await api(request, owner, 'POST', '/crews', { name: 'Dawn Runners' });
	const code = String(crew.joinUrl).split('/i/c/')[1];
	const guest = await createUser(request);

	await page.goto(`/i/c/${code}`);
	await expect(page.getByText('Join Dawn Runners on Khepri')).toBeVisible();
	const cookie = (await page.context().cookies()).find((c) => c.name === 'north_crew');
	expect(cookie?.value).toBe(code);

	await signIn(page, guest, '/app');
	const list = await api(request, guest, 'GET', '/crews');
	const crews = Array.isArray(list) ? list : list.crews;
	expect(crews.map((c: { id: string }) => c.id)).toContain(crew.id);
});
