import { expect, test } from '@playwright/test';

// The install surface (north-client web/pwa, auth/aasa.go, the favicon
// redirect) and the error page.

test('manifest is served as a web app manifest', async ({ request }) => {
	const res = await request.get('/manifest.webmanifest');
	expect(res.ok()).toBe(true);
	expect(res.headers()['content-type']).toContain('application/manifest+json');
	const body = await res.json();
	expect(body.start_url).toBe('/app');
	expect(body.share_target.action).toBe('/app/capture');
});

test('offline page is self-contained and translated in the browser', async ({ page, request }) => {
	const res = await request.get('/offline.html');
	expect(res.ok()).toBe(true);
	const html = await res.text();
	expect(html).toContain("You're offline");
	expect(html).not.toMatch(/<link[^>]+stylesheet/);
	await page.goto('/offline.html');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText("You're offline");
});

test('apple-app-site-association names the iOS apps', async ({ request }) => {
	const res = await request.get('/.well-known/apple-app-site-association', { maxRedirects: 0 });
	expect(res.status()).toBe(200);
	const body = await res.json();
	expect(body.webcredentials.apps.length).toBeGreaterThan(0);
	expect(body.applinks.details[0].components[0]['/']).toBe('/i/*');
});

test('favicon.ico points at the SVG mark', async ({ request }) => {
	const res = await request.get('/favicon.ico', { maxRedirects: 0 });
	expect(res.status()).toBe(301);
	expect(res.headers()['location']).toBe('/assets/brand/favicon.svg');
});

test('service worker registers for the whole site', async ({ page }) => {
	await page.goto('/');
	const scope = await page.evaluate(async () => {
		const reg = await navigator.serviceWorker.ready;
		return reg.scope;
	});
	expect(new URL(scope).pathname).toBe('/');
});

test('unknown address renders the error page', async ({ page }) => {
	const res = await page.goto('/definitely-not-a-page');
	expect(res?.status()).toBe(404);
	await expect(page.getByText('404 · Page not found')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Go to Khepri' })).toHaveAttribute('href', '/');
});
