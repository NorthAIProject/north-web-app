import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { apiUrl, createUser, password, signIn, webHost } from './helpers';

// The auth port: sign-in, sign-up, password recovery, onboarding, sign-out and
// the MCP consent screen. Google and passkeys need a real provider or device,
// so their halves are covered by unit tests (passkey.spec.ts, Go api_web_test).

const goOrigin = apiUrl.replace(/\/api\/v1$/, '');

test('login: a wrong password says so without saying which half', async ({ page, request }) => {
	const user = await createUser(request);
	await page.goto('/login');
	await page.getByLabel('Email').fill(user.email);
	await page.getByLabel('Password', { exact: true }).fill('not the password at all');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByText('Email or password is incorrect.')).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
	// The address stays filled in.
	await expect(page.getByLabel('Email')).toHaveValue(user.email);
});

test('login: success honours next, and the page offers what the API enables', async ({ page, request }) => {
	const user = await createUser(request);
	const options = await (await request.get(`${apiUrl}/auth/options`)).json();
	await page.goto('/login?next=%2Fapp%2Fsettings');
	await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveCount(options.passwordReset ? 1 : 0);
	await expect(page.getByRole('button', { name: 'Use a passkey' })).toHaveCount(options.passkey ? 1 : 0);
	await expect(page.getByRole('link', { name: 'Continue with Google' })).toHaveCount(options.google ? 1 : 0);
	await signIn(page, user, '/app/settings');
	await expect(page).toHaveURL(/\/app\/settings/);
});

test('login: a next pointing off-site is ignored', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user, '//evil.example/');
	await expect(page).toHaveURL(new RegExp(`${webHost}/app`));
});

test('signup: a field error, then an account that lands in onboarding', async ({ page }) => {
	const email = `e2e-signup-${Date.now()}@khepri.local`;
	await page.goto('/signup');
	await expect(page.getByRole('link', { name: 'Terms' }).or(page.locator('a[href="/terms"]'))).toBeVisible();
	await expect(page.locator('a[href="/privacy"]')).toBeVisible();

	await page.getByLabel('Name').fill('Signup Tester');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByLabel('Confirm password').fill(`${password} typo`);
	await page.getByRole('button', { name: 'Create account', exact: true }).click();
	await expect(page.getByText('Passwords do not match.')).toBeVisible();
	// Answers survive the round trip; the browser's zone was posted.
	await expect(page.getByLabel('Name')).toHaveValue('Signup Tester');
	await expect(page.locator('#timezone')).not.toHaveValue('');

	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByLabel('Confirm password').fill(password);
	await page.getByRole('button', { name: 'Create account', exact: true }).click();
	await expect(page).toHaveURL(/\/app\/onboarding$/);
});

test('onboarding: completes and lands on the done page, as Go does', async ({ page, request }) => {
	const user = await createUser(request, { onboarded: false, name: 'Ana Tester' });
	await signIn(page, user);
	await expect(page).toHaveURL(/\/app\/onboarding$/);

	await page.getByText('Fitness', { exact: true }).click();
	await page.getByLabel('One goal you are working toward right now').fill('Run 5k');
	await page.getByRole('button', { name: 'Start with Khepri' }).click();

	await expect(page).toHaveURL(/\/app\/onboarding\/done/);
	await expect(page.getByText('Khepri knows where to start, Ana')).toBeVisible();
	await expect(
		page.getByRole('link', { name: 'Read what Khepri said' }).or(page.getByRole('button', { name: 'Talk to Khepri' }))
	).toBeVisible();

	// Finished: the questionnaire is gone and the app opens.
	await page.goto('/app/onboarding');
	await expect(page).toHaveURL(/\/app$/);
});

test('onboarding: skip goes straight to the app', async ({ page, request }) => {
	const user = await createUser(request, { onboarded: false });
	await signIn(page, user);
	await page.getByRole('button', { name: 'Skip for now' }).click();
	await expect(page).toHaveURL(/\/app$/);
});

test('logout ends the session and lands on sign-in', async ({ page, request }) => {
	const user = await createUser(request);
	await signIn(page, user);
	// Submitted directly: the home page's floating view switcher can sit over
	// the rail's button at this viewport.
	await page.locator('form[action="/logout"]').first().evaluate((f: HTMLFormElement) => f.requestSubmit());
	await expect(page).toHaveURL(/\/login$/);
	await page.goto('/app');
	await expect(page).toHaveURL(/\/login\?next=/);
});

