import { expect, test } from '@playwright/test';
import { apiUrl, createUser, signIn } from './helpers';

// The overview's news ticker. The local API runs without NEWS_TICKER_FEEDS, so
// news is off: the ticker never shows and its settings endpoints answer 404,
// which is the state most installs are in. The on-state is covered by the Go
// contract tests for /news/settings.

test('with news off the overview has no ticker and settings say so', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/overview');
	await expect(page.getByRole('heading', { name: /Hello/ })).toBeVisible();
	await expect(page.getByTestId('news-ticker')).toHaveCount(0);

	const headers = { Authorization: `Bearer ${user.token}` };
	const settings = await request.get(`${apiUrl}/news/settings`, { headers });
	expect(settings.status()).toBe(404);
	const put = await request.put(`${apiUrl}/news/settings`, { headers, data: { enabled: true } });
	expect(put.status()).toBe(404);
	await page.reload();
	await expect(page.getByTestId('news-ticker')).toHaveCount(0);
});

test('the news ticker settings page is not found while news is off', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '/app/overview');
	const res = await page.goto('/app/settings/news-ticker');
	expect(res?.status()).toBe(404);
});
