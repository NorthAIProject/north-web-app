<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import PatternsPanels from '#lib/features/insights/patterns/PatternsPanels.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'patterns')} active="patterns" range={data.view.range}>
	<PatternsPanels view={data.view} />
</InsightsPage>
