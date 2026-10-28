import { deflateSync } from 'node:zlib';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Go: internal/progresschecks/handler.go — GET /app/progress and its posts
// (create, schedule, delete, compare).

test.describe.configure({ timeout: 90_000 });

/** A small solid-colour PNG, built by hand so the test needs no fixture file. */
function png(w = 30, h = 40, rgb: [number, number, number] = [200, 100, 50]): Buffer {
	const crcTable = Array.from({ length: 256 }, (_, n) => {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		return c >>> 0;
	});
	const crc = (buf: Buffer) => {
		let c = 0xffffffff;
		for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
		return (c ^ 0xffffffff) >>> 0;
	};
	const chunk = (type: string, data: Buffer) => {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const td = Buffer.concat([Buffer.from(type), data]);
		const sum = Buffer.alloc(4);
		sum.writeUInt32BE(crc(td));
		return Buffer.concat([len, td, sum]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0);
	ihdr.writeUInt32BE(h, 4);
	ihdr.set([8, 2, 0, 0, 0], 8);
	const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
	const raw = Buffer.concat(Array.from({ length: h }, () => row));
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	]);
}

/** The unlock celebration would cover the page; these tests are not about it. */
async function markAwardsSeen(request: APIRequestContext, user: TestUser) {
	const unseen = await api(request, user, 'GET', '/awards/unseen');
	for (const a of unseen.awards ?? []) await api(request, user, 'POST', `/awards/${a.id}/seen`);
}

/** A check through the API, with a front photo when asked. */
async function apiCheck(request: APIRequestContext, user: TestUser, check: object, photo = false) {
	const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = {
		check: JSON.stringify(check)
	};
	if (photo) multipart.front = { name: 'front.png', mimeType: 'image/png', buffer: png() };
	const res = await request.post(`${process.env.NORTH_API_URL ?? 'http://localhost:8090/api/v1'}/progress/checks`, {
		headers: { authorization: `Bearer ${user.token}` },
		multipart
	});
	if (!res.ok()) throw new Error(`create check → ${res.status()} ${await res.text()}`);
}

async function open(page: Page, request: APIRequestContext, user: TestUser) {
	await markAwardsSeen(request, user);
	await signIn(page, user, '/app/progress');
	await expect(page.getByTestId('progress-page')).toBeVisible();
}

test('empty page: form, reminder off, no history, no comparison', async ({ page, request }) => {
	const user = await createUser(request);
	await open(page, request, user);
	await expect(page.getByRole('heading', { level: 1, name: 'Progress check' })).toBeVisible();
	await expect(page.getByTestId('pose-front')).toContainText('Front');
	await expect(page.getByText('No reminder set.')).toBeVisible();
	await expect(page.locator('#cadence-off')).toBeChecked();
	await expect(page.getByTestId('progress-history')).toContainText('No checks yet');
	await expect(page.getByTestId('progress-compare')).toHaveCount(0);
	await page.screenshot({ path: 'test-results/progress-empty.png', fullPage: true });
});

test('a save with nothing in it is refused with the reason', async ({ page, request }) => {
	const user = await createUser(request);
	await open(page, request, user);
	await page.getByTestId('progress-save').click();
	await expect(page.getByText('Add a photo or at least one measurement.')).toBeVisible();
	await expect(page.getByTestId('progress-check')).toHaveCount(0);
});

test('numbers, then a photo: history shows chips, deltas and the photo', async ({ page, request }) => {
	const user = await createUser(request);
	await open(page, request, user);

	await page.locator('#m_weight').fill('80.5');
	await page.locator('#m_waist').fill('90');
	await page.getByTestId('progress-save').click();
	await expect(page.getByTestId('progress-check')).toHaveCount(1);
	await expect(page.getByTestId('progress-check').first()).toContainText('80.5 kg');
	// The form starts over after a save.
	await expect(page.locator('#m_weight')).toHaveValue('');

	await page.locator('#photo-front').setInputFiles({ name: 'front.png', mimeType: 'image/png', buffer: png() });
	await expect(page.getByTestId('pose-front').locator('label img')).toBeVisible();
	await page.locator('#m_waist').fill('88.5');
	await page.getByTestId('progress-save').click();
	await expect(page.getByTestId('progress-check')).toHaveCount(2);
	const newest = page.getByTestId('progress-check').first();
	await expect(newest).toContainText('88.5 cm');
	await expect(newest).toContainText('−1.5');
	await expect(newest.locator('img[alt="Front"]')).toBeVisible();
	await expect(newest.locator('a[href^="/app/media/"]')).toHaveCount(1);
	// The newest photo is now the "last" one beside the front slot.
	await expect(page.getByTestId('pose-front').locator('figure img')).toHaveAttribute('src', /\/app\/media\//);
	await page.screenshot({ path: 'test-results/progress-history.png', fullPage: true });
});

test('reminder cadence saves and says when the next check is', async ({ page, request }) => {
	const user = await createUser(request);
	await open(page, request, user);
	await page.locator('#cadence-weekly').check();
	await page.getByTestId('progress-schedule').getByRole('button').click();
	await expect(page.getByText(/^Next check: /)).toBeVisible();
	await expect(page.locator('#cadence-weekly')).toBeChecked();
	const sched = await api(request, user, 'GET', '/progress/schedule');
	expect(sched.cadence).toBe('weekly');

	await page.locator('#cadence-off').check();
	await page.getByTestId('progress-schedule').getByRole('button').click();
	await expect(page.getByText('No reminder set.')).toBeVisible();
});

test('two checks with photos offer the comparison card', async ({ page, request }) => {
	const user = await createUser(request);
	await apiCheck(request, user, { measuredOn: '2026-09-01', weightKg: 82 }, true);
	await apiCheck(request, user, { weightKg: 80 }, true);
	await open(page, request, user);
	await expect(page.getByTestId('progress-compare')).toContainText(
		'You have two checks with photos. Compare them to see what changed.'
	);
	// No provider may read photos on the local stack (fake AI): Go hides the
	// button then too, and shows only the card.
	await expect(page.getByTestId('progress-compare-button')).toHaveCount(0);
	await expect(page.getByTestId('progress-check')).toHaveCount(2);
	await expect(page.getByTestId('progress-check').first()).toContainText('−2');
	await page.screenshot({ path: 'test-results/progress-compare.png', fullPage: true });
});

test('delete asks first, then removes the check', async ({ page, request }) => {
	const user = await createUser(request);
	await apiCheck(request, user, { weightKg: 79 });
	await open(page, request, user);
	await expect(page.getByTestId('progress-check')).toHaveCount(1);

	await page.getByRole('button', { name: 'Delete' }).first().click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('Delete this check?');
	await dialog.getByRole('button', { name: 'Cancel' }).click();
	await expect(page.getByTestId('progress-check')).toHaveCount(1);

	await page.getByRole('button', { name: 'Delete' }).first().click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByTestId('progress-check')).toHaveCount(0);
	await expect(page.getByTestId('progress-history')).toContainText('No checks yet');
});
