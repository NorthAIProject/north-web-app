import { expect, test, type Page } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

// Go: internal/meals — ingredients, food log, meal plans and a plan's page.

async function withTarget(request: Parameters<typeof api>[0], user: TestUser) {
	await api(request, user, 'PUT', '/calculator/biometrics', {
		weightKg: 80,
		heightCm: 180,
		dateOfBirth: '1990-01-01',
		sex: 'male'
	});
	await api(request, user, 'POST', '/calculator/plan', {
		activityLevel: 'moderate',
		goal: 'maintenance',
		macroSplit: 'moderate_carb'
	});
}

// Names start "Aa": like Go, the page lists only the first 25 ingredients by name.
async function ownIngredient(request: Parameters<typeof api>[0], user: TestUser, name: string, per100g = { calories: 120, proteinG: 20, fatG: 2, carbG: 5 }) {
	return (await api(request, user, 'POST', '/nutrition/ingredients', { name, category: 'protein', servingSizeGrams: 100, per100g })) as {
		id: string;
	};
}

async function choose(page: Page, scope: ReturnType<Page['locator']>, trigger: string, option: string) {
	await scope.getByRole('combobox', { name: trigger }).click();
	await page.getByRole('option', { name: option, exact: true }).click();
}

test('ingredients: add, refuse, delete', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/nutrition/ingredients');
	await expect(page.getByRole('heading', { name: 'Ingredients', level: 1 })).toBeVisible();

	await page.getByLabel('Name').fill('Test tofu');
	await page.getByLabel('Calories / 100g').fill('-5');
	await page.getByRole('button', { name: 'Add ingredient' }).click();
	await expect(page.getByText('Calories cannot be negative.')).toBeVisible();
	// The refused form keeps what was typed.
	await expect(page.getByLabel('Name')).toHaveValue('Test tofu');

	await page.getByLabel('Calories / 100g').fill('144');
	await page.getByLabel('Protein (g)').fill('15');
	await page.getByRole('button', { name: 'Add ingredient' }).click();
	// Saved: the form clears, as Go's redirect did.
	await expect(page.getByLabel('Name')).toHaveValue('');
	await expect(page.getByLabel('Protein (g)')).toHaveValue('');
	await page.getByPlaceholder('Search ingredients…').fill('Test tofu');
	await page.getByPlaceholder('Search ingredients…').press('Enter');
	const row = page.getByRole('listitem').filter({ hasText: 'Test tofu' });
	await expect(row).toContainText('144 kcal/100g');
	await row.getByRole('button', { name: 'Delete' }).click();
	// Go redirects to the unfiltered list after a delete.
	await expect(page.getByPlaceholder('Search ingredients…')).toHaveValue('');
	await page.getByPlaceholder('Search ingredients…').fill('Test tofu');
	await page.getByPlaceholder('Search ingredients…').press('Enter');
	await expect(page.getByText('No ingredients found.')).toBeVisible();
});

test('food log: log an ingredient and a planned meal, remove an entry', async ({ page, request }) => {
	const user = await createUser(request);
	await withTarget(request, user);
	const chicken = await ownIngredient(request, user, 'Aa log chicken');
	// One day (Monday): a plan without today's weekday offers every day's meals.
	const plan = await api(request, user, 'POST', '/nutrition/plans', { name: 'Log plan', planType: 'mid_carb', mode: 'easy', dayCount: 1 });
	const withMeal = await api(request, user, 'POST', `/nutrition/plan-days/${plan.days[0].id}/meals`, { name: 'Lunch' });
	const lunch = withMeal.days[0].meals[0];
	await api(request, user, 'POST', `/nutrition/meals/${lunch.id}/ingredients`, { ingredientId: chicken.id, quantityGrams: 150 });

	await signIn(page, user, '/app/nutrition/log');
	await expect(page.getByRole('heading', { name: "Today's log" })).toBeVisible();

	const ingredientForm = page.locator('form[action="?/ingredient"]');
	await choose(page, ingredientForm, 'Choose an ingredient', 'Aa log chicken');
	await ingredientForm.getByLabel('grams').fill('200');
	await ingredientForm.getByRole('button', { name: 'Log' }).click();
	const entries = page.locator('section').filter({ hasText: 'Logged today' });
	await expect(entries).toContainText('240 kcal');

	const mealForm = page.locator('form[action="?/meal"]');
	await mealForm.getByRole('combobox').click();
	await page.getByRole('option').filter({ hasText: 'Log plan –' }).filter({ hasText: 'Lunch' }).first().click();
	await mealForm.getByRole('button', { name: 'Log' }).click();
	await expect(entries.getByRole('button', { name: 'Remove' })).toHaveCount(2);

	await entries.getByRole('button', { name: 'Remove' }).first().click();
	await expect(entries.getByRole('button', { name: 'Remove' })).toHaveCount(1);
});

