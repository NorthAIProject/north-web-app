import { expect, test, type APIRequestContext } from '@playwright/test';
import { api, createUser, signIn, type TestUser } from './helpers';

const day = 24 * 3600 * 1000;

/**
 * Twelve weeks of two lifts, twice a week, creeping up with some wobble, and
 * six weeks of morning weights drifting down: enough history for every
 * forecast but the waist, which is left out so its row shows what is missing.
 */
async function seedHistory(request: APIRequestContext, user: TestUser) {
	const now = Date.now();
	// A followed plan, so the figure shows training continuing and every
	// what-if is on offer. Imported: the fake model cannot write one.
	await api(request, user, 'POST', '/training/import', {
		name: 'Horizon plan',
		days: [
			{
				label: 'Lower',
				weekday: 'Monday',
				exercises: [{ name: 'Barbell Squat', sets: 3, reps: '4-6', load: '', notes: '', flags: [] }]
			},
			{
				label: 'Upper',
				weekday: 'Thursday',
				exercises: [
					{ name: 'Dumbbell Bench Press', sets: 3, reps: '5', load: '', notes: '', flags: [] }
				]
			}
		],
		unparsed: []
	});
	for (let session = 0; session < 24; session++) {
		const at = new Date(now - (84 - session * 3.5) * day).toISOString();
		const wobble = [0, 2.5, -2.5, 0][session % 4];
		for (const [exerciseName, start] of [
			['Barbell Squat', 100],
			['Dumbbell Bench Press', 70]
		] as const) {
			for (let n = 0; n < 3; n++) {
				await api(request, user, 'POST', '/lifts/sets', {
					exerciseName,
					// 0: the server numbers the set and matches the name to the
					// catalog, as the app's own form does.
					setNumber: 0,
					weightKg: start + Math.floor(session / 3) * 2.5 + wobble,
					reps: 5,
					rir: 2,
					performedAt: at
				});
			}
		}
	}
	const readings = [];
	for (let ago = 42; ago >= 1; ago--) {
		readings.push({
			metric: 'body_mass',
			value: 82 + ago * 0.05 + (ago % 3) * 0.2,
			unit: 'kg',
			startedAt: new Date(now - ago * day).toISOString()
		});
	}
	await api(request, user, 'POST', '/health/samples', { readings, workouts: [] });
}

/** Marks the medals the seeded sets earned as seen, so their celebration does not open over the page. */
async function settle(request: APIRequestContext, user: TestUser) {
	const unseen = await api(request, user, 'GET', '/awards/unseen');
	for (const award of unseen.awards as { id: string }[]) {
		await api(request, user, 'POST', `/awards/${award.id}/seen`);
	}
}

test.describe('Horizon', () => {
	// Seeding is a few hundred requests.
	test.setTimeout(180_000);

	test('forecasts as ranges, scrubbed by keyboard, with honest what-ifs', async ({
		page,
		request
	}) => {
		const user = await createUser(request);
		await seedHistory(request, user);
		await settle(request, user);
		await signIn(page, user, '/app/horizon');

		const rows = page.getByTestId('horizon-row');
		const squat = rows.filter({ hasText: 'Barbell Squat' });
		await expect(squat).toHaveAttribute('data-status', 'ready');
		await expect(rows.filter({ hasText: 'Body weight' })).toHaveAttribute('data-status', 'ready');
		// No waist was ever measured: the row says what is missing instead.
		await expect(rows.filter({ hasText: 'Waist' })).toHaveAttribute('data-status', 'insufficient');

		// Today is what was measured: one number. Any day ahead is a range.
		await expect(page.getByTestId('horizon-when')).toHaveText('Today');
		await expect(squat.getByTestId('horizon-range')).not.toContainText('–');
		await expect(squat.getByTestId('horizon-record')).toHaveAttribute('data-kind', 'backtest');

		const scrubber = page.getByRole('slider', { name: 'Day to look at' });
		await scrubber.focus();
		for (let i = 0; i < 18; i++) await page.keyboard.press('ArrowRight');
		// Fourteen daily frames, then weekly: eighteen steps is week six.
		await expect(scrubber).toHaveAttribute('aria-valuetext', /^In 6 weeks, /);
		await expect(page.getByTestId('horizon-when')).toContainText('In 6 weeks');
		await expect(squat.getByTestId('horizon-range')).toContainText('–');
		// The plan is followed, so six weeks on nothing is detraining.
		await expect(page.getByTestId('horizon-figure-note')).toContainText('if you follow your plan');
		// Let the bars finish moving before the picture.
		await page.waitForTimeout(400);
		await page.screenshot({ path: test.info().outputPath('horizon-week-6.png'), fullPage: true });

		// Time off: the page says so, drops the track record (it is no longer
		// the forecast that was backtested), and the squat's progress waits.
		const before = await squat.getByTestId('horizon-range').innerText();
		await page.getByTestId('horizon-whatif').getByRole('link', { name: /^4 / }).click();
		await expect(page).toHaveURL(/skipWeeks=4/);
		await expect(squat.getByTestId('horizon-record')).toHaveCount(0);
		await expect(squat.getByTestId('horizon-range')).not.toHaveText(before);
		// Back to week four, the last morning of the time off: the figure
		// names what has gone untrained.
		await scrubber.focus();
		await page.keyboard.press('ArrowLeft');
		await page.keyboard.press('ArrowLeft');
		await expect(scrubber).toHaveAttribute('aria-valuetext', /^In 4 weeks, /);
		await expect(page.getByTestId('horizon-figure-note')).toContainText(
			'Untrained for over two weeks by then'
		);
		await page.waitForTimeout(400);
		await page.screenshot({ path: test.info().outputPath('horizon-skip-4.png'), fullPage: true });
	});

	test('says what is missing instead of guessing', async ({ page, request }) => {
		const user = await createUser(request);
		await signIn(page, user, '/app/horizon');
		await expect(page.getByTestId('horizon-low-data')).toBeVisible();
		await expect(page.getByTestId('horizon-scrubber')).toHaveCount(0);
		await expect(page.getByTestId('horizon-range')).toHaveCount(0);
		await page.screenshot({ path: test.info().outputPath('horizon-low-data.png'), fullPage: true });
	});

	test('the set logger offers the next set and fills it only when asked', async ({
		page,
		request
	}) => {
		const user = await createUser(request);
		await seedHistory(request, user);
		await settle(request, user);
		await signIn(page, user, '/app/lifts/today');
		const card = page.getByTestId('set-logger');
		const exercise = card.getByLabel('Exercise', { exact: true });
		// A looser spelling than the sets were logged under.
		await exercise.fill('barbell squat');
		await exercise.blur();

		const next = card.getByTestId('next-set');
		await expect(next).toContainText('Try');
		await expect(next).toContainText('Last time');
		// Offered, not filled in.
		await expect(card.getByLabel('Reps', { exact: true })).toHaveValue('');
		await next.getByRole('button', { name: 'Use' }).click();
		await expect(card.getByLabel('Reps', { exact: true })).not.toHaveValue('');
		await expect(card.getByLabel('Kg', { exact: true })).not.toHaveValue('');
		await expect(next).toHaveCount(0);
	});
});
