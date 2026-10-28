<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import AwardsCard from '#lib/features/insights/summary/AwardsCard.svelte';
	import SummaryPanels from '#lib/features/insights/summary/SummaryPanels.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'summary')} active="summary" range={data.view.range}>
	<SummaryPanels view={data.view} />
	{#snippet after()}
		{#if data.awards}
			<AwardsCard awards={data.awards} />
		{/if}
	{/snippet}
</InsightsPage>