test('plans: without a target the form is closed; with one a plan is created', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/nutrition/plans');
	await expect(page.getByText('Work out your macro target first')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Create plan' })).toBeDisabled();

	await withTarget(request, user);
	await page.reload();
	await expect(page.getByText('Your daily target')).toBeVisible();
	await page.getByLabel('Name').fill('Weekday cut');
	await page.getByLabel(/^Low carb/).check();
	await page.getByLabel('Days, starting Monday').fill('3');
	await page.getByRole('button', { name: 'Create plan' }).click();
	await expect(page).toHaveURL(/\/app\/nutrition\/plans\/[0-9a-f-]{36}$/);
	await expect(page.getByRole('heading', { name: 'Weekday cut' })).toBeVisible();
	await expect(page.getByText('Low carb').first()).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Monday' })).toBeVisible();

	await page.goto('/app/nutrition/plans');
	await expect(page.getByRole('link', { name: /Weekday cut/ })).toContainText('3 days');
});

test('plan page: meals, foods, optional, options, overage and days', async ({ page, request }) => {
	const user = await createUser(request);
	await withTarget(request, user);
	await ownIngredient(request, user, 'Aa plan chicken');
	await ownIngredient(request, user, 'Aa plan butter', { calories: 717, proteinG: 1, fatG: 81, carbG: 0 });
	const plan = await api(request, user, 'POST', '/nutrition/plans', { name: 'Detail plan', planType: 'mid_carb', mode: 'easy', dayCount: 2 });

	await signIn(page, user, `/app/nutrition/plans/${plan.id}`);
	const monday = page.locator('[data-slot="card"]').filter({ has: page.getByRole('heading', { name: 'Monday' }) });

	await monday.getByPlaceholder('Add a meal, e.g. Breakfast').fill('Breakfast');
	await monday.getByRole('button', { name: 'Add meal' }).click();
	await expect(monday.getByRole('heading', { name: 'Breakfast' })).toBeVisible();

	// The live preview shows what the day would have left.
	const addFood = monday.locator('form[action="?/addPortion"]');
	await expect(addFood).toContainText('This day:');
	await choose(page, addFood, 'Choose an ingredient', 'Aa plan chicken');
	await addFood.getByLabel('grams').fill('100');
	await expect(addFood).toContainText('After this:');
	await addFood.getByRole('button', { name: 'Add', exact: true }).click();
	await expect(monday.getByText('Aa plan chicken · 100g')).toBeVisible();

	// Optional food: shown, not counted.
	await monday.getByRole('button', { name: 'Make optional' }).click();
	await expect(monday.getByText('optional · not counted')).toBeVisible();
	await monday.getByRole('button', { name: 'Count it' }).click();
	await expect(monday.getByText('optional · not counted')).toHaveCount(0);

	// Optional meal.
	await monday.getByRole('button', { name: 'Make meal optional' }).click();
	await expect(monday.getByText('optional · not counted')).toBeVisible();
	await monday.getByRole('button', { name: 'Count meal' }).click();

	// A second option opens in its own tab.
	await monday.getByPlaceholder('Option label (optional)').fill('Eggs');
	await monday.getByRole('button', { name: 'Add option' }).click();
	await expect(monday.getByRole('tab', { name: 'Eggs' })).toHaveAttribute('data-state', 'active');
	await expect(monday.getByText('instead of option 1, not counted')).toBeVisible();
	await monday.getByRole('button', { name: 'Remove option' }).click();
	await expect(monday.getByRole('tab')).toHaveCount(0);

	// An easy plan refuses a portion that takes the day over its target.
	const addMore = monday.locator('form[action="?/addPortion"]');
	await choose(page, addMore, 'Choose an ingredient', 'Aa plan butter');
	await addMore.getByLabel('grams').fill('900');
	await addMore.getByRole('button', { name: 'Add', exact: true }).click();
	await expect(page.getByText('That would go over your target')).toBeVisible();
	await expect(page.getByText(/^Monday: fat/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'Save anyway' })).toHaveCount(0);

	// Days: remove the empty Tuesday, add it back.
	const tuesday = page.locator('[data-slot="card"]').filter({ has: page.getByRole('heading', { name: 'Tuesday' }) });
	await tuesday.getByRole('button', { name: 'Remove day' }).click();
	await expect(page.getByRole('heading', { name: 'Tuesday' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Add Tuesday' }).click();
	await expect(page.getByRole('heading', { name: 'Tuesday' })).toBeVisible();
});

test('plan page: advanced plan confirms an overage, changes a day, switches back and is deleted', async ({ page, request }) => {
	const user = await createUser(request);
	await withTarget(request, user);
	await ownIngredient(request, user, 'Aa adv butter', { calories: 717, proteinG: 1, fatG: 81, carbG: 0 });
	const plan = await api(request, user, 'POST', '/nutrition/plans', { name: 'Adv plan', planType: 'mid_carb', mode: 'easy', dayCount: 1 });

	await signIn(page, user, `/app/nutrition/plans/${plan.id}`);
	await page.getByRole('button', { name: 'Switch to advanced' }).click();
	await expect(page.getByText('Advanced', { exact: true })).toBeVisible();

	const monday = page.locator('[data-slot="card"]').filter({ has: page.getByRole('heading', { name: 'Monday' }) });
	await monday.getByPlaceholder('Add a meal, e.g. Breakfast').fill('Dinner');
	await monday.getByRole('button', { name: 'Add meal' }).click();
	const addFood = monday.locator('form[action="?/addPortion"]');
	await choose(page, addFood, 'Choose an ingredient', 'Aa adv butter');
	await addFood.getByLabel('grams').fill('900');
	await addFood.getByRole('button', { name: 'Add', exact: true }).click();
	await page.getByRole('button', { name: 'Save anyway' }).click();
	await expect(monday.getByText('Aa adv butter · 900g')).toBeVisible();

	// The day's own target.
	await monday.getByRole('button', { name: 'Change day' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Low carb day').check();
	await dialog.getByRole('button', { name: 'Save day' }).click();
	await expect(monday.getByText('Low carb day')).toBeVisible();
	await expect(dialog).toHaveCount(0);

	// Add a chosen weekday.
	await page.getByRole('combobox', { name: 'Choose a weekday' }).click();
	await page.getByRole('option', { name: 'Friday' }).click();
	await page.getByRole('button', { name: 'Add day' }).click();
	await expect(page.getByRole('heading', { name: 'Friday' })).toBeVisible();

	// Back to easy asks first, and is refused while a day is over its target.
	// A trigger clicked while the last select is still closing can be ignored by bits-ui.
	await expect(async () => {
		if (!(await page.getByRole('dialog').isVisible())) await page.getByRole('button', { name: 'Switch to easy' }).click();
		await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
	}).toPass();
	await page.getByRole('dialog').getByRole('button', { name: 'Switch to easy' }).click();
	await expect(page.getByText('That would go over your target')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Save anyway' })).toHaveCount(0);
	await expect(page.getByText('Advanced', { exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Delete plan' }).click();
	await expect(page).toHaveURL(/\/app\/nutrition\/plans$/);
	await expect(page.getByRole('link', { name: /Adv plan/ })).toHaveCount(0);
});
