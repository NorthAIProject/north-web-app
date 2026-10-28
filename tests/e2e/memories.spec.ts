import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Go: web/memories + internal/memories/handler.go.
//
// Pending memories are only ever proposed by the extraction job, so the specs
// that need one insert it straight into the local database.
const shots = process.env.SHOTS_DIR ?? 'test-results';
const databaseUrl = process.env.TEST_DATABASE_URL ?? 'postgres://north:north@localhost:5434/north?sslmode=disable';

function insertPending(user: TestUser, content: string, conversationId?: string): string {
	const out = execFileSync(
		'psql',
		[
			databaseUrl,
			'-qtA',
			'-v',
			'ON_ERROR_STOP=1',
			'-c',
			`INSERT INTO user_memories (user_id, category, content, status, source, source_conversation_id)
			 VALUES ('${user.id}', 'injury', '${content.replace(/'/g, "''")}', 'pending', 'extraction', ${
				conversationId ? `'${conversationId}'` : 'NULL'
			 }) RETURNING id`
		],
		{ encoding: 'utf8' }
	);
	return out.trim().split('\n')[0];
}

async function remember(page: Page, fact: string) {
	await page.getByLabel('Fact').fill(fact);
	await page.getByRole('button', { name: 'Save fact' }).click();
}

test('memories page renders', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/memories');
	await expect(page.getByRole('heading', { level: 1, name: 'Memory' })).toBeVisible();
	await expect(page.getByText('Facts by category')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Known facts' })).toBeVisible();
	await expect(page.locator('#memories-category-donut canvas')).toBeVisible();
	await page.screenshot({ path: `${shots}/memories.png`, fullPage: true });
});

test('add a fact, then see validation on a short one', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/memories');

	await page.getByLabel('Fact').fill('short');
	await page.getByRole('button', { name: 'Save fact' }).click();
	await expect(page.getByText('Make it specific — a few more words help.')).toBeVisible();

	await remember(page, 'Trains before work, around 07:00.');
	await expect(page.getByText('Trains before work, around 07:00.')).toBeVisible();
	await expect(page.getByLabel('Fact')).toHaveValue('');
	const list = await api(request, user, 'GET', '/memories');
	expect(list.approved.map((m: { content: string }) => m.content)).toContain('Trains before work, around 07:00.');
	await page.screenshot({ path: `${shots}/memories-list.png`, fullPage: true });
});

test('pin, unpin, hide, include, edit and delete a fact', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'POST', '/memories', { category: 'habit', content: 'Walks the dog every morning.' });
	await signIn(page, user, '/app/memories');
	const card = page.locator('[data-memory]').filter({ hasText: 'Walks the dog every morning.' });

	await card.getByRole('button', { name: 'Pin' }).click();
	await expect(card.getByText('pinned', { exact: true })).toBeVisible();
	await card.getByRole('button', { name: 'Unpin' }).click();
	await expect(card.getByText('pinned', { exact: true })).toHaveCount(0);

	await card.getByRole('button', { name: 'Hide from coach' }).click();
	await expect(card.getByText('hidden from coach', { exact: true })).toBeVisible();
	await card.getByRole('button', { name: 'Use in coaching' }).click();
	await expect(card.getByText('hidden from coach', { exact: true })).toHaveCount(0);

	await card.getByRole('button', { name: 'Edit' }).click();
	await card.locator('textarea[name="content"]').fill('Walks the dog every evening.');
	await card.getByRole('button', { name: 'Save' }).click();
	const edited = page.locator('[data-memory]').filter({ hasText: 'Walks the dog every evening.' });
	await expect(edited).toBeVisible();

	await edited.getByRole('button', { name: 'Delete' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByText('Walks the dog every evening.')).toHaveCount(0);
	const list = await api(request, user, 'GET', '/memories');
	expect(list.approved.map((m: { content: string }) => m.content)).not.toContain('Walks the dog every evening.');
});

test('approve and discard what the coach proposed', async ({ page, request }) => {
	const user = await createUser(request);
	insertPending(user, 'Left knee aches on long downhill runs.');
	insertPending(user, 'Prefers swimming to cycling.');
	await signIn(page, user, '/app/memories');
	await expect(page.getByRole('heading', { name: 'Proposed from conversations' })).toBeVisible();
	await page.screenshot({ path: `${shots}/memories-pending.png`, fullPage: true });

	const knee = page.locator('[data-memory]').filter({ hasText: 'Left knee aches' });
	await knee.getByRole('button', { name: 'Approve' }).click();
	const swim = page.locator('[data-memory]').filter({ hasText: 'Prefers swimming' });
	await swim.getByRole('button', { name: 'Discard' }).click();
	await expect(page.getByText('Prefers swimming to cycling.')).toHaveCount(0);

	const list = await api(request, user, 'GET', '/memories');
	expect(list.pending).toHaveLength(0);
	const approved = list.approved.map((m: { content: string }) => m.content);
	expect(approved).toContain('Left knee aches on long downhill runs.');
	expect(approved).not.toContain('Prefers swimming to cycling.');
});

test('pending memories for one conversation', async ({ request }) => {
	const user = await createUser(request);
	const convo = await api(request, user, 'POST', '/conversations', {});
	insertPending(user, 'Sleeps badly after late sessions.', convo.id);
	insertPending(user, 'Not from this conversation at all.');
	const got = await api(request, user, 'GET', `/memories/for/${convo.id}`);
	expect(got.pending.map((m: { content: string }) => m.content)).toEqual(['Sleeps badly after late sessions.']);
});
