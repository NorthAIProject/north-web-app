import { expect, test } from '@playwright/test';
import { webUrl } from './helpers';

// The policies (north-client web/legal): public, English in every language.

for (const [path, title, heading] of [
	['/privacy', 'Privacy · Khepri', 'Privacy policy'],
	['/terms', 'Terms · Khepri', 'Terms of service'],
	['/facebook-data', 'Facebook data · Khepri', 'Your Facebook data in Khepri']
] as const) {
	test(`${path} renders signed out`, async ({ page }) => {
		await page.goto(path);
		await expect(page).toHaveTitle(title);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
		await expect(page.getByText('Last updated 29 August 2026')).toBeVisible();
		await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
		// The marketing navbar, and the document's own footer links.
		await expect(page.getByRole('navigation').getByRole('link', { name: 'Sign in' })).toBeVisible();
		await expect(page.locator('article footer').getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
	});
}

test('privacy links its contact address', async ({ page }) => {
	await page.goto('/privacy');
	await expect(page.locator('a[href="mailto:privacy@khepri.invalid"]').first()).toBeVisible();
});

test('a non-English reader is told why the policy is in English', async ({ page, context }) => {
	await context.addCookies([{ name: 'locale', value: 'es', url: webUrl }]);
	await page.goto('/terms');
	await expect(page.getByText('Esta página solo está disponible en inglés.')).toBeVisible();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of service');
});
