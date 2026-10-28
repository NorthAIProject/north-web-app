<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import { sectionTitle } from '#lib/features/insights/sections.js';
	import TimelinePanels from '#lib/features/insights/timeline/TimelinePanels.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<InsightsPage title={sectionTitle(i18n, 'timeline')} active="timeline" range={data.view.range}>
	<TimelinePanels view={data.view} now={new Date(data.now)} timeZone={data.user.timezone} />
</InsightsPage>
