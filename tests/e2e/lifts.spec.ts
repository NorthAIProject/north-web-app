import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

// A small Hevy export: one workout, a warm-up and two work sets, and an
// exercise the catalog does not know.
const hevyCsv = [
	'"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"',
	'"Push Day","8 Oct 2026, 18:05","8 Oct 2026, 19:10","","Bench Press (Barbell)","","","0","warmup","40","10","","",""',
	'"Push Day","8 Oct 2026, 18:05","8 Oct 2026, 19:10","","Bench Press (Barbell)","","","1","normal","80","5","","","8"',
	'"Push Day","8 Oct 2026, 18:05","8 Oct 2026, 19:10","","Zorbian Press","","","0","normal","20","12","","",""'
].join('\n');

test('set logger logs, keeps the form, and undoes', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/lifts/today');
	const card = page.getByTestId('set-logger');
	await expect(card.getByText('Log a set')).toBeVisible();

	await card.getByLabel('Exercise', { exact: true }).fill('Bench press');
	await card.getByLabel('Kg', { exact: true }).fill('80');
	await card.getByLabel('Reps', { exact: true }).fill('5');
	await card.getByLabel('In reserve').fill('2');
	await card.getByRole('button', { name: 'Log set' }).click();

	const list = card.getByRole('list', { name: "Today's sets" });
	await expect(list.getByRole('listitem')).toHaveCount(1);
	await expect(list).toContainText('Bench press');
	await expect(list).toContainText('80 kg × 5');
	await expect(list).toContainText('2 in reserve');
	// Exercise, weight and reps carry over; effort is cleared.
	await expect(card.getByLabel('Exercise', { exact: true })).toHaveValue('Bench press');
	await expect(card.getByLabel('Kg', { exact: true })).toHaveValue('80');
	await expect(card.getByLabel('In reserve')).toHaveValue('');

	// A warm-up, then the server numbered both sets of the same exercise.
	await card.getByLabel('Warm-up').check();
	await card.getByRole('button', { name: 'Log set' }).click();
	await expect(list.getByRole('listitem')).toHaveCount(2);
	await expect(list.getByRole('listitem').nth(1)).toContainText('Warm-up');
	const today = await api(request, user, 'GET', '/lifts/today');
	expect(today.sets.map((s: { setNumber: number }) => s.setNumber)).toEqual([1, 2]);

	await list.getByRole('button', { name: 'Remove Bench press 80 kg × 5' }).first().click();
	await expect(list.getByRole('listitem')).toHaveCount(1);
});

test('set logger refuses a set without reps', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/lifts/today');
	const card = page.getByTestId('set-logger');
	await card.getByLabel('Exercise', { exact: true }).fill('Squat');
	await card.getByLabel('Reps', { exact: true }).fill('500');
	await card.getByRole('button', { name: 'Log set' }).click();
	// The browser's own max blocks it; force past it to reach the API's refusal.
	await card.getByLabel('Reps', { exact: true }).evaluate((el: HTMLInputElement) => el.removeAttribute('max'));
	await card.getByRole('button', { name: 'Log set' }).click();
	await expect(card.getByRole('alert')).toHaveText('Enter between 1 and 100 reps.');
});

test('Hevy import reports what it did', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/lifts/import');
	await expect(page.getByRole('heading', { level: 1, name: 'Bring your Hevy history' })).toBeVisible();
	await page.locator('input#file').setInputFiles({ name: 'workouts.csv', mimeType: 'text/csv', buffer: Buffer.from(hevyCsv) });
	await expect(page.getByText('Imported 1 workouts, 3 sets')).toBeVisible();
	await expect(page.getByTestId('import-result')).toContainText('Zorbian Press');

	// The same file again adds nothing.
	await page.locator('input#file').setInputFiles({ name: 'workouts.csv', mimeType: 'text/csv', buffer: Buffer.from(hevyCsv) });
	await expect(page.getByText('Already imported')).toBeVisible();
});

test('Hevy import refuses a file that is not an export', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/lifts/import');
	await page.locator('input#file').setInputFiles({ name: 'x.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') });
	await expect(page.getByRole('alert')).toContainText('That file is not a Hevy workout export');
});
