import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against a live stack: north-client's API on :8090 (fake
// AI provider) and this app's dev server on :5173. Both are started outside
// Playwright so parallel workers share them.
export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	// Each run cleans its output dir first, so concurrent runs (several specs at
	// once) need their own or they delete each other's artefacts mid-test. Workers
	// re-load this file in their own processes, so the id travels in the env.
	outputDir: `test-results/run-${(process.env.PW_RUN_ID ??= String(process.pid))}`,
	// vite dev compiles a route on its first visit, and under four workers that
	// alone can take most of 30 s (sign-in waits for the next page to load). A
	// built app (wrangler dev, WEB_URL) never compiles at request time.
	timeout: 60_000,
	use: {
		baseURL: process.env.WEB_URL ?? 'http://localhost:5173',
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ }
	]
});
