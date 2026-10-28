<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import CoachPanels from '#lib/features/insights/coach/CoachPanels.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'coach')} active="coach" range={data.view.range}>
	<CoachPanels view={data.view} />
</InsightsPage>
