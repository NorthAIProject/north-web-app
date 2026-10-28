<script lang="ts">
	import { useI18n } from '#lib/i18n/index.js';
	import InsightsPage from '#lib/features/insights/InsightsPage.svelte';
	import SpendPanels from '#lib/features/insights/spend/SpendPanels.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<!-- Go titles this page insights.spend.title, not the sub-nav's section name. -->
<InsightsPage title={i18n.t('insights.spend.title')} active="spend" range={data.view.range}>
	<SpendPanels view={data.view} />
</InsightsPage>
