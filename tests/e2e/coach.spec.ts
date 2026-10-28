import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// The local API answers every turn with the fake provider's canned reply.
const FAKE_REPLY = /This is the fake coach/;

// The shared dev server is slow while other features compile.
test.describe.configure({ timeout: 90_000 });

const databaseUrl = process.env.NORTH_DATABASE_URL ?? 'postgres://north:north@localhost:5434/north?sslmode=disable';

/** Runs SQL against the local database, for state the API cannot arrange (a pending tool call). */
function sql(statement: string) {
	execFileSync('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-q', '-c', statement], { stdio: 'pipe' });
}

/** Leaves the conversation waiting on the coach's tool call, as a model turn that stopped to ask. */
function seedPendingCall(conversationId: string, call: { name: string; args: unknown }) {
	const calls = JSON.stringify([{ ID: `${call.name}-call`, Name: call.name, Arguments: call.args }]).replaceAll("'", "''");
	sql(
		`INSERT INTO messages (conversation_id, role, content, created_at) VALUES ('${conversationId}', 'user', 'Please do it', now() - interval '2 seconds');` +
			`INSERT INTO messages (conversation_id, role, content, tool_calls, created_at) VALUES ('${conversationId}', 'model', '', '${calls}'::jsonb, now() - interval '1 second');`
	);
}

async function emptyAccount(request: Parameters<typeof createUser>[0]): Promise<TestUser> {
	const user = await createUser(request);
	const { conversations } = await api(request, user, 'GET', '/conversations');
	for (const c of conversations) await api(request, user, 'DELETE', `/conversations/${c.id}`);
	return user;
}

async function newThread(request: Parameters<typeof createUser>[0], user: TestUser, kind = 'chat') {
	const c = await api(request, user, 'POST', '/conversations', { kind });
	return c.id as string;
}

async function send(page: Page, text: string) {
	await page.locator('#message').fill(text);
	await page.locator('#message').press('Enter');
}

test('no conversations shows the empty coach page; a starter opens a thread with it drafted', async ({ page, request }) => {
	const user = await emptyAccount(request);
	await signIn(page, user, '/app/chat');
	await expect(page).toHaveURL(/\/app\/chat$/);
	await expect(page.getByRole('heading', { name: 'Talk to your coach' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'New conversation' })).toBeVisible();

	const starter = "I want to get stronger but I don't know where to start.";
	await page.getByRole('button', { name: starter }).click();
	await expect(page).toHaveURL(/\/app\/chat\/[0-9a-f-]{36}\?draft=/);
	await expect(page.locator('#message')).toHaveValue(starter);
});

test('/app/chat opens the newest conversation', async ({ page, request }) => {
	const user = await emptyAccount(request);
	await newThread(request, user);
	const newest = await newThread(request, user);
	await signIn(page, user, '/app/chat');
	await expect(page).toHaveURL(new RegExp(`/app/chat/${newest}$`));
	await expect(page.getByRole('heading', { name: "What's on your mind?" })).toBeVisible();
	await expect(page.locator('#chat-status')).toHaveText('Ready');
	await expect(page.getByTestId('thread-list').getByRole('link')).toHaveCount(2);
});

test('sending streams the reply, then the stored turn takes its place with feedback', async ({ page, request }) => {
	const user = await emptyAccount(request);
	const id = await newThread(request, user);
	await signIn(page, user, `/app/chat/${id}`);

	// A starter fills the composer rather than sending.
	await page.getByRole('button', { name: 'Help me build a habit' }).click();
	await expect(page.locator('#message')).toHaveValue("Help me build a habit I'll actually keep.");

	await send(page, 'How do I start running?');
	await expect(page.locator('[data-role="user"]').getByText('How do I start running?')).toBeVisible();
	await expect(page.locator('[data-role="coach"]').getByText(FAKE_REPLY)).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('coach-stream')).toHaveCount(0);
	await expect(page.locator('#message')).toHaveValue('');

	// The stored reply was rated through the API, and the control swapped in place.
	const feedback = page.getByTestId('feedback').first();
	await feedback.getByRole('button', { name: 'Yes' }).click();
	await expect(feedback.getByText('Marked helpful')).toBeVisible();
	const { messages } = await api(request, user, 'GET', `/conversations/${id}`);
	expect(messages.find((m: { role: string }) => m.role === 'coach')?.helpful).toBe(true);
	await feedback.getByRole('button', { name: 'Undo' }).click();
	await expect(feedback.getByText('Did this help?')).toBeVisible();

	// Thread counters on the strip.
	await page.reload();
	await expect(page.getByTestId('thread-list').getByText('Threads')).toBeVisible();
});

test('an empty message is refused at the composer', async ({ page, request }) => {
	const user = await emptyAccount(request);
	const id = await newThread(request, user);
	await signIn(page, user, `/app/chat/${id}`);
	await page.locator('#message').press('Enter');
	await expect(page.getByRole('alert')).toHaveText('Type something first.');
});

