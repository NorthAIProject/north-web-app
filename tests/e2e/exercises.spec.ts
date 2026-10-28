import { expect, test } from '@playwright/test';
import { api, createUser, signIn } from './helpers';

test('browse lists, filters and pages the catalog', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/exercises');
	await expect(page.getByRole('heading', { level: 1, name: 'Exercises' })).toBeVisible();
	await expect(page.getByText(/Showing 1-24 of \d+ exercises/)).toBeVisible();
	await expect(page.locator('main ul li a[href^="/app/exercises/"]')).toHaveCount(24);

	// Page 2 keeps the filter-free URL canonical and moves the range.
	await page.getByRole('link', { name: '2', exact: true }).click();
	await expect(page).toHaveURL(/\/app\/exercises\?page=2$/);
	await expect(page.getByText(/Showing 25-48 of \d+ exercises/)).toBeVisible();

	// The GET form: search by name.
	await page.getByPlaceholder('Search by name').fill('bench press');
	await page.getByRole('button', { name: 'Filter' }).click();
	await expect(page).toHaveURL(/q=bench\+press/);
	await expect(page.locator('main ul li a').first()).toContainText(/bench/i);

	// A filter that matches nothing offers to clear it.
	await page.goto('/app/exercises?q=zzzznothing');
	await expect(page.getByText('Nothing matched. Try a broader filter.')).toBeVisible();
	await page.getByRole('link', { name: 'Clear filters' }).click();
	await expect(page).toHaveURL(/\/app\/exercises$/);
});

test('muscle filter and out-of-range page clamp', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/exercises?muscle=chest&page=999');
	await expect(page.getByRole('combobox', { name: 'Any muscle' })).toContainText('Chest');
	// Page 999 re-runs at the last real page rather than rendering nothing.
	const all = await api(request, user, 'GET', '/exercises?muscle=chest&limit=1');
	const last = Math.ceil(all.total / 24);
	await expect(page.getByRole('link', { name: String(last), exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(page.locator('main ul li a[href^="/app/exercises/"]').first()).toBeVisible();
});

test('detail without a plan points at building one', async ({ page, request }) => {
	const user = await createUser(request);
	const list = await api(request, user, 'GET', '/exercises?muscle=chest&limit=1');
	const ex = list.exercises[0];
	await signIn(page, user, `/app/exercises/${ex.slug}`);
	await expect(page.getByRole('heading', { level: 1, name: ex.name })).toBeVisible();
	await expect(page.getByText('What next')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Build a training plan' })).toHaveAttribute('href', '/app/training');
	await expect(page.getByText(/Also trains/)).toBeVisible();
	await expect(page.locator('[data-exercise-next] form')).toHaveCount(0);
});

test('unknown exercise is a 404', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user);
	const res = await page.goto('/app/exercises/not-a-real-exercise');
	expect(res?.status()).toBe(404);
});

test('detail with a plan offers each day and adds to one', async ({ page, request }) => {
	test.setTimeout(90_000);
	const user = await createUser(request);
	// An imported plan: the fake model cannot write one.
	const imported = await api(request, user, 'POST', '/training/import', {
		name: 'E2E plan',
		days: [
			{ label: 'Upper', weekday: 'Monday', exercises: [{ name: 'Bench press', sets: 3, reps: '8', load: '', notes: '', flags: [] }] },
			{ label: 'Lower', weekday: 'Thursday', exercises: [{ name: 'Back squat', sets: 3, reps: '5', load: '', notes: '', flags: [] }] }
		],
		unparsed: []
	});
	const plan = await api(request, user, 'GET', `/training/plans/${imported.planId}`);
	// An exercise not already on the plan's first day.
	const inPlan = new Set<string>(plan.days.flatMap((d: { exercises: { catalogSlug?: string }[] }) => d.exercises.map((e) => e.catalogSlug)));
	const list = await api(request, user, 'GET', '/exercises?q=curl&limit=30');
	const ex = list.exercises.find((e: { slug: string }) => !inPlan.has(e.slug));
	await signIn(page, user, `/app/exercises/${ex.slug}`);
	await expect(page.getByText('Not in your plan yet. Add it to a day:')).toBeVisible();
	const adds = page.locator('[data-exercise-next] form');
	await expect(adds).toHaveCount(plan.days.length);
	await expect(adds.first()).toHaveAttribute('action', `/app/training/${plan.id}/days/0/exercises`);
	await expect(adds.first().locator('input[name="catalog_slug"]')).toHaveValue(ex.slug);
});

test('detail of an exercise already in the plan says where', async ({ page, request }) => {
	const user = await createUser(request);
	const known = (await api(request, user, 'GET', '/exercises?q=bench&limit=1')).exercises[0];
	const imported = await api(request, user, 'POST', '/training/import', {
		name: 'E2E plan',
		days: [{ label: 'Upper', weekday: 'Monday', exercises: [{ name: 'Row', sets: 3, reps: '8', load: '', notes: '', flags: [] }] }],
		unparsed: []
	});
	// An edit makes a new version of the plan; the page reads the current one.
	const plan = await api(request, user, 'POST', `/training/plans/${imported.planId}/days/0/exercises`, {
		catalogSlug: known.slug
	});
	await signIn(page, user, `/app/exercises/${known.slug}`);
	await expect(page.getByText('Already in your plan on Monday.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open your plan' })).toHaveAttribute('href', `/app/training/${plan.id}`);
	await expect(page.locator('[data-exercise-next] form')).toHaveCount(0);
});
