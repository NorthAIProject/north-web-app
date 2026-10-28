import { expect as baseExpect, test } from '@playwright/test';
import { createUser, signIn } from './helpers';

// Quick capture (/app/capture). The local API runs the fake model, which does
// not answer in the parse's JSON shape, so a parse here is the failure path:
// the sentence must survive it. The preview → commit path is covered by the
// form unit tests in src/lib/features/capture/capture.spec.ts.
const expect = baseExpect.configure({ timeout: 20_000 });
test.describe.configure({ timeout: 90_000, retries: 2 });

test('the capture page renders its box', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/capture');
	await expect(page.getByRole('heading', { level: 1, name: 'Quick capture' })).toBeVisible();
	await expect(page.getByTestId('capture-composer').getByRole('textbox')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Read it' })).toBeVisible();
});

test('a shared sentence prefills the box', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/capture?text=' + encodeURIComponent('500ml of water'));
	await expect(page.getByTestId('capture-composer').getByRole('textbox')).toHaveValue('500ml of water');
});

test('a failed read keeps the sentence and says try again', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/capture');
	const box = page.getByTestId('capture-composer').getByRole('textbox');
	await box.fill('I drank 500ml of water and slept 7 hours');
	await page.getByRole('button', { name: 'Read it' }).click();
	await expect(page.getByRole('alert')).toContainText('Try again');
	await expect(box).toHaveValue('I drank 500ml of water and slept 7 hours');
});

test('My Day quick add embeds the capture box', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app');
	await page.getByRole('button', { name: 'Add to your day' }).click();
	await expect(page.getByRole('dialog').getByTestId('capture-composer')).toBeVisible();
});
