<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import NutritionPanels from '#lib/features/insights/nutrition/NutritionPanels.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'nutrition')} active="nutrition" range={data.view.range}>
	<NutritionPanels view={data.view} />
</InsightsPage>
