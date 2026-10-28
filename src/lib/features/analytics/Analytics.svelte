<!--
	PostHog in the browser (north-client layout.analyticsSnippet +
	web/assets/js/shared/analytics.js). Renders nothing, and loads nothing, when
	POSTHOG_API_KEY is unset.

	The bundle is the vendored posthog-js array.full.js under /assets/js/vendor,
	never a CDN: a visitor's browser makes no request to a third-party origin
	we did not put in the repository. It is preloaded from the document head so
	the download starts with the page, and run once the app has hydrated.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { POSTHOG_API_KEY, POSTHOG_HOST } from '$app/env/public';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { posthogConfig, shouldRecord, type PostHog } from './analytics.js';

	// identity: the signed-in account id, matching the server's DistinctId.
	let { identity = null }: { identity?: string | null } = $props();

	const src = '/assets/js/vendor/posthog.min.js';
	const enabled = Boolean(POSTHOG_API_KEY && POSTHOG_HOST);

	let ph: PostHog | null = $state.raw(null);
	let identified: string | null = null;

	function load(): Promise<PostHog | null> {
		if (window.posthog) return Promise.resolve(window.posthog);
		return new Promise((resolve) => {
			const script = document.createElement('script');
			script.src = src;
			script.onload = () => resolve(window.posthog ?? null);
			script.onerror = () => resolve(null);
			document.head.appendChild(script);
		});
	}

	// Super properties: every event says which appearance was chosen and which
	// one is actually on screen. They differ for "system", and counting System
	// users as light or dark is what lets the default be decided on numbers.
	function registerAppearance() {
		const root = document.documentElement;
		ph?.register({
			appearance_setting: root.getAttribute('data-appearance') || 'unknown',
			color_scheme: root.classList.contains('dark') ? 'dark' : 'light'
		});
	}

	function follow(path: string) {
		if (!ph) return;
		if (shouldRecord(path)) ph.startSessionRecording();
		else ph.stopSessionRecording();
		ph.capture('$pageview');
	}

	onMount(() => {
		if (!enabled) return;
		let alive = true;
		load().then((posthog) => {
			if (!alive || !posthog) return;
			posthog.init(POSTHOG_API_KEY, posthogConfig(POSTHOG_HOST, () => location.pathname));
			ph = posthog;
			registerAppearance();
			follow(location.pathname);
		});
		document.addEventListener('theme-changed', registerAppearance);
		return () => {
			alive = false;
			document.removeEventListener('theme-changed', registerAppearance);
		};
	});

	// Without identify the anonymous session and the account are two unrelated
	// people, and no funnel crosses the signup. Re-run when someone signs in
	// without a full page load.
	$effect(() => {
		if (ph && identity && identity !== identified) {
			ph.identify(identity);
			identified = identity;
		}
	});

	// Replay stops before the next page renders, not after, so a recorded page
	// never captures the first frame of one that may not be recorded.
	beforeNavigate(({ to }) => {
		if (ph && to && !shouldRecord(to.url.pathname)) ph.stopSessionRecording();
	});

	afterNavigate(({ type, to }) => {
		// The first page is reported once posthog has loaded (onMount above).
		if (type === 'enter' || !to) return;
		follow(to.url.pathname);
	});
</script>

<svelte:head>
	{#if enabled}
		<link rel="preload" href={src} as="script" />
	{/if}
</svelte:head>
