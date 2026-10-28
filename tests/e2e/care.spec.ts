import { expect, test, type Page } from '@playwright/test';
import { createUser, signIn } from './helpers';

// /app/care: water, sleep, habits, medications and reminders (Go:
// internal/care/handler.go + internal/medications/handler.go).

async function openCare(page: Page, request: Parameters<typeof createUser>[0]) {
	const user = await createUser(request);
	await signIn(page, user, '/app/care');
	await expect(page).toHaveURL(/\/app\/care$/);
	return user;
}

const card = (page: Page, title: string) =>
	page.locator('[data-slot="card"]').filter({ has: page.getByText(title, { exact: true }) });

test('the care page renders every card', async ({ page, request }) => {
	await openCare(page, request);
	await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
	for (const title of ['Water', 'Sleep', 'Habits', 'Medications']) {
		await expect(card(page, title).first()).toBeVisible();
	}
	await expect(page.getByText('No medications tracked yet.')).toBeVisible();
	await expect(page.getByRole('button', { name: '+ 250ml' })).toBeVisible();
	await page.screenshot({ path: test.info().outputPath('care-empty.png'), fullPage: true });
});

test('water is logged and undone in place', async ({ page, request }) => {
	await openCare(page, request);
	await page.getByRole('button', { name: '+ 500ml' }).click();
	const entry = page.locator('li', { hasText: '500ml at' });
	await expect(entry).toBeVisible();
	await entry.getByRole('button', { name: 'Undo' }).click();
	await expect(entry).toHaveCount(0);
});

test('last night is logged, and a missing duration is rejected', async ({ page, request }) => {
	await openCare(page, request);
	await page.getByRole('button', { name: 'Log last night' }).click();
	// The API refuses a night of zero minutes; the message sits in the form.
	await expect(page.locator('p.text-red-500').first()).toBeVisible();

	await page.getByLabel('Hours').fill('7');
	await page.getByLabel('Minutes').fill('30');
	await page.getByRole('button', { name: 'Log last night' }).click();
	await expect(page.getByText('Last night: 7h 30m')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Update last night' })).toBeVisible();
	await expect(page.locator('p.text-red-500')).toHaveCount(0);
	// The form went back to empty after the save.
	await expect(page.getByLabel('Hours')).toHaveValue('');
});

test('a habit is added, ticked, unticked and deleted', async ({ page, request }) => {
	await openCare(page, request);
	await page.getByLabel('New habit').fill('Stretch');
	await page.getByRole('button', { name: 'Add habit' }).click();
	const row = page.locator('li', { hasText: 'Stretch' });
	await expect(row).toBeVisible();
	await expect(page.getByLabel('New habit')).toHaveValue('');

	await row.getByRole('button', { name: 'Mark done' }).click();
	await expect(row.getByRole('button', { name: 'Done' })).toBeVisible();
	await row.getByRole('button', { name: 'Done' }).click();
	await expect(row.getByRole('button', { name: 'Mark done' })).toBeVisible();

	await row.getByRole('button', { name: 'Delete' }).click();
	await expect(row).toHaveCount(0);
});

test('a reminder is added, disabled, enabled and deleted', async ({ page, request }) => {
	await openCare(page, request);
	await page.getByLabel('Label').fill('Vitamins');
	await page.getByLabel('Time', { exact: true }).fill('09:15');
	await page.getByRole('button', { name: 'Add reminder' }).click();
	const row = page.locator('li', { hasText: 'Vitamins' }).filter({ hasText: '09:15 ·' });
	await expect(row).toBeVisible();
	await expect(row).toContainText('Every day');

	await row.getByRole('button', { name: 'Disable' }).click();
	await expect(row.getByRole('button', { name: 'Enable' })).toBeVisible();
	await row.getByRole('button', { name: 'Enable' }).click();
	await expect(row.getByRole('button', { name: 'Disable' })).toBeVisible();

	await row.getByRole('button', { name: 'Delete' }).click();
	await expect(row).toHaveCount(0);
});

test('medications: add, take, undo, as-needed dose, stop', async ({ page, request }) => {
	await openCare(page, request);
	const meds = card(page, 'Medications');

	await meds.getByLabel('Name', { exact: true }).fill('Metformin');
	await meds.getByLabel('Dose').fill('500 mg');
	await meds.getByLabel('Times').fill('23:59');
	await meds.getByRole('button', { name: 'Add medication' }).click();

	const slot = meds.locator('li', { hasText: '23:59' }).filter({ hasText: 'Metformin 500 mg' }).first();
	await expect(slot).toBeVisible();
	await slot.getByRole('button', { name: 'Taken' }).click();
	await expect(slot.getByRole('button', { name: 'Undo' })).toBeVisible();
	await slot.getByRole('button', { name: 'Undo' }).click();
	await expect(slot.getByRole('button', { name: 'Skip' })).toBeVisible();

	// No times: taken as needed.
	await meds.getByLabel('Name', { exact: true }).fill('Ibuprofen');
	await meds.getByRole('button', { name: 'Add medication' }).click();
	const asNeeded = meds.locator('li', { hasText: 'Ibuprofen' }).filter({ has: page.getByRole('button', { name: 'Took one' }) });
	await expect(asNeeded).toBeVisible();
	await asNeeded.getByRole('button', { name: 'Took one' }).click();
	await expect(asNeeded.getByRole('button', { name: 'Undo' })).toBeVisible();

	const listed = meds.locator('li', { hasText: 'Ibuprofen' }).filter({ has: page.getByRole('button', { name: 'Stop' }) });
	await listed.getByRole('button', { name: 'Stop' }).click();
	await expect(listed).toHaveCount(0);
	await page.screenshot({ path: test.info().outputPath('care-filled.png'), fullPage: true });
});

test('the page works with no script: a water post lands back on /app/care', async ({ browser, request }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	const user = await createUser(request);
	// The login form posts without script too.
	await page.goto(`/login?next=${encodeURIComponent('/app/care')}`);
	await page.getByLabel('Email').fill(user.email);
	await page.getByLabel('Password', { exact: true }).fill('correct horse battery staple');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForURL(/\/app\/care/);
	await page.getByRole('button', { name: '+ 250ml' }).click();
	await page.waitForURL(/\/app\/care$/);
	await expect(page.locator('li', { hasText: '250ml at' })).toBeVisible();
	await context.close();
});
