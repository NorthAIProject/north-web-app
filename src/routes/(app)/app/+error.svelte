<!--
	A signed-in error: rendered inside the app shell (this layout's AppShell),
	so a 404 or a failed load keeps the rail and the way back to everything
	else. Unknown /app paths land here through [...rest].
-->
<script lang="ts">
	import { page } from '$app/state';
	import { pageTitle } from '#lib/brand.js';
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { errorView } from '#lib/components/layout/errorView.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { useI18n } from '#lib/i18n/index.js';

	const i18n = useI18n();
	const view = $derived(errorView(i18n, page.status, page.error?.message));
</script>

<svelte:head><title>{pageTitle(view.title)}</title></svelte:head>

<div class="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
	<header>
		<MonoLabel text={String(page.status)} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{view.title}</h1>
		<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{view.reason}</p>
		{#if view.detail}
			<p class="mt-1 text-sm leading-relaxed text-muted-foreground">{view.detail}</p>
		{/if}
		{#if page.error?.requestId}
			<p class="mt-3 font-mono text-[10px] text-muted-foreground">
				{i18n.tf('layout.error.reference', page.error.requestId)}
			</p>
		{/if}
	</header>
	<div class="flex flex-wrap gap-2">
		{#if page.status >= 500}
			<!-- A full reload: the client router would reuse the failed state. -->
			<Button href={page.url.pathname + page.url.search} data-sveltekit-reload>
				{i18n.t('layout.error.retry')}
			</Button>
		{/if}
		<Button href="/app" variant={page.status >= 500 ? 'outline' : 'default'}
			>{i18n.t('layout.error.today')}</Button
		>
	</div>
</div>
