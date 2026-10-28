<script lang="ts">
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import MetricPanels from '#lib/features/insights/metric/MetricPanels.svelte';
	import type { SectionKey } from '#lib/features/insights/sections.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// Go page(…, active "", …): a metric is no section of its own, so no tab is
	// current.
	const none = '' as SectionKey;
</script>

<InsightsPage title={data.view.label} active={none} range={data.view.range}>
	<MetricPanels view={data.view} />
</InsightsPage>