test('a file rides along with the message', async ({ page, request }) => {
	const user = await emptyAccount(request);
	const id = await newThread(request, user);
	await signIn(page, user, `/app/chat/${id}`);
	await page.locator('#attachment').setInputFiles({ name: 'plan.txt', mimeType: 'text/plain', buffer: Buffer.from('Squats 3x5') });
	await expect(page.getByText('plan.txt')).toBeVisible();
	await send(page, 'Read this');
	await expect(page.locator('[data-role="coach"]').getByText(FAKE_REPLY)).toBeVisible({ timeout: 15_000 });
	await expect(page.locator('[data-role="user"] [data-attachment-file]')).toContainText('plan.txt');
});

test('a reflection opens with the coach speaking first', async ({ page, request }) => {
	const user = await emptyAccount(request);
	await signIn(page, user, '/app/chat');
	await page.getByRole('button', { name: 'Start a reflection' }).click();
	await expect(page).toHaveURL(/\/app\/chat\/[0-9a-f-]{36}$/);
	await expect(page.locator('.muse-pill-name').getByText('Reflection')).toBeVisible();
	await expect(page.locator('[data-role="coach"]').first()).toBeVisible({ timeout: 15_000 });
});

test('a write waits for approval; Yes runs it and the reply resumes', async ({ page, request }) => {
	const user = await emptyAccount(request);
	const id = await newThread(request, user);
	seedPendingCall(id, { name: 'log_water', args: { amount_ml: 500 } });
	await signIn(page, user, `/app/chat/${id}`);

	const card = page.getByTestId('approval-card');
	await expect(card.getByText('Khepri wants to change something')).toBeVisible();
	await expect(page.getByTestId('composer')).toHaveCount(0);
	await card.getByRole('button', { name: 'Yes, go ahead' }).click();

	await expect(card).toHaveCount(0, { timeout: 15_000 });
	await expect(page.locator('[data-role="coach"]').getByText(FAKE_REPLY)).toBeVisible({ timeout: 15_000 });
	await expect(page.getByTestId('composer')).toBeVisible();
	const detail = await api(request, user, 'GET', `/conversations/${id}`);
	expect(detail.pendingApproval).toBeUndefined();
	expect(detail.awaitingResume).toBe(false);
});

test('a standing task reads as one; Not now declines it', async ({ page, request }) => {
	const user = await emptyAccount(request);
	const id = await newThread(request, user);
	seedPendingCall(id, {
		name: 'create_watch',
		args: { watch: 'your sleep', notify_when: 'it drops under seven hours', spec: 'Check last night', cadence: 'weekly', weekday: 'monday', time: '08:00' }
	});
	await signIn(page, user, `/app/chat/${id}`);
	const card = page.locator('[data-standing-task-card]');
	await expect(card.getByText('Your sleep')).toBeVisible();
	await expect(card.getByText('Every Monday at 8:00')).toBeVisible();
	await expect(card.getByText('Pings you when it drops under seven hours')).toBeVisible();
	await card.getByRole('button', { name: 'Not now' }).click();
	await expect(card).toHaveCount(0, { timeout: 15_000 });
	await expect(page.locator('[data-role="coach"]').getByText(FAKE_REPLY)).toBeVisible({ timeout: 15_000 });
});

test('a stale approval keeps polling until the turn moves on', async ({ page, request }) => {
	const user = await emptyAccount(request);
	const id = await newThread(request, user);
	seedPendingCall(id, { name: 'log_water', args: { amount_ml: 250 } });
	await signIn(page, user, `/app/chat/${id}`);
	const card = page.getByTestId('approval-card');
	await expect(card).toBeVisible();
	// Answered elsewhere (another tab, the phone) while this card was up.
	const { pendingApproval } = await api(request, user, 'GET', `/conversations/${id}`);
	await api(request, user, 'POST', `/conversations/${id}/tools/${pendingApproval.messageId}`, { approve: false });
	await card.getByRole('button', { name: 'Yes, go ahead' }).click();
	await expect(card).toHaveCount(0, { timeout: 15_000 });
	await expect(page.locator('[data-role="coach"]').getByText(FAKE_REPLY)).toBeVisible({ timeout: 15_000 });
	// Resumed exactly once.
	await page.waitForTimeout(1500);
	await expect(page.locator('[data-role="coach"]')).toHaveCount(1);
});

test('deleting a conversation asks first', async ({ page, request }) => {
	const user = await emptyAccount(request);
	const keep = await newThread(request, user);
	const doomed = await newThread(request, user);
	await signIn(page, user, `/app/chat/${doomed}`);
	let asked = '';
	page.once('dialog', (d) => {
		asked = d.message();
		void d.dismiss();
	});
	await page.getByRole('button', { name: 'Delete conversation' }).click();
	await expect.poll(() => asked).toBe('Delete this conversation? Everything in it is lost.');
	await expect(page).toHaveURL(new RegExp(`/app/chat/${doomed}$`));
	page.once('dialog', (d) => d.accept());
	await page.getByRole('button', { name: 'Delete conversation' }).click();
	await expect(page).toHaveURL(new RegExp(`/app/chat/${keep}$`), { timeout: 15_000 });
	const { conversations } = await api(request, user, 'GET', '/conversations');
	expect(conversations.map((c: { id: string }) => c.id)).toEqual([keep]);
});

test('an unknown conversation is a 404', async ({ page, request }) => {
	const user = await emptyAccount(request);
	await signIn(page, user, '/app/chat');
	const response = await page.goto('/app/chat/00000000-0000-0000-0000-000000000000');
	expect(response?.status()).toBe(404);
});
