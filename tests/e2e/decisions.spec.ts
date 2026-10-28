import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// Go: web/decisions + internal/decisions/handler.go.
const shots = process.env.SHOTS_DIR ?? 'test-results';

test('decisions index renders its empty state', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/decisions');
	await expect(page.getByRole('heading', { level: 1, name: 'Decisions' })).toBeVisible();
	await expect(page.getByText("Nothing recorded yet. The first one is the one you'll want later.")).toBeVisible();
	// The create form has no outcome or held fields.
	await expect(page.getByLabel('How it turned out')).toHaveCount(0);
	await page.screenshot({ path: `${shots}/decisions-empty.png`, fullPage: true });
});

test('log a decision, with validation first', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/decisions');

	await page.getByRole('button', { name: 'Save decision' }).click();
	await expect(page.getByText('Name the decision.')).toBeVisible();

	await page.getByLabel('The decision').fill('Quit the evening client');
	await page.getByLabel('Options considered').fill('Keep it; halve it; quit');
	await page.getByLabel('Why this one').fill('Sleep matters more');
	await page.getByRole('button', { name: 'Save decision' }).click();

	await expect(page.getByRole('heading', { name: 'Quit the evening client' })).toBeVisible();
	await expect(page.getByText('Options: Keep it; halve it; quit')).toBeVisible();
	await expect(page.getByText('Why: Sleep matters more')).toBeVisible();
	await expect(page.getByLabel('The decision')).toHaveValue('');
	await page.screenshot({ path: `${shots}/decisions-list.png`, fullPage: true });
});

test('review a decision, then delete it', async ({ page, request }) => {
	const user = await createUser(request);
	const d = await api(request, user, 'POST', '/decisions', { title: 'Move to 3 runs a week', rationale: 'Knee' });
	await signIn(page, user, '/app/decisions');

	await page.getByRole('link', { name: 'Edit' }).click();
	await expect(page).toHaveURL(new RegExp(`/app/decisions/${d.id}$`));
	await expect(page.getByRole('heading', { level: 1, name: 'Move to 3 runs a week' })).toBeVisible();
	await expect(page.getByRole('radio', { name: 'Not yet' })).toBeChecked();
	await page.screenshot({ path: `${shots}/decision-show.png`, fullPage: true });

	await page.getByLabel('How it turned out').fill('Knee settled within a month');
	await page.getByRole('radio', { name: 'Partly' }).click();
	// The action redirects back here; wait for that reload before navigating on.
	await Promise.all([
		page.waitForResponse((r) => r.url().includes('__data.json')),
		page.getByRole('button', { name: 'Save changes' }).click()
	]);
	await expect(page.getByRole('radio', { name: 'Partly' })).toBeChecked();
	await expect.poll(async () => (await api(request, user, 'GET', `/decisions/${d.id}`)).held).toBe('partly');
	const saved = await api(request, user, 'GET', `/decisions/${d.id}`);
	expect(saved.outcome).toBe('Knee settled within a month');
	const calibration = await api(request, user, 'GET', '/decisions/calibration');
	expect(calibration).toMatchObject({ partly: 1, revisited: 1 });

	await page.getByRole('link', { name: 'Back to decisions' }).click();
	await expect(page.getByText('Held: Partly')).toBeVisible();
	await expect(page.getByText('Outcome: Knee settled within a month')).toBeVisible();

	await page.getByRole('link', { name: 'Edit' }).click();
	await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
	await page.getByLabel('The decision').fill('');
	await page.getByRole('button', { name: 'Save changes' }).click();
	await expect(page.getByText('Name the decision.')).toBeVisible();
	// The header keeps the stored title while the form shows what was posted.
	await expect(page.getByRole('heading', { level: 1, name: 'Move to 3 runs a week' })).toBeVisible();

	await page.getByRole('button', { name: 'Delete' }).click();
	await expect(page).toHaveURL(/\/app\/decisions$/);
	await expect(page.getByText("Nothing recorded yet. The first one is the one you'll want later.")).toBeVisible();
});

test('an unknown decision is a 404', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/decisions');
	const res = await page.goto('/app/decisions/00000000-0000-0000-0000-000000000000');
	expect(res?.status()).toBe(404);
	const bad = await page.goto('/app/decisions/not-a-uuid');
	expect(bad?.status()).toBe(404);
});
