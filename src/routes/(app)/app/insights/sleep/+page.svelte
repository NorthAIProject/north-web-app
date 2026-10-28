<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import SleepPanels from '#lib/features/insights/sleep/SleepPanels.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'sleep')} active="sleep" range={data.view.range}>
	<SleepPanels view={data.view} />
</InsightsPage>
