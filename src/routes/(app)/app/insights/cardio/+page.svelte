<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import CardioPanels from '#lib/features/insights/cardio/CardioPanels.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'cardio')} active="cardio" range={data.view.range}>
	<CardioPanels view={data.view} />
</InsightsPage>
