import { expect, test, type Page } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// Go: web/settings + internal/settings/handler.go, internal/vault, internal/export.
const shots = process.env.SHOTS_DIR ?? 'test-results';

/** Picks an option in a bits-ui select by its trigger's id. */
async function choose(page: Page, id: string, option: string) {
	// A save's redirect re-renders the page; a click mid-navigation is lost.
	await page.waitForLoadState('networkidle');
	const trigger = page.locator(`#${id}`);
	await trigger.evaluate((el) => el.scrollIntoView({ block: 'center' }));
	await trigger.click();
	await page.getByRole('option', { name: option, exact: true }).click();
}

test('settings page renders every card', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');
	await expect(page.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
	for (const button of ['Save profile', 'Save notifications', 'Save defaults', 'Save preferences']) {
		await expect(page.getByRole('button', { name: button })).toBeVisible();
	}
	await expect(page.getByRole('link', { name: 'Download my data' })).toBeVisible();
	await page.screenshot({ path: `${shots}/settings.png`, fullPage: true });
});

test('profile save: name, language re-renders, appearance applies', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');
	await page.getByLabel('Name', { exact: true }).fill('Renamed Tester');
	await choose(page, 'appearance', 'Light');
	await page.getByRole('button', { name: 'Save profile' }).click();
	await expect(page.locator('html')).toHaveAttribute('data-appearance', 'light');
	await expect(page.locator('html')).not.toHaveClass(/dark/);
	const profile = await api(request, user, 'GET', '/settings/profile');
	expect(profile.displayName).toBe('Renamed Tester');
	expect(profile.appearance).toBe('light');

	// Language: the whole page comes back in Portuguese without a reload.
	await choose(page, 'locale', 'Português (Portugal)');
	await page.getByRole('button', { name: 'Save profile' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Conta' })).toBeVisible();
	expect((await api(request, user, 'GET', '/settings/profile')).locale).toBe('pt-PT');
});

test('profile rejects an empty name with the field message', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');
	const name = page.getByLabel('Name', { exact: true });
	await name.fill('   ');
	await name.evaluate((el) => el.removeAttribute('required'));
	await page.getByRole('button', { name: 'Save profile' }).click();
	await expect(name).toHaveAttribute('aria-invalid', 'true');
});

test('notifications, defaults and diets save', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');

	const weekly = page.locator('#weekly_report_auto');
	const before = (await api(request, user, 'GET', '/settings/notifications')).weeklyReportAuto;
	await weekly.click();
	await page.locator('#quiet_start').fill('22:30');
	await page.locator('#quiet_end').fill('07:00');
	await page.getByRole('button', { name: 'Save notifications' }).click();
	await expect
		.poll(async () => (await api(request, user, 'GET', '/settings/notifications')).weeklyReportAuto)
		.toBe(!before);
	expect((await api(request, user, 'GET', '/settings/notifications')).quietStart).toBe('22:30');

	await choose(page, 'units_system', 'Imperial (lb, in)');
	await expect(page.locator('#units_system')).toContainText('Imperial');
	await expect(page.locator('input[name="units_system"]')).toHaveValue('imperial');
	await page.getByRole('button', { name: 'Save defaults' }).click();
	await expect.poll(async () => (await api(request, user, 'GET', '/settings/preferences')).unitsSystem).toBe('imperial');
	await expect(page.getByText('Imperial', { exact: true }).first()).toBeVisible();

	const diets = (await api(request, user, 'GET', '/settings/diets')).diets as { id: string; name: string }[];
	if (diets.length > 0) {
		await page.getByRole('checkbox', { name: diets[0].name }).click();
		await page.getByRole('button', { name: 'Save preferences' }).click();
		await expect
			.poll(async () => ((await api(request, user, 'GET', '/settings/diets')).diets as { selected: boolean }[])[0].selected)
			.toBe(true);
	}
});

test('connections: create shows the token once, status, revoke', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings/connections');
	await expect(page.getByRole('heading', { level: 1, name: 'Agent connections' })).toBeVisible();
	await expect(page.getByText('Nothing connected yet.')).toBeVisible();
	await page.screenshot({ path: `${shots}/settings-connections.png`, fullPage: true });

	await page.getByText('No browser on that machine?').click();
	await page.locator('#name-claude_code').fill('Laptop');
	await page.getByRole('button', { name: 'Create a key for Claude Code' }).click();
	await expect(page.getByText('Laptop is ready')).toBeVisible();
	const token = (await page.locator('#issued-token').textContent())?.trim() ?? '';
	expect(token.length).toBeGreaterThan(10);
	await expect(page.getByText('waiting for first use…')).toBeVisible();

	// The token is not stored: a reload does not show it again.
	await page.reload();
	await page.waitForLoadState('networkidle');
	await expect(page.getByText('Laptop is ready')).toHaveCount(0);

	await page.getByRole('button', { name: 'Revoke' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Revoke' }).click();
	await expect(page.getByText('Nothing connected yet.')).toBeVisible();
	expect((await api(request, user, 'GET', '/settings/connections')).connections).toHaveLength(0);
});

test('connections: own provider key is refused with its field message', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings/connections');
	const ai = await api(request, user, 'GET', '/settings/ai');
	test.skip(!ai.enabled, 'no encryption key on this server');
	await page.getByLabel('Use my own API key').check();
	await page.getByRole('button', { name: 'Save provider' }).click();
	await expect(page.locator('#api_key')).toHaveAttribute('aria-invalid', 'true');
});

test('activity page renders', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings/activity');
	await expect(page.getByRole('heading', { level: 1, name: 'Activity' })).toBeVisible();
	await expect(page.getByText(/Nothing yet\./)).toBeVisible();
	await page.screenshot({ path: `${shots}/settings-activity.png`, fullPage: true });
});

test('export downloads a zip', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');
	const download = page.waitForEvent('download');
	await page.getByRole('link', { name: 'Download my data' }).click();
	expect((await download).suggestedFilename()).toBe('north-export.zip');
});

test('vault page connects and disconnects (dev deployments)', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');
	const res = await page.goto('/app/settings/vault');
	test.skip(res?.status() === 404, 'vault switched off on this API');
	await expect(page.getByRole('heading', { level: 1, name: 'Vault folder' })).toBeVisible();
	await page.locator('#root_path').fill('/definitely/not/a/folder');
	await page.getByRole('button', { name: 'Save and sync' }).click();
	await expect(page.locator('#root_path')).toHaveAttribute('aria-invalid', 'true');
	await page.locator('#root_path').fill('/tmp');
	await page.getByRole('button', { name: 'Save and sync' }).click();
	await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible();
	await page.screenshot({ path: `${shots}/settings-vault.png`, fullPage: true });
	await page.getByRole('button', { name: 'Disconnect' }).click();
	await expect(page.getByRole('button', { name: 'Disconnect' })).toHaveCount(0);
});

test('account delete: wrong email refused, right email signs out', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/settings');
	await page.getByRole('button', { name: 'Delete my account' }).click();
	await page.locator('#confirm_email').fill('someone-else@khepri.local');
	await page.getByRole('button', { name: 'Delete everything' }).click();
	await expect(page.locator('p.text-red-500')).toBeVisible();

	await page.getByRole('button', { name: 'Delete my account' }).click();
	await page.locator('#confirm_email').fill(user.email);
	await page.getByRole('button', { name: 'Delete everything' }).click();
	await page.waitForURL((url) => url.pathname === '/' && url.searchParams.get('deleted') === '1');
});
