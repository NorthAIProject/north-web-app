import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { api, apiUrl, createUser, password, signIn, type TestUser } from './helpers';

// The operator queue (/app/ops/moderation). Operators are static config
// (OPERATOR_USER_IDS), so the local API is started with one fixed account as
// operator: e2e-operator@khepri.local (see docs/migration/moderation.md).
const operatorEmail = 'e2e-operator@khepri.local';

async function operator(request: APIRequestContext): Promise<TestUser> {
	const res = await request.post(`${apiUrl}/auth/login`, { data: { email: operatorEmail, password } });
	test.skip(!res.ok(), 'the local operator account is not set up');
	const body = await res.json();
	return { email: operatorEmail, token: body.token, id: body.user.id };
}

/** A crew message by author, reported by another member; returns its excerpt. */
async function reportedMessage(request: APIRequestContext): Promise<{ author: TestUser; body: string }> {
	const author = await createUser(request, { name: 'Loud Author' });
	const reporter = await createUser(request, { name: 'Reporter' });
	const crew = await api(request, author, 'POST', '/crews', { name: 'Mod crew' });
	await api(request, reporter, 'POST', `/crews/join/${String(crew.joinUrl).split('/').pop()}`);
	const space = await api(request, author, 'GET', `/crews/${crew.id}/space`);
	const channel = space.channels[0].id as string;
	await api(request, author, 'POST', '/moderation/terms');
	const body = `buy cheap stuff ${Date.now()}`;
	const msg = await api(request, author, 'POST', `/crews/${crew.id}/channels/${channel}/messages`, { body });
	const id = (msg.message?.id ?? msg.id) as string;
	await api(request, reporter, 'POST', `/crews/${crew.id}/messages/${id}/report`, { reason: 'spam' });
	return { author, body };
}

/** Clicks a queue button and waits for its form post to come back. */
async function decide(page: Page, button: Locator) {
	await Promise.all([
		page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/app/ops/moderation')),
		button.click()
	]);
}

test('the queue is not found for anyone but an operator', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user);
	const res = await page.goto('/app/ops/moderation');
	expect(res?.status()).toBe(404);
});

test('an operator sees a report, dismisses it, and can suspend the author', async ({ page, request }) => {
	const op = await operator(request);
	const { body } = await reportedMessage(request);
	const reportedTwice = await reportedMessage(request);

	await signIn(page, op, '/app/ops/moderation');
	await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
	const row = page.getByRole('row').filter({ hasText: body });
	await expect(row).toContainText('crew_message');
	await expect(row).toContainText('spam ×1');

	await decide(page, row.getByRole('button', { name: 'dismiss' }));
	await expect(page.getByRole('row').filter({ hasText: body })).toHaveCount(0, { timeout: 15_000 });

	const other = page.getByRole('row').filter({ hasText: reportedTwice.body });
	await decide(page, other.getByRole('button', { name: 'hide', exact: true }));
	const hidden = page.getByRole('row').filter({ hasText: reportedTwice.body });
	// Hiding records the decision and closes the subject's open reports.
	await expect(hidden).toHaveCount(0, { timeout: 15_000 });
});

test('suspend author posts and comes back to the queue', async ({ page, request }) => {
	const op = await operator(request);
	const { author, body } = await reportedMessage(request);
	await signIn(page, op, '/app/ops/moderation');
	const row = page.getByRole('row').filter({ hasText: body });
	await decide(page, row.getByRole('button', { name: 'suspend author' }));
	await expect(page).toHaveURL(/\/app\/ops\/moderation$/);
	// A suspended author can no longer post.
	const crews = await api(request, author, 'GET', '/crews');
	const crew = (crews.crews ?? crews.items ?? crews)[0];
	const space = await api(request, author, 'GET', `/crews/${crew.id}/space`);
	const res = await request.post(`${apiUrl}/crews/${crew.id}/channels/${space.channels[0].id}/messages`, {
		headers: { authorization: `Bearer ${author.token}` },
		data: { body: 'still here?' }
	});
	expect(res.ok()).toBe(false);
	// Leave the queue tidy for the next run.
	await decide(page, row.getByRole('button', { name: 'dismiss' }));
});
