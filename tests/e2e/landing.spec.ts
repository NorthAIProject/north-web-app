import { expect, test } from '@playwright/test';
import { createUser, signIn, webUrl } from './helpers';

// The marketing page (north-client web/landing). Its demos are canned and run
// in the browser, so each is exercised here rather than only rendered.

test('landing renders for a visitor with signup calls to action', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('Khepri');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Most AI forgets you by Tuesday.');
	// Hero and final CTA both send a stranger to sign up.
	const create = page.getByRole('link', { name: 'Create your account' });
	await expect(create).toHaveCount(2);
	await expect(create.first()).toHaveAttribute('href', '/signup');
	await expect(page.getByRole('navigation').getByRole('link', { name: 'Sign in' })).toBeVisible();
	// Footer: legal links and the visitor-only language switcher.
	await expect(page.locator('footer a[href="/privacy"]')).toBeVisible();
	await expect(page.getByLabel('Language')).toBeVisible();
	// Link previews.
	await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Khepri');
	await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://kheprios.com/assets/brand/og-card.png');
	await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
	// The hero wall: 14 back + 15 front cards, plus the two-card phone pair.
	await expect(page.locator('.hero-wall-slot')).toHaveCount(31);
});

test('landing tells a signed-in visitor to open the app', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user);
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Create your account' })).toHaveCount(0);
	const open = page.getByRole('main').getByRole('link', { name: 'Open Khepri' });
	await expect(open.first()).toHaveAttribute('href', '/app');
	// Every plan button and the setter CTA also lead back into the app.
	await expect(page.getByRole('link', { name: 'Start free' })).toHaveCount(0);
	await expect(page.getByLabel('Language')).toHaveCount(0);
});

test('landing speaks the visitor language', async ({ page, context }) => {
	await context.addCookies([{ name: 'locale', value: 'es', url: webUrl }]);
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Casi toda la IA se ha olvidado de ti para el martes.');
});

test('goal demo structures what the visitor typed', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.locator('#goal-input').fill('I want to lose fat, 4 days a week, I have dumbbells, bad knee');
	await page.getByRole('button', { name: 'Structure this' }).click();
	await expect(page.getByText('Lose fat without losing the strength you already have')).toBeVisible();
	await expect(page.getByText('Knee to work around — depth and volume progress separately')).toBeVisible();
	await expect(page.getByText(/In week six, either the squat goes up 5kg/)).toBeVisible();
});

test('muscle and surface tabs switch panels', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('tablist', { name: 'Exercise' }).getByRole('tab', { name: 'Romanian deadlift' }).click();
	await expect(page.getByRole('tabpanel').filter({ has: page.getByRole('heading', { name: 'Romanian deadlift' }) })).toBeVisible();
	await page.getByRole('tablist', { name: 'Surface' }).getByRole('tab', { name: 'Telegram' }).click();
	await expect(page.getByText('squatting now. 80 felt heavy')).toBeVisible();
});

test('quick tools recompute in the browser', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	// BMI: 178 cm / 82 kg → 25.9, then one step taller.
	await expect(page.getByText('178 cm')).toBeVisible();
	await page.locator('#bmi-height').focus();
	await page.keyboard.press('ArrowRight');
	await expect(page.getByText('179 cm')).toBeVisible();
	// "Nothing at all" settles the other equipment boxes.
	const barbell = page.getByRole('checkbox', { name: 'Barbell' });
	await expect(barbell).toBeChecked();
	await page.getByRole('checkbox', { name: 'Nothing at all' }).click();
	await expect(barbell).not.toBeChecked();
	await expect(page.getByText(/3 days a week, .* with/)).toBeVisible();
	// The goal select shows the chosen label, not its key.
	await page.getByRole('combobox').filter({ hasText: 'Get stronger' }).click();
	await page.getByRole('option', { name: 'Get leaner' }).click();
	await expect(page.getByRole('combobox').filter({ hasText: 'Get leaner' })).toBeVisible();
});

test('landing fits a phone without horizontal scroll @mobile', async ({ page }) => {
	await page.goto('/');
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
	expect(overflow).toBeLessThanOrEqual(0);
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
