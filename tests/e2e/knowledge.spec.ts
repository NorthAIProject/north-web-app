import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// /app/knowledge and its pages (Go: web/knowledge, internal/documents). The
// local stack runs no worker, so documents stay "waiting" and search finds
// nothing; hits are covered by the API contract tests.

test('empty library shows the first-run block and the compose rail', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/knowledge');
	await expect(page).toHaveTitle(/Knowledge/);
	await expect(page.getByRole('heading', { name: 'Knowledge', level: 1 })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'The coach has nothing to quote yet' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Write a note' })).toHaveAttribute('href', '#add-note');
	await expect(page.getByText('Drop a file, or browse')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Rebuild index' })).toBeVisible();
});

test('writing a note adds it to the library; an empty one says why not', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/knowledge');

	await page.getByRole('button', { name: 'Save note' }).click();
	await expect(page.getByText("Give this note a name you'll recognise later.")).toBeVisible();
	await expect(page.getByText('Write something for Khepri to remember.')).toBeVisible();

	await page.getByLabel('Or write a note').fill('Physio notes');
	await page.locator('#body').fill('# Physio\n\nKnee: two sets of wall sits.');
	await page.getByRole('button', { name: 'Save note' }).click();

	const row = page.getByRole('row').filter({ hasText: 'Physio notes' });
	await expect(row).toBeVisible();
	await expect(row.getByText('waiting')).toBeVisible();
	await expect(page.locator('#body')).toHaveValue('');

	// Filter tabs are client state, as Alpine's were.
	await page.getByRole('button', { name: /^Files/ }).click();
	await expect(row).toBeHidden();
	await page.getByRole('button', { name: /^Notes/ }).click();
	await expect(row).toBeVisible();
});

test('uploading a file adds it as a Markdown document', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/knowledge');
	await page.locator('#file').setInputFiles({
		name: 'marathon.md',
		mimeType: 'text/markdown',
		buffer: Buffer.from('# Marathon\n\n## Week 1\nThree easy runs.\n')
	});
	const row = page.getByRole('row').filter({ hasText: 'marathon' });
	await expect(row).toBeVisible();
	await expect(row.getByText('MD', { exact: true })).toBeVisible();
});

test('document page numbers lines, highlights a cited range, and removes', async ({ page, request }) => {
	const user = await createUser(request);
	const doc = await api(request, user, 'POST', '/knowledge/notes', {
		title: 'Marathon plan',
		body: '# Marathon plan\n\n## Week 1\nThree easy runs.\n\n## Week 2\nIntervals on Tuesday.'
	});
	await signIn(page, user, `/app/knowledge/${doc.id}?from=3&to=4#L3`);

	await expect(page.getByRole('heading', { name: 'Marathon plan', level: 1 })).toBeVisible();
	await expect(page.getByText('Showing lines 3–4, the passage that was quoted.')).toBeVisible();
	await expect(page.locator('#L3')).toHaveClass(/bg-signal\/12/);
	await expect(page.locator('#L5')).not.toHaveClass(/bg-signal\/12/);
	await expect(page.getByText('Contents')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Week 2' })).toHaveAttribute('href', '#L6');

	await page.getByRole('button', { name: 'Read it again' }).click();
	await expect(page).toHaveURL(/\/app\/knowledge$/);

	await page.goto(`/app/knowledge/${doc.id}`);
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page).toHaveURL(/\/app\/knowledge$/);
	await expect(page.getByRole('heading', { name: 'The coach has nothing to quote yet' })).toBeVisible();
});

test('removing from the list, and an unknown document is a 404', async ({ page, request }) => {
	const user = await createUser(request);
	await api(request, user, 'POST', '/knowledge/notes', { title: 'Old note', body: 'Something stale.' });
	await signIn(page, user, '/app/knowledge');
	const row = page.getByRole('row').filter({ hasText: 'Old note' });
	await row.getByRole('button', { name: 'Remove' }).click();
	await expect(row).toBeHidden();

	const res = await page.goto('/app/knowledge/00000000-0000-0000-0000-000000000000');
	expect(res?.status()).toBe(404);
});

test('rebuild index queues and stays on the library', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/knowledge');
	await page.getByRole('button', { name: 'Rebuild index' }).click();
	await expect(page).toHaveURL(/\/app\/knowledge$/);
	await expect(page.getByRole('heading', { name: 'Knowledge', level: 1 })).toBeVisible();
});

test('inline search and the search page', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/knowledge');

	await page.getByLabel('Search what Khepri has read').fill('intervals');
	await expect(page.getByText('Nothing matched. Khepri can only find what it has read — check')).toBeVisible();

	await page.getByLabel('Search what Khepri has read').press('Enter');
	await expect(page).toHaveURL(/\/app\/knowledge\/search\?q=intervals/);
	await expect(page.getByRole('heading', { name: 'Search passages' })).toBeVisible();
	await expect(page.getByText('Nothing matched. Khepri can only find what it has read.')).toBeVisible();

	await page.goto('/app/knowledge/search');
	await page.waitForLoadState('networkidle');
	await expect(page.getByText('Type a phrase to search what Khepri has read.')).toBeVisible();
	await page.getByLabel('Search what Khepri has read').fill('tempo');
	await expect(page).toHaveURL(/q=tempo/);
	await expect(page.getByLabel('Search what Khepri has read')).toBeFocused();
});

test('passages resolve only chunk refs the caller owns', async ({ request }) => {
	const user = await createUser(request);
	const out = await api(request, user, 'GET', '/knowledge/passages?ref=chunk:nope&ref=memory:x');
	expect(out).toEqual({ hits: [], hasMore: false });
});
