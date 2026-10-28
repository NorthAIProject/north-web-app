<script lang="ts">
	import MonoLabel from '#lib/components/khepri/MonoLabel.svelte';
	import { pageTitle } from '#lib/brand.js';
	import { useI18n } from '#lib/i18n/index.js';
	import RecapPanels from '#lib/features/recaps/RecapPanels.svelte';
	import { buildView } from '#lib/features/recaps/view.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
	const view = $derived(buildView(i18n, data.recap, data.siteUrl));
</script>

<svelte:head><title>{pageTitle(i18n.t('recap.title'))}</title></svelte:head>

<div class="mx-auto w-full max-w-3xl space-y-5 p-4 pb-28 md:p-6 md:pb-28">
	<header>
		<MonoLabel text={i18n.t('recap.mono')} />
		<h1 class="mt-2 text-2xl font-medium tracking-tight">{i18n.t('recap.title')}</h1>
	</header>
	<div id="recap-panels">
		<RecapPanels {view} notice={data.notice} timeZone={data.user.timezone} />
	</div>
</div>
