import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import path from 'node:path';
import { api, createUser, signIn, webUrl, type TestUser } from './helpers';

// Go: web/planimport (meal side) — upload, review, save, and AI generation.

async function withTarget(request: APIRequestContext, user: TestUser) {
	await api(request, user, 'PUT', '/calculator/biometrics', {
		weightKg: 80,
		heightCm: 180,
		dateOfBirth: '1990-05-01',
		sex: 'male'
	});
	await api(request, user, 'POST', '/calculator/plan', {
		activityLevel: 'moderate',
		goal: 'maintenance',
		macroSplit: 'moderate_carb'
	});
}

/** A food line's name as the file gave it (the table's first column). */
const foodCell = (page: Page, name: string) => page.locator('td div.font-medium', { hasText: new RegExp(`^${name}$`) });

const csv = path.join(import.meta.dirname, 'fixtures', 'meal-plan.csv');

test('meal plan import: upload, review, remove a food, save', async ({ page, request }) => {
	const user = await createUser(request);
	await withTarget(request, user);
	await signIn(page, user, '/app/nutrition/import');
	await expect(page.getByRole('heading', { name: 'Import a meal plan' })).toBeVisible();

	await page.locator('input[type=file]').setInputFiles(csv);
	await expect(page.getByRole('heading', { name: 'Check your meal plan' })).toBeVisible();
	await expect(foodCell(page, 'Rolled oats')).toBeVisible();
	await expect(foodCell(page, 'Chicken breast')).toBeVisible();

	// A remove button posts the whole draft to the review route.
	await page.getByRole('button', { name: 'Remove Chicken breast' }).click();
	await expect(page).toHaveURL(/\/app\/nutrition\/import\/review$/);
	await expect(foodCell(page, 'Chicken breast')).toHaveCount(0);
	await expect(foodCell(page, 'Rolled oats')).toBeVisible();

	// No carb type is chosen yet, so saving is refused and says why.
	await page.getByRole('button', { name: 'Save plan' }).click();
	await expect(page.locator('[data-slot=alert][data-variant=destructive], [data-slot=alert]').first()).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Check your meal plan' })).toBeVisible();

	await page.locator('input[name=name]').fill('Imported e2e plan');
	await page.locator('button[data-slot=select-trigger]').nth(1).click();
	await page.getByRole('option', { name: /^Mid carb/ }).click();
	// Nothing in the local catalog may match: keep the file's own macros.
	await page.locator('button[data-slot=select-trigger]').nth(2).click();
	await page.getByRole('option', { name: "Save as my own food (file's macros)" }).click();
	await page.getByRole('button', { name: 'Save plan' }).click();
	await page.waitForURL(/\/app\/nutrition\/plans\/[0-9a-f-]{36}/);
	const plans = await api(request, user, 'GET', '/nutrition/plans');
	expect(plans.plans.map((p: { name: string }) => p.name)).toContain('Imported e2e plan');
});

test('meal plan import refuses a missing file', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/nutrition/import');
	const res = await page.request.post('/app/nutrition/import', {
		headers: { origin: webUrl, 'x-sveltekit-action': 'true' },
		multipart: { other: 'x' }
	});
	expect(await res.text()).toContain('planimport.err.nofile');
});

test('meal plan generation asks for a target first', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/nutrition/plans/generate');
	await expect(page.getByText("Meal plans are built to your macro target, and you haven't worked one out yet.")).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open the calculator' })).toBeVisible();
});

test('meal plan generation drafts a plan for review', async ({ page, request }) => {
	test.setTimeout(90_000);
	const user = await createUser(request);
	await withTarget(request, user);
	await signIn(page, user, '/app/nutrition/plans/generate');
	await expect(page.getByRole('heading', { name: 'Build your meal plan' })).toBeVisible();
	await page.getByLabel('Foods to leave out').fill('peanuts, mushrooms');
	await page.getByRole('button', { name: 'Build my plan' }).click();
	// The fake provider either drafts a plan (review) or reports that none fitted.
	await expect(
		page.getByRole('heading', { name: 'Check your meal plan' }).or(page.getByText(/couldn't build a plan/))
	).toBeVisible({ timeout: 60_000 });
	const intake = await api(request, user, 'GET', '/nutrition/plans/intake');
	expect(intake.intake.exclusions).toEqual(['peanuts', 'mushrooms']);
});
