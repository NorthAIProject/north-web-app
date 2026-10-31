import { expect, test } from '@playwright/test';
import { createUser, signIn } from './helpers';

// Go: web/calculator — /app/calculator, its biometrics and generate forms.

test('calculator records measurements and generates a plan', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/calculator');
	await expect(page.getByRole('heading', { name: 'Calorie & macro calculator' })).toBeVisible();
	await expect(page.getByText('Needed before a plan can be generated.')).toBeVisible();

	// Without measurements the plan is refused with a sentence under the form.
	await page.getByRole('button', { name: 'Generate plan' }).click();
	await expect(page.locator('form[action="?/generate"] p.text-destructive')).toBeVisible();

	await page.getByLabel('Weight (kg)').fill('72');
	await page.getByLabel('Height (cm)').fill('175');
	await page.getByLabel('Date of birth').fill('1990-05-01');
	await page.locator('#sex').click();
	await page.getByRole('option', { name: 'Female' }).click();
	await page.getByRole('button', { name: 'Save measurements' }).click();
	await expect(page.getByText(/72\.0 kg, 175\.0 cm, \d+ years old\./)).toBeVisible();

	await page.locator('#activity_level').click();
	await page.getByRole('option', { name: /^Moderate — / }).click();
	await page.locator('#goal').click();
	await page.getByRole('option', { name: /^Cutting — / }).click();
	await page.locator('#macro_split').click();
	await page.getByRole('option', { name: /^Moderate carb — / }).click();
	await page.getByRole('button', { name: 'Generate plan' }).click();
	await expect(page.getByText(/^Cutting target: \d+ kcal\/day/)).toBeVisible();
	await expect(page.getByText('What each goal would cost')).toBeVisible();
	await expect(page.getByText('Yours')).toBeVisible();
});

test('calculator shows field errors from the measurements form', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/calculator');
	await page.getByLabel('Weight (kg)').fill('5');
	await page.getByLabel('Height (cm)').fill('175');
	await page.getByLabel('Date of birth').fill('1990-05-01');
	await page.getByRole('button', { name: 'Save measurements' }).click();
	await expect(page.getByText('Weight should be between 20 and 400 kg.')).toBeVisible();
	await expect(page.getByLabel('Weight (kg)')).toHaveValue('5');
});
