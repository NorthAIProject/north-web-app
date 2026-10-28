<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import TrainingPanels from '#lib/features/insights/training/TrainingPanels.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'training')} active="training" range={data.view.range}>
	<TrainingPanels view={data.view} now={new Date(data.now)} timeZone={data.user.timezone} />
</InsightsPage>
