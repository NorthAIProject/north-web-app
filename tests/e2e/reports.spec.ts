import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { createUser, signIn } from './helpers';

const databaseUrl = process.env.TEST_DATABASE_URL ?? 'postgres://north:north@localhost:5434/north?sslmode=disable';

/** Stands in for cmd/worker, which the local e2e stack does not run: finish the report. */
function finishReport(id: string) {
	execFileSync('psql', [
		databaseUrl,
		'-qtA',
		'-v',
		'ON_ERROR_STOP=1',
		'-c',
		`UPDATE reports SET status = 'ready', body = '## Your week\n\nSteady.', generated_at = now(), updated_at = now() WHERE id = '${id}'`
	]);
}

const shots = process.env.E2E_SHOTS;

// The shell's award unlock dialog can open over the page after a write; close it.
test.beforeEach(async ({ page }) => {
	await page.addLocatorHandler(page.getByTestId('awards-unlock'), async () => {
		await page.keyboard.press('Escape');
	});
});

test('reports: empty list, generate, read, rate, archive', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/reports');
	await expect(page.getByRole('heading', { name: 'Weekly reports', level: 1 })).toBeVisible();
	await expect(page.getByText('No review yet')).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/reports-empty.png`, fullPage: true });

	await page.getByRole('button', { name: 'Generate this week' }).first().click();
	await page.waitForURL(/\/app\/reports\/[0-9a-f-]{36}/);
	await expect(page.getByText('Writing this week… refresh in a moment.')).toBeVisible();
	// The worker writes it in the background; the page polls (5 s) until ready.
	finishReport(page.url().split('/').pop()!.split('?')[0]);
	await expect(page.getByText('Was this useful?')).toBeVisible({ timeout: 15_000 });
	await expect(page.getByRole('heading', { name: 'Your week' })).toBeVisible();
	if (shots) await page.screenshot({ path: `${shots}/report.png`, fullPage: true });

	await page.getByRole('button', { name: 'Yes' }).click();
	await expect(page.getByText('Marked useful. Thank you.')).toBeVisible();
	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(page.getByText('Was this useful?')).toBeVisible();

	// Again within the hour: the cooldown notice.
	await page.getByRole('button', { name: 'Regenerate' }).click();
	await expect(page.getByText('Already generated this hour.')).toBeVisible();

	await page.getByRole('button', { name: 'Archive' }).click();
	await page.waitForURL(/\/app\/reports$/);
	await expect(page.getByText('No review yet')).toBeVisible();
	await page.getByRole('link', { name: 'Archived' }).click();
	await expect(page.locator('[data-report-row]')).toHaveCount(1);
	if (shots) await page.screenshot({ path: `${shots}/reports-archived.png`, fullPage: true });
});
