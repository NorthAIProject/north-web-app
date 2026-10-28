import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// Form check (Go web/form). Uploads need the local S3 stand-in on :9000 (see
// docs/migration/formcheck.md). The analysis itself runs on the worker and
// needs a video-capable model, which the fake provider is not, so the
// finished states are written straight into the local database.

const clip = fileURLToPath(new URL('./fixtures/formcheck.mp4', import.meta.url));
const pgContainer = process.env.NORTH_PG_CONTAINER ?? 'north-client-postgres-1';

function sql(statement: string) {
	execFileSync('docker', ['exec', pgContainer, 'psql', '-U', 'north', '-d', 'north', '-qtAc', statement]);
}

const finished = {
	exercise: 'Goblet squat',
	confidence: 'high',
	summary: 'Depth is good; knees drift in on the way up.',
	issues: [
		{ timestamp_seconds: 65, severity: 'critical', observation: 'Knees move inward as you stand.', correction: 'Push the knees out over the toes.' },
		{ timestamp_seconds: 4.5, severity: 'minor', observation: 'Heels lift slightly.', correction: 'Keep the weight mid-foot.' }
	]
};

test('upload a clip, watch it, then read the result', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/form');
	await expect(page.getByRole('heading', { name: 'Form check' })).toBeVisible();
	await expect(page.getByText('Previous checks')).toHaveCount(0);

	await page.locator('#video').setInputFiles(clip);
	await page.getByRole('button', { name: 'Analyse my form' }).click();
	await page.waitForURL(/\/app\/form\/[0-9a-f-]{36}$/);
	await expect(page.getByText('Khepri is watching your set.')).toBeVisible();
	await expect(page.locator('video')).toHaveAttribute('src', /north-media/);

	// The worker finishes; the page notices on its next poll without a reload.
	const id = page.url().split('/').pop()!;
	sql(`UPDATE form_analyses SET status='done', analysis='${JSON.stringify(finished)}'::jsonb WHERE id='${id}'`);
	await expect(page.getByRole('heading', { name: 'Goblet squat' })).toBeVisible({ timeout: 10_000 });
	await expect(page.getByText('What Khepri saw')).toBeVisible();
	await expect(page.getByText('Clear footage')).toBeVisible();
	await expect(page.getByText('2 things to work on')).toBeVisible();
	await expect(page.getByText('Fix before adding load')).toBeVisible();

	// A timestamp moves the clip to that moment (once the clip's metadata is in).
	await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThan(0);
	await page.getByRole('button', { name: '0:04' }).click();
	await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0);

	// It is listed on the upload page with its badge.
	await page.getByRole('link', { name: 'New check' }).click();
	await expect(page.getByText('Previous checks')).toBeVisible();
	const row = page.getByRole('link', { name: /Goblet squat/ });
	await expect(row).toHaveAttribute('href', `/app/form/${id}`);
	await expect(row.getByText('2 to fix')).toBeVisible();
});

test('failed and unclear analyses say so', async ({ page, request }) => {
	const user = await createUser(request);
	// Only finished checks are listed (Go: ListAnalyses status = 'done').
	expect((await api(request, user, 'GET', '/form-checks')).checks).toEqual([]);
	await signIn(page, user, '/app/form');
	await page.locator('#video').setInputFiles(clip);
	await page.getByRole('button', { name: 'Analyse my form' }).click();
	await page.waitForURL(/\/app\/form\/[0-9a-f-]{36}$/);
	const id = page.url().split('/').pop()!;

	// Let the dev server settle (a dependency re-optimise reloads the page).
	await page.waitForLoadState('networkidle');
	sql(`UPDATE form_analyses SET status='failed', error='' WHERE id='${id}'`);
	await page.goto(`/app/form/${id}`);
	await expect(page.getByText('That did not work')).toBeVisible();
	await expect(page.getByText('Something went wrong analysing that video.')).toBeVisible();

	const unclear = { ...finished, confidence: 'low', issues: [] };
	sql(`UPDATE form_analyses SET status='done', error='', analysis='${JSON.stringify(unclear)}'::jsonb WHERE id='${id}'`);
	await page.goto(`/app/form/${id}`);
	await expect(page.getByText('Unclear footage')).toBeVisible();
	await expect(page.getByText('Khepri could not see the movement clearly enough')).toBeVisible();
});

test('a file that is not a video is refused with the reason', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/form');
	await page.locator('#video').setInputFiles({ name: 'notes.mp4', mimeType: 'video/mp4', buffer: Buffer.from('not a video at all') });
	await page.getByRole('button', { name: 'Analyse my form' }).click();
	await expect(page.getByText('That does not look like a video Khepri can read.')).toBeVisible();
	await expect(page).toHaveURL(/\/app\/form$/);
});

test('media links redirect to signed storage; unknown ids are 404', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/form');
	await page.locator('#video').setInputFiles(clip);
	await page.getByRole('button', { name: 'Analyse my form' }).click();
	await page.waitForURL(/\/app\/form\/[0-9a-f-]{36}$/);
	const id = page.url().split('/').pop()!;
	const mediaID = execFileSync('docker', [
		'exec', pgContainer, 'psql', '-U', 'north', '-d', 'north', '-qtAc',
		`SELECT media_id FROM form_analyses WHERE id='${id}'`
	]).toString().trim();

	const res = await page.request.get(`/app/media/${mediaID}`, { maxRedirects: 0 });
	expect(res.status()).toBe(302);
	expect(res.headers()['location']).toContain('X-Amz-Signature');

	const missing = await page.request.get('/app/media/00000000-0000-0000-0000-000000000000', { maxRedirects: 0 });
	expect(missing.status()).toBe(404);
	const missingCheck = await page.goto('/app/form/00000000-0000-0000-0000-000000000000');
	expect(missingCheck?.status()).toBe(404);
});
