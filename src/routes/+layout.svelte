<script lang="ts">
	import '#lib/styles/app.css';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { createTranslator, setI18n } from '#lib/i18n/index.js';
	import { themeColorDark, themeColorLight } from '#lib/theme.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const translator = $derived(createTranslator(data.locale, data.messages, data.fallback));
	setI18n(() => translator);
</script>

<svelte:head>
	{#if data.appearance === 'system'}
		<meta name="color-scheme" content="light dark" />
		<meta name="theme-color" media="(prefers-color-scheme: light)" content={themeColorLight} />
		<meta name="theme-color" media="(prefers-color-scheme: dark)" content={themeColorDark} />
	{:else}
		<meta name="color-scheme" content={data.appearance} />
		<meta name="theme-color" content={data.appearance === 'light' ? themeColorLight : themeColorDark} />
	{/if}
	<meta name="apple-mobile-web-app-status-bar-style" content={data.appearance === 'dark' ? 'black-translucent' : 'default'} />
</svelte:head>

{@render children()}
<Toaster richColors position="bottom-right" theme={data.appearance} />