test('forgot password: the same success copy for any address', async ({ page, request }) => {
	const user = await createUser(request);
	await page.goto('/login');
	await page.getByRole('link', { name: 'Forgot password?' }).click();
	await expect(page).toHaveURL(/\/forgot-password$/);
	await page.getByLabel('Email').fill(user.email);
	await page.getByRole('button', { name: 'Send reset link' }).click();
	await expect(page.getByText('If an account exists for that address, we sent a reset link.')).toBeVisible();
	await expect(page.getByText(/Check your inbox for a message from Khepri/)).toBeVisible();
});

test('reset password: the emailed link path renders, and a bad token is refused', async ({ page }) => {
	await page.goto('/reset-password');
	await expect(page.getByRole('link', { name: /request a new/i }).or(page.locator('a[href="/forgot-password"]'))).toBeVisible();

	await page.goto('/reset-password?token=not-a-real-token');
	await page.getByLabel('New password').fill(password);
	await page.getByLabel('Confirm password').fill(password);
	await page.getByRole('button', { name: 'Update password' }).click();
	await expect(page.getByText('This reset link is invalid or has expired. Request a new one.')).toBeVisible();
});

test('locale switcher on the auth card changes the language', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByText('Welcome back')).toBeVisible();
	// The switcher submits on change once hydrated.
	await page.waitForLoadState('networkidle');
	await page.locator('#footer-locale').selectOption('pt-PT');
	await expect(page.getByText('Bem-vindo de volta')).toBeVisible();
	await expect(page).toHaveURL(/\/login$/);
	await page.waitForLoadState('networkidle');
	await page.locator('#footer-locale').selectOption('en');
	await expect(page.getByText('Welcome back')).toBeVisible();
});

// --- MCP consent screen ------------------------------------------------------

const clientCallback = 'https://agent.example/callback';

async function registerClient(request: import('@playwright/test').APIRequestContext) {
	const res = await request.post(`${goOrigin}/oauth/register`, {
		data: { client_name: 'E2E Agent', redirect_uris: [clientCallback], token_endpoint_auth_method: 'none' }
	});
	if (!res.ok()) throw new Error(`register: ${res.status()} ${await res.text()}`);
	return (await res.json()).client_id as string;
}

function authorizeURL(clientId: string, redirectUri = clientCallback) {
	const verifier = 'e2e-verifier-0123456789-abcdefghijklmnopqrstuvwxyz-ABCDEFG';
	const challenge = createHash('sha256').update(verifier).digest('base64url');
	const q = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		state: 'e2e-state',
		code_challenge: challenge,
		code_challenge_method: 'S256'
	});
	return `/oauth/authorize?${q}`;
}

test('consent: an unregistered destination is shown, never redirected to', async ({ page, request }) => {
	const clientId = await registerClient(request);
	const res = await page.goto(authorizeURL(clientId, 'https://evil.example/cb'));
	expect(res?.status()).toBe(400);
	expect(res?.headers()['x-frame-options']).toBe('DENY');
	await expect(page.getByText('That request cannot be completed')).toBeVisible();
	await expect(page).toHaveURL(new RegExp(`${webHost}/oauth/authorize`));
});

test('consent: create the account on the screen, then approve', async ({ page, request }) => {
	const clientId = await registerClient(request);
	let callback = '';
	await page.route('https://agent.example/**', async (route) => {
		callback = route.request().url();
		await route.fulfill({ status: 200, body: 'ok' });
	});

	await page.goto(authorizeURL(clientId));
	await expect(page).toHaveURL(/\/oauth\/authorize\?request_id=/);
	await expect(page.getByText(/E2E Agent/).first()).toBeVisible();

	const email = `e2e-consent-${Date.now()}@khepri.local`;
	await page.getByLabel('Name').fill('Consent Tester');
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.locator('form[action*="/account"] button[type="submit"]').click();

	// Signed in on the same screen, with Approve still to press.
	await expect(page.getByText(email)).toBeVisible();
	const sent = page.waitForRequest(/agent\.example\/callback/);
	await page.locator('button[name="decision"][value="approve"]').click();
	callback = (await sent).url();
	expect(callback).toContain('code=');
	expect(callback).toContain('state=e2e-state');
});

test('consent: a signed-in person can deny', async ({ page, request }) => {
	const user = await createUser(request);
	const clientId = await registerClient(request);
	let callback = '';
	await page.route('https://agent.example/**', async (route) => {
		callback = route.request().url();
		await route.fulfill({ status: 200, body: 'ok' });
	});
	await signIn(page, user);
	await page.goto(authorizeURL(clientId));
	await expect(page.getByText(user.email)).toBeVisible();
	const sent = page.waitForRequest(/agent\.example\/callback/);
	await page.locator('button[name="decision"][value="deny"]').click();
	callback = (await sent).url();
	expect(callback).toContain('error=access_denied');
});
