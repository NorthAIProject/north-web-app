import { expect, test } from '@playwright/test';
import { createUser, signIn } from './helpers';
import { transcript } from './stubs/providers';

// The dictation recorder end to end: Chromium's fake microphone records, the
// page converts to WAV and posts through the /api proxy, and north-client
// sends it to the transcription stub (tests/e2e/stubs/providers.ts), whose
// words land in the box at the cursor. Needs the API started with
// TRANSCRIBE_PROVIDER_OPENAI_BASEURL pointing at the stub.

test.use({
	permissions: ['microphone'],
	launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }
});

test.describe.configure({ timeout: 90_000 });

test('dictating into the coach composer puts the words in the box', async ({ page, request }) => {
	const user = await createUser(request);
	const voice = await request.get(`${process.env.NORTH_API_URL ?? 'http://localhost:8090/api/v1'}/voice`, {
		headers: { authorization: `Bearer ${user.token}` }
	});
	test.skip(!voice.ok() || !(await voice.json()).available, 'transcription is off in this API');

	await signIn(page, user, '/app/chat');
	await page.getByRole('button', { name: 'New conversation' }).click();
	await expect(page).toHaveURL(/\/app\/chat\/[0-9a-f-]{36}/);
	const box = page.locator('#message');
	await expect(box).toHaveValue('');

	const mic = page.locator('[data-dictate-target="message"]');
	await mic.click();
	await expect(mic).toHaveAttribute('data-state', 'recording');
	await page.waitForTimeout(1500);
	await mic.click();
	await expect(box).toHaveValue(new RegExp(transcript), { timeout: 15_000 });
	await expect(mic).not.toHaveAttribute('data-state');
});
