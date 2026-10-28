<script lang="ts">
	import { pageTitle } from '#lib/brand.js';
	import EmptyCoach from '#lib/features/coach/EmptyCoach.svelte';
	import { useI18n } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head><title>{pageTitle(i18n.t('nav.coach'))}</title></svelte:head>

<EmptyCoach hasThreads={data.list.length > 0} stats={data.stats} />
