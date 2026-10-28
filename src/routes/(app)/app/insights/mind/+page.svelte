<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import MindPanels from '#lib/features/insights/mind/MindPanels.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'mind')} active="mind" range={data.view.range}>
	<MindPanels view={data.view} />
</InsightsPage>
